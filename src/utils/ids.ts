// Copyright (c) 2026 François Rouaix
/**
 * Generate a unique ID for accounts
 * Uses crypto.randomUUID if available, falls back to timestamp-based ID
 */
export function generateAccountId(accountType: string): string {
  // Try to use crypto.randomUUID (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${accountType}-${crypto.randomUUID()}`;
  }
  
  // Fallback to timestamp + random number for uniqueness
  return `${accountType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
