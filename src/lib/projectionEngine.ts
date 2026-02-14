// Copyright (c) 2026 François Rouaix
/**
 * Projection Engine - Multi-Year Retirement Simulation Orchestrator
 *
 * Runs deterministic retirement simulations by orchestrating the WithdrawalCoordinator
 * across multiple years, tracking results, and detecting portfolio depletion.
 *
 * Port of Python ProjectionEngine from espargne-core/simulations/projection_engine.py
 *
 * Key features:
 * - Multi-year deterministic projections with fixed returns
 * - Automatic portfolio depletion detection (failure year/age)
 * - Summary statistics (total taxes, total withdrawals, final value)
 * - Inflation adjustment for target income
 * - Support for different withdrawal strategies
 *
 * @module projectionEngine
 */

import Big from 'big.js';
import { sum } from './bigHelpers';
import type { Scenario, ProjectionResult, WithdrawalPlan } from './types';
import { AccountType } from './types';
import { WithdrawalCoordinator } from './withdrawalCoordinator';
import { BaseAccount } from './accounts/BaseAccount';
import { TaxableAccount } from './accounts/TaxableAccount';
import { TraditionalAccount } from './accounts/TraditionalAccount';
import { RothAccount } from './accounts/RothAccount';

/**
 * ProjectionEngine - Orchestrates multi-year retirement projections.
 *
 * Runs deterministic simulations by repeatedly calling the WithdrawalCoordinator
 * for each year, tracking withdrawal plans, and calculating summary statistics.
 *
 * @example
 * const scenario = {
 *   name: "Conservative 4% Withdrawal",
 *   user: { birthYear: 1960, retirementAge: 65, filingStatus: FilingStatus.SINGLE },
 *   accounts: [
 *     { id: "trad-401k", accountType: AccountType.TRADITIONAL, balance: new Big(600000) },
 *     { id: "roth-ira", accountType: AccountType.ROTH, balance: new Big(400000) },
 *   ],
 *   policy: {
 *     withdrawalRate: new Big(0.04),
 *     sequencingStrategy: SequencingStrategy.TAXABLE_FIRST,
 *     inflationAdjust: true,
 *     inflationRate: new Big(0.025),
 *     avoidIRMAA: false,
 *   },
 * };
 *
 * const engine = new ProjectionEngine(scenario);
 * const result = engine.runProjection(30, new Big(0.05));
 *
 * console.log(`Success: ${result.success}`);
 * console.log(`Final portfolio: $${result.finalPortfolioValue.toFixed(0)}`);
 * console.log(`Total taxes paid: $${result.totalTaxesPaid.toFixed(0)}`);
 */
export class ProjectionEngine {
  private scenario: Scenario;

  /**
   * Initialize projection engine with a scenario.
   *
   * @param scenario - Scenario definition with accounts, policy, and user profile
   */
  constructor(scenario: Scenario) {
    this.scenario = scenario;
    this.validateScenario();
  }

  /**
   * Validate scenario configuration.
   *
   * @throws {Error} If scenario is missing required fields
   */
  private validateScenario(): void {
    if (!this.scenario.name) {
      throw new Error('Scenario must have a name');
    }

    if (!this.scenario.user) {
      throw new Error('Scenario must have user profile');
    }

    if (!this.scenario.accounts || this.scenario.accounts.length === 0) {
      throw new Error('Scenario must have at least one account');
    }

    if (!this.scenario.policy) {
      throw new Error('Scenario must have withdrawal policy');
    }
  }

  /**
   * Run deterministic projection with fixed return rate.
   *
   * Simulates retirement income by:
   * 1. Creating fresh account instances from scenario
   * 2. Initializing WithdrawalCoordinator
   * 3. Looping through years:
   *    - Planning annual withdrawals
   *    - Executing withdrawals
   *    - Applying growth
   *    - Checking for portfolio depletion
   * 4. Calculating summary statistics
   *
   * @param maxYears - Maximum years to simulate (default 40)
   * @param realReturn - Annual real return rate as decimal (e.g., 0.05 for 5%)
   * @returns ProjectionResult with withdrawal plans and summary statistics
   *
   * @example
   * const result = engine.runProjection(30, new Big(0.05));
   * // Simulates 30 years with 5% annual returns
   */
  runProjection(maxYears: number = 40, realReturn: Big): ProjectionResult {
    // Use same implementation but with fixed returns array
    const returns: Big[] = new Array(maxYears).fill(realReturn);
    return this.runProjectionWithReturns(maxYears, returns);
  }

  /**
   * Run projection with predetermined array of returns (for Monte Carlo).
   *
   * Simulates retirement income with variable returns, where each year
   * uses the corresponding return from the returns array. This enables
   * Monte Carlo simulations with stochastic returns.
   *
   * @param maxYears - Maximum years to simulate
   * @param returns - Array of return rates, one per year
   * @returns ProjectionResult with withdrawal plans and summary statistics
   *
   * @example
   * // Monte Carlo: different return each year
   * const returns = [new Big(0.08), new Big(-0.02), new Big(0.12), ...];
   * const result = engine.runProjectionWithReturns(30, returns);
   */
  runProjectionWithReturns(maxYears: number, returns: Big[]): ProjectionResult {
    if (returns.length < maxYears) {
      throw new Error(`Not enough returns provided (need ${maxYears}, got ${returns.length})`);
    }

    // Create fresh account instances for this run
    const accounts = this.createAccounts();

    // Initialize coordinator
    const startingYear = this.calculateStartingYear();
    const startingAge = this.scenario.user.retirementAge;

    const coordinator = new WithdrawalCoordinator({
      accounts,
      policy: this.scenario.policy,
      ssaIncome: this.scenario.ssaIncome,
      userProfile: this.scenario.user,
      startingYear,
      startingAge,
    });

    // Run simulation
    const plans: WithdrawalPlan[] = [];
    let success = true;
    let failureYear: number | undefined;
    let failureAge: number | undefined;

    for (let yearNum = 0; yearNum < maxYears; yearNum++) {
      const currentYear = startingYear + yearNum;
      const currentAge = startingAge + yearNum;

      // Check if portfolio depleted
      const portfolioValue = coordinator.getPortfolioValue();
      if (portfolioValue.lte(0)) {
        success = false;
        failureYear = currentYear;
        failureAge = currentAge;
        break;
      }

      // Plan and track withdrawal
      const plan = coordinator.planYear(
        currentYear,
        currentAge,
        this.scenario.user,
        this.scenario.ssaIncome,
      );
      plans.push(plan);

      // Apply returns for this year and advance to next year
      const yearReturn = returns[yearNum];
      coordinator.applyGrowth(yearReturn);
    }

    // Calculate summary statistics
    const totalTaxesPaid = sum(plans.map((p) => p.totalTaxes));
    const totalWithdrawals = sum(
      plans.map((p) => {
        const accountWithdrawalAmounts = Object.values(p.accountWithdrawals);
        return sum(accountWithdrawalAmounts);
      }),
    );
    const finalPortfolioValue = coordinator.getPortfolioValue();

    return {
      scenarioName: this.scenario.name,
      success,
      failureYear,
      failureAge,
      withdrawalPlans: plans,
      finalPortfolioValue,
      totalTaxesPaid,
      totalWithdrawals,
    };
  }

  /**
   * Create account instances from scenario definition.
   *
   * Instantiates concrete account types (TaxableAccount, TraditionalAccount, RothAccount)
   * based on scenario account definitions.
   *
   * @returns Array of BaseAccount instances
   */
  private createAccounts(): BaseAccount[] {
    return this.scenario.accounts.map((accountDef) => {
      const { id, accountType, balance, costBasis, nickname } = accountDef;

      switch (accountType) {
        case AccountType.TAXABLE:
          return new TaxableAccount(
            id,
            balance,
            costBasis ?? balance,
            nickname,
          );

        case AccountType.TRADITIONAL:
          return new TraditionalAccount(
            id,
            balance,
            this.scenario.user.birthYear,
            nickname,
          );

        case AccountType.ROTH:
          return new RothAccount(
            id,
            balance,
            nickname,
          );

        default:
          throw new Error(`Unknown account type: ${accountType}`);
      }
    });
  }

  /**
   * Calculate starting year for projection.
   *
   * Uses current year as baseline.
   *
   * @returns Starting year (current year)
   */
  private calculateStartingYear(): number {
    return new Date().getFullYear();
  }
}
