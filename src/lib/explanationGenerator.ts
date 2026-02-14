/**
 * Explanation Generator - Human-Readable Retirement Scenario Analysis
 * 
 * Generates narrative explanations of projection results including:
 * - Portfolio success/failure analysis
 * - Key financial milestones and inflection points
 * - Tax efficiency insights
 * - Withdrawal strategy effectiveness
 * - Recommendations for optimization
 */

import type { ProjectionResult, ChartDataPoint } from './types';
import { buildChartData } from './chartDataBuilder';

/**
 * Structured explanation of retirement scenario.
 */
export interface ExplanationResult {
  summary: string;
  successAnalysis: string;
  taxAnalysis: string;
  withdrawalAnalysis: string;
  keyMilestones: string[];
  recommendations: string[];
}

/**
 * Generate comprehensive human-readable explanation from projection result.
 * 
 * Analyzes projection outcomes and provides:
 * - Executive summary
 * - Success probability assessment
 * - Tax efficiency evaluation
 * - Withdrawal strategy identification
 * - Key milestone detection
 * - Actionable recommendations
 * 
 * @param result - Projection result from simulation
 * @returns Structured explanation with narrative sections
 */
export function generateExplanation(result: ProjectionResult): ExplanationResult {
  const chartData = buildChartData(result);
  const dataPoints = chartData.dataPoints;
  
  if (dataPoints.length === 0) {
    return {
      summary: 'No data available for analysis.',
      successAnalysis: '',
      taxAnalysis: '',
      withdrawalAnalysis: '',
      keyMilestones: [],
      recommendations: [],
    };
  }
  
  const initialPortfolio = dataPoints[0].totalPortfolio;
  const finalPortfolio = dataPoints[dataPoints.length - 1].totalPortfolio;
  const totalYears = dataPoints.length;
  const totalTaxes = dataPoints.reduce((sum, d) => sum + Math.abs(d.taxes), 0);
  const totalWithdrawals = dataPoints.reduce(
    (sum, d) => sum + d.taxableWithdrawal + d.traditionalWithdrawal + d.rothWithdrawal,
    0,
  );
  
  const summary = generateSummary(
    result.scenarioName,
    totalYears,
    initialPortfolio,
    finalPortfolio,
    result.failureYear,
    result.failureAge,
  );
  
  const successAnalysis = analyzeSuccess(
    dataPoints,
    result.success,
    result.failureYear,
    result.failureAge,
    initialPortfolio,
    finalPortfolio,
  );
  
  const taxAnalysis = analyzeTaxes(dataPoints, totalTaxes, totalWithdrawals);
  
  const withdrawalAnalysis = analyzeWithdrawals(dataPoints, totalWithdrawals);
  
  const keyMilestones = identifyMilestones(dataPoints);
  
  const recommendations = generateRecommendations(
    dataPoints,
    totalTaxes,
    totalWithdrawals,
    result.failureYear,
    initialPortfolio,
    finalPortfolio,
  );
  
  return {
    summary,
    successAnalysis,
    taxAnalysis,
    withdrawalAnalysis,
    keyMilestones,
    recommendations,
  };
}

/**
 * Generate executive summary.
 */
function generateSummary(
  scenarioName: string,
  totalYears: number,
  initialPortfolio: number,
  finalPortfolio: number,
  failureYear: number | undefined,
  failureAge: number | undefined,
): string {
  const portfolioChange = finalPortfolio - initialPortfolio;
  const portfolioChangePct = initialPortfolio > 0 ? (portfolioChange / initialPortfolio) * 100 : 0;
  
  if (failureYear !== undefined && failureAge !== undefined) {
    return (
      `Scenario '${scenarioName}' projects portfolio depletion in year ${failureYear} ` +
      `at age ${failureAge}. The portfolio started at $${initialPortfolio.toLocaleString()} and ` +
      `lasted ${totalYears} years before running out of funds. This indicates the ` +
      `withdrawal strategy is not sustainable for the full retirement period.`
    );
  } else {
    const changeDesc = portfolioChange > 0 ? 'grew' : 'declined';
    const changeType = portfolioChange > 0 ? 'increase' : 'decrease';
    const sustainabilityDesc = portfolioChange >= 0 ? 'sustainable' : 'gradually declining but viable';
    
    return (
      `Scenario '${scenarioName}' successfully maintains the portfolio for all ${totalYears} ` +
      `years simulated. Starting with $${initialPortfolio.toLocaleString()}, the portfolio ${changeDesc} ` +
      `to $${finalPortfolio.toLocaleString()} (a ${Math.abs(portfolioChangePct).toFixed(1)}% ` +
      `${changeType}). This demonstrates a ${sustainabilityDesc} withdrawal strategy.`
    );
  }
}

/**
 * Analyze portfolio success probability.
 */
function analyzeSuccess(
  dataPoints: ChartDataPoint[],
  success: boolean,
  failureYear: number | undefined,
  failureAge: number | undefined,
  initialPortfolio: number,
  finalPortfolio: number,
): string {
  if (!success && failureYear !== undefined && failureAge !== undefined) {
    const yearsUntilFailure = dataPoints.length;
    
    return (
      `⚠️  PORTFOLIO DEPLETION ALERT\n\n` +
      `The portfolio is projected to run out of funds after ${yearsUntilFailure} years ` +
      `(age ${failureAge}).\n\n` +
      `Primary factors:\n` +
      `  • Withdrawal rate may be too high relative to portfolio growth\n` +
      `  • Investment returns may not be keeping pace with spending needs\n` +
      `  • Consider reducing annual withdrawals or adjusting investment strategy`
    );
  } else {
    const avgWithdrawal = dataPoints.reduce(
      (sum, d) => sum + d.taxableWithdrawal + d.traditionalWithdrawal + d.rothWithdrawal,
      0,
    ) / dataPoints.length;
    const effectiveWithdrawalRate = initialPortfolio > 0 ? (avgWithdrawal / initialPortfolio) * 100 : 0;
    
    const portfolioGrowth = finalPortfolio - initialPortfolio;
    let sustainabilityScore = 'Fair';
    if (portfolioGrowth > 0) {
      sustainabilityScore = 'Excellent';
    } else if (finalPortfolio > initialPortfolio * 0.8) {
      sustainabilityScore = 'Good';
    }
    
    const finalPct = initialPortfolio > 0 ? (finalPortfolio / initialPortfolio) * 100 : 0;
    const safetyMargin = finalPortfolio > initialPortfolio ? 'Strong' : 'Moderate';
    
    return (
      `✅ PORTFOLIO SUCCESS\n\n` +
      `The portfolio successfully sustains withdrawals for the entire ${dataPoints.length}-year period. ` +
      `Ending balance of $${finalPortfolio.toLocaleString()} represents ` +
      `${finalPct.toFixed(1)}% of the starting value.\n\n` +
      `Sustainability Metrics:\n` +
      `  • Effective withdrawal rate: ${effectiveWithdrawalRate.toFixed(2)}% of initial portfolio\n` +
      `  • Portfolio trajectory: ${sustainabilityScore}\n` +
      `  • Final portfolio value: $${finalPortfolio.toLocaleString()}\n` +
      `  • Safety margin: ${safetyMargin}`
    );
  }
}

/**
 * Analyze tax efficiency.
 */
function analyzeTaxes(
  dataPoints: ChartDataPoint[],
  totalTaxes: number,
  totalWithdrawals: number,
): string {
  if (totalWithdrawals === 0) {
    return 'No withdrawals occurred during this period, so no tax analysis is available.';
  }
  
  const effectiveTaxRate = totalWithdrawals > 0 ? (totalTaxes / totalWithdrawals) * 100 : 0;
  const avgAnnualTax = totalTaxes / dataPoints.length;
  
  // Find years with highest/lowest taxes
  const sortedByTax = [...dataPoints].sort((a, b) => Math.abs(a.taxes) - Math.abs(b.taxes));
  const minTaxYear = sortedByTax[0];
  const maxTaxYear = sortedByTax[sortedByTax.length - 1];
  
  // Count tax sources
  const tradWithdrawalYears = dataPoints.filter(d => d.traditionalWithdrawal > 0).length;
  const taxableWithdrawalYears = dataPoints.filter(d => d.taxableWithdrawal > 0).length;
  const rothWithdrawalYears = dataPoints.filter(d => d.rothWithdrawal > 0).length;
  
  let efficiencyRating: string;
  if (effectiveTaxRate < 5) {
    efficiencyRating = 'Excellent';
  } else if (effectiveTaxRate < 10) {
    efficiencyRating = 'Good';
  } else if (effectiveTaxRate < 15) {
    efficiencyRating = 'Fair';
  } else {
    efficiencyRating = 'Needs Optimization';
  }
  
  return (
    `Tax Efficiency Rating: ${efficiencyRating}\n\n` +
    `Overall Tax Metrics:\n` +
    `  • Total taxes paid: $${totalTaxes.toLocaleString()} over ${dataPoints.length} years\n` +
    `  • Average annual tax: $${avgAnnualTax.toLocaleString()}\n` +
    `  • Effective tax rate: ${effectiveTaxRate.toFixed(2)}% of gross withdrawals\n\n` +
    `Tax Variation:\n` +
    `  • Lowest tax year: Year ${minTaxYear.year} (age ${minTaxYear.age}) - $${Math.abs(minTaxYear.taxes).toLocaleString()}\n` +
    `  • Highest tax year: Year ${maxTaxYear.year} (age ${maxTaxYear.age}) - $${Math.abs(maxTaxYear.taxes).toLocaleString()}\n\n` +
    `Withdrawal Sources:\n` +
    `  • Traditional account withdrawals: ${tradWithdrawalYears} years\n` +
    `  • Taxable account withdrawals: ${taxableWithdrawalYears} years\n` +
    `  • Tax-free Roth withdrawals: ${rothWithdrawalYears} years`
  );
}

/**
 * Analyze withdrawal patterns.
 */
function analyzeWithdrawals(dataPoints: ChartDataPoint[], totalWithdrawals: number): string {
  const avgWithdrawal = totalWithdrawals / dataPoints.length;
  
  const totalTaxable = dataPoints.reduce((sum, d) => sum + d.taxableWithdrawal, 0);
  const totalTraditional = dataPoints.reduce((sum, d) => sum + d.traditionalWithdrawal, 0);
  const totalRoth = dataPoints.reduce((sum, d) => sum + d.rothWithdrawal, 0);
  
  const pctTaxable = totalWithdrawals > 0 ? (totalTaxable / totalWithdrawals) * 100 : 0;
  const pctTraditional = totalWithdrawals > 0 ? (totalTraditional / totalWithdrawals) * 100 : 0;
  const pctRoth = totalWithdrawals > 0 ? (totalRoth / totalWithdrawals) * 100 : 0;
  
  let strategy: string;
  let strategyDesc: string;
  if (pctTaxable > 50) {
    strategy = 'Taxable-First';
    strategyDesc = 'maximizes tax-advantaged growth';
  } else if (pctTraditional > 50) {
    strategy = 'Traditional-First';
    strategyDesc = 'spreads tax burden';
  } else if (pctRoth > 50) {
    strategy = 'Roth-First';
    strategyDesc = 'provides tax-free income';
  } else {
    strategy = 'Balanced/Proportional';
    strategyDesc = 'spreads tax burden';
  }
  
  return (
    `Withdrawal Strategy: ${strategy}\n\n` +
    `Total Withdrawals: $${totalWithdrawals.toLocaleString()}\n` +
    `Average Annual: $${avgWithdrawal.toLocaleString()}\n\n` +
    `Source Breakdown:\n` +
    `  • Taxable accounts: $${totalTaxable.toLocaleString()} (${pctTaxable.toFixed(1)}%)\n` +
    `  • Traditional accounts: $${totalTraditional.toLocaleString()} (${pctTraditional.toFixed(1)}%)\n` +
    `  • Roth accounts: $${totalRoth.toLocaleString()} (${pctRoth.toFixed(1)}%)\n\n` +
    `The ${strategy.toLowerCase()} approach ${strategyDesc} during retirement.`
  );
}

/**
 * Identify key financial milestones.
 */
function identifyMilestones(dataPoints: ChartDataPoint[]): string[] {
  const milestones: string[] = [];
  
  // Portfolio peaks and troughs
  const maxPortfolio = dataPoints.reduce((max, d) => d.totalPortfolio > max.totalPortfolio ? d : max, dataPoints[0]);
  const minPortfolio = dataPoints.reduce((min, d) => d.totalPortfolio < min.totalPortfolio ? d : min, dataPoints[0]);
  
  if (maxPortfolio.year !== dataPoints[0].year) {
    milestones.push(
      `Portfolio peak: $${maxPortfolio.totalPortfolio.toLocaleString()} in year ${maxPortfolio.year} (age ${maxPortfolio.age})`,
    );
  }
  
  if (minPortfolio.totalPortfolio < dataPoints[0].totalPortfolio * 0.8) {
    milestones.push(
      `Portfolio low point: $${minPortfolio.totalPortfolio.toLocaleString()} in year ${minPortfolio.year} (age ${minPortfolio.age})`,
    );
  }
  
  // RMD age (73 for 2024+)
  const rmdYears = dataPoints.filter(d => d.age >= 73);
  if (rmdYears.length > 0) {
    const firstRmd = rmdYears[0];
    milestones.push(
      `RMD begins: Age ${firstRmd.age} (year ${firstRmd.year}) - Required minimum distributions commence`,
    );
  }
  
  // Medicare age
  const medicareYears = dataPoints.filter(d => d.age === 65);
  if (medicareYears.length > 0) {
    milestones.push(`Medicare eligibility: Age 65 (year ${medicareYears[0].year})`);
  }
  
  // Social Security (if active)
  const ssaYears = dataPoints.filter(d => d.socialSecurity > 0);
  if (ssaYears.length > 0) {
    const firstSsa = ssaYears[0];
    milestones.push(
      `Social Security begins: Age ${firstSsa.age} (year ${firstSsa.year}) - ` +
      `$${firstSsa.socialSecurity.toLocaleString()}/year`,
    );
  }
  
  // Account depletion milestones
  for (let i = 1; i < dataPoints.length; i++) {
    const current = dataPoints[i];
    const previous = dataPoints[i - 1];
    
    if (current.taxableBalance === 0 && previous.taxableBalance > 0) {
      milestones.push(`Taxable accounts depleted: Year ${current.year} (age ${current.age})`);
    }
    if (current.traditionalBalance === 0 && previous.traditionalBalance > 0) {
      milestones.push(`Traditional accounts depleted: Year ${current.year} (age ${current.age})`);
    }
    if (current.rothBalance === 0 && previous.rothBalance > 0) {
      milestones.push(`Roth accounts depleted: Year ${current.year} (age ${current.age})`);
    }
  }
  
  return milestones.length > 0 ? milestones : ['No significant milestones identified'];
}

/**
 * Generate actionable recommendations.
 */
function generateRecommendations(
  dataPoints: ChartDataPoint[],
  totalTaxes: number,
  totalWithdrawals: number,
  failureYear: number | undefined,
  initialPortfolio: number,
  finalPortfolio: number,
): string[] {
  const recommendations: string[] = [];
  
  // Portfolio sustainability
  if (failureYear !== undefined) {
    recommendations.push(
      'CRITICAL: Reduce annual withdrawal rate or increase portfolio returns to avoid depletion',
    );
    recommendations.push(
      'Consider delaying retirement, working part-time, or reducing expenses',
    );
  } else if (finalPortfolio < initialPortfolio * 0.7) {
    recommendations.push(
      'Portfolio declining significantly - consider reducing withdrawal rate',
    );
  } else if (finalPortfolio > initialPortfolio * 1.5) {
    recommendations.push(
      'Portfolio growing substantially - withdrawal rate appears conservative; may be able to increase spending',
    );
  }
  
  // Tax optimization
  const effectiveTaxRate = totalWithdrawals > 0 ? (totalTaxes / totalWithdrawals) * 100 : 0;
  if (effectiveTaxRate > 15) {
    recommendations.push(
      'Tax burden is high - explore Roth conversions during low-income years to reduce future RMDs',
    );
  } else if (effectiveTaxRate < 5) {
    recommendations.push(
      'Excellent tax efficiency - current withdrawal strategy is well-optimized',
    );
  }
  
  // Account balance optimization
  const lastYear = dataPoints[dataPoints.length - 1];
  if (lastYear.traditionalBalance > lastYear.rothBalance * 3 && lastYear.age < 73) {
    recommendations.push(
      'Large traditional balance before RMDs - consider Roth conversions to reduce future tax burden',
    );
  }
  
  // Sequence optimization
  const totalTaxable = dataPoints.reduce((sum, d) => sum + d.taxableWithdrawal, 0);
  const totalTraditional = dataPoints.reduce((sum, d) => sum + d.traditionalWithdrawal, 0);
  if (totalTaxable > 0 && totalTraditional > totalTaxable * 2) {
    recommendations.push(
      'Consider using more taxable account withdrawals to benefit from preferential capital gains rates',
    );
  }
  
  // IRMAA considerations
  const highIncomeYears = dataPoints.filter(d => 
    (d.traditionalWithdrawal + d.socialSecurity) > 100000,
  );
  if (highIncomeYears.length > dataPoints.length * 0.3) {
    recommendations.push(
      'Multiple years near IRMAA thresholds ($103k single/$206k joint) - plan withdrawals to avoid Medicare surcharges',
    );
  }
  
  return recommendations.length > 0 ? recommendations : [
    'Current strategy appears well-balanced - continue monitoring and adjust as needed',
  ];
}

/**
 * Format explanation as plain text report.
 * 
 * @param explanation - Structured explanation result
 * @returns Formatted text report
 */
export function formatExplanationAsText(explanation: ExplanationResult): string {
  const lines: string[] = [
    '='.repeat(80),
    'RETIREMENT SCENARIO ANALYSIS',
    '='.repeat(80),
    '',
    'SUMMARY',
    '-'.repeat(80),
    explanation.summary,
    '',
    'SUCCESS PROBABILITY',
    '-'.repeat(80),
    explanation.successAnalysis,
    '',
    'TAX EFFICIENCY',
    '-'.repeat(80),
    explanation.taxAnalysis,
    '',
    'WITHDRAWAL STRATEGY',
    '-'.repeat(80),
    explanation.withdrawalAnalysis,
    '',
    'KEY MILESTONES',
    '-'.repeat(80),
  ];
  
  for (const milestone of explanation.keyMilestones) {
    lines.push(`  • ${milestone}`);
  }
  
  lines.push('');
  lines.push('RECOMMENDATIONS');
  lines.push('-'.repeat(80));
  
  for (const rec of explanation.recommendations) {
    lines.push(`  • ${rec}`);
  }
  
  lines.push('');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}
