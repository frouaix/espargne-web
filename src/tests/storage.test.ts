import { describe, it, expect, beforeEach } from 'vitest'
import { STORAGE_KEYS } from '../utils/storage'

describe('storage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('STORAGE_KEYS', () => {
    it('should have consistent key prefix', () => {
      const keys = Object.values(STORAGE_KEYS)
      
      // All keys should start with 'retirement-calc-'
      keys.forEach(key => {
        expect(key).toMatch(/^retirement-calc-/)
      })
    })

    it('should have all required keys', () => {
      expect(STORAGE_KEYS.USER_PROFILE).toBe('retirement-calc-user-profile')
      expect(STORAGE_KEYS.ACCOUNTS).toBe('retirement-calc-accounts')
      expect(STORAGE_KEYS.SSA_INCOME).toBe('retirement-calc-ssa-income')
      expect(STORAGE_KEYS.WITHDRAWAL_STRATEGY).toBe('retirement-calc-withdrawal-strategy')
      expect(STORAGE_KEYS.MIN_REQUIRED_INCOME).toBe('retirement-calc-min-required-income')
      expect(STORAGE_KEYS.MIN_INCOME_INFLATION_RATE).toBe('retirement-calc-min-income-inflation-rate')
      expect(STORAGE_KEYS.MAX_YEARS).toBe('retirement-calc-max-years')
    })

    it('should have unique keys', () => {
      const keys = Object.values(STORAGE_KEYS)
      const uniqueKeys = new Set(keys)
      
      expect(uniqueKeys.size).toBe(keys.length)
    })
  })

  describe('localStorage integration', () => {
    it('should be able to save and retrieve data', () => {
      const testData = { name: 'Test User', age: 65 }
      
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(testData))
      const retrieved = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || '{}')
      
      expect(retrieved).toEqual(testData)
    })

    it('should handle non-existent keys', () => {
      const value = localStorage.getItem('non-existent-key')
      
      expect(value).toBeNull()
    })

    it('should be able to remove items', () => {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, '[]')
      expect(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)).toBe('[]')
      
      localStorage.removeItem(STORAGE_KEYS.ACCOUNTS)
      expect(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)).toBeNull()
    })

    it('should be able to clear all storage', () => {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, '{}')
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, '[]')
      localStorage.setItem(STORAGE_KEYS.SSA_INCOME, '{}')
      
      localStorage.clear()
      
      expect(localStorage.getItem(STORAGE_KEYS.USER_PROFILE)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.ACCOUNTS)).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.SSA_INCOME)).toBeNull()
    })
  })

  describe('data persistence patterns', () => {
    it('should handle withdrawal strategy persistence', () => {
      const strategy = 'taxable_first'
      
      localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_STRATEGY, strategy)
      const retrieved = localStorage.getItem(STORAGE_KEYS.WITHDRAWAL_STRATEGY)
      
      expect(retrieved).toBe(strategy)
    })

    it('should handle numeric values as strings', () => {
      const minIncome = 75000
      
      localStorage.setItem(STORAGE_KEYS.MIN_REQUIRED_INCOME, minIncome.toString())
      const retrieved = parseInt(localStorage.getItem(STORAGE_KEYS.MIN_REQUIRED_INCOME) || '0')
      
      expect(retrieved).toBe(minIncome)
    })

    it('should handle max years persistence', () => {
      const maxYears = 40
      
      localStorage.setItem(STORAGE_KEYS.MAX_YEARS, maxYears.toString())
      const retrieved = parseInt(localStorage.getItem(STORAGE_KEYS.MAX_YEARS) || '30')
      
      expect(retrieved).toBe(maxYears)
    })

    it('should provide defaults for missing values', () => {
      // Simulate reading max_years when not set
      const defaultMaxYears = 30
      const retrieved = parseInt(
        localStorage.getItem(STORAGE_KEYS.MAX_YEARS) || defaultMaxYears.toString()
      )
      
      expect(retrieved).toBe(defaultMaxYears)
    })
  })
})
