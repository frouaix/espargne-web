/**
 * Scenario Builder - Transform Frontend Data to Lib Scenario Format
 * 
 * Converts frontend form state (UserProfileData, Account[], SSAIncomeData)
 * into the Scenario type expected by ProjectionEngine and other lib modules.
 */

import Big from 'big.js';
import type { UserProfileData } from '../components/UserProfileForm';
import type { SSAIncomeData } from '../components/SSAIncomeForm';
import type { Account as FrontendAccount } from './export';
import type { 
  Scenario, 
  UserProfile, 
  Account, 
  SSAIncome, 
  WithdrawalPolicy,
} from '../lib/types';
import { 
  FilingStatus,
  AccountType,
  SequencingStrategy,
} from '../lib/types';

/**
 * Convert frontend filing status to lib FilingStatus enum.
 */
function convertFilingStatus(status: string): FilingStatus {
  const statusMap: Record<string, FilingStatus> = {
    'single': FilingStatus.SINGLE,
    'married': FilingStatus.MARRIED_FILING_JOINTLY,
    'married_filing_jointly': FilingStatus.MARRIED_FILING_JOINTLY,
    'mfj': FilingStatus.MARRIED_FILING_JOINTLY,
    'married_filing_separately': FilingStatus.MARRIED_FILING_JOINTLY, // Simplified for now
    'mfs': FilingStatus.MARRIED_FILING_JOINTLY,
    'head_of_household': FilingStatus.HEAD_OF_HOUSEHOLD,
    'hoh': FilingStatus.HEAD_OF_HOUSEHOLD,
  };
  return statusMap[status.toLowerCase()] || FilingStatus.SINGLE;
}

/**
 * Convert frontend account type to lib AccountType enum.
 */
function convertAccountType(accountType: string): AccountType | null {
  const typeMap: Record<string, AccountType> = {
    'taxable': AccountType.TAXABLE,
    'traditional': AccountType.TRADITIONAL,
    'roth': AccountType.ROTH,
  };
  return typeMap[accountType] || null;
}

/**
 * Convert frontend withdrawal strategy to lib SequencingStrategy enum.
 */
function convertWithdrawalStrategy(
  strategy: 'taxable_first_min_taxes' | 'taxable_first_proportional' | 'traditional_first' | 'pro_rata'
): SequencingStrategy {
  const strategyMap: Record<string, SequencingStrategy> = {
    'taxable_first_min_taxes': SequencingStrategy.TAXABLE_FIRST,
    'taxable_first_proportional': SequencingStrategy.TAXABLE_FIRST,
    'traditional_first': SequencingStrategy.TRADITIONAL_FIRST,
    'pro_rata': SequencingStrategy.PRO_RATA,
  };
  return strategyMap[strategy] || SequencingStrategy.TAXABLE_FIRST;
}

/**
 * Convert frontend account to lib Account format.
 */
function convertAccount(account: FrontendAccount): Account | null {
  const accountType = convertAccountType(account.accountType);
  if (!accountType) {
    return null; // Skip unsupported account types
  }

  // Type guard to ensure account has balance property
  if (!('balance' in account)) {
    return null;
  }

  const libAccount: Account = {
    id: account.accountId.toString(),
    accountType,
    balance: new Big(account.balance),
  };

  // Add nickname if present
  if ('nickname' in account && account.nickname) {
    libAccount.nickname = account.nickname;
  }

  // Add cost basis for taxable accounts
  if (account.accountType === 'taxable' && 'costBasis' in account) {
    libAccount.costBasis = new Big(account.costBasis);
  }

  return libAccount;
}

/**
 * Convert frontend SSA income to lib SSAIncome format.
 */
function convertSSAIncome(ssaIncome: SSAIncomeData): SSAIncome {
  return {
    fraMonthlyBenefit: new Big(ssaIncome.fraMonthlyBenefit),
    claimingAge: ssaIncome.claimingAge || 67,
  };
}

/**
 * Build Scenario from frontend data.
 * 
 * @param userProfile - User profile from form
 * @param accounts - Array of accounts from forms
 * @param ssaIncome - Social Security income data (optional)
 * @param options - Simulation parameters
 * @returns Scenario object ready for ProjectionEngine
 */
export function buildScenario(
  userProfile: UserProfileData,
  accounts: FrontendAccount[],
  ssaIncome: SSAIncomeData | null,
  options: {
    scenarioName?: string;
    withdrawalRate?: number;
    withdrawalStrategy?: 'taxable_first_min_taxes' | 'taxable_first_proportional' | 'traditional_first' | 'pro_rata';
    minRequiredIncome?: number;
    minIncomeInflationRate?: number;
  } = {}
): Scenario {
  // Convert user profile
  const user: UserProfile = {
    birthYear: userProfile.birthYear,
    retirementAge: userProfile.retirementAge || 67,
    filingStatus: convertFilingStatus(userProfile.filingStatus),
  };

  // Convert accounts (filter out unsupported types)
  const libAccounts: Account[] = accounts
    .map(acc => convertAccount(acc))
    .filter((acc): acc is Account => acc !== null);

  // Convert SSA income
  const libSSAIncome = ssaIncome ? convertSSAIncome(ssaIncome) : undefined;

  // Build withdrawal policy
  const policy: WithdrawalPolicy = {
    withdrawalRate: new Big(options.withdrawalRate || 0.04),
    minRequiredIncome: options.minRequiredIncome ? new Big(options.minRequiredIncome) : undefined,
    minIncomeInflationRate: options.minIncomeInflationRate ? new Big(options.minIncomeInflationRate) : new Big(0.03),
    sequencingStrategy: convertWithdrawalStrategy(options.withdrawalStrategy || 'taxable_first_min_taxes'),
    inflationAdjust: true,
    inflationRate: new Big(0.025),
    avoidIRMAA: true,
  };

  return {
    name: options.scenarioName || 'Retirement Scenario',
    user,
    accounts: libAccounts,
    ssaIncome: libSSAIncome,
    policy,
  };
}
