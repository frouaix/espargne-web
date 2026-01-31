import { describe, it, expect } from 'vitest'
import { transformToAPIScenario, createProjectionRequest } from '../utils/apiTransform'
import type { UserProfileData } from '../components/UserProfileForm'
import type { SSAIncomeData } from '../components/SSAIncomeForm'
import type { Account } from '../utils/export'

describe('apiTransform utilities', () => {
  const mockUserProfile: UserProfileData = {
    currentAge: 65,
    retirementAge: 67,
    filingStatus: 'single',
  }

  const mockAccounts: Account[] = [
    {
      accountId: 'acc_1',
      accountType: 'taxable',
      balance: 500000,
      costBasis: 300000,
      dividendYield: 2.5,
      nickname: 'Brokerage',
    },
    {
      accountId: 'acc_2',
      accountType: 'traditional',
      balance: 750000,
      nickname: '401k',
    },
    {
      accountId: 'acc_3',
      accountType: 'roth',
      balance: 250000,
    },
  ]

  const mockSSAIncome: SSAIncomeData = {
    fraMonthlyBenefit: 3000,
    claimingAge: 67,
    colaRate: 2.5,
  }

  describe('transformToAPIScenario', () => {
    it('should transform basic user profile correctly', () => {
      const result = transformToAPIScenario(mockUserProfile, [], null)

      expect(result.user.birth_year).toBe(new Date().getFullYear() - 65)
      expect(result.user.retirement_age).toBe(67)
      expect(result.user.filing_status).toBe('single')
      expect(result.filing_status).toBe('single')
    })

    it('should convert filing status correctly', () => {
      const marriedProfile = { ...mockUserProfile, filingStatus: 'married' }
      const result = transformToAPIScenario(marriedProfile, [], null)

      expect(result.user.filing_status).toBe('mfj')
      expect(result.filing_status).toBe('mfj')
    })

    it('should convert accounts correctly', () => {
      const result = transformToAPIScenario(mockUserProfile, mockAccounts, null)

      expect(result.accounts).toHaveLength(3)
      
      // Taxable account
      expect(result.accounts[0].account_type).toBe('taxable')
      expect(result.accounts[0].balance).toBe('500000')
      expect(result.accounts[0].cost_basis).toBe('300000')
      expect(result.accounts[0].metadata?.nickname).toBe('Brokerage')
      expect(result.accounts[0].metadata?.dividend_yield).toBe(0.025) // Converted to decimal
      
      // Traditional account
      expect(result.accounts[1].account_type).toBe('traditional')
      expect(result.accounts[1].balance).toBe('750000')
      expect(result.accounts[1].cost_basis).toBeNull()
      expect(result.accounts[1].metadata?.nickname).toBe('401k')
      
      // Roth account
      expect(result.accounts[2].account_type).toBe('roth')
      expect(result.accounts[2].balance).toBe('250000')
      expect(result.accounts[2].cost_basis).toBeNull()
    })

    it('should filter out unsupported account types', () => {
      const accountsWithRealEstate = [
        ...mockAccounts,
        { accountId: 'acc_4', accountType: 'real_estate' as any, balance: 500000 },
        { accountId: 'acc_5', accountType: 'mortgage' as any, balance: -300000 },
      ]

      const result = transformToAPIScenario(mockUserProfile, accountsWithRealEstate, null)

      expect(result.accounts).toHaveLength(3) // Only supported accounts
      expect(result.accounts.every(a => ['taxable', 'traditional', 'roth'].includes(a.account_type))).toBe(true)
    })

    it('should include SSA income when provided', () => {
      const result = transformToAPIScenario(mockUserProfile, mockAccounts, mockSSAIncome)

      expect(result.income_sources).toHaveLength(1)
      expect(result.income_sources[0].source_type).toBe('ssa')
      expect(result.income_sources[0].start_age).toBe(67)
      expect(result.income_sources[0].monthly_amount).toBe(3000)
      expect(result.income_sources[0].metadata.cola_rate).toBe(0.025) // Converted to decimal
    })

    it('should exclude SSA income when not provided', () => {
      const result = transformToAPIScenario(mockUserProfile, mockAccounts, null)

      expect(result.income_sources).toHaveLength(0)
    })

    it('should exclude SSA income when benefit is 0', () => {
      const zeroSSA = { ...mockSSAIncome, fraMonthlyBenefit: 0 }
      const result = transformToAPIScenario(mockUserProfile, mockAccounts, zeroSSA)

      expect(result.income_sources).toHaveLength(0)
    })

    it('should set default withdrawal policy', () => {
      const result = transformToAPIScenario(mockUserProfile, mockAccounts, null)

      expect(result.policy.withdrawal_rate).toBe('0.04')
      expect(result.policy.sequencing_strategy).toBe('taxable_first_min_taxes')
      expect(result.policy.inflation_adjust).toBe(true)
      expect(result.policy.inflation_rate).toBe('0.025')
      expect(result.policy.avoid_irmaa).toBe(true)
    })

    it('should convert withdrawal strategies correctly', () => {
      const strategies = [
        { input: 'taxable_first_min_taxes' as const, expected: 'taxable_first_min_taxes' },
        { input: 'taxable_first_proportional' as const, expected: 'taxable_first_proportional' },
        { input: 'traditional_first' as const, expected: 'tax_deferred_first' },
        { input: 'pro_rata' as const, expected: 'proportional' },
      ]

      strategies.forEach(({ input, expected }) => {
        const result = transformToAPIScenario(mockUserProfile, mockAccounts, null, 'Test', 0.04, input)
        expect(result.policy.sequencing_strategy).toBe(expected)
      })
    })

    it('should set correct assumptions', () => {
      const result = transformToAPIScenario(mockUserProfile, mockAccounts, null)

      expect(result.assumptions.start_year).toBe(new Date().getFullYear())
      expect(result.assumptions.start_age).toBe(67) // retirement age
      expect(result.assumptions.real_return).toBe('0.05')
      expect(result.assumptions.inflation_rate).toBe('0.025')
      expect(result.assumptions.volatility).toBe('0.12')
    })
  })

  describe('createProjectionRequest', () => {
    it('should create complete projection request with defaults', () => {
      const result = createProjectionRequest(mockUserProfile, mockAccounts, mockSSAIncome)

      expect(result.scenario).toBeDefined()
      expect(result.max_years).toBe(30)
      expect(result.real_return).toBe(0.05)
      expect(result.min_required_income).toBe(0)
      expect(result.min_income_inflation_rate).toBe(0.03)
    })

    it('should apply custom options', () => {
      const result = createProjectionRequest(mockUserProfile, mockAccounts, mockSSAIncome, {
        maxYears: 40,
        realReturn: 0.06,
        minRequiredIncome: 75000,
        minIncomeInflationRate: 0.025,
        withdrawalRate: 0.035,
        withdrawalStrategy: 'proportional' as any,
        scenarioName: 'Custom Scenario',
      })

      expect(result.max_years).toBe(40)
      expect(result.real_return).toBe(0.06)
      expect(result.min_required_income).toBe(75000)
      expect(result.min_income_inflation_rate).toBe(0.025)
      expect(result.scenario.policy.withdrawal_rate).toBe('0.035')
      expect(result.scenario.name).toBe('Custom Scenario')
    })

    it('should include minimum required income parameters', () => {
      const result = createProjectionRequest(mockUserProfile, mockAccounts, null, {
        minRequiredIncome: 80000,
        minIncomeInflationRate: 0.04,
      })

      expect(result.min_required_income).toBe(80000)
      expect(result.min_income_inflation_rate).toBe(0.04)
    })

    it('should handle missing optional SSA income', () => {
      const result = createProjectionRequest(mockUserProfile, mockAccounts, null, {
        maxYears: 35,
      })

      expect(result.scenario.income_sources).toHaveLength(0)
      expect(result.max_years).toBe(35)
    })

    it('should preserve account IDs across transformation', () => {
      const result = createProjectionRequest(mockUserProfile, mockAccounts, null)

      expect(result.scenario.accounts[0].account_id).toBe('acc_1')
      expect(result.scenario.accounts[1].account_id).toBe('acc_2')
      expect(result.scenario.accounts[2].account_id).toBe('acc_3')
    })

    it('should convert percentages to decimals correctly', () => {
      const ssaWithHighCOLA = { ...mockSSAIncome, colaRate: 5.0 }
      const accountWithHighDividend = [{
        ...mockAccounts[0],
        dividendYield: 4.5,
      }]

      const result = createProjectionRequest(mockUserProfile, accountWithHighDividend, ssaWithHighCOLA)

      expect(result.scenario.income_sources[0].metadata.cola_rate).toBe(0.05)
      expect(result.scenario.accounts[0].metadata?.dividend_yield).toBe(0.045)
    })
  })
})
