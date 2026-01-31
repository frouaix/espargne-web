import { useState, useEffect, useRef } from 'react';
import type { UserProfileData } from './UserProfileForm';
import type { SSAIncomeData } from './SSAIncomeForm';
import type { Account } from '../utils/export';
import { createProjectionRequest } from '../utils/apiTransform';
import { formatCurrency } from '../utils/format';
import { runProjection, downloadProjectionCSV, getProjectionExplanation } from '../services/api';
import type { ProjectionResponse, ExplanationResponse } from '../services/api';
import { ProjectionChart } from './ProjectionChart';
import { ExplanationView } from './ExplanationView';
import { STORAGE_KEYS } from '../utils/storage';

interface ScenarioRunnerProps {
  userProfile: UserProfileData;
  accounts: Account[];
  ssaIncome: SSAIncomeData | null;
}

export function ScenarioRunner({ userProfile, accounts, ssaIncome }: ScenarioRunnerProps) {
  const [maxYears, setMaxYears] = useState(30);
  const [realReturn, setRealReturn] = useState(0.05);
  const [withdrawalRate, setWithdrawalRate] = useState(0.04);
  const [minRequiredIncome, setMinRequiredIncome] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MIN_REQUIRED_INCOME);
    return saved ? parseFloat(saved) : 0;
  });
  const [minIncomeInflationRate, setMinIncomeInflationRate] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MIN_INCOME_INFLATION_RATE);
    return saved ? parseFloat(saved) : 0.03;
  });
  const [withdrawalStrategy, setWithdrawalStrategy] = useState<'taxable_first_min_taxes' | 'taxable_first_proportional' | 'traditional_first' | 'pro_rata'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WITHDRAWAL_STRATEGY);
    return (saved as any) || 'taxable_first_min_taxes';
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [projectionResult, setProjectionResult] = useState<ProjectionResponse | null>(null);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(null);
  const [activeView, setActiveView] = useState<'chart' | 'explanation' | null>(null);

  const supportedAccounts = accounts.filter(acc => 
    ['taxable', 'traditional', 'roth'].includes(acc.accountType)
  );

  const totalBalance = supportedAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  // Track if this is the first render
  const isFirstRender = useRef(true);
  
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
        minRequiredIncome,
        minIncomeInflationRate,
      });

      const result = await runProjection(request);
      setProjectionResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run projection');
    } finally {
      setLoading(false);
    }
  };

  // Save withdrawal strategy to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWAL_STRATEGY, withdrawalStrategy);
  }, [withdrawalStrategy]);

  // Save min required income settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MIN_REQUIRED_INCOME, minRequiredIncome.toString());
  }, [minRequiredIncome]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MIN_INCOME_INFLATION_RATE, minIncomeInflationRate.toString());
  }, [minIncomeInflationRate]);

  // Auto-run projection when inputs change (after initial render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Only auto-run if we have the minimum required data
    if (supportedAccounts.length > 0 && userProfile) {
      handleRunProjection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    maxYears, 
    realReturn, 
    withdrawalRate, 
    withdrawalStrategy,
    minRequiredIncome,
    minIncomeInflationRate,
    // Also trigger on account/profile changes
    accounts.length,
    totalBalance,
    userProfile.birthYear,
    userProfile.retirementAge,
    userProfile.filingStatus,
    ssaIncome?.fraMonthlyBenefit,
    ssaIncome?.claimingAge
  ]);

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
        minRequiredIncome,
        minIncomeInflationRate,
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
        minRequiredIncome,
        minIncomeInflationRate,
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
        <p className="no-accounts-message">
          Add at least one account (Taxable, Traditional, or Roth) to run a simulation.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>📊 Run Retirement Simulation</h2>
      
      <div className="portfolio-summary">
        <h3>Current Portfolio</h3>
        <p>
          <strong>Total Balance:</strong> ${formatCurrency(totalBalance)}<br />
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
          <small>{(withdrawalRate * 100).toFixed(2)}% = ${formatCurrency(totalBalance * withdrawalRate)}/year</small>
        </label>
      </div>

      <div className="form-group">
        <label>
          Withdrawal Strategy:
          <select value={withdrawalStrategy} onChange={(e) => setWithdrawalStrategy(e.target.value as any)}>
            <option value="taxable_first_min_taxes">Taxable First (Minimum Taxes)</option>
            <option value="taxable_first_proportional">Taxable First (Proportional)</option>
            <option value="traditional_first">Traditional First</option>
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

      <div className="form-group">
        <label>
          Minimum Required Income (optional):
          <input
            type="number"
            min="0"
            max="1000000"
            step="1000"
            value={minRequiredIncome === 0 ? '' : minRequiredIncome}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '') {
                setMinRequiredIncome(0);
              } else {
                const parsed = parseFloat(value);
                if (!isNaN(parsed)) {
                  setMinRequiredIncome(parsed);
                }
              }
            }}
            placeholder="0"
          />
          <small>Reference line shown on income chart (not used in calculations)</small>
        </label>
      </div>

      {minRequiredIncome > 0 && (
        <div className="form-group">
          <label>
            Min Income Inflation Rate (%):
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={minIncomeInflationRate * 100}
              onChange={(e) => setMinIncomeInflationRate(parseFloat(e.target.value) / 100 || 0.03)}
            />
            <small>{(minIncomeInflationRate * 100).toFixed(1)}% annual increase</small>
          </label>
        </div>
      )}

      <div className="scenario-actions">
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
        <div className="scenario-error">
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
