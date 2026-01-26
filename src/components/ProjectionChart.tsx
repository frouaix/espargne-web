import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProjectionResult } from '../services/api';

interface ProjectionChartProps {
  result: ProjectionResult;
}

export function ProjectionChart({ result }: ProjectionChartProps) {
  const { chart_data, success, failure_year, failure_age, total_years } = result;

  // Prepare data for visualization
  const chartData = chart_data.years_data.map(year => ({
    year: year.year,
    age: year.age,
    'Total Portfolio': year.total_portfolio_value || year.total_balance || 0,
    'Taxable': year.taxable_balance || year.balance_taxable || 0,
    'Traditional': year.traditional_balance || year.balance_traditional || 0,
    'Roth': year.roth_balance || year.balance_roth || 0,
    'Total Income': (year.taxable_withdrawal || year.income_taxable || 0) + 
                     (year.traditional_withdrawal || year.income_traditional || 0) + 
                     (year.roth_withdrawal || year.income_roth || 0) + 
                     (year.social_security || year.income_ssa || 0) + 
                     (year.pension || year.income_pension || 0) + 
                     (year.other_income || year.income_other || 0),
    'Social Security': year.social_security || year.income_ssa || 0,
    'Withdrawals': (year.taxable_withdrawal || year.income_taxable || 0) + 
                    (year.traditional_withdrawal || year.income_traditional || 0) + 
                    (year.roth_withdrawal || year.income_roth || 0),
    'Taxes': year.taxes || 0,
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div style={{ marginTop: '30px' }}>
      <div style={{ 
        padding: '20px', 
        background: success ? '#e8f5e9' : '#ffebee',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>
          {success ? '✅ Portfolio Success' : '❌ Portfolio Depleted'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <strong>Years Simulated:</strong> {total_years}<br />
            <strong>Final Portfolio:</strong> ${result.final_portfolio_value.toLocaleString()}<br />
            {!success && failure_year && (
              <>
                <strong style={{ color: '#c00' }}>Failed in Year:</strong> {failure_year} (age {failure_age})
              </>
            )}
          </div>
          <div>
            <strong>Total Withdrawals:</strong> ${result.total_withdrawals.toLocaleString()}<br />
            <strong>Total Taxes:</strong> ${result.total_taxes_paid.toLocaleString()}<br />
            <strong>Net Income:</strong> ${(result.total_withdrawals - result.total_taxes_paid).toLocaleString()}
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
            tickFormatter={formatCurrency}
            label={{ value: 'Portfolio Balance', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="Taxable" 
            stackId="1"
            stroke="#8884d8" 
            fill="#8884d8" 
          />
          <Area 
            type="monotone" 
            dataKey="Traditional" 
            stackId="1"
            stroke="#82ca9d" 
            fill="#82ca9d" 
          />
          <Area 
            type="monotone" 
            dataKey="Roth" 
            stackId="1"
            stroke="#ffc658" 
            fill="#ffc658" 
          />
        </AreaChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: '40px' }}>Total Portfolio Value</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year"
            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            label={{ value: 'Total Value', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
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

      <h3 style={{ marginTop: '40px' }}>Annual Income & Taxes</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year"
            label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            label={{ value: 'Amount', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="Withdrawals" fill="#4CAF50" />
          <Bar dataKey="Social Security" fill="#2196F3" />
          <Bar dataKey="Taxes" fill="#F44336" />
        </BarChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: '40px' }}>Year-by-Year Details</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px',
          marginTop: '10px'
        }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Year</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Age</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Income</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Taxes</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Taxable</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Traditional</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Roth</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Total</th>
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
                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{year.year}</td>
                  <td style={{ padding: '8px' }}>{year.age}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ${totalIncome.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ${(year.taxes || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ${taxableBalance.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ${traditionalBalance.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ${rothBalance.toLocaleString()}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                    ${totalBalance.toLocaleString()}
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
