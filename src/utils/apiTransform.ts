/**
 * Transform frontend data structures to backend API format
 */

import type { UserProfileData } from '../components/UserProfileForm';
import type { SSAIncomeData } from '../components/SSAIncomeForm';
import type { Account } from './export';

export interface APIScenario {
  scenario_id: string;
  user_id: string;
  name: string;
  user: {
    birth_year: number;
    retirement_age: number;
    filing_status: 'single' | 'mfj' | 'mfs' | 'hoh';
  };
  accounts: Array<{
    account_id: string;
    account_type: 'taxable' | 'traditional' | 'roth';
    balance: string;
    cost_basis?: string | null;
    metadata?: Record<string, any>;
  }>;
  income_sources: Array<{
    source_type: 'ssa';
    start_age: number;
    monthly_amount: number;
  }>;
  policy: {
    target_net_income?: string | null;
    withdrawal_rate?: string | null;
    sequencing_strategy: 'taxable_first' | 'tax_deferred_first' | 'tax_bracket_optimization' | 'proportional';
    target_tax_bracket?: string | null;
    avoid_irmaa: boolean;
    inflation_adjust: boolean;
    inflation_rate: string;
  };
  assumptions: {
    start_year: number;
    start_age: number;
    inflation_rate: string;
    real_return: string;
    volatility?: string | null;
  };
  filing_status: 'single' | 'mfj' | 'mfs' | 'hoh';
}

export interface APIProjectionRequest {
  scenario: APIScenario;
  max_years: number;
  real_return: number;
}

/**
 * Convert frontend filing status to backend format
 */
function convertFilingStatus(status: string): 'single' | 'mfj' | 'mfs' | 'hoh' {
  const statusMap: Record<string, 'single' | 'mfj' | 'mfs' | 'hoh'> = {
    'single': 'single',
    'married': 'mfj',
    'married_filing_jointly': 'mfj',
    'mfj': 'mfj',
    'married_filing_separately': 'mfs',
    'mfs': 'mfs',
    'head_of_household': 'hoh',
    'hoh': 'hoh',
  };
  return statusMap[status.toLowerCase()] || 'single';
}

/**
 * Convert frontend account to backend format
 */
function convertAccount(account: Account, index: number) {
  const accountId = `account_${account.accountType}_${index}`;
  
  const baseAccount: {
    account_id: string;
    account_type: 'taxable' | 'traditional' | 'roth';
    balance: string;
    cost_basis?: string | null;
    metadata?: Record<string, any>;
  } = {
    account_id: accountId,
    account_type: account.accountType as 'taxable' | 'traditional' | 'roth',
    balance: account.balance.toString(),
  };

  // Add cost basis for taxable accounts
  if (account.accountType === 'taxable' && 'costBasis' in account) {
    baseAccount.cost_basis = account.costBasis.toString();
    console.log('DEBUG: Taxable account cost basis:', {
      balance: account.balance,
      costBasis: account.costBasis,
      sent: baseAccount.cost_basis
    });
  } else {
    baseAccount.cost_basis = null;
  }

  // Add metadata with nickname if available
  if ('nickname' in account && account.nickname) {
    baseAccount.metadata = { nickname: account.nickname };
  }

  return baseAccount;
}

/**
 * Convert withdrawal strategy to backend format
 */
function convertWithdrawalStrategy(
  strategy: 'taxable_first' | 'traditional_first' | 'roth_first' | 'pro_rata'
): 'taxable_first' | 'tax_deferred_first' | 'tax_bracket_optimization' | 'proportional' {
  const strategyMap: Record<string, 'taxable_first' | 'tax_deferred_first' | 'tax_bracket_optimization' | 'proportional'> = {
    'taxable_first': 'taxable_first',
    'traditional_first': 'tax_deferred_first',
    'roth_first': 'tax_deferred_first',
    'pro_rata': 'proportional',
  };
  return strategyMap[strategy] || 'taxable_first';
}

/**
 * Transform frontend data to API scenario format
 */
export function transformToAPIScenario(
  userProfile: UserProfileData,
  accounts: Account[],
  ssaIncome: SSAIncomeData | null,
  scenarioName: string = 'Retirement Scenario',
  withdrawalRate: number = 0.04,
  withdrawalStrategy: 'taxable_first' | 'traditional_first' | 'roth_first' | 'pro_rata' = 'taxable_first'
): APIScenario {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - userProfile.currentAge;
  const retirementAge = userProfile.retirementAge || 67;

  // Filter out real estate and mortgage accounts (not supported by backend yet)
  const supportedAccounts = accounts.filter(acc => 
    ['taxable', 'traditional', 'roth'].includes(acc.accountType)
  );

  const apiScenario: APIScenario = {
    scenario_id: `scenario_${Date.now()}`,
    user_id: 'user_web',
    name: scenarioName,
    user: {
      birth_year: birthYear,
      retirement_age: retirementAge,
      filing_status: convertFilingStatus(userProfile.filingStatus),
    },
    accounts: supportedAccounts.map((acc, idx) => convertAccount(acc, idx)),
    income_sources: [],
    policy: {
      target_net_income: null,
      withdrawal_rate: withdrawalRate.toString(),
      sequencing_strategy: convertWithdrawalStrategy(withdrawalStrategy),
      target_tax_bracket: null,
      avoid_irmaa: true,
      inflation_adjust: true,
      inflation_rate: '0.025',
    },
    assumptions: {
      start_year: currentYear,
      start_age: retirementAge,
      real_return: '0.05',
      inflation_rate: '0.025',
      volatility: '0.12',
    },
    filing_status: convertFilingStatus(userProfile.filingStatus),
  };

  // Add SSA income if available
  if (ssaIncome && ssaIncome.monthlyBenefit > 0) {
    apiScenario.income_sources.push({
      source_type: 'ssa',
      start_age: ssaIncome.startAge || 67,
      monthly_amount: ssaIncome.monthlyBenefit,
    });
  }

  return apiScenario;
}

/**
 * Create a complete API projection request
 */
export function createProjectionRequest(
  userProfile: UserProfileData,
  accounts: Account[],
  ssaIncome: SSAIncomeData | null,
  options: {
    scenarioName?: string;
    withdrawalRate?: number;
    withdrawalStrategy?: 'taxable_first' | 'traditional_first' | 'roth_first' | 'pro_rata';
    maxYears?: number;
    realReturn?: number;
  } = {}
): APIProjectionRequest {
  const scenario = transformToAPIScenario(
    userProfile,
    accounts,
    ssaIncome,
    options.scenarioName,
    options.withdrawalRate,
    options.withdrawalStrategy
  );

  return {
    scenario,
    max_years: options.maxYears || 30,
    real_return: options.realReturn || 0.05,
  };
}
