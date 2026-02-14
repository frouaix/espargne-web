/**
 * Big.js helper utilities for financial calculations.
 * 
 * Provides conversion functions and common operations to ensure
 * consistent precision across all financial math.
 */

import Big from 'big.js';

// Set Big.js configuration for financial calculations
// DP = decimal places, RM = rounding mode (half-up)
Big.DP = 10; // Precision: 10 decimal places
Big.RM = Big.roundHalfUp; // Rounding mode: standard rounding

/**
 * Convert a number or string to Big, handling null/undefined.
 */
export function toBig(value: number | string | Big | null | undefined): Big {
  if (value === null || value === undefined) {
    return new Big(0);
  }
  if (value instanceof Big) {
    return value;
  }
  return new Big(value);
}

/**
 * Convert Big to number for display purposes.
 * WARNING: Only use for display, never for calculations.
 */
export function toNumber(value: Big): number {
  return parseFloat(value.toString());
}

/**
 * Convert Big to fixed decimal string for currency display.
 */
export function toCurrency(value: Big, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Convert Big to integer dollars (no cents) for display.
 */
export function toDollars(value: Big): string {
  return value.toFixed(0);
}

/**
 * Safe addition that handles null/undefined.
 */
export function add(...values: (Big | number | string | null | undefined)[]): Big {
  return values.reduce((sum: Big, val) => sum.plus(toBig(val)), new Big(0));
}

/**
 * Safe subtraction.
 */
export function subtract(a: Big | number | string, b: Big | number | string): Big {
  return toBig(a).minus(toBig(b));
}

/**
 * Safe multiplication.
 */
export function multiply(a: Big | number | string, b: Big | number | string): Big {
  return toBig(a).times(toBig(b));
}

/**
 * Safe division. Returns 0 if dividing by 0.
 */
export function divide(a: Big | number | string, b: Big | number | string): Big {
  const divisor = toBig(b);
  if (divisor.eq(0)) {
    return new Big(0);
  }
  return toBig(a).div(divisor);
}

/**
 * Get maximum of multiple Big values.
 */
export function max(...values: (Big | number | string)[]): Big {
  if (values.length === 0) {
    return new Big(0);
  }
  return values.reduce((maxVal: Big, val) => {
    const bigVal = toBig(val);
    return bigVal.gt(maxVal) ? bigVal : maxVal;
  }, toBig(values[0]));
}

/**
 * Get minimum of multiple Big values.
 */
export function min(...values: (Big | number | string)[]): Big {
  if (values.length === 0) {
    return new Big(0);
  }
  return values.reduce((minVal: Big, val) => {
    const bigVal = toBig(val);
    return bigVal.lt(minVal) ? bigVal : minVal;
  }, toBig(values[0]));
}

/**
 * Check if Big value is zero.
 */
export function isZero(value: Big): boolean {
  return value.eq(0);
}

/**
 * Check if Big value is positive.
 */
export function isPositive(value: Big): boolean {
  return value.gt(0);
}

/**
 * Check if Big value is negative.
 */
export function isNegative(value: Big): boolean {
  return value.lt(0);
}

/**
 * Compare two Big values.
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compare(a: Big | number | string, b: Big | number | string): number {
  return toBig(a).cmp(toBig(b));
}

/**
 * Round to specified decimal places.
 */
export function round(value: Big, decimals: number = 2): Big {
  return toBig(value.toFixed(decimals));
}

/**
 * Calculate percentage of a value.
 * Example: percent(100, 0.15) = 15
 */
export function percent(value: Big | number | string, rate: Big | number | string): Big {
  return multiply(value, rate);
}

/**
 * Sum an array of Big values.
 */
export function sum(values: Big[]): Big {
  return values.reduce((total, val) => total.plus(val), new Big(0));
}

/**
 * Calculate compound growth: principal * (1 + rate)^periods
 */
export function compoundGrowth(
  principal: Big | number | string,
  rate: Big | number | string,
  periods: number,
): Big {
  const p = toBig(principal);
  const r = toBig(rate);
  const growthFactor = r.plus(1);
  
  let result = p;
  for (let i = 0; i < periods; i++) {
    result = result.times(growthFactor);
  }
  return result;
}

/**
 * Apply growth rate: value * (1 + rate)
 */
export function applyGrowth(value: Big | number | string, rate: Big | number | string): Big {
  return toBig(value).times(toBig(rate).plus(1));
}

/**
 * Convert percentage string to Big decimal.
 * Example: "5%" -> Big(0.05), "0.05" -> Big(0.05)
 */
export function parsePercent(value: string): Big {
  const trimmed = value.trim();
  if (trimmed.endsWith('%')) {
    return new Big(trimmed.slice(0, -1)).div(100);
  }
  return new Big(trimmed);
}

/**
 * Clamp a value between min and max.
 */
export function clamp(
  value: Big | number | string,
  minVal: Big | number | string,
  maxVal: Big | number | string,
): Big {
  return max(minVal, min(value, maxVal));
}

/**
 * Calculate effective tax rate.
 */
export function effectiveTaxRate(tax: Big | number | string, income: Big | number | string): Big {
  const inc = toBig(income);
  if (inc.eq(0)) {
    return new Big(0);
  }
  return divide(tax, income);
}

/**
 * Format Big as percentage string.
 * Example: Big(0.05) -> "5.00%"
 */
export function toPercent(value: Big, decimals: number = 2): string {
  return multiply(value, 100).toFixed(decimals) + '%';
}
