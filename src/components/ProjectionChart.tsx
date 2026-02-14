// Copyright (c) 2026 François Rouaix
import { AreaChart, Area, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProjectionResult } from '../lib/types';
import { buildChartData } from '../lib/chartDataBuilder';
import { formatCurrency } from '../utils/format';
import { toNumber } from '../lib/bigHelpers';

interface ProjectionChartProps {
  result: ProjectionResult;
}

export function ProjectionChart({ result }: ProjectionChartProps) {
  // Build chart data from projection result
  const chartDataset = buildChartData(result);
  const { dataPoints } = chartDataset;
  
  const success = result.success;
  const failureYear = result.failureYear;
  const failureAge = result.failureAge;
  const totalYears = result.withdrawalPlans.length;

  // Get all unique account IDs from withdrawal plans
  const accountIds = new Set<string>();
  result.withdrawalPlans.forEach(plan => {
    Object.keys(plan.accountBalances).forEach(id => accountIds.add(id));
    Object.keys(plan.accountWithdrawals).forEach(id => accountIds.add(id));
  });
  
  // Sort account IDs for consistent ordering
  const sortedAccountIds = Array.from(accountIds).sort();
  
  // Build account display names (nickname or ID)
  const accountDisplayNames: Record<string, string> = {};
  if (result.withdrawalPlans.length > 0) {
    const firstPlan = result.withdrawalPlans[0];
    sortedAccountIds.forEach(id => {
      const metadata = firstPlan.accountMetadata?.[id];
      accountDisplayNames[id] = metadata?.nickname || id;
    });
  }
  
  // Check which account types have non-zero balances
  const hasAnyTaxable = dataPoints.some(d => d.taxableBalance > 0);
  const hasAnyTraditional = dataPoints.some(d => d.traditionalBalance > 0);
  const hasAnyRoth = dataPoints.some(d => d.rothBalance > 0);
  const hasAnySocialSecurity = dataPoints.some(d => d.socialSecurity > 0);
  
  // Generate colors for each account
  const colorPalette = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', 
    '#a4de6c', '#d0ed57', '#ffc0cb', '#dda0dd', '#20b2aa',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'
  ];
  
  const accountColors: Record<string, string> = {};
  sortedAccountIds.forEach((id, idx) => {
    accountColors[id] = colorPalette[idx % colorPalette.length];
  });

  // Prepare data for visualization
  const chartData = dataPoints.map((dataPoint, idx) => {
    const plan = result.withdrawalPlans[idx];
    const chartPoint: Record<string, number> = {
      year: dataPoint.year,
      age: dataPoint.age,
      'Total Portfolio': dataPoint.totalPortfolio,
      'Total Income': dataPoint.totalIncome,
      'Social Security': dataPoint.socialSecurity,
      'Taxes': dataPoint.taxes, // Already negative
      'Net Income': dataPoint.totalIncome + dataPoint.taxes, // taxes is negative
    };
    
    // Add individual account balances
    Object.entries(plan.accountBalances).forEach(([accountId, balance]) => {
      chartPoint[accountId] = toNumber(balance);
    });
    
    // Add individual account withdrawals (prefixed to distinguish from balances)
    Object.entries(plan.accountWithdrawals).forEach(([accountId, withdrawal]) => {
      chartPoint[`withdrawal_${accountId}`] = toNumber(withdrawal);
    });
    
    return chartPoint;
  });
  
  // Get all unique withdrawal account IDs (sorted for consistency)
  const withdrawalAccountIds = new Set<string>();
  result.withdrawalPlans.forEach(plan => {
    Object.keys(plan.accountWithdrawals).forEach(id => {
      if (toNumber(plan.accountWithdrawals[id]) > 0) {
        withdrawalAccountIds.add(id);
      }
    });
  });
  const sortedWithdrawalAccountIds = Array.from(withdrawalAccountIds).sort();

  const formatChartCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div>
      <div className={`projection-result ${success ? 'success' : 'failure'}`}>
        <h3>
          {success ? '✅ Portfolio Success' : '❌ Portfolio Depleted'}
        </h3>
        <div className="projection-metrics">
          <div>
            <strong>Years Simulated:</strong> {totalYears}<br />
            <strong>Final Portfolio:</strong> ${formatCurrency(toNumber(result.finalPortfolioValue))}<br />
            {!success && failureYear && (
              <>
                <strong className="failure-info">Failed in Year:</strong> {failureYear} (age {failureAge})
              </>
            )}
          </div>
          <div>
            <strong>Total Withdrawals:</strong> ${formatCurrency(toNumber(result.totalWithdrawals))}<br />
            <strong>Total Taxes:</strong> ${formatCurrency(toNumber(result.totalTaxesPaid))}<br />
            <strong>Net Income:</strong> ${formatCurrency(toNumber(result.totalWithdrawals.minus(result.totalTaxesPaid)))}
          </div>
        </div>
      </div>

      <h3>Portfolio Balance Over Time</h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tickFormatter={formatChartCurrency}
            label={{ value: 'Portfolio Balance', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value: number) => formatChartCurrency(value)} />
          <Legend />
          {sortedAccountIds.map(accountId => (
            <Area 
              key={accountId}
              type="monotone" 
              dataKey={accountId} 
              name={accountDisplayNames[accountId]}
              stackId="1"
              stroke={accountColors[accountId]} 
              fill={accountColors[accountId]} 
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <h3 className="chart-section">Annual Income & Taxes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year"
            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tickFormatter={formatChartCurrency}
            label={{ value: 'Amount', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value: number) => formatChartCurrency(value)} />
          <Legend />
          {sortedWithdrawalAccountIds.map(accountId => (
            <Bar 
              key={accountId}
              dataKey={`withdrawal_${accountId}`} 
              name={accountDisplayNames[accountId]}
              stackId="income" 
              fill={accountColors[accountId] || '#999999'} 
            />
          ))}
          <Bar dataKey="Social Security" stackId="income" fill="#2196F3" />
          <Bar dataKey="Taxes" fill="#F44336" />
          <Line 
            type="monotone" 
            dataKey="Net Income" 
            stroke="#9C27B0" 
            strokeWidth={3}
            dot={false}
            name="Net Income"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <h3 className="chart-section">Year-by-Year Details</h3>
      <div className="details-table-container">
        <table className="details-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Age</th>
              <th className="align-right">Income</th>
              {hasAnySocialSecurity && <th className="align-right">Social Security</th>}
              <th className="align-right">Taxes</th>
              <th className="align-right">Tax Rate</th>
              <th className="align-right">Net Income</th>
              {hasAnyTaxable && <th className="align-right">Brokerage</th>}
              {hasAnyTraditional && <th className="align-right">Traditional</th>}
              {hasAnyRoth && <th className="align-right">Roth</th>}
              <th className="align-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {dataPoints.map((dataPoint, idx) => {
              const totalIncome = dataPoint.totalIncome;
              const netIncome = totalIncome + dataPoint.taxes; // taxes is negative
              const taxRate = totalIncome > 0 ? ((Math.abs(dataPoint.taxes) / totalIncome) * 100) : 0;
              
              return (
                <tr key={idx}>
                  <td>{dataPoint.year}</td>
                  <td>{dataPoint.age}</td>
                  <td className="align-right">
                    ${formatCurrency(totalIncome)}
                  </td>
                  {hasAnySocialSecurity && (
                    <td className="align-right">
                      ${formatCurrency(dataPoint.socialSecurity)}
                    </td>
                  )}
                  <td className="align-right">
                    ${formatCurrency(Math.abs(dataPoint.taxes))}
                  </td>
                  <td className="align-right">
                    {taxRate.toFixed(1)}%
                  </td>
                  <td className="align-right">
                    ${formatCurrency(netIncome)}
                  </td>
                  {hasAnyTaxable && (
                    <td className="align-right">
                      ${formatCurrency(dataPoint.taxableBalance)}
                    </td>
                  )}
                  {hasAnyTraditional && (
                    <td className="align-right">
                      ${formatCurrency(dataPoint.traditionalBalance)}
                    </td>
                  )}
                  {hasAnyRoth && (
                    <td className="align-right">
                      ${formatCurrency(dataPoint.rothBalance)}
                    </td>
                  )}
                  <td className="align-right bold">
                    ${formatCurrency(dataPoint.totalPortfolio)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
