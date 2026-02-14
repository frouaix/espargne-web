// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCurrencyWithCents } from '../utils/format';

describe('format', () => {
  describe('formatCurrency', () => {
    it('should format whole numbers with thousands separators', () => {
      expect(formatCurrency(1234567)).toBe('1,234,567');
    });

    it('should format small numbers without separators', () => {
      expect(formatCurrency(123)).toBe('123');
    });

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('0');
    });

    it('should round decimal values to whole numbers', () => {
      expect(formatCurrency(1234.56)).toBe('1,235');
      expect(formatCurrency(1234.49)).toBe('1,234');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1234567)).toBe('-1,234,567');
    });

    it('should handle large numbers', () => {
      expect(formatCurrency(1000000)).toBe('1,000,000');
      expect(formatCurrency(1000000000)).toBe('1,000,000,000');
    });

    it('should handle very small numbers', () => {
      expect(formatCurrency(1)).toBe('1');
      expect(formatCurrency(0.5)).toBe('1'); // Rounds up
    });

    it('should handle decimal that rounds down', () => {
      expect(formatCurrency(999.4)).toBe('999');
    });

    it('should handle decimal that rounds up', () => {
      expect(formatCurrency(999.5)).toBe('1,000');
    });
  });

  describe('formatCurrencyWithCents', () => {
    it('should format with two decimal places', () => {
      expect(formatCurrencyWithCents(1234.56)).toBe('1,234.56');
    });

    it('should format whole numbers with .00', () => {
      expect(formatCurrencyWithCents(1234)).toBe('1,234.00');
    });

    it('should format with thousands separators', () => {
      expect(formatCurrencyWithCents(1234567.89)).toBe('1,234,567.89');
    });

    it('should format zero with cents', () => {
      expect(formatCurrencyWithCents(0)).toBe('0.00');
    });

    it('should round to two decimal places', () => {
      expect(formatCurrencyWithCents(1234.567)).toBe('1,234.57');
      expect(formatCurrencyWithCents(1234.564)).toBe('1,234.56');
    });

    it('should handle negative numbers with cents', () => {
      expect(formatCurrencyWithCents(-1234.56)).toBe('-1,234.56');
    });

    it('should handle single decimal digit', () => {
      expect(formatCurrencyWithCents(1234.5)).toBe('1,234.50');
    });

    it('should handle very small amounts', () => {
      expect(formatCurrencyWithCents(0.01)).toBe('0.01');
      expect(formatCurrencyWithCents(0.99)).toBe('0.99');
    });

    it('should handle large numbers with cents', () => {
      expect(formatCurrencyWithCents(1000000.99)).toBe('1,000,000.99');
    });

    it('should round 3+ decimal places correctly', () => {
      expect(formatCurrencyWithCents(1234.999)).toBe('1,235.00');
    });
  });
});
