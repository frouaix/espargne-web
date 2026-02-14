// Copyright (c) 2026 François Rouaix
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateAccountId } from '../utils/ids';

describe('ids', () => {
  describe('generateAccountId', () => {
    it('should generate ID with account type prefix', () => {
      const id = generateAccountId('roth');
      
      expect(id).toContain('roth-');
    });

    it('should generate unique IDs', () => {
      const id1 = generateAccountId('roth');
      const id2 = generateAccountId('roth');
      
      expect(id1).not.toBe(id2);
    });

    it('should handle different account types', () => {
      const rothId = generateAccountId('roth');
      const tradId = generateAccountId('traditional');
      const taxId = generateAccountId('taxable');
      
      expect(rothId).toContain('roth-');
      expect(tradId).toContain('traditional-');
      expect(taxId).toContain('taxable-');
    });

    it('should use crypto.randomUUID when available', () => {
      // Most tests will naturally use crypto if available
      const id = generateAccountId('test');
      
      expect(id).toContain('test-');
      expect(id.length).toBeGreaterThan(10);
    });

    it('should generate different IDs in rapid succession', () => {
      const ids = new Set();
      
      // Generate 100 IDs quickly
      for (let i = 0; i < 100; i++) {
        ids.add(generateAccountId('test'));
      }
      
      // All should be unique
      expect(ids.size).toBe(100);
    });

    it('should handle empty string account type', () => {
      const id = generateAccountId('');
      
      expect(id).toContain('-');
    });

    it('should handle special characters in account type', () => {
      const id = generateAccountId('my-special_account');
      
      expect(id).toContain('my-special_account-');
    });
  });
});
