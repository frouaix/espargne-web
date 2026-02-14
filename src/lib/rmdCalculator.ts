/**
 * IRS Required Minimum Distribution (RMD) Calculator
 *
 * Implements official IRS rules for RMDs including:
 * - SECURE Act 2.0 age thresholds based on birth year
 * - Full IRS Uniform Lifetime Table (2022 and beyond)
 * - Simplified calculation: balance / life_expectancy_factor
 *
 * See: IRS Publication 590-B
 * https://www.irs.gov/publications/p590b
 */

import Big from 'big.js';
import { divide, isZero } from './bigHelpers';

/**
 * IRS Uniform Lifetime Table (effective 2022+)
 * Maps age -> distribution period (life expectancy factor)
 * Source: IRS Publication 590-B, Appendix B
 */
const UNIFORM_LIFETIME_TABLE: Record<number, string> = {
  72: '27.4',
  73: '26.5',
  74: '25.5',
  75: '24.6',
  76: '23.7',
  77: '22.9',
  78: '22.0',
  79: '21.1',
  80: '20.2',
  81: '19.4',
  82: '18.5',
  83: '17.7',
  84: '16.8',
  85: '16.0',
  86: '15.2',
  87: '14.4',
  88: '13.7',
  89: '12.9',
  90: '12.2',
  91: '11.5',
  92: '10.8',
  93: '10.1',
  94: '9.5',
  95: '8.9',
  96: '8.4',
  97: '7.8',
  98: '7.3',
  99: '6.8',
  100: '6.4',
  101: '6.0',
  102: '5.6',
  103: '5.2',
  104: '4.9',
  105: '4.6',
  106: '4.3',
  107: '4.1',
  108: '3.9',
  109: '3.7',
  110: '3.5',
  111: '3.4',
  112: '3.3',
  113: '3.1',
  114: '3.0',
  115: '2.9',
  116: '2.8',
  117: '2.7',
  118: '2.5',
  119: '2.3',
  120: '2.0', // 120 and older use 2.0
};

/**
 * Determine RMD starting age based on birth year (SECURE Act 2.0 rules).
 *
 * Rules:
 * - Born before 1951: Age 72 (pre-SECURE 2.0, already taking RMDs)
 * - Born 1951-1959: Age 73
 * - Born 1960 or later: Age 75
 *
 * References:
 * - SECURE Act 1.0 (2019): Changed from 70.5 to 72
 * - SECURE Act 2.0 (2022): Changed to 73 for most, 75 for younger cohorts
 *
 * @param birthYear - Year of birth
 * @returns Age at which RMDs must begin
 *
 * @example
 * getRMDStartingAge(1950) // Returns 72
 * getRMDStartingAge(1955) // Returns 73
 * getRMDStartingAge(1965) // Returns 75
 */
export function getRMDStartingAge(birthYear: number): number {
  if (birthYear < 1951) {
    return 72;
  } else if (birthYear <= 1959) {
    return 73;
  } else {
    // 1960 or later
    return 75;
  }
}

/**
 * Get IRS Uniform Lifetime Table factor for given age.
 *
 * @param age - Current age
 * @returns Life expectancy factor (distribution period)
 * @throws {Error} If age is below 72 (no RMD yet)
 *
 * @example
 * getLifeExpectancyFactor(75) // Returns Big('24.6')
 * getLifeExpectancyFactor(80) // Returns Big('20.2')
 * getLifeExpectancyFactor(125) // Returns Big('2.0') - ages 120+ use 2.0
 */
export function getLifeExpectancyFactor(age: number): Big {
  if (age < 72) {
    throw new Error(`No RMD factor for age ${age} (RMDs start at 72+)`);
  }

  // Ages 120+ all use factor of 2.0
  if (age >= 120) {
    return new Big(UNIFORM_LIFETIME_TABLE[120]);
  }

  const factor = UNIFORM_LIFETIME_TABLE[age];
  if (factor === undefined) {
    throw new Error(`No RMD factor defined for age ${age}`);
  }

  return new Big(factor);
}

/**
 * Calculate Required Minimum Distribution for a tax-deferred account.
 *
 * Formula: RMD = Account Balance / Life Expectancy Factor
 *
 * @param accountBalance - Account balance as of December 31 of prior year
 * @param currentAge - Account owner's age in the distribution year
 * @param birthYear - Optional birth year for RMD age determination
 *                    (if not provided, uses age-based rules)
 * @returns Required minimum distribution amount (0 if below RMD age)
 *
 * @example
 * // $100,000 at age 75
 * calculateRMD(new Big(100000), 75)
 * // Returns Big('4065.040650406504065') -> $100,000 / 24.6
 *
 * @example
 * // $500,000 at age 80
 * calculateRMD(new Big(500000), 80)
 * // Returns Big('24752.47524752475248') -> $500,000 / 20.2
 *
 * @example
 * // Below RMD age
 * calculateRMD(new Big(100000), 70)
 * // Returns Big('0')
 */
export function calculateRMD(
  accountBalance: Big,
  currentAge: number,
  birthYear?: number,
): Big {
  // Determine if RMDs are required
  if (birthYear !== undefined) {
    const rmdAge = getRMDStartingAge(birthYear);
    if (currentAge < rmdAge) {
      return new Big(0);
    }
  } else {
    // Conservative: if no birth year, assume standard age 73 threshold
    if (currentAge < 73) {
      return new Big(0);
    }
  }

  // Handle edge case: age below table minimum
  if (currentAge < 72) {
    return new Big(0);
  }

  // Handle zero balance
  if (isZero(accountBalance)) {
    return new Big(0);
  }

  // Calculate RMD
  const lifeExpectancyFactor = getLifeExpectancyFactor(currentAge);
  const rmd = divide(accountBalance, lifeExpectancyFactor);

  return rmd;
}
