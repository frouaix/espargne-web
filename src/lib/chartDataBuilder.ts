/**
 * Chart Data Builder - Transform Projection Results into Recharts-Compatible Format
 * 
 * Converts WithdrawalPlan arrays into chart-ready data structures with:
 * - Income sources breakdown (stacked bars)
 * - Tax visualization (negative bars)
 * - Portfolio balance trajectories (line overlays)
 * - Metadata for axis scaling
 */

import Big from 'big.js';
import { toNumber } from './bigHelpers';
import type { ProjectionResult, ChartDataset, ChartDataPoint, WithdrawalPlan } from './types';

/**
 * Build chart-ready dataset from projection result.
 * 
 * Transforms year-by-year withdrawal plans into a format suitable for
 * Recharts visualization. Aggregates account withdrawals by type (taxable,
 * traditional, roth) and computes balance aggregates.
 * 
 * @param result - Projection result with withdrawal plans
 * @returns Chart dataset with data points and scaling metadata
 */
export function buildChartData(result: ProjectionResult): ChartDataset {
  const { scenarioName, withdrawalPlans } = result;
  
  if (withdrawalPlans.length === 0) {
    return {
      scenarioName,
      dataPoints: [],
      maxIncome: 0,
      maxWealth: 0,
    };
  }

  const dataPoints: ChartDataPoint[] = [];
  let maxIncome = 0;
  let maxWealth = 0;

  for (const plan of withdrawalPlans) {
    // Aggregate withdrawals by account type
    const { taxableWithdrawal, traditionalWithdrawal, rothWithdrawal } = aggregateWithdrawalsByType(plan);
    
    // Aggregate balances by account type
    const { taxableBalance, traditionalBalance, rothBalance } = aggregateBalancesByType(plan);
    
    // Convert to numbers for charting (Recharts requires numbers, not Big)
    const socialSecurity = toNumber(plan.guaranteedIncome);
    const taxes = toNumber(plan.totalTaxes);
    const totalIncome = toNumber(plan.totalGrossIncome);
    const totalPortfolio = toNumber(plan.totalPortfolioValue);
    
    const dataPoint: ChartDataPoint = {
      year: plan.year,
      age: plan.age,
      socialSecurity,
      taxableWithdrawal: toNumber(taxableWithdrawal),
      traditionalWithdrawal: toNumber(traditionalWithdrawal),
      rothWithdrawal: toNumber(rothWithdrawal),
      taxes: -taxes, // Negative for display below X-axis
      totalIncome,
      taxableBalance: toNumber(taxableBalance),
      traditionalBalance: toNumber(traditionalBalance),
      rothBalance: toNumber(rothBalance),
      totalPortfolio,
    };
    
    dataPoints.push(dataPoint);
    
    // Track maximums for axis scaling
    maxIncome = Math.max(maxIncome, totalIncome);
    maxWealth = Math.max(maxWealth, totalPortfolio);
  }

  return {
    scenarioName,
    dataPoints,
    maxIncome,
    maxWealth,
  };
}

/**
 * Aggregate account withdrawals by type.
 * 
 * Infers account type from account ID naming conventions:
 * - "taxable" or "brokerage" → Taxable
 * - "trad", "401k", "ira" (not "roth") → Traditional
 * - "roth" → Roth
 * 
 * @param plan - Withdrawal plan for a single year
 * @returns Aggregated withdrawals by account type
 */
function aggregateWithdrawalsByType(plan: WithdrawalPlan): {
  taxableWithdrawal: Big;
  traditionalWithdrawal: Big;
  rothWithdrawal: Big;
} {
  let taxableWithdrawal = new Big(0);
  let traditionalWithdrawal = new Big(0);
  let rothWithdrawal = new Big(0);

  for (const [accountId, amount] of Object.entries(plan.accountWithdrawals)) {
    const idLower = accountId.toLowerCase();
    
    if (idLower.includes('taxable') || idLower.includes('brokerage')) {
      taxableWithdrawal = taxableWithdrawal.plus(amount);
    } else if (idLower.includes('roth')) {
      rothWithdrawal = rothWithdrawal.plus(amount);
    } else if (idLower.includes('trad') || idLower.includes('401k') || idLower.includes('ira')) {
      traditionalWithdrawal = traditionalWithdrawal.plus(amount);
    } else {
      // Default unknown types to traditional
      traditionalWithdrawal = traditionalWithdrawal.plus(amount);
    }
  }

  return { taxableWithdrawal, traditionalWithdrawal, rothWithdrawal };
}

/**
 * Aggregate account balances by type.
 * 
 * Uses same account type inference logic as withdrawal aggregation.
 * 
 * @param plan - Withdrawal plan for a single year
 * @returns Aggregated balances by account type
 */
function aggregateBalancesByType(plan: WithdrawalPlan): {
  taxableBalance: Big;
  traditionalBalance: Big;
  rothBalance: Big;
} {
  let taxableBalance = new Big(0);
  let traditionalBalance = new Big(0);
  let rothBalance = new Big(0);

  for (const [accountId, balance] of Object.entries(plan.accountBalances)) {
    const idLower = accountId.toLowerCase();
    
    if (idLower.includes('taxable') || idLower.includes('brokerage')) {
      taxableBalance = taxableBalance.plus(balance);
    } else if (idLower.includes('roth')) {
      rothBalance = rothBalance.plus(balance);
    } else if (idLower.includes('trad') || idLower.includes('401k') || idLower.includes('ira')) {
      traditionalBalance = traditionalBalance.plus(balance);
    } else {
      // Default unknown types to traditional
      traditionalBalance = traditionalBalance.plus(balance);
    }
  }

  return { taxableBalance, traditionalBalance, rothBalance };
}

/**
 * Create sample chart dataset for testing.
 * 
 * Generates synthetic 30-year retirement scenario with:
 * - Social Security starting at 65
 * - Taxable account depletion over first 15 years
 * - Traditional withdrawals increasing (simulating RMDs)
 * - Roth withdrawals starting after year 15
 * 
 * @returns Sample chart dataset
 */
export function createSampleChartData(): ChartDataset {
  const dataPoints: ChartDataPoint[] = [];
  
  for (let i = 0; i < 30; i++) {
    const year = 2026 + i;
    const age = 65 + i;
    
    // Simulate income progression
    const socialSecurity = 36000;
    const taxableWithdrawal = Math.max(0, 30000 - i * 1000); // Deplete over time
    const traditionalWithdrawal = 20000 + i * 500; // Increase as RMDs kick in
    const rothWithdrawal = i > 15 ? 10000 : 0; // Use Roth later
    
    const totalIncome = socialSecurity + taxableWithdrawal + traditionalWithdrawal + rothWithdrawal;
    const taxes = totalIncome * 0.15; // Simplified 15% rate
    
    // Simulate portfolio depletion
    const totalPortfolio = Math.max(0, 1000000 - i * 25000);
    const taxableBalance = Math.max(0, 200000 - i * 15000);
    const traditionalBalance = Math.max(0, 600000 - i * 8000);
    const rothBalance = Math.max(0, 200000 - i * 2000);
    
    dataPoints.push({
      year,
      age,
      socialSecurity,
      taxableWithdrawal,
      traditionalWithdrawal,
      rothWithdrawal,
      taxes: -taxes, // Negative for display
      totalIncome,
      taxableBalance,
      traditionalBalance,
      rothBalance,
      totalPortfolio,
    });
  }
  
  return {
    scenarioName: 'Sample 30-Year Retirement',
    dataPoints,
    maxIncome: 100000,
    maxWealth: 1000000,
  };
}
