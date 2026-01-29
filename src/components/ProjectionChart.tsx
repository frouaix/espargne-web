import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProjectionResult } from '../services/api';
import { formatCurrency } from '../utils/format';

interface ProjectionChartProps {
  result: ProjectionResult;
}

export function ProjectionChart({ result }: ProjectionChartProps) {
  const { chart_data, success, failure_year, failure_age, total_years } = result;

  // Get all unique account IDs from the data
  const accountIds = new Set<string>();
  chart_data.years_data.forEach(year => {
    if (year.account_balances) {
      Object.keys(year.account_balances).forEach(id => accountIds.add(id));
    }
  });
  
  // Generate colors for each account
  const colorPalette = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', 
    '#a4de6c', '#d0ed57', '#ffc0cb', '#dda0dd', '#20b2aa',
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'
  ];
  
  const accountColors: Record<string, string> = {};
  Array.from(accountIds).forEach((id, idx) => {
    accountColors[id] = colorPalette[idx % colorPalette.length];
  });

  // Prepare data for visualization
  const chartData = chart_data.years_data.map(year => {
    const dataPoint: any = {
      year: year.year,
      age: year.age,
      'Total Portfolio': year.total_portfolio_value || year.total_balance || 0,
      'Total Income': (year.taxable_withdrawal || year.income_taxable || 0) + 
                       (year.traditional_withdrawal || year.income_traditional || 0) + 
                       (year.roth_withdrawal || year.income_roth || 0) + 
                       (year.social_security || year.income_ssa || 0) + 
                       (year.pension || year.income_pension || 0) + 
                       (year.other_income || year.income_other || 0),
      'Social Security': year.social_security || year.income_ssa || 0,
      'Taxes': year.taxes || 0,
    };
    
    // Add individual account balances
    if (year.account_balances) {
      Object.entries(year.account_balances).forEach(([accountId, balance]) => {
        dataPoint[accountId] = balance;
      });
    }
    
    // Add individual account withdrawals (prefixed to distinguish from balances)
    if (year.account_withdrawals) {
      Object.entries(year.account_withdrawals).forEach(([accountId, withdrawal]) => {
        dataPoint[`withdrawal_${accountId}`] = withdrawal;
      });
    }
    
    return dataPoint;
  });
  
  // Get all unique withdrawal account IDs
  const withdrawalAccountIds = new Set<string>();
  chart_data.years_data.forEach(year => {
    if (year.account_withdrawals) {
      Object.keys(year.account_withdrawals).forEach(id => withdrawalAccountIds.add(id));
    }
  });

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
            <strong>Years Simulated:</strong> {total_years}<br />
            <strong>Final Portfolio:</strong> ${formatCurrency(result.final_portfolio_value)}<br />
            {!success && failure_year && (
              <>
                <strong className="failure-info">Failed in Year:</strong> {failure_year} (age {failure_age})
              </>
            )}
          </div>
          <div>
            <strong>Total Withdrawals:</strong> ${formatCurrency(result.total_withdrawals)}<br />
            <strong>Total Taxes:</strong> ${formatCurrency(result.total_taxes_paid)}<br />
            <strong>Net Income:</strong> ${formatCurrency(result.total_withdrawals - result.total_taxes_paid)}
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
          {Array.from(accountIds).map(accountId => (
            <Area 
              key={accountId}
              type="monotone" 
              dataKey={accountId} 
              stackId="1"
              stroke={accountColors[accountId]} 
              fill={accountColors[accountId]} 
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      <h3 className="chart-section">Total Portfolio Value</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year"
            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tickFormatter={formatChartCurrency}
            label={{ value: 'Total Value', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value: number) => formatChartCurrency(value)} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="Total Portfolio" 
            stroke="#2196F3" 
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      <h3 className="chart-section">Annual Income & Taxes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
          {Array.from(withdrawalAccountIds).map(accountId => (
            <Bar 
              key={accountId}
              dataKey={`withdrawal_${accountId}`} 
              name={accountId}
              stackId="withdrawals" 
              fill={accountColors[accountId] || '#999999'} 
            />
          ))}
          <Bar dataKey="Social Security" fill="#2196F3" />
          <Bar dataKey="Taxes" fill="#F44336" />
        </BarChart>
      </ResponsiveContainer>

      <h3 className="chart-section">Year-by-Year Details</h3>
      <div className="details-table-container">
        <table className="details-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Age</th>
              <th className="align-right">Income</th>
              <th className="align-right">Taxes</th>
              <th className="align-right">Brokerage</th>
              <th className="align-right">Traditional</th>
              <th className="align-right">Roth</th>
              <th className="align-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {chart_data.years_data.map((year, idx) => {
              const totalIncome = (year.taxable_withdrawal || year.income_taxable || 0) + 
                                  (year.traditional_withdrawal || year.income_traditional || 0) + 
                                  (year.roth_withdrawal || year.income_roth || 0) + 
                                  (year.social_security || year.income_ssa || 0);
              const taxableBalance = year.taxable_balance || year.balance_taxable || 0;
              const traditionalBalance = year.traditional_balance || year.balance_traditional || 0;
              const rothBalance = year.roth_balance || year.balance_roth || 0;
              const totalBalance = year.total_portfolio_value || year.total_balance || 0;
              
              return (
                <tr key={idx}>
                  <td>{year.year}</td>
                  <td>{year.age}</td>
                  <td className="align-right">
                    ${formatCurrency(totalIncome)}
                  </td>
                  <td className="align-right">
                    ${formatCurrency(year.taxes || 0)}
                  </td>
                  <td className="align-right">
                    ${formatCurrency(taxableBalance)}
                  </td>
                  <td className="align-right">
                    ${formatCurrency(traditionalBalance)}
                  </td>
                  <td className="align-right">
                    ${formatCurrency(rothBalance)}
                  </td>
                  <td className="align-right bold">
                    ${formatCurrency(totalBalance)}
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
