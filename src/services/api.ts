/**
 * API service for communicating with espargne backend
 */

import type { APIProjectionRequest } from '../utils/apiTransform';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface YearlyChartData {
  year: number;
  age: number;
  social_security: number;
  pension: number;
  dividend_income?: number;
  taxable_withdrawal: number;
  traditional_withdrawal: number;
  roth_withdrawal: number;
  other_income: number;
  taxes: number;
  net_income: number;
  total_portfolio_value: number;
  taxable_balance: number;
  traditional_balance: number;
  roth_balance: number;
  min_required_income?: number | null;
  account_balances?: Record<string, number>;
  account_withdrawals?: Record<string, number>;
  
  // Legacy names (for backward compatibility)
  income_taxable?: number;
  income_traditional?: number;
  income_roth?: number;
  income_ssa?: number;
  income_pension?: number;
  income_other?: number;
  balance_taxable?: number;
  balance_traditional?: number;
  balance_roth?: number;
  total_balance?: number;
}

export interface ChartData {
  years_data?: YearlyChartData[];
  years?: YearlyChartData[];  // Backend returns "years" not "years_data"
  max_income: number;
  max_wealth: number;
}

export interface ProjectionResult {
  scenario_name: string;
  success: boolean;
  failure_year: number | null;
  failure_age: number | null;
  total_years: number;
  final_portfolio_value: number;
  total_taxes_paid: number;
  total_withdrawals: number;
  chart_data: ChartData;
}

export interface ProjectionResponse {
  success: boolean;
  result: ProjectionResult | null;
  error: string | null;
}

export interface ExplanationSection {
  summary: string;
  success_analysis: string;
  tax_analysis: string;
  withdrawal_analysis: string;
  key_milestones: string;
  recommendations: string;
}

export interface ExplanationResponse {
  success: boolean;
  explanation: ExplanationSection;
  text: string;
}

/**
 * Run a deterministic projection and get JSON results
 */
export async function runProjection(
  request: APIProjectionRequest
): Promise<ProjectionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scenarios/project`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Projection failed: ${error}`);
  }

  const data = await response.json();
  
  // Normalize backend response: "years" -> "years_data"
  if (data.success && data.result?.chart_data) {
    if (data.result.chart_data.years && !data.result.chart_data.years_data) {
      data.result.chart_data.years_data = data.result.chart_data.years;
    }
  }

  return data;
}

/**
 * Run a projection and download CSV file
 */
export async function downloadProjectionCSV(
  request: APIProjectionRequest,
  filename: string = 'retirement_projection.csv'
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/scenarios/project/csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`CSV export failed: ${error}`);
  }

  // Download the file
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Run a projection and get textual explanation
 */
export async function getProjectionExplanation(
  request: APIProjectionRequest
): Promise<ExplanationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/scenarios/project/explain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Explanation generation failed: ${error}`);
  }

  return response.json();
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<{ status: string; components: Record<string, string> }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}
