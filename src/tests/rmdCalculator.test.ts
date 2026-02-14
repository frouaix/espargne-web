// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import { getRMDStartingAge, getLifeExpectancyFactor, calculateRMD } from '../lib/rmdCalculator';
import { toBig } from '../lib/bigHelpers';

describe('RMD Calculator', () => {
  describe('getRMDStartingAge', () => {
    it('should return 72 for people born before 1951', () => {
      expect(getRMDStartingAge(1950)).toBe(72);
      expect(getRMDStartingAge(1945)).toBe(72);
      expect(getRMDStartingAge(1940)).toBe(72);
    });

    it('should return 73 for people born between 1951-1959', () => {
      expect(getRMDStartingAge(1951)).toBe(73);
      expect(getRMDStartingAge(1955)).toBe(73);
      expect(getRMDStartingAge(1959)).toBe(73);
    });

    it('should return 75 for people born in 1960 or later', () => {
      expect(getRMDStartingAge(1960)).toBe(75);
      expect(getRMDStartingAge(1965)).toBe(75);
      expect(getRMDStartingAge(1970)).toBe(75);
      expect(getRMDStartingAge(1980)).toBe(75);
      expect(getRMDStartingAge(2000)).toBe(75);
    });

    it('should handle edge case at 1951 boundary', () => {
      expect(getRMDStartingAge(1950)).toBe(72);
      expect(getRMDStartingAge(1951)).toBe(73);
    });

    it('should handle edge case at 1960 boundary', () => {
      expect(getRMDStartingAge(1959)).toBe(73);
      expect(getRMDStartingAge(1960)).toBe(75);
    });
  });

  describe('getLifeExpectancyFactor', () => {
    it('should return correct factor for age 72', () => {
      const factor = getLifeExpectancyFactor(72);
      expect(factor.toString()).toBe('27.4');
    });

    it('should return correct factor for age 73', () => {
      const factor = getLifeExpectancyFactor(73);
      expect(factor.toString()).toBe('26.5');
    });

    it('should return correct factor for age 75', () => {
      const factor = getLifeExpectancyFactor(75);
      expect(factor.toString()).toBe('24.6');
    });

    it('should return correct factor for age 80', () => {
      const factor = getLifeExpectancyFactor(80);
      expect(factor.toString()).toBe('20.2');
    });

    it('should return correct factor for age 90', () => {
      const factor = getLifeExpectancyFactor(90);
      expect(factor.toString()).toBe('12.2');
    });

    it('should return correct factor for age 100', () => {
      const factor = getLifeExpectancyFactor(100);
      expect(factor.toString()).toBe('6.4');
    });

    it('should return correct factor for age 110', () => {
      const factor = getLifeExpectancyFactor(110);
      expect(factor.toString()).toBe('3.5');
    });

    it('should return correct factor for age 120', () => {
      const factor = getLifeExpectancyFactor(120);
      expect(factor.toString()).toBe('2');
    });

    it('should return 2.0 for ages above 120', () => {
      expect(getLifeExpectancyFactor(121).toString()).toBe('2');
      expect(getLifeExpectancyFactor(125).toString()).toBe('2');
      expect(getLifeExpectancyFactor(130).toString()).toBe('2');
    });

    it('should throw error for age below 72', () => {
      expect(() => getLifeExpectancyFactor(71)).toThrow('No RMD factor for age 71');
      expect(() => getLifeExpectancyFactor(70)).toThrow('No RMD factor for age 70');
      expect(() => getLifeExpectancyFactor(50)).toThrow('No RMD factor for age 50');
    });

    it('should handle all ages in the table', () => {
      // Test a few spot checks across the range
      expect(getLifeExpectancyFactor(85).toString()).toBe('16');
      expect(getLifeExpectancyFactor(95).toString()).toBe('8.9');
      expect(getLifeExpectancyFactor(105).toString()).toBe('4.6');
      expect(getLifeExpectancyFactor(115).toString()).toBe('2.9');
    });
  });

  describe('calculateRMD - basic calculations', () => {
    it('should calculate RMD correctly for age 75', () => {
      const balance = toBig(100000);
      const rmd = calculateRMD(balance, 75);
      
      // RMD = 100000 / 24.6 = 4065.040650406504...
      expect(rmd.toString()).toContain('4065.04');
    });

    it('should calculate RMD correctly for age 80', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 80);
      
      // RMD = 500000 / 20.2 = 24752.475247...
      expect(rmd.toString()).toContain('24752.47');
    });

    it('should calculate RMD correctly for age 90', () => {
      const balance = toBig(250000);
      const rmd = calculateRMD(balance, 90);
      
      // RMD = 250000 / 12.2 = 20491.803278...
      expect(rmd.toString()).toContain('20491.80');
    });

    it('should calculate RMD correctly for large balance', () => {
      const balance = toBig(2000000);
      const rmd = calculateRMD(balance, 75);
      
      // RMD = 2000000 / 24.6 = 81300.813008...
      expect(rmd.toString()).toContain('81300.81');
    });

    it('should calculate RMD correctly for small balance', () => {
      const balance = toBig(10000);
      const rmd = calculateRMD(balance, 75);
      
      // RMD = 10000 / 24.6 = 406.504065...
      expect(rmd.toString()).toContain('406.50');
    });

    it('should return 0 for zero balance', () => {
      const balance = toBig(0);
      const rmd = calculateRMD(balance, 75);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should handle very small balance', () => {
      const balance = toBig(100);
      const rmd = calculateRMD(balance, 75);
      
      // RMD = 100 / 24.6 = 4.065...
      expect(rmd.toString()).toContain('4.06');
    });
  });

  describe('calculateRMD - age-based rules', () => {
    it('should return 0 RMD for age 70 regardless of balance', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 70);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should return 0 RMD for age 71', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 71);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should return 0 RMD for age 72 when birth year is 1960 (RMD age 75)', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 72, 1960);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should return 0 RMD for age 73 when birth year is 1960', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 73, 1960);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should return 0 RMD for age 74 when birth year is 1960', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 74, 1960);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should calculate RMD at age 75 when birth year is 1960', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 75, 1960);
      
      // RMD should be calculated (not 0)
      expect(rmd.gt(toBig(0))).toBe(true);
      expect(rmd.toString()).toContain('20325.20');
    });

    it('should return 0 RMD for age 72 when birth year is 1955 (RMD age 73)', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 72, 1955);
      
      expect(rmd.toString()).toBe('0');
    });

    it('should calculate RMD at age 73 when birth year is 1955', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 73, 1955);
      
      expect(rmd.gt(toBig(0))).toBe(true);
      expect(rmd.toString()).toContain('18867.92');
    });

    it('should calculate RMD at age 72 when birth year is 1950 (RMD age 72)', () => {
      const balance = toBig(500000);
      const rmd = calculateRMD(balance, 72, 1950);
      
      expect(rmd.gt(toBig(0))).toBe(true);
      expect(rmd.toString()).toContain('18248.17');
    });

    it('should use conservative age 73 when birth year not provided', () => {
      const balance = toBig(500000);
      
      // Age 72 without birth year should return 0
      const rmd72 = calculateRMD(balance, 72);
      expect(rmd72.toString()).toBe('0');
      
      // Age 73 without birth year should calculate RMD
      const rmd73 = calculateRMD(balance, 73);
      expect(rmd73.gt(toBig(0))).toBe(true);
    });
  });

  describe('calculateRMD - edge cases', () => {
    it('should handle age at exact RMD starting age', () => {
      const balance = toBig(100000);
      
      // Born 1950, RMD at 72
      const rmd = calculateRMD(balance, 72, 1950);
      expect(rmd.gt(toBig(0))).toBe(true);
    });

    it('should handle age just before RMD starting age', () => {
      const balance = toBig(100000);
      
      // Born 1950, age 71 (one year before RMD)
      const rmd = calculateRMD(balance, 71, 1950);
      expect(rmd.toString()).toBe('0');
    });

    it('should handle very old age (120+)', () => {
      const balance = toBig(50000);
      const rmd = calculateRMD(balance, 125);
      
      // RMD = 50000 / 2.0 = 25000
      expect(rmd.toString()).toBe('25000');
    });

    it('should handle decimal balances', () => {
      const balance = toBig('123456.78');
      const rmd = calculateRMD(balance, 75);
      
      // RMD = 123456.78 / 24.6
      expect(rmd.gt(toBig(5000))).toBe(true);
      expect(rmd.lt(toBig(5100))).toBe(true);
    });

    it('should maintain precision with Big.js', () => {
      const balance = toBig('999999.99');
      const rmd = calculateRMD(balance, 80);
      
      // Should not have floating-point errors
      const expected = balance.div('20.2');
      expect(rmd.toString()).toBe(expected.toString());
    });
  });

  describe('calculateRMD - realistic scenarios', () => {
    it('should calculate RMD for typical retiree scenario', () => {
      // 75-year-old with $800k Traditional IRA, born in 1949
      const balance = toBig(800000);
      const rmd = calculateRMD(balance, 75, 1949);
      
      // RMD = 800000 / 24.6 = 32520.325203...
      expect(rmd.toString()).toContain('32520.32');
    });

    it('should calculate RMD for older retiree', () => {
      // 85-year-old with $300k Traditional IRA
      const balance = toBig(300000);
      const rmd = calculateRMD(balance, 85);
      
      // RMD = 300000 / 16.0 = 18750
      expect(rmd.toString()).toBe('18750');
    });

    it('should calculate RMD for very old retiree', () => {
      // 95-year-old with $150k Traditional IRA
      const balance = toBig(150000);
      const rmd = calculateRMD(balance, 95);
      
      // RMD = 150000 / 8.9 = 16853.932584...
      expect(rmd.toString()).toContain('16853.93');
    });

    it('should calculate increasing RMD percentage as age increases', () => {
      const balance = toBig(100000);
      
      const rmd75 = calculateRMD(balance, 75);
      const rmd85 = calculateRMD(balance, 85);
      const rmd95 = calculateRMD(balance, 95);
      
      // As age increases, RMD percentage increases
      expect(rmd85.gt(rmd75)).toBe(true);
      expect(rmd95.gt(rmd85)).toBe(true);
    });

    it('should handle depleting account over time', () => {
      let balance = toBig(100000);
      
      // Calculate RMDs for several years and verify balance decreases
      const rmd75 = calculateRMD(balance, 75);
      balance = balance.minus(rmd75);
      
      const rmd76 = calculateRMD(balance, 76);
      balance = balance.minus(rmd76);
      
      calculateRMD(balance, 77); // Year 77 RMD calculated
      
      // Balance should decrease each year
      expect(balance.lt(toBig(100000))).toBe(true);
      expect(balance.gt(toBig(90000))).toBe(true);
    });
  });

  describe('calculateRMD - SECURE Act 2.0 scenarios', () => {
    it('should apply correct age for person born in 1950 (pre-SECURE 2.0)', () => {
      const balance = toBig(200000);
      
      // Should start RMDs at age 72
      expect(calculateRMD(balance, 71, 1950).toString()).toBe('0');
      expect(calculateRMD(balance, 72, 1950).gt(toBig(0))).toBe(true);
    });

    it('should apply correct age for person born in 1955 (SECURE 2.0 tier 1)', () => {
      const balance = toBig(200000);
      
      // Should start RMDs at age 73
      expect(calculateRMD(balance, 72, 1955).toString()).toBe('0');
      expect(calculateRMD(balance, 73, 1955).gt(toBig(0))).toBe(true);
    });

    it('should apply correct age for person born in 1965 (SECURE 2.0 tier 2)', () => {
      const balance = toBig(200000);
      
      // Should start RMDs at age 75
      expect(calculateRMD(balance, 72, 1965).toString()).toBe('0');
      expect(calculateRMD(balance, 73, 1965).toString()).toBe('0');
      expect(calculateRMD(balance, 74, 1965).toString()).toBe('0');
      expect(calculateRMD(balance, 75, 1965).gt(toBig(0))).toBe(true);
    });

    it('should handle boundary year 1951 correctly', () => {
      const balance = toBig(200000);
      
      // 1951 is first year for age 73 RMD
      expect(calculateRMD(balance, 72, 1951).toString()).toBe('0');
      expect(calculateRMD(balance, 73, 1951).gt(toBig(0))).toBe(true);
    });

    it('should handle boundary year 1960 correctly', () => {
      const balance = toBig(200000);
      
      // 1960 is first year for age 75 RMD
      expect(calculateRMD(balance, 74, 1960).toString()).toBe('0');
      expect(calculateRMD(balance, 75, 1960).gt(toBig(0))).toBe(true);
    });
  });
});
