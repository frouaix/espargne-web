// Copyright (c) 2026 François Rouaix
/**
 * TaxableAccount - Taxable investment account with cost basis tracking.
 * 
 * Implements average cost basis method for capital gains calculations.
 * Withdrawals generate long-term capital gains (LTCG) income.
 * No RMDs required.
 */

import Big from 'big.js';
import { BaseAccount } from './BaseAccount';
import type { WithdrawalResult } from '../types';
import { AccountType, IncomeType } from '../types';
import { toBig, min, max, isZero, divide } from '../bigHelpers';

/**
 * Taxable brokerage account with average cost basis tracking.
 * 
 * Key features:
 * - Cost basis tracking using average cost method
 * - Capital gains computed on withdrawals: gain = withdrawal - (basis_ratio * withdrawal)
 * - Long-term capital gains tax treatment
 * - No required minimum distributions
 * 
 * Tax treatment:
 * - Only capital gains portion is taxable
 * - Return of basis is tax-free
 * - Assumes all gains are long-term (1+ year holding period)
 * 
 * @example
 * const account = new TaxableAccount('taxable-1', 100000, 80000);
 * // $100k balance, $80k cost basis = $20k unrealized gain
 * 
 * const result = account.withdraw(new Big(10000), 65, 2024);
 * // Withdraws $10k: $8k basis return (tax-free), $2k LTCG (taxable)
 */
export class TaxableAccount extends BaseAccount {
  /**
   * Current average cost basis of holdings.
   * Updated proportionally on each withdrawal.
   */
  private costBasis: Big;

  /**
   * Create a taxable investment account.
   * 
   * @param id - Unique account identifier
   * @param initialBalance - Starting balance
   * @param initialCostBasis - Starting cost basis (total invested capital)
   * @param nickname - Optional display name
   * @throws {Error} If cost basis is negative or exceeds balance
   * 
   * @example
   * new TaxableAccount('brokerage', 150000, 120000);
   * // $150k current value, $120k invested = $30k unrealized gain
   */
  constructor(
    id: string,
    initialBalance: Big | number | string,
    initialCostBasis: Big | number | string,
    nickname?: string,
  ) {
    super(id, initialBalance, AccountType.TAXABLE, nickname);
    
    const basis = toBig(initialCostBasis);
    
    // Validate cost basis
    if (basis.lt(0)) {
      throw new Error('Cost basis cannot be negative');
    }
    if (basis.gt(this.balance)) {
      throw new Error('Cost basis cannot exceed balance');
    }
    
    this.costBasis = basis;
  }

  /**
   * Withdraw funds from account with capital gains calculation.
   * 
   * Algorithm:
   * 1. Cap withdrawal at available balance
   * 2. Calculate basis ratio: costBasis / balance
   * 3. Determine basis removed: withdrawal * basis_ratio
   * 4. Calculate capital gain: withdrawal - basis_removed
   * 5. Update balance and cost basis
   * 
   * @param amount - Requested withdrawal amount
   * @param _age - Current age (not used for taxable accounts, but required by interface)
   * @param _year - Calendar year (not used for taxable accounts, but required by interface)
   * @returns WithdrawalResult with LTCG income
   * 
   * @example
   * const account = new TaxableAccount('tax', 100000, 60000);
   * const result = account.withdraw(new Big(20000), 67, 2024);
   * // result.grossAmount = 20000
   * // result.costBasis = 12000 (60% of balance is basis)
   * // result.taxableAmount = 8000 (capital gain)
   * // result.incomeType = LONG_TERM_CAPITAL_GAIN
   */
  withdraw(amount: Big, /* age */ _unusedAge: number, /* year */ _unusedYear: number): WithdrawalResult {
    const requestedAmount = toBig(amount);
    
    // Cap withdrawal at available balance
    const actualAmount = min(requestedAmount, this.balance);
    
    // Handle zero withdrawal
    if (isZero(actualAmount)) {
      return {
        grossAmount: new Big(0),
        taxableAmount: new Big(0),
        incomeType: IncomeType.LONG_TERM_CAPITAL_GAIN,
        remainingBalance: this.balance,
        costBasis: new Big(0),
      };
    }
    
    // Calculate basis ratio (avoid division by zero)
    const basisRatio = isZero(this.balance) 
      ? new Big(0) 
      : divide(this.costBasis, this.balance);
    
    // Determine basis removed (proportional to withdrawal)
    const basisRemoved = min(this.costBasis, actualAmount.times(basisRatio));
    
    // Calculate capital gain (cannot be negative)
    const capitalGain = max(new Big(0), actualAmount.minus(basisRemoved));
    
    // Update account state
    this.balance = this.balance.minus(actualAmount);
    this.costBasis = this.costBasis.minus(basisRemoved);
    
    return {
      grossAmount: actualAmount,
      taxableAmount: capitalGain,
      incomeType: IncomeType.LONG_TERM_CAPITAL_GAIN,
      remainingBalance: this.balance,
      costBasis: basisRemoved,
    };
  }

  /**
   * Calculate Required Minimum Distribution.
   * 
   * Taxable accounts are not subject to RMDs.
   * 
   * @param _age - Current age (unused)
   * @param _birthYear - Birth year (unused)
   * @returns Big(0) - no RMD for taxable accounts
   */
  calculateRMD(/* age */ _unusedAge: number, /* birthYear */ _unusedBirthYear?: number): Big {
    return new Big(0);
  }

  /**
   * Get current cost basis.
   * 
   * @returns Current cost basis
   */
  getCostBasis(): Big {
    return this.costBasis;
  }

  /**
   * Get unrealized capital gains.
   * 
   * @returns Current market value minus cost basis
   */
  getUnrealizedGains(): Big {
    return this.balance.minus(this.costBasis);
  }

  /**
   * Get gain percentage.
   * 
   * @returns Percentage gain as decimal (e.g., 0.25 for 25% gain)
   */
  getGainPercentage(): Big {
    if (isZero(this.costBasis)) {
      return new Big(0);
    }
    return divide(this.getUnrealizedGains(), this.costBasis);
  }

  /**
   * Estimate tax components for a hypothetical withdrawal without mutating state.
   * 
   * Useful for withdrawal planning and optimization.
   * 
   * @param amount - Hypothetical withdrawal amount
   * @returns Object with ltcg (long-term capital gain amount)
   * 
   * @example
   * const estimate = account.estimateTaxComponents(new Big(50000));
   * console.log(`Would generate ${estimate.ltcg} in LTCG`);
   */
  estimateTaxComponents(amount: Big): { ltcg: Big } {
    if (isZero(amount) || isZero(this.balance)) {
      return { ltcg: new Big(0) };
    }
    
    const basisRatio = divide(this.costBasis, this.balance);
    const basisRemoved = min(this.costBasis, amount.times(basisRatio));
    const capitalGain = max(new Big(0), amount.minus(basisRemoved));
    
    return { ltcg: capitalGain };
  }

  /**
   * String representation including cost basis.
   * 
   * @returns Account description with basis and unrealized gains
   */
  toString(): string {
    const unrealizedGain = this.getUnrealizedGains();
    return `${super.toString()} [Basis: $${this.costBasis.toFixed(2)}, Unrealized: $${unrealizedGain.toFixed(2)}]`;
  }
}
