// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import { TaxableAccount } from '../lib/accounts/TaxableAccount';
import { IncomeType } from '../lib/types';
import { toBig } from '../lib/bigHelpers';

describe('TaxableAccount', () => {
  describe('constructor', () => {
    it('should create account with valid parameters', () => {
      const account = new TaxableAccount('tax-1', 100000, 80000);
      
      expect(account.id).toBe('tax-1');
      expect(account.getBalance().toString()).toBe('100000');
      expect(account.getCostBasis().toString()).toBe('80000');
    });

    it('should create account with nickname', () => {
      const account = new TaxableAccount('tax-1', 100000, 80000, 'My Brokerage');
      
      expect(account.nickname).toBe('My Brokerage');
    });

    it('should accept Big values', () => {
      const account = new TaxableAccount('tax-1', toBig(100000), toBig(80000));
      
      expect(account.getBalance().toString()).toBe('100000');
      expect(account.getCostBasis().toString()).toBe('80000');
    });

    it('should accept string values', () => {
      const account = new TaxableAccount('tax-1', '100000', '80000');
      
      expect(account.getBalance().toString()).toBe('100000');
      expect(account.getCostBasis().toString()).toBe('80000');
    });

    it('should throw error for negative cost basis', () => {
      expect(() => {
        new TaxableAccount('tax-1', 100000, -1000);
      }).toThrow('Cost basis cannot be negative');
    });

    it('should throw error when cost basis exceeds balance', () => {
      expect(() => {
        new TaxableAccount('tax-1', 100000, 150000);
      }).toThrow('Cost basis cannot exceed balance');
    });

    it('should allow cost basis equal to balance', () => {
      const account = new TaxableAccount('tax-1', 100000, 100000);
      
      expect(account.getCostBasis().toString()).toBe('100000');
      expect(account.getUnrealizedGains().toString()).toBe('0');
    });
  });

  describe('withdraw', () => {
    it('should withdraw correctly with capital gains', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const result = account.withdraw(toBig(20000), 65, 2024);
      
      // Basis ratio = 60000/100000 = 60%
      // Basis removed = 20000 * 0.6 = 12000
      // Capital gain = 20000 - 12000 = 8000
      expect(result.grossAmount.toString()).toBe('20000');
      expect(result.taxableAmount.toString()).toBe('8000');
      expect(result.costBasis?.toString()).toBe('12000');
      expect(result.incomeType).toBe(IncomeType.LONG_TERM_CAPITAL_GAIN);
      expect(result.remainingBalance.toString()).toBe('80000');
    });

    it('should update balance and cost basis after withdrawal', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.withdraw(toBig(20000), 65, 2024);
      
      expect(account.getBalance().toString()).toBe('80000');
      expect(account.getCostBasis().toString()).toBe('48000'); // 60000 - 12000
    });

    it('should handle withdrawal of entire balance', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const result = account.withdraw(toBig(100000), 65, 2024);
      
      expect(result.grossAmount.toString()).toBe('100000');
      expect(result.taxableAmount.toString()).toBe('40000'); // Total gain
      expect(account.getBalance().toString()).toBe('0');
      expect(account.getCostBasis().toString()).toBe('0');
    });

    it('should cap withdrawal at available balance', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const result = account.withdraw(toBig(150000), 65, 2024);
      
      expect(result.grossAmount.toString()).toBe('100000');
      expect(account.getBalance().toString()).toBe('0');
    });

    it('should handle zero withdrawal', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const result = account.withdraw(toBig(0), 65, 2024);
      
      expect(result.grossAmount.toString()).toBe('0');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(account.getBalance().toString()).toBe('100000');
    });

    it('should handle withdrawal when cost basis equals balance', () => {
      const account = new TaxableAccount('tax-1', 100000, 100000);
      const result = account.withdraw(toBig(50000), 65, 2024);
      
      // No gain, all basis
      expect(result.grossAmount.toString()).toBe('50000');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(result.costBasis?.toString()).toBe('50000');
    });

    it('should handle multiple withdrawals', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      
      // First withdrawal
      const result1 = account.withdraw(toBig(20000), 65, 2024);
      expect(result1.taxableAmount.toString()).toBe('8000');
      
      // Second withdrawal - basis ratio stays same
      const result2 = account.withdraw(toBig(20000), 65, 2024);
      expect(result2.taxableAmount.toString()).toBe('8000');
      
      expect(account.getBalance().toString()).toBe('60000');
      expect(account.getCostBasis().toString()).toBe('36000');
    });

    it('should handle very small withdrawal', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const result = account.withdraw(toBig(100), 65, 2024);
      
      // Basis ratio = 60%, so 60 basis, 40 gain
      expect(result.grossAmount.toString()).toBe('100');
      expect(result.taxableAmount.toString()).toBe('40');
    });

    it('should handle decimal withdrawal amounts', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const result = account.withdraw(toBig('12345.67'), 65, 2024);
      
      expect(result.grossAmount.toString()).toBe('12345.67');
      // Should maintain Big.js precision
      expect(result.taxableAmount.gt(toBig(0))).toBe(true);
    });
  });

  describe('calculateRMD', () => {
    it('should return 0 for taxable accounts', () => {
      const account = new TaxableAccount('tax-1', 500000, 300000);
      const rmd = account.calculateRMD(75, 1950);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should return 0 at any age', () => {
      const account = new TaxableAccount('tax-1', 500000, 300000);
      
      expect(account.calculateRMD(70).toString()).toBe('0');
      expect(account.calculateRMD(80).toString()).toBe('0');
      expect(account.calculateRMD(100).toString()).toBe('0');
    });
  });

  describe('getCostBasis', () => {
    it('should return current cost basis', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      
      expect(account.getCostBasis().toString()).toBe('60000');
    });

    it('should reflect cost basis after withdrawal', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.withdraw(toBig(20000), 65, 2024);
      
      expect(account.getCostBasis().toString()).toBe('48000');
    });
  });

  describe('getUnrealizedGains', () => {
    it('should calculate unrealized gains correctly', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      
      expect(account.getUnrealizedGains().toString()).toBe('40000');
    });

    it('should return 0 when no gains', () => {
      const account = new TaxableAccount('tax-1', 100000, 100000);
      
      expect(account.getUnrealizedGains().toString()).toBe('0');
    });

    it('should update after withdrawal', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.withdraw(toBig(50000), 65, 2024);
      
      // Balance = 50000, basis = 30000, gains = 20000
      expect(account.getUnrealizedGains().toString()).toBe('20000');
    });

    it('should handle zero balance', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.withdraw(toBig(100000), 65, 2024);
      
      expect(account.getUnrealizedGains().toString()).toBe('0');
    });
  });

  describe('getGainPercentage', () => {
    it('should calculate gain percentage correctly', () => {
      const account = new TaxableAccount('tax-1', 150000, 100000);
      const gainPct = account.getGainPercentage();
      
      // 50000 / 100000 = 0.5 (50%)
      expect(gainPct.toString()).toBe('0.5');
    });

    it('should return 0 when cost basis is balance', () => {
      const account = new TaxableAccount('tax-1', 100000, 100000);
      
      expect(account.getGainPercentage().toString()).toBe('0');
    });

    it('should return 0 when cost basis is 0', () => {
      const account = new TaxableAccount('tax-1', 100000, 0);
      
      expect(account.getGainPercentage().toString()).toBe('0');
    });

    it('should handle high gain percentage', () => {
      const account = new TaxableAccount('tax-1', 300000, 100000);
      const gainPct = account.getGainPercentage();
      
      // 200000 / 100000 = 2.0 (200%)
      expect(gainPct.toString()).toBe('2');
    });
  });

  describe('estimateTaxComponents', () => {
    it('should estimate LTCG without mutating state', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const estimate = account.estimateTaxComponents(toBig(20000));
      
      expect(estimate.ltcg.toString()).toBe('8000');
      // State should not change
      expect(account.getBalance().toString()).toBe('100000');
      expect(account.getCostBasis().toString()).toBe('60000');
    });

    it('should return 0 for zero amount', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const estimate = account.estimateTaxComponents(toBig(0));
      
      expect(estimate.ltcg.toString()).toBe('0');
    });

    it('should estimate for large withdrawal', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const estimate = account.estimateTaxComponents(toBig(100000));
      
      expect(estimate.ltcg.toString()).toBe('40000');
    });

    it('should handle multiple estimates without side effects', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      
      const est1 = account.estimateTaxComponents(toBig(10000));
      const est2 = account.estimateTaxComponents(toBig(20000));
      const est3 = account.estimateTaxComponents(toBig(30000));
      
      expect(est1.ltcg.toString()).toBe('4000');
      expect(est2.ltcg.toString()).toBe('8000');
      expect(est3.ltcg.toString()).toBe('12000');
      expect(account.getBalance().toString()).toBe('100000');
    });
  });

  describe('applyGrowth', () => {
    it('should apply growth to balance only (not cost basis)', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.applyGrowth(toBig(0.05)); // 5% growth
      
      // Balance grows, basis stays same
      expect(account.getBalance().toString()).toBe('105000');
      expect(account.getCostBasis().toString()).toBe('60000');
      expect(account.getUnrealizedGains().toString()).toBe('45000');
    });

    it('should handle negative growth', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.applyGrowth(toBig(-0.10)); // -10% loss
      
      expect(account.getBalance().toString()).toBe('90000');
      expect(account.getCostBasis().toString()).toBe('60000');
      expect(account.getUnrealizedGains().toString()).toBe('30000');
    });

    it('should handle zero growth', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.applyGrowth(toBig(0));
      
      expect(account.getBalance().toString()).toBe('100000');
      expect(account.getCostBasis().toString()).toBe('60000');
    });

    it('should compound over multiple years', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      
      account.applyGrowth(toBig(0.05)); // Year 1: 105000
      account.applyGrowth(toBig(0.05)); // Year 2: 110250
      
      expect(account.getBalance().toString()).toBe('110250');
      expect(account.getCostBasis().toString()).toBe('60000');
    });
  });

  describe('toString', () => {
    it('should include basis and unrealized gains', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      const str = account.toString();
      
      expect(str).toContain('100000');
      expect(str).toContain('60000');
      expect(str).toContain('40000');
    });
  });

  describe('isDepleted', () => {
    it('should return false when balance is positive', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      
      expect(account.isDepleted()).toBe(false);
    });

    it('should return false when balance is exactly zero', () => {
      const account = new TaxableAccount('tax-1', 100000, 60000);
      account.withdraw(toBig(100000), 65, 2024);
      
      expect(account.isDepleted()).toBe(false);
    });

    it('should return true when balance is negative', () => {
      const account = new TaxableAccount('tax-1', 100, 60);
      account.withdraw(toBig(50), 65, 2024);
      // Manually set negative for testing
      account['balance'] = toBig(-10);
      
      expect(account.isDepleted()).toBe(true);
    });
  });

  describe('realistic scenarios', () => {
    it('should handle typical retiree brokerage account', () => {
      // $500k brokerage, $300k basis
      const account = new TaxableAccount('brokerage', 500000, 300000);
      
      // Withdraw $50k annually for 5 years
      for (let i = 0; i < 5; i++) {
        const result = account.withdraw(toBig(50000), 65 + i, 2024 + i);
        // Each withdrawal should have some capital gain
        expect(result.taxableAmount.gt(toBig(0))).toBe(true);
        expect(result.taxableAmount.lt(result.grossAmount)).toBe(true);
      }
      
      // After 5 years
      expect(account.getBalance().toString()).toBe('250000');
      expect(account.getCostBasis().toString()).toBe('150000');
    });

    it('should handle account with large unrealized gains', () => {
      // Highly appreciated stock: $1M value, $200k basis
      const account = new TaxableAccount('tech-stock', 1000000, 200000);
      
      const result = account.withdraw(toBig(100000), 65, 2024);
      
      // 80% of withdrawal is taxable gain
      expect(result.taxableAmount.toString()).toBe('80000');
      expect(result.costBasis?.toString()).toBe('20000');
    });

    it('should handle depleting account gradually', () => {
      const account = new TaxableAccount('savings', 100000, 80000);
      
      // Withdraw until depleted
      let totalWithdrawn = toBig(0);
      let totalGains = toBig(0);
      
      while (account.getBalance().gt(toBig(0))) {
        const result = account.withdraw(toBig(10000), 65, 2024);
        totalWithdrawn = totalWithdrawn.plus(result.grossAmount);
        totalGains = totalGains.plus(result.taxableAmount);
      }
      
      // Should have withdrawn exactly 100k with 20k total gains
      expect(totalWithdrawn.toString()).toBe('100000');
      expect(totalGains.toString()).toBe('20000');
    });
  });
});
