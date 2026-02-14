/**
 * Monte Carlo Engine - Stochastic Retirement Simulation
 *
 * Runs multiple retirement projections with random returns to analyze plan robustness
 * and quantify uncertainty. Uses normal distribution (Box-Muller transform) to
 * generate stochastic returns for each year of each simulation.
 *
 * Port of Python MonteCarloEngine from espargne-core/simulations/projection_engine.py
 *
 * Key features:
 * - Multiple simulation runs (typically 1000) with stochastic returns
 * - Normal distribution return generation using Box-Muller transform
 * - Percentile analysis (10th, 50th, 90th) of final portfolio values
 * - Success rate calculation (% of runs that didn't deplete)
 * - Representative runs at each percentile for visualization
 *
 * @module monteCarlo
 */

import Big from 'big.js';
import { ProjectionEngine } from './projectionEngine';
import type { Scenario, ProjectionResult, MonteCarloResult } from './types';

/**
 * MonteCarloEngine - Runs stochastic retirement simulations.
 *
 * Executes multiple projections with random returns sampled from a normal
 * distribution to assess retirement plan robustness. Tracks success rates,
 * final portfolio values, and provides representative runs at key percentiles.
 *
 * @example
 * const scenario = {
 *   name: "Conservative 4% Withdrawal",
 *   user: { birthYear: 1960, retirementAge: 65, filingStatus: FilingStatus.SINGLE },
 *   accounts: [
 *     { id: "trad-401k", accountType: AccountType.TRADITIONAL, balance: new Big(600000) },
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
 * const engine = new MonteCarloEngine(scenario);
 * const result = engine.runMonteCarlo(1000, 30, new Big(0.07), new Big(0.12));
 *
 * console.log(`Success rate: ${result.successRate.toFixed(1)}%`);
 * console.log(`Median final value: $${result.medianFinalValue.toFixed(0)}`);
 * console.log(`10th percentile: $${result.percentile10Value.toFixed(0)}`);
 * console.log(`90th percentile: $${result.percentile90Value.toFixed(0)}`);
 */
export class MonteCarloEngine {
  private scenario: Scenario;

  /**
   * Initialize Monte Carlo engine with a scenario.
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
   * Run Monte Carlo simulation with stochastic returns.
   *
   * Executes multiple projection runs, each with randomly generated returns
   * sampled from a normal distribution. Tracks all results and calculates:
   * - Success rate (% of runs where portfolio lasted entire period)
   * - Percentile analysis (10th, 50th, 90th) of final portfolio values
   * - Representative runs at each percentile for visualization
   *
   * The return distribution uses:
   * - meanReturn: Expected annual return (e.g., 0.07 for 7%)
   * - volatility: Standard deviation of returns (e.g., 0.12 for 12%)
   *
   * Returns can be negative (bear markets) and are generated independently
   * for each year using the Box-Muller transform.
   *
   * @param numRuns - Number of simulation runs (typically 1000)
   * @param maxYears - Maximum years to simulate per run (default 40)
   * @param meanReturn - Expected annual return rate as decimal (e.g., 0.07)
   * @param volatility - Standard deviation of returns as decimal (e.g., 0.12)
   * @returns MonteCarloResult with success rate and percentile analysis
   *
   * @example
   * // Run 1000 simulations with 7% mean return and 12% volatility
   * const result = engine.runMonteCarlo(1000, 30, new Big(0.07), new Big(0.12));
   *
   * @example
   * // High volatility scenario (20% standard deviation)
   * const highVol = engine.runMonteCarlo(1000, 30, new Big(0.07), new Big(0.20));
   *
   * @example
   * // Low volatility scenario (5% standard deviation)
   * const lowVol = engine.runMonteCarlo(1000, 30, new Big(0.07), new Big(0.05));
   */
  runMonteCarlo(
    numRuns: number,
    maxYears: number,
    meanReturn: Big,
    volatility: Big,
  ): MonteCarloResult {
    if (numRuns <= 0) {
      throw new Error('numRuns must be positive');
    }

    if (maxYears <= 0) {
      throw new Error('maxYears must be positive');
    }

    if (volatility.lt(0)) {
      throw new Error('volatility cannot be negative');
    }

    const results: ProjectionResult[] = [];

    // Run multiple simulations with random returns
    for (let runNum = 0; runNum < numRuns; runNum++) {
      // Generate random returns for all years of this run
      const returns = this.generateRandomReturns(maxYears, meanReturn, volatility);

      // Run projection with these random returns
      const result = this.runSingleProjection(returns, runNum);
      results.push(result);
    }

    // Analyze results
    const successCount = results.filter((r) => r.success).length;
    const successRate = (successCount / numRuns) * 100;

    // Sort by final portfolio value for percentile calculations
    const sortedResults = [...results].sort((a, b) => {
      return a.finalPortfolioValue.cmp(b.finalPortfolioValue);
    });

    // Calculate percentile indices
    const p10Idx = Math.floor(numRuns * 0.1);
    const p50Idx = Math.floor(numRuns * 0.5);
    const p90Idx = Math.floor(numRuns * 0.9);

    // Extract representative runs and values
    const worstCaseRun = sortedResults[p10Idx];
    const medianRun = sortedResults[p50Idx];
    const bestCaseRun = sortedResults[p90Idx];

    return {
      scenarioName: this.scenario.name,
      numRuns,
      successRate,
      medianFinalValue: medianRun.finalPortfolioValue,
      percentile10Value: worstCaseRun.finalPortfolioValue,
      percentile90Value: bestCaseRun.finalPortfolioValue,
      medianRun,
      worstCaseRun,
      bestCaseRun,
    };
  }

  /**
   * Generate array of random returns using normal distribution.
   *
   * Uses Box-Muller transform to convert uniform random variables
   * to normally distributed returns: N(meanReturn, volatility).
   *
   * The Box-Muller transform:
   * 1. Generate two independent uniform random variables U1, U2 ~ Uniform(0,1)
   * 2. Apply transform: Z = sqrt(-2 * ln(U1)) * cos(2π * U2)
   * 3. Z ~ Normal(0, 1) (standard normal)
   * 4. Scale to desired distribution: return = mean + Z * stddev
   *
   * Returns can be negative to simulate bear markets.
   *
   * @param numYears - Number of years (returns to generate)
   * @param meanReturn - Expected return (center of distribution)
   * @param volatility - Standard deviation (spread of distribution)
   * @returns Array of random returns, one per year
   *
   * @example
   * // Generate 30 years of returns with 7% mean and 12% volatility
   * const returns = engine.generateRandomReturns(30, new Big(0.07), new Big(0.12));
   * // returns might be: [0.15, -0.03, 0.08, 0.11, -0.05, ...]
   */
  private generateRandomReturns(
    numYears: number,
    meanReturn: Big,
    volatility: Big,
  ): Big[] {
    const returns: Big[] = [];

    for (let i = 0; i < numYears; i++) {
      // Box-Muller transform for normal distribution
      let u1 = Math.random();
      const u2 = Math.random();

      // Avoid log(0) by ensuring u1 > 0
      if (u1 < 1e-10) {
        u1 = 1e-10;
      }

      // Generate standard normal random variable (mean=0, stddev=1)
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

      // Transform to desired mean and standard deviation
      // return = mean + z * stddev
      const randomReturn = meanReturn.plus(volatility.times(z));
      returns.push(randomReturn);
    }

    return returns;
  }

  /**
   * Run single projection with predetermined array of returns.
   *
   * Creates a new ProjectionEngine and runs a projection where each year
   * uses the corresponding return from the returns array instead of a
   * fixed return rate.
   *
   * @param returns - Array of returns, one per year
   * @param runNum - Run number for naming
   * @returns ProjectionResult for this simulation
   */
  private runSingleProjection(
    returns: Big[],
    runNum: number,
  ): ProjectionResult {
    // Create modified scenario for this run
    const runScenario: Scenario = {
      ...this.scenario,
      name: `${this.scenario.name} - Run ${runNum + 1}`,
    };

    const engine = new ProjectionEngine(runScenario);

    // Run projection with variable returns (one per year)
    return engine.runProjectionWithReturns(returns.length, returns);
  }
}

/**
 * Example Usage:
 *
 * ```typescript
 * import { MonteCarloEngine } from './lib/monteCarlo';
 * import { AccountType, FilingStatus, SequencingStrategy } from './lib/types';
 * import Big from 'big.js';
 *
 * // Define your retirement scenario
 * const scenario = {
 *   name: "Conservative Retirement Plan",
 *   user: {
 *     birthYear: 1960,
 *     retirementAge: 65,
 *     filingStatus: FilingStatus.SINGLE,
 *   },
 *   accounts: [
 *     {
 *       id: "traditional-401k",
 *       accountType: AccountType.TRADITIONAL,
 *       balance: new Big(600000),
 *     },
 *     {
 *       id: "roth-ira",
 *       accountType: AccountType.ROTH,
 *       balance: new Big(400000),
 *     },
 *   ],
 *   policy: {
 *     withdrawalRate: new Big(0.04), // 4% withdrawal rate
 *     sequencingStrategy: SequencingStrategy.TAXABLE_FIRST,
 *     inflationAdjust: true,
 *     inflationRate: new Big(0.025), // 2.5% inflation
 *     avoidIRMAA: false,
 *   },
 * };
 *
 * // Create Monte Carlo engine
 * const engine = new MonteCarloEngine(scenario);
 *
 * // Run 1000 simulations over 30 years
 * // Mean return: 7%, volatility: 12%
 * const result = engine.runMonteCarlo(
 *   1000,              // Number of runs
 *   30,                // Years to simulate
 *   new Big(0.07),     // Mean annual return (7%)
 *   new Big(0.12),     // Volatility (12% std dev)
 * );
 *
 * // Analyze results
 * console.log(`Success Rate: ${result.successRate.toFixed(1)}%`);
 * console.log(`Median Final Value: $${result.medianFinalValue.toFixed(0)}`);
 * console.log(`10th Percentile: $${result.percentile10Value.toFixed(0)}`);
 * console.log(`90th Percentile: $${result.percentile90Value.toFixed(0)}`);
 *
 * // Access representative runs for visualization
 * console.log('Worst Case (10th percentile):');
 * console.log(`  Final Value: $${result.worstCaseRun.finalPortfolioValue.toFixed(0)}`);
 * console.log(`  Success: ${result.worstCaseRun.success}`);
 *
 * console.log('Median Case (50th percentile):');
 * console.log(`  Final Value: $${result.medianRun.finalPortfolioValue.toFixed(0)}`);
 * console.log(`  Success: ${result.medianRun.success}`);
 *
 * console.log('Best Case (90th percentile):');
 * console.log(`  Final Value: $${result.bestCaseRun.finalPortfolioValue.toFixed(0)}`);
 * console.log(`  Success: ${result.bestCaseRun.success}`);
 *
 * // Each representative run includes full withdrawal plans
 * // for detailed year-by-year analysis:
 * result.medianRun.withdrawalPlans.forEach((plan) => {
 *   console.log(`Year ${plan.year} (Age ${plan.age}):`);
 *   console.log(`  Total Income: $${plan.totalGrossIncome.toFixed(0)}`);
 *   console.log(`  Total Taxes: $${plan.totalTaxes.toFixed(0)}`);
 *   console.log(`  Net Income: $${plan.totalNetIncome.toFixed(0)}`);
 *   console.log(`  Portfolio: $${plan.totalPortfolioValue.toFixed(0)}`);
 * });
 * ```
 *
 * Volatility Guidelines:
 * - Conservative portfolio (bonds/fixed income): 5-8%
 * - Balanced portfolio (60/40 stocks/bonds): 10-12%
 * - Aggressive portfolio (stocks): 15-20%
 * - Historical S&P 500: ~15%
 */
