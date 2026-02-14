// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import { validateUserProfile, validateAccount } from '../utils/validation';
import type { UserProfileData } from '../components/UserProfileForm';
import type { Account } from '../utils/export';
import { FilingStatus } from '../lib/types';

describe('validation', () => {
  describe('validateUserProfile', () => {
    it('should return true for valid profile', () => {
      const profile: UserProfileData = {
        birthYear: 1960,
        filingStatus: FilingStatus.SINGLE,
        retirementAge: 65,
      };
      
      expect(validateUserProfile(profile)).toBe(true);
    });

    it('should return false when birthYear is missing', () => {
      const profile = {
        filingStatus: FilingStatus.SINGLE,
        retirementAge: 65,
      } as UserProfileData;
      
      expect(validateUserProfile(profile)).toBe(false);
    });

    it('should return false when filingStatus is missing', () => {
      const profile = {
        birthYear: 1960,
        retirementAge: 65,
      } as UserProfileData;
      
      expect(validateUserProfile(profile)).toBe(false);
    });

    it('should return false when retirementAge is missing', () => {
      const profile = {
        birthYear: 1960,
        filingStatus: FilingStatus.SINGLE,
      } as UserProfileData;
      
      expect(validateUserProfile(profile)).toBe(false);
    });

    it('should return false when all fields are missing', () => {
      const profile = {} as UserProfileData;
      
      expect(validateUserProfile(profile)).toBe(false);
    });

    it('should handle married filing jointly status', () => {
      const profile: UserProfileData = {
        birthYear: 1960,
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
        retirementAge: 67,
      };
      
      expect(validateUserProfile(profile)).toBe(true);
    });

    it('should handle head of household status', () => {
      const profile: UserProfileData = {
        birthYear: 1960,
        filingStatus: FilingStatus.HEAD_OF_HOUSEHOLD,
        retirementAge: 65,
      };
      
      expect(validateUserProfile(profile)).toBe(true);
    });

    it('should return false for zero birthYear', () => {
      const profile: UserProfileData = {
        birthYear: 0,
        filingStatus: FilingStatus.SINGLE,
        retirementAge: 65,
      };
      
      expect(validateUserProfile(profile)).toBe(false);
    });

    it('should return false for zero retirementAge', () => {
      const profile: UserProfileData = {
        birthYear: 1960,
        filingStatus: FilingStatus.SINGLE,
        retirementAge: 0,
      };
      
      expect(validateUserProfile(profile)).toBe(false);
    });
  });

  describe('validateAccount', () => {
    it('should return true for valid Roth account', () => {
      const account: Account = {
        accountId: 'roth-1',
        accountType: 'roth',
        balance: 100000,
        nickname: 'My Roth IRA',
      };
      
      expect(validateAccount(account)).toBe(true);
    });

    it('should return true for valid Traditional account', () => {
      const account: Account = {
        accountId: 'trad-1',
        accountType: 'traditional',
        balance: 500000,
        nickname: 'My 401k',
      };
      
      expect(validateAccount(account)).toBe(true);
    });

    it('should return true for valid Taxable account', () => {
      const account: Account = {
        accountId: 'tax-1',
        accountType: 'taxable',
        balance: 200000,
        costBasis: 150000,
        nickname: 'Brokerage',
        dividendYield: 0.02,
      };
      
      expect(validateAccount(account)).toBe(true);
    });

    it('should return false when accountId is missing', () => {
      const account = {
        accountType: 'roth',
        balance: 100000,
      } as Account;
      
      expect(validateAccount(account)).toBe(false);
    });

    it('should return false when accountType is missing', () => {
      const account = {
        accountId: 'roth-1',
        balance: 100000,
      } as Account;
      
      expect(validateAccount(account)).toBe(false);
    });

    it('should return true when balance is missing (optional field)', () => {
      const account = {
        accountId: 'roth-1',
        accountType: 'roth',
      } as Account;
      
      expect(validateAccount(account)).toBe(true);
    });

    it('should return false when balance is not a number', () => {
      // Using Partial to test invalid data
      const account = {
        accountId: 'roth-1',
        accountType: 'roth',
        nickname: 'Test',
        balance: 'invalid' as unknown as number,
      } as Account;
      
      expect(validateAccount(account)).toBe(false);
    });

    it('should return true for zero balance', () => {
      const account: Account = {
        accountId: 'roth-1',
        accountType: 'roth',
        nickname: 'Test',
        balance: 0,
      };
      
      expect(validateAccount(account)).toBe(true);
    });

    it('should return true for negative balance (edge case)', () => {
      const account: Account = {
        accountId: 'roth-1',
        accountType: 'roth',
        nickname: 'Test',
        balance: -100,
      };
      
      expect(validateAccount(account)).toBe(true);
    });

    it('should return false when accountId is empty string', () => {
      const account: Account = {
        accountId: '',
        accountType: 'roth',
        nickname: 'Test',
        balance: 100000,
      };
      
      expect(validateAccount(account)).toBe(false);
    });

    it('should return false when accountType is empty string', () => {
      // Using invalid type cast to test validation
      const account = {
        accountId: 'roth-1',
        accountType: '',
        nickname: 'Test',
        balance: 100000,
      } as unknown as Account;
      
      expect(validateAccount(account)).toBe(false);
    });

    it('should handle account with all optional fields', () => {
      const account: Account = {
        accountId: 'trad-1',
        accountType: 'traditional',
        balance: 500000,
        nickname: 'My IRA',
      };
      
      expect(validateAccount(account)).toBe(true);
    });
  });
});
