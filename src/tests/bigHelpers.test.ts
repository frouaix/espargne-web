// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import {
  toBig,
  add,
  subtract,
  multiply,
  divide,
  toCurrency,
  toNumber,
  toDollars,
  max,
  min,
  isZero,
  isPositive,
  isNegative,
  compare,
  round,
  percent,
  sum,
  compoundGrowth,
  applyGrowth,
  parsePercent,
  clamp,
  effectiveTaxRate,
  toPercent,
} from '../lib/bigHelpers';

describe('bigHelpers', () => {
  describe('toBig', () => {
    it('should convert number to Big', () => {
      const result = toBig(100);
      expect(result.toString()).toBe('100');
    });

    it('should convert string to Big', () => {
      const result = toBig('100.50');
      expect(result.toString()).toBe('100.5');
    });

    it('should handle zero', () => {
      const result = toBig(0);
      expect(result.toString()).toBe('0');
    });

    it('should handle negative numbers', () => {
      const result = toBig(-50.25);
      expect(result.toString()).toBe('-50.25');
    });
  });

  describe('add', () => {
    it('should add two Big numbers', () => {
      const a = toBig(100);
      const b = toBig(50);
      const result = add(a, b);
      expect(result.toString()).toBe('150');
    });

    it('should handle decimals precisely', () => {
      const a = toBig(0.1);
      const b = toBig(0.2);
      const result = add(a, b);
      expect(result.toString()).toBe('0.3');
    });
  });

  describe('subtract', () => {
    it('should subtract two Big numbers', () => {
      const a = toBig(100);
      const b = toBig(50);
      const result = subtract(a, b);
      expect(result.toString()).toBe('50');
    });

    it('should handle negative results', () => {
      const a = toBig(50);
      const b = toBig(100);
      const result = subtract(a, b);
      expect(result.toString()).toBe('-50');
    });
  });

  describe('multiply', () => {
    it('should multiply two Big numbers', () => {
      const a = toBig(100);
      const b = toBig(2);
      const result = multiply(a, b);
      expect(result.toString()).toBe('200');
    });

    it('should handle decimals', () => {
      const a = toBig(100);
      const b = toBig(0.05);
      const result = multiply(a, b);
      expect(result.toString()).toBe('5');
    });
  });

  describe('divide', () => {
    it('should divide two Big numbers', () => {
      const a = toBig(100);
      const b = toBig(2);
      const result = divide(a, b);
      expect(result.toString()).toBe('50');
    });

    it('should handle decimal division', () => {
      const a = toBig(100);
      const b = toBig(3);
      const result = divide(a, b);
      // Uses configured Big.js precision (Big.DP = 10 in bigHelpers)
      expect(result.toString()).toContain('33.333333');
    });
  });

  describe('toCurrency', () => {
    it('should format number as currency with default precision', () => {
      const value = toBig(1234.567);
      const result = toCurrency(value);
      expect(result).toBe('1234.57');
    });

    it('should format with custom precision', () => {
      const value = toBig(1234.567);
      const result = toCurrency(value, 0);
      expect(result).toBe('1235');
    });

    it('should handle negative values', () => {
      const value = toBig(-1234.567);
      const result = toCurrency(value);
      expect(result).toBe('-1234.57');
    });
  });

  describe('toNumber', () => {
    it('should convert Big to number', () => {
      const value = toBig(1234.567);
      const result = toNumber(value);
      expect(result).toBe(1234.567);
    });

    it('should handle zero', () => {
      const value = toBig(0);
      const result = toNumber(value);
      expect(result).toBe(0);
    });

    it('should handle negative values', () => {
      const value = toBig(-1234.567);
      const result = toNumber(value);
      expect(result).toBe(-1234.567);
    });
  });

  describe('toDollars', () => {
    it('should format as integer dollars with no cents', () => {
      const value = toBig(1234.567);
      const result = toDollars(value);
      expect(result).toBe('1235');
    });

    it('should handle negative values', () => {
      const value = toBig(-1234.567);
      const result = toDollars(value);
      expect(result).toBe('-1235');
    });

    it('should handle zero', () => {
      const value = toBig(0);
      const result = toDollars(value);
      expect(result).toBe('0');
    });
  });

  describe('max', () => {
    it('should return maximum of multiple values', () => {
      const result = max(10, 50, 30, 20);
      expect(result.toString()).toBe('50');
    });

    it('should handle Big values', () => {
      const result = max(toBig(10), toBig(50), toBig(30));
      expect(result.toString()).toBe('50');
    });

    it('should handle negative values', () => {
      const result = max(-10, -50, -5);
      expect(result.toString()).toBe('-5');
    });

    it('should return 0 for empty array', () => {
      const result = max();
      expect(result.toString()).toBe('0');
    });

    it('should handle single value', () => {
      const result = max(42);
      expect(result.toString()).toBe('42');
    });
  });

  describe('min', () => {
    it('should return minimum of multiple values', () => {
      const result = min(10, 50, 30, 20);
      expect(result.toString()).toBe('10');
    });

    it('should handle Big values', () => {
      const result = min(toBig(10), toBig(50), toBig(5));
      expect(result.toString()).toBe('5');
    });

    it('should handle negative values', () => {
      const result = min(-10, -50, -5);
      expect(result.toString()).toBe('-50');
    });

    it('should return 0 for empty array', () => {
      const result = min();
      expect(result.toString()).toBe('0');
    });

    it('should handle single value', () => {
      const result = min(42);
      expect(result.toString()).toBe('42');
    });
  });

  describe('isZero', () => {
    it('should return true for zero', () => {
      expect(isZero(toBig(0))).toBe(true);
    });

    it('should return false for positive number', () => {
      expect(isZero(toBig(1))).toBe(false);
    });

    it('should return false for negative number', () => {
      expect(isZero(toBig(-1))).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive number', () => {
      expect(isPositive(toBig(1))).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isPositive(toBig(0))).toBe(false);
    });

    it('should return false for negative number', () => {
      expect(isPositive(toBig(-1))).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative number', () => {
      expect(isNegative(toBig(-1))).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isNegative(toBig(0))).toBe(false);
    });

    it('should return false for positive number', () => {
      expect(isNegative(toBig(1))).toBe(false);
    });
  });

  describe('compare', () => {
    it('should return -1 when a < b', () => {
      expect(compare(10, 20)).toBe(-1);
    });

    it('should return 0 when a === b', () => {
      expect(compare(20, 20)).toBe(0);
    });

    it('should return 1 when a > b', () => {
      expect(compare(30, 20)).toBe(1);
    });

    it('should handle Big values', () => {
      expect(compare(toBig(10), toBig(20))).toBe(-1);
      expect(compare(toBig(20), toBig(20))).toBe(0);
      expect(compare(toBig(30), toBig(20))).toBe(1);
    });

    it('should handle negative values', () => {
      expect(compare(-10, -5)).toBe(-1);
      expect(compare(-5, -10)).toBe(1);
    });
  });

  describe('round', () => {
    it('should round to default 2 decimal places', () => {
      const result = round(toBig(1234.5678));
      expect(result.toString()).toBe('1234.57');
    });

    it('should round to specified decimal places', () => {
      const result = round(toBig(1234.5678), 0);
      expect(result.toString()).toBe('1235');
    });

    it('should round to 3 decimal places', () => {
      const result = round(toBig(1234.5678), 3);
      expect(result.toString()).toBe('1234.568');
    });

    it('should handle negative values', () => {
      const result = round(toBig(-1234.5678));
      expect(result.toString()).toBe('-1234.57');
    });
  });

  describe('percent', () => {
    it('should calculate percentage of a value', () => {
      const result = percent(100, 0.15);
      expect(result.toString()).toBe('15');
    });

    it('should handle Big values', () => {
      const result = percent(toBig(1000), toBig(0.05));
      expect(result.toString()).toBe('50');
    });

    it('should handle zero rate', () => {
      const result = percent(100, 0);
      expect(result.toString()).toBe('0');
    });

    it('should handle negative rate', () => {
      const result = percent(100, -0.1);
      expect(result.toString()).toBe('-10');
    });
  });

  describe('sum', () => {
    it('should sum array of Big values', () => {
      const values = [toBig(10), toBig(20), toBig(30)];
      const result = sum(values);
      expect(result.toString()).toBe('60');
    });

    it('should handle empty array', () => {
      const result = sum([]);
      expect(result.toString()).toBe('0');
    });

    it('should handle single value', () => {
      const result = sum([toBig(42)]);
      expect(result.toString()).toBe('42');
    });

    it('should handle negative values', () => {
      const values = [toBig(10), toBig(-20), toBig(30)];
      const result = sum(values);
      expect(result.toString()).toBe('20');
    });
  });

  describe('compoundGrowth', () => {
    it('should calculate compound growth over periods', () => {
      const result = compoundGrowth(1000, 0.05, 3);
      expect(result.toString()).toBe('1157.625');
    });

    it('should handle zero periods', () => {
      const result = compoundGrowth(1000, 0.05, 0);
      expect(result.toString()).toBe('1000');
    });

    it('should handle negative rate', () => {
      const result = compoundGrowth(1000, -0.1, 2);
      expect(result.toString()).toBe('810');
    });

    it('should handle Big values', () => {
      const result = compoundGrowth(toBig(1000), toBig(0.1), 2);
      expect(result.toString()).toBe('1210');
    });
  });

  describe('applyGrowth', () => {
    it('should apply growth rate to value', () => {
      const result = applyGrowth(1000, 0.05);
      expect(result.toString()).toBe('1050');
    });

    it('should handle zero rate', () => {
      const result = applyGrowth(1000, 0);
      expect(result.toString()).toBe('1000');
    });

    it('should handle negative rate', () => {
      const result = applyGrowth(1000, -0.1);
      expect(result.toString()).toBe('900');
    });

    it('should handle Big values', () => {
      const result = applyGrowth(toBig(1000), toBig(0.05));
      expect(result.toString()).toBe('1050');
    });
  });

  describe('parsePercent', () => {
    it('should parse percentage string with % symbol', () => {
      const result = parsePercent('5%');
      expect(result.toString()).toBe('0.05');
    });

    it('should parse decimal string without % symbol', () => {
      const result = parsePercent('0.05');
      expect(result.toString()).toBe('0.05');
    });

    it('should handle whitespace', () => {
      const result = parsePercent('  5%  ');
      expect(result.toString()).toBe('0.05');
    });

    it('should handle large percentages', () => {
      const result = parsePercent('150%');
      expect(result.toString()).toBe('1.5');
    });

    it('should handle decimal percentages', () => {
      const result = parsePercent('5.5%');
      expect(result.toString()).toBe('0.055');
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      const result = clamp(50, 0, 100);
      expect(result.toString()).toBe('50');
    });

    it('should return min when value below range', () => {
      const result = clamp(-10, 0, 100);
      expect(result.toString()).toBe('0');
    });

    it('should return max when value above range', () => {
      const result = clamp(150, 0, 100);
      expect(result.toString()).toBe('100');
    });

    it('should handle Big values', () => {
      const result = clamp(toBig(50), toBig(0), toBig(100));
      expect(result.toString()).toBe('50');
    });

    it('should handle negative ranges', () => {
      const result = clamp(-50, -100, -10);
      expect(result.toString()).toBe('-50');
    });
  });

  describe('effectiveTaxRate', () => {
    it('should calculate effective tax rate', () => {
      const result = effectiveTaxRate(15000, 100000);
      expect(result.toString()).toBe('0.15');
    });

    it('should return 0 when income is 0', () => {
      const result = effectiveTaxRate(1000, 0);
      expect(result.toString()).toBe('0');
    });

    it('should handle Big values', () => {
      const result = effectiveTaxRate(toBig(20000), toBig(100000));
      expect(result.toString()).toBe('0.2');
    });

    it('should handle zero tax', () => {
      const result = effectiveTaxRate(0, 100000);
      expect(result.toString()).toBe('0');
    });
  });

  describe('toPercent', () => {
    it('should format Big as percentage with default precision', () => {
      const result = toPercent(toBig(0.05));
      expect(result).toBe('5.00%');
    });

    it('should format with custom precision', () => {
      const result = toPercent(toBig(0.05), 0);
      expect(result).toBe('5%');
    });

    it('should handle large percentages', () => {
      const result = toPercent(toBig(1.5));
      expect(result).toBe('150.00%');
    });

    it('should handle negative percentages', () => {
      const result = toPercent(toBig(-0.05));
      expect(result).toBe('-5.00%');
    });

    it('should handle zero', () => {
      const result = toPercent(toBig(0));
      expect(result).toBe('0.00%');
    });
  });
});
