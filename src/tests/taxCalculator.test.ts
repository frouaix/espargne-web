// Copyright (c) 2026 François Rouaix
import { describe, it, expect } from 'vitest';
import { FederalTaxCalculator } from '../lib/taxCalculator';
import { FilingStatus } from '../lib/types';
import type { TaxInputs } from '../lib/types';
import { toBig } from '../lib/bigHelpers';

describe('FederalTaxCalculator', () => {
  const calculator = new FederalTaxCalculator();

  describe('calculate - basic scenarios', () => {
    it('should calculate zero tax for income below standard deduction', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(10000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      expect(result.totalTax.toString()).toBe('0');
      expect(result.agi.toString()).toBe('10000');
      expect(result.taxableIncome.toString()).toBe('0');
    });

    it('should calculate tax for single filer with only ordinary income', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(50000), // Above standard deduction
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // AGI should equal ordinary income
      expect(result.agi.toString()).toBe('50000');
      
      // Taxable income = 50000 - 14600 (standard deduction) = 35400
      expect(result.taxableIncome.toString()).toBe('35400');
      
      // Tax: 10% on first 11600 + 12% on remaining 23800
      // = 1160 + 2856 = 4016
      expect(result.totalTax.toString()).toBe('4016');
      expect(result.ordinaryTax.toString()).toBe('4016');
      expect(result.ltcgTax.toString()).toBe('0');
    });

    it('should calculate tax for married filing jointly', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(100000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
      };

      const result = calculator.calculate(inputs);
      
      // AGI = 100000
      expect(result.agi.toString()).toBe('100000');
      
      // Taxable income = 100000 - 29200 = 70800
      expect(result.taxableIncome.toString()).toBe('70800');
      
      // Tax: 10% on 23200 + 12% on 47600
      // = 2320 + 5712 = 8032
      expect(result.totalTax.toString()).toBe('8032');
    });

    it('should calculate tax for head of household', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(75000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.HEAD_OF_HOUSEHOLD,
      };

      const result = calculator.calculate(inputs);
      
      // Taxable income = 75000 - 21900 = 53100
      expect(result.taxableIncome.toString()).toBe('53100');
      
      // Tax: 10% on 16550 + 12% on 36550
      // = 1655 + 4386 = 6041
      expect(result.totalTax.toString()).toBe('6041');
    });
  });

  describe('calculate - LTCG and qualified dividends', () => {
    it('should apply 0% LTCG rate when income is low', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(20000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(15000),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // AGI = 35000
      // Taxable = 35000 - 14600 = 20400
      // Ordinary portion = 20000 - 14600 = 5400
      // LTCG portion = 15000 (all taxable)
      
      // All LTCG should be in 0% bracket (threshold is 47025)
      expect(result.ltcgTax.toString()).toBe('0');
    });

    it('should apply 15% LTCG rate when income is moderate', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(50000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(30000),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // AGI = 80000
      // Taxable = 80000 - 14600 = 65400
      // Ordinary portion = min(65400, 50000 - 14600) = 35400
      // LTCG portion = 30000
      
      // Ordinary stack ends at 35400
      // 0% bracket ceiling is 47025, so room = 47025 - 35400 = 11625
      // First 11625 of LTCG at 0%
      // Remaining 18375 at 15%
      // Tax = 0 + 18375 * 0.15 = 2756.25
      expect(result.ltcgTax.toString()).toBe('2756.25');
    });

    it('should apply 20% LTCG rate when income is high', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(500000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(100000),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // High income scenario
      // Taxable = 585400, Ordinary portion = 485400, LTCG portion = 100000
      // 0% bracket room = 0 (ordinary stack above 47025)
      // 15% bracket room = 518900 - 485400 = 33500
      // Amount at 15% = 33500, Amount at 20% = 66500
      // Tax = 33500*0.15 + 66500*0.20 = 5025 + 13300 = 18325
      expect(result.ltcgTax.toString()).toBe('18325');
    });

    it('should correctly stack qualified dividends and LTCG', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(40000),
        qualifiedDividends: toBig(5000),
        longTermCapitalGains: toBig(10000),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // AGI = 55000
      // Taxable = 55000 - 14600 = 40400
      // Ordinary portion = min(40400, 40000 - 14600) = 25400
      // LTCG+QD portion = 15000
      
      // All preferential income in 0% bracket (25400 < 47025)
      expect(result.ltcgTax.toString()).toBe('0');
      expect(result.ltcgTaxable.toString()).toBe('15000');
    });
  });

  describe('calculate - Social Security taxation', () => {
    it('should not tax Social Security when income is below first threshold', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(10000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(20000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Combined income = 10000 + 0 + 0 + 0 + 20000*0.5 = 20000
      // Below threshold of 25000, so no SS taxed
      expect(result.taxableSocialSecurity.toString()).toBe('0');
      expect(result.agi.toString()).toBe('10000');
    });

    it('should tax up to 50% of Social Security when in first tier', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(20000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(20000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Combined income = 20000 + 0 + 0 + 0 + 20000*0.5 = 30000
      // Between 25000 and 34000, so up to 50% taxable
      // Taxable = min(20000*0.5, (30000-25000)*0.5) = min(10000, 2500) = 2500
      expect(result.taxableSocialSecurity.toString()).toBe('2500');
      expect(result.agi.toString()).toBe('22500');
    });

    it('should tax up to 85% of Social Security when in second tier', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(40000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(30000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Combined income = 40000 + 0 + 0 + 0 + 30000*0.5 = 55000
      // Above 34000, so up to 85% taxable
      // Formula: 85% of (55000-34000) + min(4500, 30000*0.5)
      // = 21000*0.85 + 4500 = 17850 + 4500 = 22350
      // Cap at 85% of SS = 30000 * 0.85 = 25500
      // Result = min(22350, 25500) = 22350
      expect(result.taxableSocialSecurity.toString()).toBe('22350');
    });

    it('should respect 85% cap on Social Security taxation', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(100000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(40000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Very high income, should hit 85% cap
      // Max taxable = 40000 * 0.85 = 34000
      expect(result.taxableSocialSecurity.toString()).toBe('34000');
    });

    it('should use different thresholds for married filing jointly', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(35000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(30000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
      };

      const result = calculator.calculate(inputs);
      
      // Combined income = 35000 + 30000*0.5 = 50000
      // MFJ thresholds: 32000, 44000, 6000
      // Above 44000, so in 85% tier
      // Formula: 85% of (50000-44000) + min(6000, 30000*0.5)
      // = 6000*0.85 + 6000 = 5100 + 6000 = 11100
      expect(result.taxableSocialSecurity.toString()).toBe('11100');
    });
  });

  describe('calculate - AGI and MAGI', () => {
    it('should calculate AGI correctly with all income types', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(50000),
        qualifiedDividends: toBig(5000),
        longTermCapitalGains: toBig(10000),
        socialSecurityGross: toBig(20000),
        taxExemptInterest: toBig(2000),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // AGI = ordinary + QD + LTCG + taxable SS
      // Need to calculate taxable SS first
      // Combined income = 50000 + 5000 + 10000 + 2000 + 20000*0.5 = 77000
      // Above 34000, so 85% formula applies
      // This is complex, but AGI should include all income except tax-exempt interest
      expect(result.agi.gt(toBig(65000))).toBe(true);
      expect(result.agi.lt(toBig(100000))).toBe(true);
    });

    it('should calculate MAGI including tax-exempt interest', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(50000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(5000),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // AGI = 50000 (no taxable SS)
      // MAGI = AGI + tax-exempt interest = 50000 + 5000 = 55000
      expect(result.agi.toString()).toBe('50000');
      expect(result.magi.toString()).toBe('55000');
    });
  });

  describe('calculate - progressive bracket filling', () => {
    it('should correctly fill multiple ordinary brackets', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(150000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Taxable = 150000 - 14600 = 135400
      // 10% on 11600 = 1160
      // 12% on (47150-11600) = 35550 * 0.12 = 4266
      // 22% on (100525-47150) = 53375 * 0.22 = 11742.5
      // 24% on (135400-100525) = 34875 * 0.24 = 8370
      // Total = 1160 + 4266 + 11742.5 + 8370 = 25538.5
      expect(result.totalTax.toString()).toBe('25538.5');
    });

    it('should handle income in top bracket', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(700000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Should reach 37% bracket (above 609350)
      // Tax should be substantial
      expect(result.totalTax.gt(toBig(200000))).toBe(true);
      expect(result.ordinaryTaxable.gt(toBig(600000))).toBe(true);
    });
  });

  describe('calculate - edge cases', () => {
    it('should handle zero income', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(0),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      expect(result.totalTax.toString()).toBe('0');
      expect(result.agi.toString()).toBe('0');
      expect(result.magi.toString()).toBe('0');
    });

    it('should handle very small amounts', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(0.01),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Below standard deduction
      expect(result.totalTax.toString()).toBe('0');
      expect(result.agi.toString()).toBe('0.01');
    });

    it('should handle only qualified dividends with no ordinary income', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(0),
        qualifiedDividends: toBig(30000),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // AGI = 30000
      // Taxable = 30000 - 14600 = 15400
      // All QD, no ordinary
      // All in 0% LTCG bracket
      expect(result.ordinaryTax.toString()).toBe('0');
      expect(result.ltcgTax.toString()).toBe('0');
      expect(result.totalTax.toString()).toBe('0');
    });

    it('should handle negative intermediate calculations correctly', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(5000),
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Income below standard deduction
      // Taxable income should be 0, not negative
      expect(result.taxableIncome.toString()).toBe('0');
      expect(result.totalTax.toString()).toBe('0');
    });
  });

  describe('calculate - complex mixed scenarios', () => {
    it('should handle complex scenario with all income types', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(60000),
        qualifiedDividends: toBig(8000),
        longTermCapitalGains: toBig(12000),
        socialSecurityGross: toBig(25000),
        taxExemptInterest: toBig(3000),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Should have:
      // - Taxable SS component
      // - Ordinary tax component
      // - LTCG tax component
      // - AGI and MAGI different values
      expect(result.taxableSocialSecurity.gt(toBig(0))).toBe(true);
      expect(result.ordinaryTax.gt(toBig(0))).toBe(true);
      expect(result.totalTax.gt(toBig(0))).toBe(true);
      expect(result.magi.gt(result.agi)).toBe(true);
    });

    it('should correctly split income between ordinary and preferential', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(80000),
        qualifiedDividends: toBig(10000),
        longTermCapitalGains: toBig(15000),
        socialSecurityGross: toBig(0),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
      };

      const result = calculator.calculate(inputs);
      
      // Taxable = 105000 - 29200 = 75800
      // LTCG+QD = 25000
      // Ordinary = 75800 - 25000 = 50800
      expect(result.ordinaryTaxable.toString()).toBe('50800');
      expect(result.ltcgTaxable.toString()).toBe('25000');
    });
  });

  describe('calculate - realistic retirement scenarios', () => {
    it('should calculate tax for typical retiree with pension and Social Security', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(40000), // Pension or IRA withdrawal
        qualifiedDividends: toBig(0),
        longTermCapitalGains: toBig(0),
        socialSecurityGross: toBig(30000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
      };

      const result = calculator.calculate(inputs);
      
      // Should have moderate tax with some SS taxable
      expect(result.taxableSocialSecurity.gt(toBig(0))).toBe(true);
      expect(result.totalTax.gt(toBig(0))).toBe(true);
      expect(result.totalTax.lt(toBig(10000))).toBe(true);
    });

    it('should calculate tax for retiree living on LTCG from taxable account', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(0),
        qualifiedDividends: toBig(5000),
        longTermCapitalGains: toBig(40000),
        socialSecurityGross: toBig(25000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.SINGLE,
      };

      const result = calculator.calculate(inputs);
      
      // Low ordinary income, mostly LTCG
      // Should have favorable tax treatment
      expect(result.ltcgTax.lte(result.ordinaryTax.plus(toBig(5000)))).toBe(true);
    });

    it('should calculate tax for high-income retiree with RMDs', () => {
      const inputs: TaxInputs = {
        ordinaryIncome: toBig(120000), // Large RMD
        qualifiedDividends: toBig(15000),
        longTermCapitalGains: toBig(25000),
        socialSecurityGross: toBig(35000),
        taxExemptInterest: toBig(0),
        filingStatus: FilingStatus.MARRIED_FILING_JOINTLY,
      };

      const result = calculator.calculate(inputs);
      
      // High income scenario
      // Should have substantial tax
      expect(result.totalTax.gt(toBig(20000))).toBe(true);
      // Most SS should be taxable (85%)
      expect(result.taxableSocialSecurity.toString()).toBe('29750');
    });
  });
});
