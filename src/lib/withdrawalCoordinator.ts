// Copyright (c) 2026 François Rouaix
/**
 * Withdrawal Coordinator - Income Aggregation Infrastructure
 *
 * Orchestrates withdrawals from multiple account types and income sources
 * to meet retirement income targets while optimizing tax efficiency.
 *
 * Key features:
 * - Multiple withdrawal sequencing strategies
 * - RMD enforcement for Traditional accounts
 * - Tax-aware withdrawal planning
 * - Social Security income integration
 *
 * @module withdrawalCoordinator
 */

import Big from 'big.js';
import {
  toBig,
  isZero,
  min,
  max,
  divide,
  multiply,
  subtract,
  add,
} from './bigHelpers';
import type {
  WithdrawalPolicy,
  WithdrawalPlan,
  UserProfile,
  SSAIncome,
  TaxInputs,
} from './types';
import type { AccountMetadata } from './types';
import { SequencingStrategy, AccountType } from './types';
import { BaseAccount } from './accounts/BaseAccount';
import { TaxableAccount } from './accounts/TaxableAccount';
import { TraditionalAccount } from './accounts/TraditionalAccount';
import { FederalTaxCalculator } from './taxCalculator';

/**
 * Social Security benefit calculator.
 *
 * Calculates annual benefits based on claiming age with adjustments
 * for early or delayed claiming relative to Full Retirement Age,
 * plus COLA (Cost of Living Adjustment) increases.
 */
export class SSABenefitCalculator {
  private readonly fraMonthlyBenefit: Big;
  private readonly claimingAge: number;
  private readonly colaRate: Big;
  private baseBenefit: Big | null = null; // Benefit at claiming age (before COLA)

  // FRA is 67 for people born 1960+
  private static readonly FRA = 67;

  // SSA adjustment rates
  private static readonly EARLY_REDUCTION_MONTHLY = new Big('0.00555556'); // ~5/9 of 1%
  private static readonly DELAYED_CREDIT_MONTHLY = new Big('0.00666667'); // 2/3 of 1% (~8% annually)

  constructor(ssaIncome: SSAIncome, colaRate: Big) {
    this.fraMonthlyBenefit = toBig(ssaIncome.fraMonthlyBenefit);
    this.claimingAge = ssaIncome.claimingAge;
    this.colaRate = colaRate;
  }

  /**
   * Calculate annual benefit for given age with COLA adjustments.
   *
   * Returns 0 if age is below claiming age.
   * Applies COLA increases for each year after claiming.
   *
   * @param age - Current age
   * @returns Annual benefit amount with COLA applied
   */
  getBenefitAtAge(age: number): Big {
    if (age < this.claimingAge) {
      return new Big(0);
    }

    // Calculate base benefit at claiming age (once)
    if (this.baseBenefit === null) {
      const adjustmentFactor = this.calculateAdjustmentFactor();
      const monthlyBenefit = this.fraMonthlyBenefit.times(adjustmentFactor);
      this.baseBenefit = monthlyBenefit.times(12);
    }

    // Apply COLA for years since claiming
    const yearsSinceClaiming = age - this.claimingAge;
    if (yearsSinceClaiming === 0) {
      return this.baseBenefit;
    }

    // Compound COLA: benefit * (1 + colaRate)^years
    const colaFactor = add(new Big(1), this.colaRate).pow(yearsSinceClaiming);
    return this.baseBenefit.times(colaFactor);
  }

  /**
   * Calculate benefit adjustment factor based on claiming age vs FRA.
   *
   * Early claiming (age 62-66): Reduction of ~5.56% per year
   * FRA (age 67): 100% of benefit
   * Delayed claiming (age 68-70): Increase of ~8% per year
   *
   * Uses linear interpolation for simplicity.
   *
   * @returns Adjustment factor (e.g., 0.70 for 30% reduction, 1.24 for 24% increase)
   */
  private calculateAdjustmentFactor(): Big {
    const fra = SSABenefitCalculator.FRA;

    if (this.claimingAge < fra) {
      // Early claiming: reduction
      const monthsEarly = (fra - this.claimingAge) * 12;
      const reduction = multiply(
        new Big(monthsEarly),
        SSABenefitCalculator.EARLY_REDUCTION_MONTHLY,
      );
      return subtract(new Big(1), reduction);
    } else if (this.claimingAge > fra) {
      // Delayed claiming: credits up to age 70
      const effectiveAge = Math.min(this.claimingAge, 70);
      const monthsDelayed = (effectiveAge - fra) * 12;
      const increase = multiply(
        new Big(monthsDelayed),
        SSABenefitCalculator.DELAYED_CREDIT_MONTHLY,
      );
      return add(new Big(1), increase);
    } else {
      // At FRA: no adjustment
      return new Big(1);
    }
  }
}

/**
 * Withdrawal Coordinator - Orchestrates retirement income withdrawals.
 *
 * Manages withdrawal sequencing, RMD compliance, and tax optimization across
 * taxable, tax-deferred, and tax-free accounts plus guaranteed income sources.
 *
 * @example
 * const coordinator = new WithdrawalCoordinator({
 *   accounts: [tradAccount, rothAccount, taxableAccount],
 *   policy: {
 *     targetNetIncome: new Big(100000),
 *     sequencingStrategy: SequencingStrategy.TAXABLE_FIRST,
 *     inflationAdjust: true,
 *     inflationRate: new Big(0.025),
 *     avoidIRMAA: true,
 *   },
 *   ssaIncome: { fraMonthlyBenefit: new Big(3000), claimingAge: 67 },
 *   userProfile: { birthYear: 1960, retirementAge: 65, filingStatus: FilingStatus.SINGLE },
 *   startingYear: 2025,
 *   startingAge: 65,
 * });
 *
 * const plan = coordinator.planYear(2025, 65, userProfile, ssaIncome);
 * coordinator.applyGrowth(new Big(0.05));
 */
export class WithdrawalCoordinator {
  private accounts: Map<string, BaseAccount>;
  private policy: WithdrawalPolicy;
  private ssaCalculator: SSABenefitCalculator | null;
  private userProfile: UserProfile;
  private currentYear: number;
  private currentAge: number;
  private taxCalculator: FederalTaxCalculator;
  private withdrawalHistory: WithdrawalPlan[];

  /**
   * Initialize withdrawal coordinator.
   *
   * @param config - Configuration object
   * @param config.accounts - List of retirement accounts to draw from
   * @param config.policy - Withdrawal policy and preferences
   * @param config.ssaIncome - Optional Social Security income source
   * @param config.userProfile - User profile with birth year and filing status
   * @param config.startingYear - First year of retirement
   * @param config.startingAge - Age at start of retirement
   */
  constructor(config: {
    accounts: BaseAccount[];
    policy: WithdrawalPolicy;
    ssaIncome?: SSAIncome;
    userProfile: UserProfile;
    startingYear: number;
    startingAge: number;
  }) {
    this.accounts = new Map(config.accounts.map((acc) => [acc.id, acc]));
    this.policy = config.policy;
    this.ssaCalculator = config.ssaIncome
      ? new SSABenefitCalculator(config.ssaIncome, config.policy.inflationRate)
      : null;
    this.userProfile = config.userProfile;
    this.currentYear = config.startingYear;
    this.currentAge = config.startingAge;
    this.taxCalculator = new FederalTaxCalculator();
    this.withdrawalHistory = [];

    this.validatePolicy();
  }

  /**
   * Validate withdrawal policy configuration.
   *
   * @throws {Error} If policy is invalid
   */
  private validatePolicy(): void {
    const { targetNetIncome, withdrawalRate, minRequiredIncome } = this.policy;

    if (
      targetNetIncome === undefined &&
      withdrawalRate === undefined &&
      minRequiredIncome === undefined
    ) {
      throw new Error(
        'Policy must specify either targetNetIncome, withdrawalRate, or minRequiredIncome',
      );
    }
  }

  /**
   * Plan withdrawals for a specific year.
   *
   * This is the main coordination method that:
   * 1. Calculates guaranteed income (SSA)
   * 2. Determines withdrawal need
   * 3. Enforces RMDs
   * 4. Plans discretionary withdrawals using sequencing strategy
   * 5. Calculates taxes
   * 6. Returns comprehensive withdrawal plan
   *
   * @param year - Calendar year
   * @param age - Current age
   * @param userProfile - User profile (for tax filing status)
   * @param ssaIncome - Optional SSA income (overrides constructor value)
   * @returns WithdrawalPlan for the year
   */
  planYear(
    year: number,
    age: number,
    userProfile: UserProfile,
    ssaIncome?: SSAIncome,
  ): WithdrawalPlan {
    this.currentYear = year;
    this.currentAge = age;
    this.userProfile = userProfile;

    // Update SSA calculator if provided
    if (ssaIncome) {
      this.ssaCalculator = new SSABenefitCalculator(ssaIncome, this.policy.inflationRate);
    }

    // Step 1: Calculate guaranteed income (SSA)
    const guaranteedIncome = this.calculateGuaranteedIncome();

    // Step 2: Determine withdrawal need
    const withdrawalNeed = this.calculateWithdrawalNeed(guaranteedIncome);

    // Step 3: Calculate RMDs
    const rmdWithdrawals = this.calculateRMDs();

    // Step 4: Plan discretionary withdrawals
    const discretionaryWithdrawals = this.planDiscretionaryWithdrawals(
      withdrawalNeed,
      rmdWithdrawals,
    );

    // Step 5: Merge withdrawals
    const allWithdrawals = this.mergeWithdrawals(
      rmdWithdrawals,
      discretionaryWithdrawals,
    );

    // Step 6: Execute withdrawals
    this.executeWithdrawals(allWithdrawals);

    // Step 7: Calculate taxes
    const totalGrossIncome = add(
      guaranteedIncome,
      this.sumWithdrawals(allWithdrawals),
    );
    const estimatedTaxes = this.estimateTaxes(guaranteedIncome, allWithdrawals);

    // Step 8: Build account metadata for visualization
    const accountMetadata: Record<string, AccountMetadata> = {};
    for (const [_id, account] of this.accounts) {
      accountMetadata[account.id] = {
        id: account.id,
        nickname: account.nickname,
        accountType: account.accountType,
      };
    }

    // Step 9: Create plan
    const plan: WithdrawalPlan = {
      year,
      age,
      guaranteedIncome,
      dividendIncome: new Big(0), // Not modeled in this version
      accountWithdrawals: allWithdrawals,
      totalGrossIncome,
      totalTaxes: estimatedTaxes,
      totalNetIncome: subtract(totalGrossIncome, estimatedTaxes),
      accountBalances: this.getAccountBalances(),
      totalPortfolioValue: this.getPortfolioValue(),
      accountMetadata,
    };

    this.withdrawalHistory.push(plan);
    return plan;
  }

  /**
   * Apply investment growth to all accounts.
   *
   * Updates balances using: balance = balance * (1 + rate)
   * Also advances year and age counters.
   *
   * @param rate - Annual return rate (e.g., 0.05 for 5%)
   */
  applyGrowth(rate: Big | number | string): void {
    const growthRate = toBig(rate);

    for (const account of this.accounts.values()) {
      account.applyGrowth(growthRate);
    }

    this.currentYear += 1;
    this.currentAge += 1;
  }

  /**
   * Calculate guaranteed income for current year.
   *
   * Currently only includes Social Security benefits.
   * Future: Add pension income sources.
   *
   * @returns Total guaranteed income
   */
  private calculateGuaranteedIncome(): Big {
    if (!this.ssaCalculator) {
      return new Big(0);
    }

    return this.ssaCalculator.getBenefitAtAge(this.currentAge);
  }

  /**
   * Calculate how much needs to be withdrawn from accounts.
   *
   * Considers:
   * - Target net income (adjusted for inflation if enabled)
   * - Withdrawal rate based on portfolio value
   * - Minimum required income floor
   * - Already received guaranteed income
   *
   * @param guaranteedIncome - Income already received (SSA, pensions)
   * @returns Amount needed from account withdrawals
   */
  private calculateWithdrawalNeed(guaranteedIncome: Big): Big {
    let withdrawalAmount = new Big(0);

    const { targetNetIncome, withdrawalRate, minRequiredIncome } = this.policy;

    // Calculate base withdrawal from rate or target
    if (targetNetIncome !== undefined) {
      let target = toBig(targetNetIncome);

      // Adjust for inflation if requested
      if (this.policy.inflationAdjust) {
        const yearsElapsed = this.withdrawalHistory.length;
        if (yearsElapsed > 0) {
          const inflationMultiplier = add(
            new Big(1),
            this.policy.inflationRate,
          ).pow(yearsElapsed);
          target = multiply(target, inflationMultiplier);
        }
      }

      // Estimate gross need (simplified: assume 25% tax rate)
      const estimatedGrossNeed = multiply(target, new Big(1.25));
      const gap = subtract(estimatedGrossNeed, guaranteedIncome);
      withdrawalAmount = max(gap, new Big(0));
    } else if (withdrawalRate !== undefined) {
      // Calculate based on portfolio value
      const totalPortfolio = this.getPortfolioValue();
      const targetWithdrawal = multiply(
        totalPortfolio,
        toBig(withdrawalRate),
      );
      const gap = subtract(targetWithdrawal, guaranteedIncome);
      withdrawalAmount = max(gap, new Big(0));
    }

    // Apply minimum required income floor if specified
    if (minRequiredIncome !== undefined) {
      let minIncome = toBig(minRequiredIncome);

      const yearsElapsed = this.withdrawalHistory.length;
      if (yearsElapsed > 0) {
        const inflationRate =
          this.policy.minIncomeInflationRate ?? this.policy.inflationRate;
        const inflationMultiplier = add(new Big(1), inflationRate).pow(
          yearsElapsed,
        );
        minIncome = multiply(minIncome, inflationMultiplier);
      }

      const shortfall = subtract(minIncome, guaranteedIncome);
      withdrawalAmount = max(withdrawalAmount, shortfall);
    }

    return max(withdrawalAmount, new Big(0));
  }

  /**
   * Calculate Required Minimum Distributions for all accounts.
   *
   * Only Traditional accounts have RMDs. Returns map of account ID to RMD amount.
   *
   * @returns Map of account IDs to RMD amounts
   */
  private calculateRMDs(): Record<string, Big> {
    const rmds: Record<string, Big> = {};

    for (const [accountId, account] of this.accounts.entries()) {
      const rmd = account.calculateRMD(
        this.currentAge,
        this.userProfile.birthYear,
      );

      if (!isZero(rmd)) {
        rmds[accountId] = rmd;
      }
    }

    return rmds;
  }

  /**
   * Plan discretionary withdrawals using sequencing strategy.
   *
   * RMDs count toward withdrawal need, so only plan additional withdrawals
   * if needed beyond RMD amounts.
   *
   * @param withdrawalNeed - Total amount needed from accounts
   * @param rmdWithdrawals - Already planned RMD withdrawals
   * @returns Discretionary withdrawal amounts by account
   */
  private planDiscretionaryWithdrawals(
    withdrawalNeed: Big,
    rmdWithdrawals: Record<string, Big>,
  ): Record<string, Big> {
    // RMDs count toward withdrawal need
    const rmdTotal = this.sumWithdrawals(rmdWithdrawals);
    const remainingNeed = subtract(withdrawalNeed, rmdTotal);

    if (remainingNeed.lte(0)) {
      return {};
    }

    // Apply sequencing strategy
    switch (this.policy.sequencingStrategy) {
      case SequencingStrategy.TAXABLE_FIRST:
        return this.withdrawTaxableFirst(remainingNeed);
      case SequencingStrategy.TRADITIONAL_FIRST:
        return this.withdrawTraditionalFirst(remainingNeed);
      case SequencingStrategy.ROTH_FIRST:
        return this.withdrawRothFirst(remainingNeed);
      case SequencingStrategy.PRO_RATA:
        return this.withdrawProRata(remainingNeed);
      default:
        // Default to taxable first
        return this.withdrawTaxableFirst(remainingNeed);
    }
  }

  /**
   * TAXABLE_FIRST strategy: Deplete taxable accounts before tax-advantaged.
   *
   * Order: Taxable -> Traditional -> Roth
   *
   * Within taxable accounts, withdraws from accounts with lowest unrealized
   * gains first to minimize tax impact.
   *
   * @param amount - Amount to withdraw
   * @returns Withdrawal amounts by account
   */
  private withdrawTaxableFirst(amount: Big): Record<string, Big> {
    const withdrawals: Record<string, Big> = {};
    let remaining = amount;

    // Order: Taxable -> Traditional -> Roth
    const accountOrder = [
      AccountType.TAXABLE,
      AccountType.TRADITIONAL,
      AccountType.ROTH,
    ];

    for (const accountType of accountOrder) {
      if (remaining.lte(0)) {
        break;
      }

      const accounts = this.getAccountsByType(accountType);

      if (accountType === AccountType.TAXABLE) {
        // Sort taxable accounts by gain percentage (ascending)
        // Lower gain = lower tax impact = withdraw first
        const sortedAccounts = accounts.sort((a, b) => {
          const gainA =
            a instanceof TaxableAccount
              ? a.getGainPercentage()
              : new Big(0);
          const gainB =
            b instanceof TaxableAccount
              ? b.getGainPercentage()
              : new Big(0);
          return gainA.cmp(gainB);
        });

        for (const account of sortedAccounts) {
          if (remaining.lte(0)) {
            break;
          }
          const available = account.getBalance();
          const withdrawAmount = min(remaining, available);
          if (!isZero(withdrawAmount)) {
            withdrawals[account.id] = withdrawAmount;
            remaining = subtract(remaining, withdrawAmount);
          }
        }
      } else {
        // Sequential withdrawal for other account types
        for (const account of accounts) {
          if (remaining.lte(0)) {
            break;
          }
          const available = account.getBalance();
          const withdrawAmount = min(remaining, available);
          if (!isZero(withdrawAmount)) {
            withdrawals[account.id] = withdrawAmount;
            remaining = subtract(remaining, withdrawAmount);
          }
        }
      }
    }

    return withdrawals;
  }

  /**
   * TRADITIONAL_FIRST strategy: Prioritize Traditional IRA/401k withdrawals.
   *
   * Order: Traditional -> Taxable -> Roth
   *
   * Maximizes tax deferral on Roth accounts.
   *
   * @param amount - Amount to withdraw
   * @returns Withdrawal amounts by account
   */
  private withdrawTraditionalFirst(amount: Big): Record<string, Big> {
    const withdrawals: Record<string, Big> = {};
    let remaining = amount;

    const accountOrder = [
      AccountType.TRADITIONAL,
      AccountType.TAXABLE,
      AccountType.ROTH,
    ];

    for (const accountType of accountOrder) {
      if (remaining.lte(0)) {
        break;
      }

      for (const account of this.getAccountsByType(accountType)) {
        if (remaining.lte(0)) {
          break;
        }
        const available = account.getBalance();
        const withdrawAmount = min(remaining, available);
        if (!isZero(withdrawAmount)) {
          withdrawals[account.id] = withdrawAmount;
          remaining = subtract(remaining, withdrawAmount);
        }
      }
    }

    return withdrawals;
  }

  /**
   * ROTH_FIRST strategy: Prioritize Roth withdrawals.
   *
   * Order: Roth -> Taxable -> Traditional
   *
   * Preserves Traditional accounts for RMDs and tax management.
   *
   * @param amount - Amount to withdraw
   * @returns Withdrawal amounts by account
   */
  private withdrawRothFirst(amount: Big): Record<string, Big> {
    const withdrawals: Record<string, Big> = {};
    let remaining = amount;

    const accountOrder = [
      AccountType.ROTH,
      AccountType.TAXABLE,
      AccountType.TRADITIONAL,
    ];

    for (const accountType of accountOrder) {
      if (remaining.lte(0)) {
        break;
      }

      for (const account of this.getAccountsByType(accountType)) {
        if (remaining.lte(0)) {
          break;
        }
        const available = account.getBalance();
        const withdrawAmount = min(remaining, available);
        if (!isZero(withdrawAmount)) {
          withdrawals[account.id] = withdrawAmount;
          remaining = subtract(remaining, withdrawAmount);
        }
      }
    }

    return withdrawals;
  }

  /**
   * PRO_RATA strategy: Withdraw proportionally from all accounts.
   *
   * Each account contributes based on its percentage of total portfolio value.
   *
   * @param amount - Amount to withdraw
   * @returns Withdrawal amounts by account
   */
  private withdrawProRata(amount: Big): Record<string, Big> {
    const withdrawals: Record<string, Big> = {};
    const totalBalance = this.getPortfolioValue();

    if (isZero(totalBalance)) {
      return withdrawals;
    }

    for (const [accountId, account] of this.accounts.entries()) {
      const balance = account.getBalance();
      if (isZero(balance)) {
        continue;
      }

      const proportion = divide(balance, totalBalance);
      const withdrawAmount = min(multiply(amount, proportion), balance);

      if (!isZero(withdrawAmount)) {
        withdrawals[accountId] = withdrawAmount;
      }
    }

    return withdrawals;
  }

  /**
   * Merge RMD and discretionary withdrawals.
   *
   * If an account has both RMD and discretionary withdrawal, combine them.
   *
   * @param rmdWithdrawals - Required minimum distributions
   * @param discretionary - Discretionary withdrawals
   * @returns Combined withdrawal amounts
   */
  private mergeWithdrawals(
    rmdWithdrawals: Record<string, Big>,
    discretionary: Record<string, Big>,
  ): Record<string, Big> {
    const merged: Record<string, Big> = { ...rmdWithdrawals };

    for (const [accountId, amount] of Object.entries(discretionary)) {
      merged[accountId] = add(merged[accountId] ?? new Big(0), amount);
    }

    return merged;
  }

  /**
   * Execute planned withdrawals and update account balances.
   *
   * @param withdrawals - Map of account IDs to withdrawal amounts
   */
  private executeWithdrawals(withdrawals: Record<string, Big>): void {
    for (const [accountId, amount] of Object.entries(withdrawals)) {
      if (isZero(amount)) {
        continue;
      }

      const account = this.accounts.get(accountId);
      if (account) {
        account.withdraw(amount, this.currentAge, this.currentYear);
      }
    }
  }

  /**
   * Estimate taxes for the year.
   *
   * Aggregates income components by type and delegates to tax calculator.
   *
   * @param guaranteedIncome - Guaranteed income (SSA)
   * @param withdrawals - Account withdrawals
   * @returns Estimated total tax
   */
  private estimateTaxes(
    guaranteedIncome: Big,
    withdrawals: Record<string, Big>,
  ): Big {
    const { ordinaryIncome, qualifiedDividends, longTermCapitalGains, socialSecurityGross } =
      this.aggregateIncomeComponents(guaranteedIncome, withdrawals);

    const taxInputs: TaxInputs = {
      filingStatus: this.userProfile.filingStatus,
      ordinaryIncome,
      qualifiedDividends,
      longTermCapitalGains,
      socialSecurityGross,
      taxExemptInterest: new Big(0),
    };

    const taxResult = this.taxCalculator.calculate(taxInputs);
    return taxResult.totalTax;
  }

  /**
   * Aggregate income components by type for tax calculation.
   *
   * Breaks down income into:
   * - Ordinary income (Traditional IRA withdrawals, pensions)
   * - Qualified dividends (not modeled yet)
   * - Long-term capital gains (taxable account withdrawals)
   * - Social Security gross (for taxable portion calculation)
   *
   * @param guaranteedIncome - Guaranteed income (assumed to be SSA)
   * @param withdrawals - Account withdrawals
   * @returns Income components by type
   */
  private aggregateIncomeComponents(
    guaranteedIncome: Big,
    withdrawals: Record<string, Big>,
  ): {
    ordinaryIncome: Big;
    qualifiedDividends: Big;
    longTermCapitalGains: Big;
    socialSecurityGross: Big;
  } {
    let ordinaryIncome = new Big(0);
    const qualifiedDividends = new Big(0);
    let longTermCapitalGains = new Big(0);
    const socialSecurityGross = guaranteedIncome; // Assume all guaranteed income is SSA

    // Process withdrawals by account type
    for (const [accountId, amount] of Object.entries(withdrawals)) {
      if (isZero(amount)) {
        continue;
      }

      const account = this.accounts.get(accountId);
      if (!account) {
        continue;
      }

      if (account instanceof TaxableAccount) {
        // Estimate tax components for taxable account withdrawal
        const estimate = account.estimateTaxComponents(amount);
        longTermCapitalGains = add(longTermCapitalGains, estimate.ltcg);
      } else if (account instanceof TraditionalAccount) {
        // Traditional withdrawals are fully taxable as ordinary income
        ordinaryIncome = add(ordinaryIncome, amount);
      }
      // Roth withdrawals are tax-free, so don't add to any income category
    }

    return {
      ordinaryIncome,
      qualifiedDividends,
      longTermCapitalGains,
      socialSecurityGross,
    };
  }

  /**
   * Get accounts by type.
   *
   * @param accountType - Account type to filter by
   * @returns Array of accounts matching type
   */
  private getAccountsByType(accountType: AccountType): BaseAccount[] {
    return Array.from(this.accounts.values()).filter(
      (acc) => acc.accountType === accountType,
    );
  }

  /**
   * Sum withdrawal amounts.
   *
   * @param withdrawals - Map of account IDs to amounts
   * @returns Total withdrawal amount
   */
  private sumWithdrawals(withdrawals: Record<string, Big>): Big {
    return Object.values(withdrawals).reduce(
      (sum, amount) => add(sum, amount),
      new Big(0),
    );
  }

  /**
   * Get current portfolio value across all accounts.
   *
   * @returns Total portfolio value
   */
  getPortfolioValue(): Big {
    return Array.from(this.accounts.values()).reduce(
      (sum, acc) => add(sum, acc.getBalance()),
      new Big(0),
    );
  }

  /**
   * Get account balances as a map.
   *
   * @returns Map of account IDs to balances
   */
  private getAccountBalances(): Record<string, Big> {
    const balances: Record<string, Big> = {};
    for (const [accountId, account] of this.accounts.entries()) {
      balances[accountId] = account.getBalance();
    }
    return balances;
  }

  /**
   * Get withdrawal history.
   *
   * @returns Array of withdrawal plans
   */
  getWithdrawalHistory(): WithdrawalPlan[] {
    return [...this.withdrawalHistory];
  }
}
