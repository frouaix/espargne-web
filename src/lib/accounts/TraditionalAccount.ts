/**
 * TraditionalAccount - Tax-deferred retirement account (Traditional IRA/401k).
 * 
 * Implements IRS RMD (Required Minimum Distribution) rules.
 * Withdrawals are ordinary income, fully taxable.
 * 
 * Port of Python SimpleTaxDeferredAccount from models/strategies/withdrawal_coordinator.py
 */

import Big from 'big.js';
import { BaseAccount } from './BaseAccount';
import type { WithdrawalResult } from '../types';
import { AccountType, IncomeType } from '../types';
import { toBig, min, isZero } from '../bigHelpers';
import { calculateRMD } from '../rmdCalculator';

/**
 * Traditional IRA/401k with RMD enforcement.
 * 
 * Key features:
 * - Tax-deferred growth during accumulation
 * - Withdrawals taxed as ordinary income
 * - Subject to Required Minimum Distributions (RMDs) starting at age 73/75
 * - Uses IRS Uniform Lifetime Table for RMD calculations
 * - SECURE Act 2.0 compliant age thresholds
 * 
 * Tax treatment:
 * - All withdrawals are 100% taxable as ordinary income
 * - No early withdrawal penalties modeled (assumes post-59.5 withdrawals)
 * 
 * RMD rules:
 * - Born before 1951: RMDs start at 72
 * - Born 1951-1959: RMDs start at 73
 * - Born 1960+: RMDs start at 75
 * 
 * @example
 * const account = new TraditionalAccount('trad-ira', 500000, 1960);
 * 
 * // At age 75, must take RMD
 * const rmd = account.calculateRMD(75, 1960);
 * // Returns $500,000 / 24.6 = $20,325.20
 * 
 * // Withdrawal is fully taxable
 * const result = account.withdraw(rmd, 75, 2035);
 * // result.taxableAmount === result.grossAmount (100% taxable)
 */
export class TraditionalAccount extends BaseAccount {
  /**
   * Owner's birth year for RMD age determination.
   * Optional - if not provided, assumes standard age 73 threshold.
   */
  private birthYear?: number;

  /**
   * Create a Traditional IRA/401k account.
   * 
   * @param id - Unique account identifier
   * @param initialBalance - Starting balance
   * @param birthYear - Optional birth year for accurate RMD age calculation
   * @param nickname - Optional display name
   * 
   * @example
   * new TraditionalAccount('401k', 1000000, 1958);
   * // $1M balance, born 1958, RMDs start at 73
   */
  constructor(
    id: string,
    initialBalance: Big | number | string,
    birthYear?: number,
    nickname?: string,
  ) {
    super(id, initialBalance, AccountType.TRADITIONAL, nickname);
    this.birthYear = birthYear;
  }

  /**
   * Withdraw funds from account.
   * 
   * All withdrawals are fully taxable as ordinary income.
   * Does not enforce RMD compliance - caller must check separately.
   * 
   * @param amount - Requested withdrawal amount
   * @param _age - Current age (not used for withdrawals, but required by interface)
   * @param _year - Calendar year (not used for withdrawals, but required by interface)
   * @returns WithdrawalResult with ordinary income classification
   * 
   * @example
   * const account = new TraditionalAccount('trad', 100000);
   * const result = account.withdraw(new Big(25000), 70, 2024);
   * // result.grossAmount = 25000
   * // result.taxableAmount = 25000 (fully taxable)
   * // result.incomeType = ORDINARY
   */
  withdraw(amount: Big, _age: number, _year: number): WithdrawalResult {
    const requestedAmount = toBig(amount);
    
    // Cap withdrawal at available balance
    const actualAmount = min(requestedAmount, this.balance);
    
    // Update balance
    this.balance = this.balance.minus(actualAmount);
    
    return {
      grossAmount: actualAmount,
      taxableAmount: actualAmount, // Fully taxable
      incomeType: IncomeType.ORDINARY,
      remainingBalance: this.balance,
    };
  }

  /**
   * Calculate Required Minimum Distribution using IRS rules.
   * 
   * Delegates to rmdCalculator which implements:
   * - IRS Uniform Lifetime Table (2022+)
   * - SECURE Act 2.0 age thresholds
   * - Formula: balance / life_expectancy_factor
   * 
   * Returns 0 if:
   * - Below RMD age for birth year
   * - Account balance is zero
   * 
   * @param age - Current age of account owner
   * @param birthYear - Optional birth year (overrides constructor value)
   * @returns Required minimum distribution amount
   * 
   * @example
   * const account = new TraditionalAccount('ira', 600000, 1960);
   * 
   * // Age 74 - no RMD yet (born 1960, RMDs start at 75)
   * account.calculateRMD(74, 1960); // Returns Big(0)
   * 
   * // Age 75 - first RMD
   * account.calculateRMD(75, 1960); // Returns $600,000 / 24.6
   * 
   * // Age 80 - ongoing RMD
   * account.calculateRMD(80, 1960); // Returns balance / 20.2
   */
  calculateRMD(age: number, birthYear?: number): Big {
    // Use provided birth year or fall back to constructor value
    const year = birthYear ?? this.birthYear;
    
    // Handle zero balance
    if (isZero(this.balance)) {
      return new Big(0);
    }
    
    // Delegate to RMD calculator
    return calculateRMD(this.balance, age, year);
  }

  /**
   * Get birth year if set.
   * 
   * @returns Birth year or undefined
   */
  getBirthYear(): number | undefined {
    return this.birthYear;
  }

  /**
   * Set or update birth year.
   * 
   * Useful if birth year was not known at construction time.
   * 
   * @param year - Birth year
   */
  setBirthYear(year: number): void {
    this.birthYear = year;
  }

  /**
   * Check if RMDs are currently required.
   * 
   * @param age - Current age
   * @param birthYear - Optional birth year (overrides constructor value)
   * @returns true if RMDs are required at this age
   * 
   * @example
   * const account = new TraditionalAccount('ira', 100000, 1960);
   * account.isRMDRequired(74, 1960); // false (born 1960, RMDs at 75)
   * account.isRMDRequired(75, 1960); // true
   */
  isRMDRequired(age: number, birthYear?: number): boolean {
    const rmd = this.calculateRMD(age, birthYear);
    return !isZero(rmd);
  }

  /**
   * String representation including birth year.
   * 
   * @returns Account description with birth year if set
   */
  toString(): string {
    const baseStr = super.toString();
    return this.birthYear 
      ? `${baseStr} [Birth: ${this.birthYear}]`
      : baseStr;
  }
}
