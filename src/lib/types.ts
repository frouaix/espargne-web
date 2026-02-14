/**
 * Core financial types for retirement planning.
 * 
 * These types define the domain model for accounts, income sources,
 * withdrawal strategies, and tax calculations.
 */

import Big from 'big.js';

/**
 * Filing status for tax calculations.
 */
export const FilingStatus = {
  SINGLE: 'single',
  MARRIED_FILING_JOINTLY: 'mfj',
  HEAD_OF_HOUSEHOLD: 'hoh',
} as const;

export type FilingStatus = typeof FilingStatus[keyof typeof FilingStatus];

/**
 * Retirement account types.
 */
export const AccountType = {
  TAXABLE: 'taxable',
  TRADITIONAL: 'traditional',
  ROTH: 'roth',
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

/**
 * Income type classification for tax purposes.
 */
export const IncomeType = {
  ORDINARY: 'ordinary',
  QUALIFIED_DIVIDEND: 'qualified_dividend',
  LONG_TERM_CAPITAL_GAIN: 'ltcg',
  SOCIAL_SECURITY: 'social_security',
} as const;

export type IncomeType = typeof IncomeType[keyof typeof IncomeType];

/**
 * Withdrawal sequencing strategies.
 */
export const SequencingStrategy = {
  TAXABLE_FIRST: 'taxable_first',
  TRADITIONAL_FIRST: 'traditional_first',
  ROTH_FIRST: 'roth_first',
  PRO_RATA: 'pro_rata',
  TAX_BRACKET_OPTIMIZATION: 'tax_bracket_optimization',
} as const;

export type SequencingStrategy = typeof SequencingStrategy[keyof typeof SequencingStrategy];

/**
 * Tax calculation inputs.
 */
export interface TaxInputs {
  filingStatus: FilingStatus;
  ordinaryIncome: Big;
  qualifiedDividends: Big;
  longTermCapitalGains: Big;
  socialSecurityGross: Big;
  taxExemptInterest: Big;
}

/**
 * Tax calculation results.
 */
export interface TaxResult {
  taxableSocialSecurity: Big;
  agi: Big;
  magi: Big;
  taxableIncome: Big;
  ordinaryTaxable: Big;
  ltcgTaxable: Big;
  ordinaryTax: Big;
  ltcgTax: Big;
  totalTax: Big;
}

/**
 * Withdrawal result from a single account.
 */
export interface WithdrawalResult {
  grossAmount: Big;
  taxableAmount: Big;
  incomeType: IncomeType;
  remainingBalance: Big;
  costBasis?: Big;
}

/**
 * User profile information.
 */
export interface UserProfile {
  birthYear: number;
  retirementAge: number;
  filingStatus: FilingStatus;
}

/**
 * Account definition.
 */
export interface Account {
  id: string;
  accountType: AccountType;
  balance: Big;
  nickname?: string;
  costBasis?: Big; // For taxable accounts
}

/**
 * Social Security income source.
 */
export interface SSAIncome {
  fraMonthlyBenefit: Big; // Monthly benefit at full retirement age
  claimingAge: number; // Age when claiming benefits
}

/**
 * Withdrawal policy configuration.
 */
export interface WithdrawalPolicy {
  targetNetIncome?: Big; // Desired after-tax income
  withdrawalRate?: Big; // Safe withdrawal rate (e.g., 0.04)
  minRequiredIncome?: Big; // Minimum required gross income floor
  minIncomeInflationRate?: Big; // Inflation rate for min income
  sequencingStrategy: SequencingStrategy;
  inflationAdjust: boolean;
  inflationRate: Big;
  targetTaxBracket?: Big; // Max marginal rate
  avoidIRMAA: boolean;
}

/**
 * Account metadata for display/visualization.
 */
export interface AccountMetadata {
  id: string;
  nickname?: string;
  accountType: AccountType;
}

/**
 * Planned withdrawals for a single year.
 */
export interface WithdrawalPlan {
  year: number;
  age: number;
  guaranteedIncome: Big; // SSA, pensions
  dividendIncome: Big;
  accountWithdrawals: Record<string, Big>; // account_id -> amount
  totalGrossIncome: Big;
  totalTaxes: Big;
  totalNetIncome: Big;
  accountBalances: Record<string, Big>; // account_id -> balance
  totalPortfolioValue: Big;
  accountMetadata: Record<string, AccountMetadata>; // account_id -> metadata
}

/**
 * Scenario definition for projection.
 */
export interface Scenario {
  name: string;
  user: UserProfile;
  accounts: Account[];
  ssaIncome?: SSAIncome;
  policy: WithdrawalPolicy;
}

/**
 * Projection result from a simulation.
 */
export interface ProjectionResult {
  scenarioName: string;
  success: boolean; // Did portfolio last entire period?
  failureYear?: number; // Year when portfolio depleted
  failureAge?: number; // Age when portfolio depleted
  withdrawalPlans: WithdrawalPlan[];
  finalPortfolioValue: Big;
  totalTaxesPaid: Big;
  totalWithdrawals: Big;
}

/**
 * Monte Carlo simulation result.
 */
export interface MonteCarloResult {
  scenarioName: string;
  numRuns: number;
  successRate: number; // Percentage of runs that succeeded
  medianFinalValue: Big;
  percentile10Value: Big;
  percentile90Value: Big;
  medianRun: ProjectionResult;
  worstCaseRun: ProjectionResult;
  bestCaseRun: ProjectionResult;
}

/**
 * Chart data point for visualization.
 */
export interface ChartDataPoint {
  year: number;
  age: number;
  socialSecurity: number;
  taxableWithdrawal: number;
  traditionalWithdrawal: number;
  rothWithdrawal: number;
  taxes: number;
  totalIncome: number;
  taxableBalance: number;
  traditionalBalance: number;
  rothBalance: number;
  totalPortfolio: number;
}

/**
 * Complete chart dataset.
 */
export interface ChartDataset {
  scenarioName: string;
  dataPoints: ChartDataPoint[];
  maxIncome: number;
  maxWealth: number;
}
