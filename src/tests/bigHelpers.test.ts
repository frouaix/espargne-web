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
});
