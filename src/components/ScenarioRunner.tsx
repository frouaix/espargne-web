import { useState } from 'react';
import type { UserProfileData } from './UserProfileForm';
import type { SSAIncomeData } from './SSAIncomeForm';
import type { Account } from '../utils/export';
import { createProjectionRequest } from '../utils/apiTransform';
import { runProjection, downloadProjectionCSV, getProjectionExplanation } from '../services/api';
import type { ProjectionResponse, ExplanationResponse } from '../services/api';
import { ProjectionChart } from './ProjectionChart';
import { ExplanationView } from './ExplanationView';

interface ScenarioRunnerProps {
  userProfile: UserProfileData;
  accounts: Account[];
  ssaIncome: SSAIncomeData | null;
}

export function ScenarioRunner({ userProfile, accounts, ssaIncome }: ScenarioRunnerProps) {
  const [maxYears, setMaxYears] = useState(30);
  const [realReturn, setRealReturn] = useState(0.05);
  const [withdrawalRate, setWithdrawalRate] = useState(0.04);
  const [withdrawalStrategy, setWithdrawalStrategy] = useState<'taxable_first' | 'traditional_first' | 'roth_first' | 'pro_rata'>('taxable_first');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [projectionResult, setProjectionResult] = useState<ProjectionResponse | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [activeView, setActiveView] = useState<'chart' | 'explanation' | null>(null);

  const supportedAccounts = accounts.filter(acc => 
    ['taxable', 'traditional', 'roth'].includes(acc.accountType)
  );

  const totalBalance = supportedAccounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleRunProjection = async () => {
    setLoading(true);
    setError('');
    setProjectionResult(null);
    setExplanation(null);
    setActiveView('chart');

    try {
      const request = createProjectionRequest(userProfile, accounts, ssaIncome, {
        maxYears,
        realReturn,
        withdrawalRate,
        withdrawalStrategy,
        scenarioName: 'Retirement Scenario',
      });

      const result = await runProjection(request);
      setProjectionResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run projection');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    setLoading(true);
    setError('');

    try {
      const request = createProjectionRequest(userProfile, accounts, ssaIncome, {
        maxYears,
        realReturn,
        withdrawalRate,
        withdrawalStrategy,
        scenarioName: 'Retirement Scenario',
      });

      await downloadProjectionCSV(request, `retirement_${Date.now()}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleGetExplanation = async () => {
    setLoading(true);
    setError('');
    setExplanation(null);
    setActiveView('explanation');

    try {
      const request = createProjectionRequest(userProfile, accounts, ssaIncome, {
        maxYears,
        realReturn,
        withdrawalRate,
        withdrawalStrategy,
        scenarioName: 'Retirement Scenario',
      });

      const result = await getProjectionExplanation(request);
      setExplanation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate explanation');
    } finally {
      setLoading(false);
    }
  };

  if (supportedAccounts.length === 0) {
    return (
      <div className="card">
        <h2>📊 Run Simulation</h2>
        <p style={{ color: '#666' }}>
          Add at least one account (Taxable, Traditional, or Roth) to run a simulation.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📊 Run Retirement Simulation</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0 }}>Current Portfolio</h3>
        <p>
          <strong>Total Balance:</strong> ${totalBalance.toLocaleString()}<br />
          <strong>Accounts:</strong> {supportedAccounts.length} 
          ({supportedAccounts.map(a => a.accountType).join(', ')})
        </p>
      </div>

      <div className="form-group">
        <label>
          Withdrawal Rate (% of initial portfolio):
          <input
            type="number"
            min="0.01"
            max="0.10"
            step="0.0025"
            value={withdrawalRate}
            onChange={(e) => setWithdrawalRate(parseFloat(e.target.value))}
          />
          <small>{(withdrawalRate * 100).toFixed(2)}% = ${(totalBalance * withdrawalRate).toLocaleString()}/year</small>
        </label>
      </div>

      <div className="form-group">
        <label>
          Withdrawal Strategy:
          <select value={withdrawalStrategy} onChange={(e) => setWithdrawalStrategy(e.target.value as any)}>
            <option value="taxable_first">Taxable First</option>
            <option value="traditional_first">Traditional First</option>
            <option value="roth_first">Roth First</option>
            <option value="pro_rata">Pro Rata</option>
          </select>
        </label>
      </div>

      <div className="form-group">
        <label>
          Real Return Rate (after inflation):
          <input
            type="number"
            min="0.00"
            max="0.15"
            step="0.005"
            value={realReturn}
            onChange={(e) => setRealReturn(parseFloat(e.target.value))}
          />
          <small>{(realReturn * 100).toFixed(1)}% annual return</small>
        </label>
      </div>

      <div className="form-group">
        <label>
          Projection Years:
          <input
            type="number"
            min="5"
            max="50"
            step="1"
            value={maxYears}
            onChange={(e) => setMaxYears(parseInt(e.target.value))}
          />
          <small>{maxYears} years (to age {userProfile.retirementAge + maxYears})</small>
        </label>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={handleRunProjection}
          disabled={loading}
          className="button-primary"
        >
          {loading && activeView === 'chart' ? 'Running...' : '📈 View Charts'}
        </button>

        <button
          onClick={handleGetExplanation}
          disabled={loading}
          className="button-primary"
        >
          {loading && activeView === 'explanation' ? 'Generating...' : '📄 View Analysis'}
        </button>

        <button
          onClick={handleDownloadCSV}
          disabled={loading}
          className="button-secondary"
        >
          {loading && activeView === null ? 'Downloading...' : '💾 Download CSV'}
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#fee', 
          color: '#c00',
          borderRadius: '8px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {activeView === 'chart' && projectionResult?.success && projectionResult.result && (
        <ProjectionChart result={projectionResult.result} />
      )}

      {activeView === 'explanation' && explanation?.success && (
        <ExplanationView explanation={explanation} />
      )}
    </div>
  );
}
