/**
 * BaseAccount - Abstract base class for retirement accounts.
 * 
 * Provides common functionality for account balance tracking, withdrawals,
 * and growth application. All concrete account types must extend this class.
 * 
 * Port of Python RetirementAccount from models/strategies/base.py
 */

import Big from 'big.js';
import type { WithdrawalResult } from '../types';
import { AccountType } from '../types';
import { toBig, applyGrowth, isZero } from '../bigHelpers';

/**
 * Abstract base class for all retirement account types.
 * 
 * Handles:
 * - Balance tracking with Big.js for precision
 * - Withdrawal operations
 * - Growth application
 * - RMD calculations (account-type specific)
 * 
 * @abstract
 */
export abstract class BaseAccount {
  /**
   * Current account balance.
   * Protected to allow subclasses to manipulate directly.
   */
  protected balance: Big;

  /**
   * Unique identifier for this account.
   */
  public readonly id: string;

  /**
   * Account type classification.
   */
  public readonly accountType: AccountType;

  /**
   * Optional human-readable nickname for display.
   */
  public readonly nickname?: string;

  /**
   * Create a new account.
   * 
   * @param id - Unique identifier for this account
   * @param initialBalance - Starting balance
   * @param accountType - Account type classification
   * @param nickname - Optional display name
   */
  constructor(
    id: string,
    initialBalance: Big | number | string,
    accountType: AccountType,
    nickname?: string,
  ) {
    this.id = id;
    this.balance = toBig(initialBalance);
    this.accountType = accountType;
    this.nickname = nickname;
  }

  /**
   * Withdraw funds from the account.
   * 
   * Concrete implementations must provide withdrawal logic including:
   * - Tax treatment (taxable amount calculation)
   * - Income type classification
   * - Cost basis tracking (for taxable accounts)
   * - Balance updates
   * 
   * @param amount - Requested withdrawal amount
   * @param age - Current age of account owner
   * @param year - Calendar year (for future use in tax calculations)
   * @returns WithdrawalResult with tax implications and remaining balance
   * 
   * @abstract
   */
  abstract withdraw(amount: Big, age: number, year: number): WithdrawalResult;

  /**
   * Calculate Required Minimum Distribution for this account.
   * 
   * Returns 0 for account types not subject to RMDs (Roth IRA, taxable).
   * Traditional/tax-deferred accounts calculate based on IRS tables.
   * 
   * @param age - Current age of account owner
   * @param birthYear - Optional birth year for RMD age determination
   * @returns Required minimum distribution amount (0 if not applicable)
   * 
   * @abstract
   */
  abstract calculateRMD(age: number, birthYear?: number): Big;

  /**
   * Apply investment growth to account balance.
   * 
   * Updates balance using: balance = balance * (1 + rate)
   * 
   * @param rate - Annual return rate as decimal (e.g., 0.05 for 5%)
   * 
   * @example
   * account.applyGrowth(new Big(0.05)); // 5% growth
   * // Balance of $100,000 becomes $105,000
   */
  applyGrowth(rate: Big | number | string): void {
    this.balance = applyGrowth(this.balance, rate);
  }

  /**
   * Get current account balance.
   * 
   * @returns Current balance as Big
   */
  getBalance(): Big {
    return this.balance;
  }

  /**
   * Check if account is depleted.
   * 
   * @returns true if balance is zero or negative
   */
  isDepleted(): boolean {
    return !isZero(this.balance) && this.balance.lte(0);
  }

  /**
   * Get a human-readable string representation of this account.
   * 
   * @returns Account description with type, ID, and balance
   */
  toString(): string {
    return `${this.accountType}(${this.id}): $${this.balance.toFixed(2)}`;
  }
}
