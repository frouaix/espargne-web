// Copyright (c) 2026 François Rouaix
/**
 * CSV Export - Year-by-Year Retirement Projection Data Export
 * 
 * Generates CSV files from projection results for Excel analysis and verification.
 * Includes detailed breakdown of income sources, taxes, withdrawals, and account balances.
 */

import type { ProjectionResult } from './types';
import { buildChartData } from './chartDataBuilder';

/**
 * Generate CSV content from projection result.
 * 
 * Creates a CSV file with:
 * - Header row with scenario name
 * - Column headers for all data fields
 * - Year-by-year data rows
 * - Summary statistics section
 * 
 * @param result - Projection result from simulation
 * @param scenarioName - Name of scenario for header
 * @returns CSV content as string
 */
export function generateCSV(result: ProjectionResult, scenarioName: string): string {
  const chartData = buildChartData(result);
  const rows: string[] = [];
  
  // Header with scenario name
  rows.push(`Retirement Projection: ${scenarioName}`);
  rows.push(''); // Blank line
  
  // Column headers
  const headers = [
    'Year',
    'Age',
    'Social Security',
    'Taxable Withdrawal',
    'Traditional Withdrawal',
    'Roth Withdrawal',
    'Gross Income',
    'Federal Taxes',
    'Net Income',
    'Taxable Balance',
    'Traditional Balance',
    'Roth Balance',
    'Total Portfolio',
  ];
  rows.push(headers.join(','));
  
  // Data rows
  for (const dataPoint of chartData.dataPoints) {
    const grossIncome = (
      dataPoint.socialSecurity +
      dataPoint.taxableWithdrawal +
      dataPoint.traditionalWithdrawal +
      dataPoint.rothWithdrawal
    );
    const netIncome = grossIncome + dataPoint.taxes; // taxes is negative, so we add
    
    const row = [
      dataPoint.year,
      dataPoint.age,
      dataPoint.socialSecurity.toFixed(2),
      dataPoint.taxableWithdrawal.toFixed(2),
      dataPoint.traditionalWithdrawal.toFixed(2),
      dataPoint.rothWithdrawal.toFixed(2),
      grossIncome.toFixed(2),
      Math.abs(dataPoint.taxes).toFixed(2), // Display as positive
      netIncome.toFixed(2),
      dataPoint.taxableBalance.toFixed(2),
      dataPoint.traditionalBalance.toFixed(2),
      dataPoint.rothBalance.toFixed(2),
      dataPoint.totalPortfolio.toFixed(2),
    ];
    rows.push(row.join(','));
  }
  
  // Summary statistics
  rows.push(''); // Blank line
  rows.push('Summary Statistics');
  
  const totalTaxes = chartData.dataPoints.reduce((sum, d) => sum + Math.abs(d.taxes), 0);
  const totalWithdrawals = chartData.dataPoints.reduce(
    (sum, d) => sum + d.taxableWithdrawal + d.traditionalWithdrawal + d.rothWithdrawal,
    0,
  );
  
  const initialPortfolio = chartData.dataPoints[0]?.totalPortfolio ?? 0;
  const finalPortfolio = chartData.dataPoints[chartData.dataPoints.length - 1]?.totalPortfolio ?? 0;
  const portfolioChange = finalPortfolio - initialPortfolio;
  const success = result.success ? 'Yes' : 'No';
  
  rows.push(`Total Years,${chartData.dataPoints.length}`);
  rows.push(`Total Federal Taxes Paid,${totalTaxes.toFixed(2)}`);
  rows.push(`Total Withdrawals,${totalWithdrawals.toFixed(2)}`);
  rows.push(`Initial Portfolio Value,${initialPortfolio.toFixed(2)}`);
  rows.push(`Final Portfolio Value,${finalPortfolio.toFixed(2)}`);
  rows.push(`Portfolio Change,${portfolioChange.toFixed(2)}`);
  rows.push(`Success,${success}`);
  
  return rows.join('\n');
}

/**
 * Generate CSV filename from scenario name.
 * 
 * Sanitizes scenario name for filesystem use and adds timestamp.
 * 
 * @param scenarioName - Name of scenario
 * @returns Suggested filename for CSV download
 */
export function generateCSVFilename(scenarioName: string): string {
  const sanitized = scenarioName
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `retirement_projection_${sanitized}_${timestamp}.csv`;
}

/**
 * Trigger browser download of CSV content.
 * 
 * Creates a Blob and triggers download via temporary anchor element.
 * 
 * @param csvContent - CSV content as string
 * @param filename - Suggested filename for download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
