// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import { RothAccount } from '../lib/accounts/RothAccount';
import { IncomeType } from '../lib/types';
import { toBig } from '../lib/bigHelpers';

describe('RothAccount', () => {
  describe('constructor', () => {
    it('should create account with balance', () => {
      const account = new RothAccount('roth-1', 300000);
      
      expect(account.id).toBe('roth-1');
      expect(account.getBalance().toString()).toBe('300000');
    });

    it('should create account with nickname', () => {
      const account = new RothAccount('roth-1', 300000, 'My Roth IRA');
      
      expect(account.nickname).toBe('My Roth IRA');
    });

    it('should accept Big values', () => {
      const account = new RothAccount('roth-1', toBig(300000));
      
      expect(account.getBalance().toString()).toBe('300000');
    });

    it('should accept string values', () => {
      const account = new RothAccount('roth-1', '300000');
      
      expect(account.getBalance().toString()).toBe('300000');
    });
  });

  describe('withdraw', () => {
    it('should withdraw with zero taxation', () => {
      const account = new RothAccount('roth-1', 300000);
      const result = account.withdraw(toBig(50000), 65, 2024);
      
      // Roth withdrawals are tax-free
      expect(result.grossAmount.toString()).toBe('50000');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(result.incomeType).toBe(IncomeType.ORDINARY);
      expect(result.remainingBalance.toString()).toBe('250000');
    });

    it('should update balance after withdrawal', () => {
      const account = new RothAccount('roth-1', 300000);
      account.withdraw(toBig(50000), 65, 2024);
      
      expect(account.getBalance().toString()).toBe('250000');
    });

    it('should handle withdrawal of entire balance', () => {
      const account = new RothAccount('roth-1', 100000);
      const result = account.withdraw(toBig(100000), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('100000');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(account.getBalance().toString()).toBe('0');
    });

    it('should cap withdrawal at available balance', () => {
      const account = new RothAccount('roth-1', 100000);
      const result = account.withdraw(toBig(150000), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('100000');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(account.getBalance().toString()).toBe('0');
    });

    it('should handle zero withdrawal', () => {
      const account = new RothAccount('roth-1', 100000);
      const result = account.withdraw(toBig(0), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('0');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(account.getBalance().toString()).toBe('100000');
    });

    it('should handle multiple withdrawals', () => {
      const account = new RothAccount('roth-1', 200000);
      
      const result1 = account.withdraw(toBig(50000), 70, 2024);
      expect(result1.taxableAmount.toString()).toBe('0');
      
      const result2 = account.withdraw(toBig(50000), 70, 2024);
      expect(result2.taxableAmount.toString()).toBe('0');
      
      expect(account.getBalance().toString()).toBe('100000');
    });

    it('should handle very small withdrawal', () => {
      const account = new RothAccount('roth-1', 100000);
      const result = account.withdraw(toBig(100), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('100');
      expect(result.taxableAmount.toString()).toBe('0');
    });

    it('should handle large withdrawal', () => {
      const account = new RothAccount('roth-1', 1000000);
      const result = account.withdraw(toBig(500000), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('500000');
      expect(result.taxableAmount.toString()).toBe('0');
    });

    it('should handle decimal withdrawal amounts', () => {
      const account = new RothAccount('roth-1', 100000);
      const result = account.withdraw(toBig('12345.67'), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('12345.67');
      expect(result.taxableAmount.toString()).toBe('0');
    });

    it('should not have cost basis in result', () => {
      const account = new RothAccount('roth-1', 100000);
      const result = account.withdraw(toBig(10000), 70, 2024);
      
      expect(result.costBasis).toBeUndefined();
    });

    it('should always be tax-free regardless of age', () => {
      const account = new RothAccount('roth-1', 100000);
      
      // Various ages - all tax-free
      const result60 = account.withdraw(toBig(10000), 60, 2024);
      expect(result60.taxableAmount.toString()).toBe('0');
      
      const result70 = account.withdraw(toBig(10000), 70, 2024);
      expect(result70.taxableAmount.toString()).toBe('0');
      
      const result85 = account.withdraw(toBig(10000), 85, 2024);
      expect(result85.taxableAmount.toString()).toBe('0');
    });
  });

  describe('calculateRMD', () => {
    it('should return 0 for Roth accounts', () => {
      const account = new RothAccount('roth-1', 500000);
      const rmd = account.calculateRMD(75, 1950);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should return 0 at any age', () => {
      const account = new RothAccount('roth-1', 500000);
      
      expect(account.calculateRMD(70).toString()).toBe('0');
      expect(account.calculateRMD(75).toString()).toBe('0');
      expect(account.calculateRMD(80).toString()).toBe('0');
      expect(account.calculateRMD(90).toString()).toBe('0');
      expect(account.calculateRMD(100).toString()).toBe('0');
    });

    it('should return 0 even with birth year', () => {
      const account = new RothAccount('roth-1', 500000);
      
      expect(account.calculateRMD(75, 1950).toString()).toBe('0');
      expect(account.calculateRMD(75, 1960).toString()).toBe('0');
    });

    it('should return 0 for zero balance', () => {
      const account = new RothAccount('roth-1', 0);
      const rmd = account.calculateRMD(75);
      
      expect(rmd.toString()).toBe('0');
    });
  });

  describe('isTaxAdvantaged', () => {
    it('should return true', () => {
      const account = new RothAccount('roth-1', 100000);
      
      expect(account.isTaxAdvantaged()).toBe(true);
    });
  });

  describe('isTaxFree', () => {
    it('should return true', () => {
      const account = new RothAccount('roth-1', 100000);
      
      expect(account.isTaxFree()).toBe(true);
    });
  });

  describe('applyGrowth', () => {
    it('should apply growth to balance', () => {
      const account = new RothAccount('roth-1', 100000);
      account.applyGrowth(toBig(0.05)); // 5% growth
      
      expect(account.getBalance().toString()).toBe('105000');
    });

    it('should handle negative growth', () => {
      const account = new RothAccount('roth-1', 100000);
      account.applyGrowth(toBig(-0.10)); // -10% loss
      
      expect(account.getBalance().toString()).toBe('90000');
    });

    it('should handle zero growth', () => {
      const account = new RothAccount('roth-1', 100000);
      account.applyGrowth(toBig(0));
      
      expect(account.getBalance().toString()).toBe('100000');
    });

    it('should compound over multiple years', () => {
      const account = new RothAccount('roth-1', 100000);
      
      account.applyGrowth(toBig(0.07)); // Year 1: 107000
      account.applyGrowth(toBig(0.07)); // Year 2: 114490
      account.applyGrowth(toBig(0.07)); // Year 3: 122504.3
      
      expect(account.getBalance().toString()).toBe('122504.3');
    });

    it('should grow tax-free', () => {
      const account = new RothAccount('roth-1', 100000);
      
      // Grow for 10 years at 7%
      for (let i = 0; i < 10; i++) {
        account.applyGrowth(toBig(0.07));
      }
      
      // All growth is tax-free when withdrawn
      const finalBalance = account.getBalance();
      const result = account.withdraw(finalBalance, 70, 2024);
      
      expect(result.taxableAmount.toString()).toBe('0');
    });
  });

  describe('toString', () => {
    it('should include tax-free indicator', () => {
      const account = new RothAccount('roth-1', 100000);
      const str = account.toString();
      
      expect(str).toContain('Tax-Free');
    });

    it('should include balance', () => {
      const account = new RothAccount('roth-1', 123456.78);
      const str = account.toString();
      
      expect(str).toContain('123456.78');
    });
  });

  describe('realistic scenarios', () => {
    it('should handle typical retiree Roth IRA', () => {
      // 65-year-old with $300k Roth IRA
      const account = new RothAccount('roth-ira', 300000);
      
      // Withdraw $20k annually for 10 years with 6% growth
      for (let year = 0; year < 10; year++) {
        const result = account.withdraw(toBig(20000), 65 + year, 2024 + year);
        expect(result.taxableAmount.toString()).toBe('0'); // Always tax-free
        account.applyGrowth(toBig(0.06));
      }
      
      // Should still have substantial balance due to growth
      expect(account.getBalance().gt(toBig(200000))).toBe(true);
    });

    it('should preserve Roth for maximum growth', () => {
      const account = new RothAccount('roth', 500000);
      
      // Let it grow untouched for 20 years at 7%
      for (let i = 0; i < 20; i++) {
        account.applyGrowth(toBig(0.07));
      }
      
      const finalBalance = account.getBalance();
      
      // Massive tax-free growth
      expect(finalBalance.gt(toBig(1500000))).toBe(true);
      
      // Withdraw everything tax-free
      const result = account.withdraw(finalBalance, 85, 2044);
      expect(result.taxableAmount.toString()).toBe('0');
    });

    it('should handle emergency large withdrawal', () => {
      const account = new RothAccount('roth', 200000);
      
      // Need to withdraw large amount for medical emergency
      const result = account.withdraw(toBig(150000), 67, 2024);
      
      expect(result.grossAmount.toString()).toBe('150000');
      expect(result.taxableAmount.toString()).toBe('0'); // No tax penalty
      expect(account.getBalance().toString()).toBe('50000');
    });

    it('should handle gradual depletion', () => {
      const account = new RothAccount('roth', 100000);
      
      // Deplete gradually with 4% withdrawals, 5% growth
      let years = 0;
      while (account.getBalance().gt(toBig(1000)) && years < 100) {
        const withdrawal = account.getBalance().times(toBig(0.04));
        const result = account.withdraw(withdrawal, 70 + years, 2024 + years);
        expect(result.taxableAmount.toString()).toBe('0');
        account.applyGrowth(toBig(0.05));
        years++;
      }
      
      // Should last many decades due to growth exceeding withdrawals
      expect(years).toBeGreaterThan(50);
    });

    it('should compare to Traditional IRA tax advantage', () => {
      const roth = new RothAccount('roth', 500000);
      
      // Withdraw $50k
      const rothResult = roth.withdraw(toBig(50000), 70, 2024);
      
      // Roth gives you full $50k with no tax
      expect(rothResult.grossAmount.toString()).toBe('50000');
      expect(rothResult.taxableAmount.toString()).toBe('0');
      
      // Traditional would give $50k gross but all taxable
      // At 22% tax rate, net would be ~$39k
      // Roth advantage = $11k in this withdrawal
    });

    it('should handle estate planning scenario', () => {
      const account = new RothAccount('roth', 750000);
      
      // Owner lives to 95, taking minimal withdrawals
      for (let age = 70; age < 95; age++) {
        account.withdraw(toBig(15000), age, 2024 + age - 70);
        account.applyGrowth(toBig(0.06));
      }
      
      // Large balance remains for heirs, all tax-free
      const remaining = account.getBalance();
      expect(remaining.gt(toBig(500000))).toBe(true);
      
      // Heirs inherit tax-free account (subject to their own RMDs)
      const result = account.withdraw(remaining, 95, 2049);
      expect(result.taxableAmount.toString()).toBe('0');
    });

    it('should demonstrate Roth conversion benefit', () => {
      // Start with $200k Roth
      const account = new RothAccount('roth', 200000);
      
      // Add $50k conversion (pay taxes up front)
      account['balance'] = account['balance'].plus(toBig(50000));
      
      // Grow for 15 years
      for (let i = 0; i < 15; i++) {
        account.applyGrowth(toBig(0.07));
      }
      
      // Converted amount grows to much larger sum, all tax-free
      const finalBalance = account.getBalance();
      expect(finalBalance.gt(toBig(500000))).toBe(true);
      
      // All withdrawals tax-free
      const result = account.withdraw(finalBalance, 80, 2039);
      expect(result.taxableAmount.toString()).toBe('0');
    });
  });

  describe('edge cases', () => {
    it('should handle very small balance', () => {
      const account = new RothAccount('roth', 1);
      const result = account.withdraw(toBig(1), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('1');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(account.getBalance().toString()).toBe('0');
    });

    it('should handle very large balance', () => {
      const account = new RothAccount('roth', 10000000);
      const result = account.withdraw(toBig(5000000), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('5000000');
      expect(result.taxableAmount.toString()).toBe('0');
    });

    it('should handle rapid succession withdrawals', () => {
      const account = new RothAccount('roth', 100000);
      
      for (let i = 0; i < 10; i++) {
        const result = account.withdraw(toBig(5000), 70, 2024);
        expect(result.taxableAmount.toString()).toBe('0');
      }
      
      expect(account.getBalance().toString()).toBe('50000');
    });

    it('should maintain tax-free status after growth', () => {
      const account = new RothAccount('roth', 50000);
      
      // Extreme growth scenario
      for (let i = 0; i < 30; i++) {
        account.applyGrowth(toBig(0.10)); // 10% per year
      }
      
      // Balance grows significantly
      const balance = account.getBalance();
      expect(balance.gt(toBig(500000))).toBe(true);
      
      // Still all tax-free
      const result = account.withdraw(balance, 95, 2054);
      expect(result.taxableAmount.toString()).toBe('0');
    });
  });
});
