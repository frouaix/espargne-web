/**
 * Federal Tax Calculator (2024 parameters)
 * 
 * Computes federal income tax for ordinary income, qualified dividends,
 * long-term capital gains, and Social Security taxation. Also returns AGI
 * and MAGI (for IRMAA checks).
 * 
 * Ported from Python implementation in espargne-core/calculators/tax_federal.py
 * 
 * Methodology:
 * 1. Calculate taxable portion of Social Security benefits (Pub 915 formula)
 * 2. Compute AGI (ordinary + QD + LTCG + taxable SS)
 * 3. Apply standard deduction to get taxable income
 * 4. Split taxable income into ordinary vs preferential (QD/LTCG) portions
 * 5. Apply progressive ordinary income brackets
 * 6. Stack LTCG/QD on top of ordinary income for preferential rate calculation
 * 7. Calculate MAGI (AGI + tax-exempt interest) for IRMAA checks
 */

import Big from 'big.js';
import { toBig, max, min } from './bigHelpers';
import { FilingStatus } from './types';
import type { TaxInputs, TaxResult } from './types';

/**
 * Tax bracket definition: [upperLimit, rate]
 * upperLimit is null for the top bracket (infinite ceiling)
 */
type TaxBracket = [Big | null, Big];

/**
 * LTCG/QD thresholds: [0% ceiling, 15% ceiling]
 * Above 15% ceiling, 20% rate applies
 */
type LTCGThresholds = [Big, Big];

/**
 * Social Security combined income thresholds: [base1, base2, additionalCap]
 * - base1: Below this, no SS taxed
 * - base2: Between base1 and base2, up to 50% taxed
 * - Above base2, up to 85% taxed
 * - additionalCap: Cap for the 50% portion calculation
 */
type SSAThresholds = [Big, Big, Big];

/**
 * Federal Tax Calculator using 2024 tax parameters.
 * 
 * All monetary values use Big.js for precise decimal arithmetic.
 * Tax brackets, deductions, and thresholds match IRS 2024 publication.
 */
export class FederalTaxCalculator {
  /**
   * Standard deductions for 2024 tax year.
   * These are subtracted from AGI to calculate taxable income.
   */
  private static readonly STANDARD_DEDUCTION: Record<FilingStatus, Big> = {
    [FilingStatus.SINGLE]: toBig('14600'),
    [FilingStatus.MARRIED_FILING_JOINTLY]: toBig('29200'),
    [FilingStatus.HEAD_OF_HOUSEHOLD]: toBig('21900'),
  };

  /**
   * Ordinary income tax brackets for 2024.
   * Progressive rates: 10%, 12%, 22%, 24%, 32%, 35%, 37%
   * 
   * Each bracket is [upperLimit, rate]. The last bracket has null limit (infinite).
   * Tax is calculated by filling each bracket sequentially.
   */
  private static readonly ORDINARY_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
    [FilingStatus.SINGLE]: [
      [toBig('11600'), toBig('0.10')],
      [toBig('47150'), toBig('0.12')],
      [toBig('100525'), toBig('0.22')],
      [toBig('191950'), toBig('0.24')],
      [toBig('243725'), toBig('0.32')],
      [toBig('609350'), toBig('0.35')],
      [null, toBig('0.37')],
    ],
    [FilingStatus.MARRIED_FILING_JOINTLY]: [
      [toBig('23200'), toBig('0.10')],
      [toBig('94300'), toBig('0.12')],
      [toBig('201050'), toBig('0.22')],
      [toBig('383900'), toBig('0.24')],
      [toBig('487450'), toBig('0.32')],
      [toBig('731200'), toBig('0.35')],
      [null, toBig('0.37')],
    ],
    [FilingStatus.HEAD_OF_HOUSEHOLD]: [
      [toBig('16550'), toBig('0.10')],
      [toBig('63100'), toBig('0.12')],
      [toBig('100500'), toBig('0.22')],
      [toBig('191950'), toBig('0.24')],
      [toBig('243700'), toBig('0.32')],
      [toBig('609350'), toBig('0.35')],
      [null, toBig('0.37')],
    ],
  };

  /**
   * Long-term capital gains and qualified dividend thresholds for 2024.
   * 
   * LTCG/QD are taxed at preferential rates (0%, 15%, 20%) based on total income.
   * These rates "stack" on top of ordinary income to determine which bracket applies.
   * 
   * [0% ceiling, 15% ceiling]
   * - Below 0% ceiling: 0% rate
   * - Between 0% and 15% ceiling: 15% rate  
   * - Above 15% ceiling: 20% rate
   */
  private static readonly LTCG_THRESHOLDS: Record<FilingStatus, LTCGThresholds> = {
    [FilingStatus.SINGLE]: [toBig('47025'), toBig('518900')],
    [FilingStatus.MARRIED_FILING_JOINTLY]: [toBig('94050'), toBig('583750')],
    [FilingStatus.HEAD_OF_HOUSEHOLD]: [toBig('63000'), toBig('551350')],
  };

  /**
   * Social Security combined income thresholds for 2024.
   * 
   * Combined income = AGI + tax-exempt interest + 50% of SS benefits
   * 
   * [base1, base2, additionalCap]
   * - base1: First threshold (50% taxation phase-in starts)
   * - base2: Second threshold (85% taxation phase-in starts)
   * - additionalCap: Maximum amount taxed at 50% rate (used in 85% calculation)
   */
  private static readonly SSA_THRESHOLDS: Record<FilingStatus, SSAThresholds> = {
    [FilingStatus.SINGLE]: [toBig('25000'), toBig('34000'), toBig('4500')],
    [FilingStatus.HEAD_OF_HOUSEHOLD]: [toBig('25000'), toBig('34000'), toBig('4500')],
    [FilingStatus.MARRIED_FILING_JOINTLY]: [toBig('32000'), toBig('44000'), toBig('6000')],
  };

  /**
   * Calculate federal income tax for given inputs.
   * 
   * This is the main entry point. It orchestrates all sub-calculations:
   * 1. Social Security taxation (Pub 915 formula)
   * 2. AGI calculation (sum of all income including taxable SS)
   * 3. Taxable income (AGI minus standard deduction)
   * 4. Split into ordinary vs preferential income
   * 5. Progressive ordinary tax calculation
   * 6. Stacked LTCG/QD tax calculation
   * 7. MAGI for IRMAA purposes
   * 
   * @param inputs Tax calculation inputs with all income sources
   * @returns Complete tax calculation results including AGI, MAGI, and total tax
   */
  calculate(inputs: TaxInputs): TaxResult {
    // Step 1: Calculate taxable portion of Social Security
    const taxableSS = this.calculateTaxableSocialSecurity(inputs);

    // Step 2: Calculate AGI (includes taxable SS)
    const agi = inputs.ordinaryIncome
      .plus(inputs.qualifiedDividends)
      .plus(inputs.longTermCapitalGains)
      .plus(taxableSS);

    // Step 3: Apply standard deduction
    const standardDeduction = FederalTaxCalculator.STANDARD_DEDUCTION[inputs.filingStatus];
    const taxableIncome = max(toBig('0'), agi.minus(standardDeduction));

    // Step 4: Split taxable income into ordinary vs LTCG/QD portions
    // LTCG/QD get preferential rates, so we need to separate them
    const ltcgPortion = min(
      taxableIncome,
      inputs.qualifiedDividends.plus(inputs.longTermCapitalGains),
    );
    const ordinaryPortion = max(toBig('0'), taxableIncome.minus(ltcgPortion));

    // Step 5: Calculate tax on ordinary income using progressive brackets
    const ordinaryTax = this.applyOrdinaryBrackets(ordinaryPortion, inputs.filingStatus);

    // Step 6: Calculate tax on LTCG/QD using stacking method
    const ltcgTax = this.applyLTCGBrackets(ordinaryPortion, ltcgPortion, inputs.filingStatus);

    // Step 7: Sum total tax
    const totalTax = ordinaryTax.plus(ltcgTax);

    // Step 8: Calculate MAGI (AGI + tax-exempt interest)
    // MAGI is used for IRMAA surcharge calculations
    const magi = agi.plus(inputs.taxExemptInterest);

    return {
      taxableSocialSecurity: taxableSS,
      agi,
      magi,
      taxableIncome,
      ordinaryTaxable: ordinaryPortion,
      ltcgTaxable: ltcgPortion,
      ordinaryTax,
      ltcgTax,
      totalTax,
    };
  }

  /**
   * Calculate taxable portion of Social Security benefits.
   * 
   * Implements IRS Publication 915 formula:
   * 1. Calculate "combined income" = AGI + tax-exempt interest + 50% of SS
   * 2. If below base1 threshold: 0% taxable
   * 3. If between base1 and base2: up to 50% taxable
   * 4. If above base2: up to 85% taxable
   * 
   * The formula ensures gradual phase-in and respects maximum percentages.
   * 
   * @param inputs Tax calculation inputs
   * @returns Taxable portion of Social Security benefits
   */
  private calculateTaxableSocialSecurity(inputs: TaxInputs): Big {
    const ss = inputs.socialSecurityGross;
    if (ss.lte(0)) {
      return toBig('0');
    }

    const [base1, base2, addlCap] = FederalTaxCalculator.SSA_THRESHOLDS[inputs.filingStatus];

    // Combined income includes 50% of SS benefits
    const combinedIncome = inputs.ordinaryIncome
      .plus(inputs.qualifiedDividends)
      .plus(inputs.longTermCapitalGains)
      .plus(inputs.taxExemptInterest)
      .plus(ss.times(toBig('0.5')));

    // Below first threshold: no taxation
    if (combinedIncome.lte(base1)) {
      return toBig('0');
    }

    // Between thresholds: up to 50% taxable
    if (combinedIncome.lte(base2)) {
      const maxTaxable = ss.times(toBig('0.5'));
      const phaseInAmount = combinedIncome.minus(base1).times(toBig('0.5'));
      return min(maxTaxable, phaseInAmount);
    }

    // Above second threshold: up to 85% taxable
    // Formula: 85% of excess over base2, plus the capped 50% portion
    const excessOverBase2 = combinedIncome.minus(base2).times(toBig('0.85'));
    const cappedHalfPortion = min(addlCap, ss.times(toBig('0.5')));
    const taxable = excessOverBase2.plus(cappedHalfPortion);

    // Cap at 85% of total SS benefits
    const maxTaxable = ss.times(toBig('0.85'));
    return min(maxTaxable, taxable);
  }

  /**
   * Apply progressive ordinary income tax brackets.
   * 
   * Calculates tax by filling each bracket sequentially:
   * - 10% on first bracket
   * - 12% on second bracket
   * - etc.
   * 
   * This is standard marginal tax rate calculation.
   * 
   * @param taxableAmount Amount subject to ordinary income tax
   * @param status Filing status (determines bracket thresholds)
   * @returns Total ordinary income tax
   */
  private applyOrdinaryBrackets(taxableAmount: Big, status: FilingStatus): Big {
    let tax = toBig('0');
    let remaining = taxableAmount;
    let lastLimit = toBig('0');

    const brackets = FederalTaxCalculator.ORDINARY_BRACKETS[status];

    for (const [limit, rate] of brackets) {
      if (limit === null) {
        // Top bracket (infinite ceiling)
        tax = tax.plus(remaining.times(rate));
        break;
      }

      // Calculate width of this bracket
      const span = limit.minus(lastLimit);
      const taxableSpan = min(remaining, span);

      if (taxableSpan.gt(0)) {
        tax = tax.plus(taxableSpan.times(rate));
        remaining = remaining.minus(taxableSpan);
        lastLimit = limit;
      }

      if (remaining.lte(0)) {
        break;
      }
    }

    return tax;
  }

  /**
   * Apply LTCG/qualified dividend tax brackets using stacking method.
   * 
   * LTCG and qualified dividends are taxed at preferential rates (0%, 15%, 20%).
   * The rate depends on where they "stack" on top of ordinary income.
   * 
   * Algorithm:
   * 1. Calculate "room" remaining in 0% bracket above ordinary income
   * 2. Fill that room at 0% rate
   * 3. Calculate "room" remaining in 15% bracket
   * 4. Fill that room at 15% rate
   * 5. Remainder taxed at 20% rate
   * 
   * Example: Single filer with $40K ordinary + $20K LTCG
   * - 0% ceiling is $47,025
   * - Room in 0% bracket: $47,025 - $40,000 = $7,025
   * - First $7,025 of LTCG taxed at 0%
   * - Remaining $12,975 falls into 15% bracket
   * 
   * @param ordinaryPortion Amount of ordinary income (forms the "base")
   * @param ltcgPortion Amount of LTCG/QD (stacked on top)
   * @param status Filing status (determines thresholds)
   * @returns Total LTCG/QD tax
   */
  private applyLTCGBrackets(
    ordinaryPortion: Big,
    ltcgPortion: Big,
    status: FilingStatus,
  ): Big {
    if (ltcgPortion.lte(0)) {
      return toBig('0');
    }

    const [threshold0, threshold15] = FederalTaxCalculator.LTCG_THRESHOLDS[status];

    // Calculate amount in 0% bracket
    // This is the "room" left in 0% bracket after ordinary income
    const taxableAt0 = max(toBig('0'), threshold0.minus(ordinaryPortion));
    const amount0 = min(ltcgPortion, taxableAt0);

    // Calculate amount in 15% bracket
    const remaining = ltcgPortion.minus(amount0);
    const taxableAt15 = max(toBig('0'), threshold15.minus(ordinaryPortion).minus(amount0));
    const amount15 = min(remaining, taxableAt15);

    // Remainder goes to 20% bracket
    const amount20 = max(toBig('0'), remaining.minus(amount15));

    // Calculate tax for each portion
    const tax0 = amount0.times(toBig('0'));
    const tax15 = amount15.times(toBig('0.15'));
    const tax20 = amount20.times(toBig('0.20'));

    return tax0.plus(tax15).plus(tax20);
  }
}
