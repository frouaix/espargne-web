// Copyright (c) 2026 François Rouaix
/**
 * Format a number as US currency without cents (no dollar sign included)
 * @param amount - The amount to format
 * @returns Formatted string like "1,234,567" (use with $ in template: ${formatCurrency(amount)})
 */
export function formatCurrency(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}
