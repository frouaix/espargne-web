/**
 * RothAccount - Tax-free retirement account (Roth IRA/401k).
 * 
 * Qualified withdrawals are completely tax-free.
 * No Required Minimum Distributions for Roth IRAs during owner's lifetime.
 * 
 * Port of Python SimpleRothAccount from models/strategies/withdrawal_coordinator.py
 */

import Big from 'big.js';
import { BaseAccount } from './BaseAccount';
import type { WithdrawalResult } from '../types';
import { AccountType, IncomeType } from '../types';
import { toBig, min } from '../bigHelpers';

/**
 * Roth IRA/401k with tax-free withdrawals.
 * 
 * Key features:
 * - After-tax contributions (already taxed going in)
 * - Tax-free growth
 * - Qualified withdrawals are 100% tax-free
 * - No RMDs for Roth IRAs during owner's lifetime
 * - Roth 401k accounts DO have RMDs (not modeled here)
 * 
 * Tax treatment:
 * - All qualified withdrawals are tax-free (taxableAmount = 0)
 * - No early withdrawal penalties modeled
 * - 5-year rule not enforced (assumes qualified distributions)
 * 
 * RMD rules:
 * - Roth IRA: No RMDs during owner's lifetime
 * - Roth 401k: Subject to RMDs (but we model as IRA for simplicity)
 * - Inherited Roth: Subject to RMDs (not modeled)
 * 
 * @example
 * const account = new RothAccount('roth-ira', 300000);
 * 
 * // Withdrawal is tax-free
 * const result = account.withdraw(new Big(50000), 68, 2024);
 * // result.grossAmount = 50000
 * // result.taxableAmount = 0 (tax-free!)
 * // result.incomeType = ORDINARY (doesn't matter, not taxed)
 * 
 * // No RMDs
 * const rmd = account.calculateRMD(80);
 * // Returns Big(0)
 */
export class RothAccount extends BaseAccount {
  /**
   * Create a Roth IRA/401k account.
   * 
   * @param id - Unique account identifier
   * @param initialBalance - Starting balance
   * @param nickname - Optional display name
   * 
   * @example
   * new RothAccount('roth-1', 500000);
   * // $500k Roth IRA - all future withdrawals tax-free
   */
  constructor(
    id: string,
    initialBalance: Big | number | string,
    nickname?: string,
  ) {
    super(id, initialBalance, AccountType.ROTH, nickname);
  }

  /**
   * Withdraw funds from account.
   * 
   * All qualified withdrawals are tax-free.
   * Returns taxableAmount = 0 and incomeType = ORDINARY (type doesn't matter).
   * 
   * Assumptions:
   * - All withdrawals are qualified (5-year rule satisfied, age 59.5+)
   * - No early withdrawal penalties
   * - No ordering rules for basis/earnings
   * 
   * @param amount - Requested withdrawal amount
   * @param _age - Current age (not used for Roth, but required by interface)
   * @param _year - Calendar year (not used for Roth, but required by interface)
   * @returns WithdrawalResult with zero taxable amount
   * 
   * @example
   * const account = new RothAccount('roth', 200000);
   * const result = account.withdraw(new Big(75000), 65, 2024);
   * // result.grossAmount = 75000
   * // result.taxableAmount = 0 (completely tax-free)
   * // result.remainingBalance = 125000
   */
  withdraw(amount: Big, _age: number, _year: number): WithdrawalResult {
    const requestedAmount = toBig(amount);
    
    // Cap withdrawal at available balance
    const actualAmount = min(requestedAmount, this.balance);
    
    // Update balance
    this.balance = this.balance.minus(actualAmount);
    
    return {
      grossAmount: actualAmount,
      taxableAmount: new Big(0), // Tax-free!
      incomeType: IncomeType.ORDINARY, // Doesn't matter since not taxed
      remainingBalance: this.balance,
    };
  }

  /**
   * Calculate Required Minimum Distribution.
   * 
   * Roth IRAs have no RMDs during the owner's lifetime.
   * (Roth 401k accounts do have RMDs, but we model as IRA for simplicity.)
   * 
   * @param _age - Current age (unused)
   * @param _birthYear - Birth year (unused)
   * @returns Big(0) - no RMD for Roth IRAs
   */
  calculateRMD(_age: number, _birthYear?: number): Big {
    return new Big(0);
  }

  /**
   * Check if this is a tax-advantaged account.
   * 
   * @returns true - Roth accounts are tax-advantaged
   */
  isTaxAdvantaged(): boolean {
    return true;
  }

  /**
   * Check if withdrawals are tax-free.
   * 
   * @returns true - Roth withdrawals are tax-free
   */
  isTaxFree(): boolean {
    return true;
  }

  /**
   * String representation.
   * 
   * @returns Account description with "Tax-Free" indicator
   */
  toString(): string {
    return `${super.toString()} [Tax-Free]`;
  }
}
