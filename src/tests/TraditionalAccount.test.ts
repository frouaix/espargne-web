// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import { TraditionalAccount } from '../lib/accounts/TraditionalAccount';
import { IncomeType } from '../lib/types';
import { toBig } from '../lib/bigHelpers';

describe('TraditionalAccount', () => {
  describe('constructor', () => {
    it('should create account with balance only', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      
      expect(account.id).toBe('trad-1');
      expect(account.getBalance().toString()).toBe('500000');
      expect(account.getBirthYear()).toBeUndefined();
    });

    it('should create account with birth year', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      
      expect(account.getBirthYear()).toBe(1955);
    });

    it('should create account with nickname', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955, 'My 401k');
      
      expect(account.nickname).toBe('My 401k');
    });

    it('should accept Big values', () => {
      const account = new TraditionalAccount('trad-1', toBig(500000), 1955);
      
      expect(account.getBalance().toString()).toBe('500000');
    });

    it('should accept string values', () => {
      const account = new TraditionalAccount('trad-1', '500000', 1955);
      
      expect(account.getBalance().toString()).toBe('500000');
    });
  });

  describe('withdraw', () => {
    it('should withdraw with full taxation', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      const result = account.withdraw(toBig(50000), 75, 2024);
      
      // All traditional withdrawals are fully taxable
      expect(result.grossAmount.toString()).toBe('50000');
      expect(result.taxableAmount.toString()).toBe('50000');
      expect(result.incomeType).toBe(IncomeType.ORDINARY);
      expect(result.remainingBalance.toString()).toBe('450000');
    });

    it('should update balance after withdrawal', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      account.withdraw(toBig(50000), 75, 2024);
      
      expect(account.getBalance().toString()).toBe('450000');
    });

    it('should handle withdrawal of entire balance', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      const result = account.withdraw(toBig(100000), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('100000');
      expect(result.taxableAmount.toString()).toBe('100000');
      expect(account.getBalance().toString()).toBe('0');
    });

    it('should cap withdrawal at available balance', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      const result = account.withdraw(toBig(150000), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('100000');
      expect(account.getBalance().toString()).toBe('0');
    });

    it('should handle zero withdrawal', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      const result = account.withdraw(toBig(0), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('0');
      expect(result.taxableAmount.toString()).toBe('0');
      expect(account.getBalance().toString()).toBe('100000');
    });

    it('should handle multiple withdrawals', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      
      const result1 = account.withdraw(toBig(20000), 70, 2024);
      expect(result1.taxableAmount.toString()).toBe('20000');
      
      const result2 = account.withdraw(toBig(30000), 70, 2024);
      expect(result2.taxableAmount.toString()).toBe('30000');
      
      expect(account.getBalance().toString()).toBe('50000');
    });

    it('should handle very small withdrawal', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      const result = account.withdraw(toBig(100), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('100');
      expect(result.taxableAmount.toString()).toBe('100');
    });

    it('should handle decimal withdrawal amounts', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      const result = account.withdraw(toBig('12345.67'), 70, 2024);
      
      expect(result.grossAmount.toString()).toBe('12345.67');
      expect(result.taxableAmount.toString()).toBe('12345.67');
    });

    it('should not have cost basis in result', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      const result = account.withdraw(toBig(10000), 70, 2024);
      
      expect(result.costBasis).toBeUndefined();
    });
  });

  describe('calculateRMD', () => {
    it('should return 0 when below RMD age', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1960);
      
      expect(account.calculateRMD(70, 1960).toString()).toBe('0');
      expect(account.calculateRMD(72, 1960).toString()).toBe('0');
      expect(account.calculateRMD(74, 1960).toString()).toBe('0');
    });

    it('should calculate RMD at exact RMD age', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1960);
      const rmd = account.calculateRMD(75, 1960);
      
      // RMD = 500000 / 24.6
      expect(rmd.toString()).toContain('20325.20');
    });

    it('should calculate RMD for ages above RMD age', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1960);
      const rmd80 = account.calculateRMD(80, 1960);
      const rmd85 = account.calculateRMD(85, 1960);
      
      // RMD increases as age increases (smaller divisor)
      expect(rmd80.gt(toBig(0))).toBe(true);
      expect(rmd85.gt(rmd80)).toBe(true);
    });

    it('should use birth year from constructor if not provided', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      
      // Born 1955, RMDs at 73
      expect(account.calculateRMD(72).toString()).toBe('0');
      expect(account.calculateRMD(73).gt(toBig(0))).toBe(true);
    });

    it('should allow birth year parameter to override constructor', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      
      // Override to 1960 (RMDs at 75)
      expect(account.calculateRMD(73, 1960).toString()).toBe('0');
      expect(account.calculateRMD(75, 1960).gt(toBig(0))).toBe(true);
    });

    it('should return 0 for zero balance', () => {
      const account = new TraditionalAccount('trad-1', 0, 1950);
      const rmd = account.calculateRMD(75, 1950);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should handle depleted account', () => {
      const account = new TraditionalAccount('trad-1', 100000, 1950);
      account.withdraw(toBig(100000), 75, 2024);
      
      const rmd = account.calculateRMD(75, 1950);
      expect(rmd.toString()).toBe('0');
    });

    it('should calculate RMD correctly for different birth years', () => {
      const balance = toBig(600000);
      
      // Born 1950: RMD at 72
      const acc1950 = new TraditionalAccount('acc1', balance, 1950);
      expect(acc1950.calculateRMD(72, 1950).gt(toBig(0))).toBe(true);
      
      // Born 1955: RMD at 73
      const acc1955 = new TraditionalAccount('acc2', balance, 1955);
      expect(acc1955.calculateRMD(73, 1955).gt(toBig(0))).toBe(true);
      
      // Born 1965: RMD at 75
      const acc1965 = new TraditionalAccount('acc3', balance, 1965);
      expect(acc1965.calculateRMD(75, 1965).gt(toBig(0))).toBe(true);
    });

    it('should use conservative age 73 when no birth year provided', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      
      // No birth year, uses age 73 threshold
      expect(account.calculateRMD(72).toString()).toBe('0');
      expect(account.calculateRMD(73).gt(toBig(0))).toBe(true);
    });
  });

  describe('isRMDRequired', () => {
    it('should return false when below RMD age', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1960);
      
      expect(account.isRMDRequired(74, 1960)).toBe(false);
    });

    it('should return true at RMD age', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1960);
      
      expect(account.isRMDRequired(75, 1960)).toBe(true);
    });

    it('should return true above RMD age', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1960);
      
      expect(account.isRMDRequired(80, 1960)).toBe(true);
    });

    it('should return false for zero balance', () => {
      const account = new TraditionalAccount('trad-1', 0, 1950);
      
      expect(account.isRMDRequired(75, 1950)).toBe(false);
    });
  });

  describe('getBirthYear and setBirthYear', () => {
    it('should get birth year from constructor', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      
      expect(account.getBirthYear()).toBe(1955);
    });

    it('should return undefined when no birth year set', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      
      expect(account.getBirthYear()).toBeUndefined();
    });

    it('should allow setting birth year', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      account.setBirthYear(1960);
      
      expect(account.getBirthYear()).toBe(1960);
    });

    it('should allow updating birth year', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      account.setBirthYear(1960);
      
      expect(account.getBirthYear()).toBe(1960);
    });

    it('should affect RMD calculations after setting birth year', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      account.setBirthYear(1960);
      
      // Should use age 75 for RMDs
      expect(account.calculateRMD(74, 1960).toString()).toBe('0');
      expect(account.calculateRMD(75, 1960).gt(toBig(0))).toBe(true);
    });
  });

  describe('applyGrowth', () => {
    it('should apply growth to balance', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      account.applyGrowth(toBig(0.05)); // 5% growth
      
      expect(account.getBalance().toString()).toBe('525000');
    });

    it('should handle negative growth', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      account.applyGrowth(toBig(-0.10)); // -10% loss
      
      expect(account.getBalance().toString()).toBe('450000');
    });

    it('should handle zero growth', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      account.applyGrowth(toBig(0));
      
      expect(account.getBalance().toString()).toBe('500000');
    });

    it('should compound over multiple years', () => {
      const account = new TraditionalAccount('trad-1', 100000);
      
      account.applyGrowth(toBig(0.05)); // Year 1: 105000
      account.applyGrowth(toBig(0.05)); // Year 2: 110250
      account.applyGrowth(toBig(0.05)); // Year 3: 115762.5
      
      expect(account.getBalance().toString()).toBe('115762.5');
    });
  });

  describe('toString', () => {
    it('should include birth year when set', () => {
      const account = new TraditionalAccount('trad-1', 500000, 1955);
      const str = account.toString();
      
      expect(str).toContain('1955');
    });

    it('should not include birth year when not set', () => {
      const account = new TraditionalAccount('trad-1', 500000);
      const str = account.toString();
      
      expect(str).not.toContain('Birth');
    });
  });

  describe('realistic scenarios', () => {
    it('should handle typical retiree traditional IRA', () => {
      // 75-year-old with $800k Traditional IRA, born 1949
      const account = new TraditionalAccount('trad-ira', 800000, 1949);
      
      // Calculate RMD
      const rmd = account.calculateRMD(75, 1949);
      expect(rmd.gt(toBig(30000))).toBe(true);
      expect(rmd.lt(toBig(35000))).toBe(true);
      
      // Withdraw RMD
      const result = account.withdraw(rmd, 75, 2024);
      expect(result.taxableAmount.eq(result.grossAmount)).toBe(true);
    });

    it('should handle multi-year RMD scenario', () => {
      const account = new TraditionalAccount('401k', 1000000, 1950);
      
      let age = 75;
      for (let year = 0; year < 10; year++) {
        const rmd = account.calculateRMD(age, 1950);
        account.withdraw(rmd, age, 2024 + year);
        account.applyGrowth(toBig(0.05)); // 5% growth
        age++;
      }
      
      // After 10 years with growth, should still have substantial balance
      expect(account.getBalance().gt(toBig(500000))).toBe(true);
    });

    it('should handle forced large RMD for old age', () => {
      const account = new TraditionalAccount('ira', 500000, 1940);
      
      // Age 95: very high RMD percentage (1/8.9 = 11.2%)
      const rmd = account.calculateRMD(95, 1940);
      expect(rmd.gt(toBig(50000))).toBe(true);
    });

    it('should handle account depletion through RMDs', () => {
      const account = new TraditionalAccount('ira', 50000, 1940);
      
      // Take RMDs for many years without growth
      for (let age = 90; age < 110; age++) {
        const rmd = account.calculateRMD(age, 1940);
        if (rmd.gt(toBig(0))) {
          account.withdraw(rmd, age, 2024);
        }
      }
      
      // Account should be depleted or very low
      expect(account.getBalance().lt(toBig(5000))).toBe(true);
    });

    it('should handle young retiree with no RMDs yet', () => {
      const account = new TraditionalAccount('401k', 750000, 1965);
      
      // Age 65, born 1965, no RMDs until 75
      for (let age = 65; age < 75; age++) {
        expect(account.calculateRMD(age, 1965).toString()).toBe('0');
        
        // Take discretionary withdrawal
        account.withdraw(toBig(40000), age, 2024 + age - 65);
        account.applyGrowth(toBig(0.06));
      }
      
      // Should still have healthy balance after 10 years
      expect(account.getBalance().gt(toBig(500000))).toBe(true);
    });
  });
});
