// Copyright (c) 2026 François Rouaix
import React, { useState } from 'react';

interface SSAIncomeFormProps {
  onSave: (data: SSAIncomeData) => void;
  initialData?: SSAIncomeData | null;
}

export interface SSAIncomeData {
  fraMonthlyBenefit: number;
  claimingAge: number;
  colaRate?: number;
}

export const SSAIncomeForm: React.FC<SSAIncomeFormProps> = ({ onSave, initialData }) => {
  const [fraMonthlyBenefit, setFraMonthlyBenefit] = useState(initialData?.fraMonthlyBenefit?.toString() || '');
  const [claimingAge, setClaimingAge] = useState(initialData?.claimingAge?.toString() || '67');
  const [colaRate, setColaRate] = useState(initialData?.colaRate?.toString() || '2.5');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fraMonthlyBenefit) {
      setError('Monthly benefit at Full Retirement Age is required');
      return;
    }

    const benefit = parseFloat(fraMonthlyBenefit);
    const age = parseFloat(claimingAge);
    const cola = parseFloat(colaRate);

    if (isNaN(benefit) || isNaN(age) || isNaN(cola)) {
      setError('Please enter valid numbers');
      return;
    }

    if (age < 62 || age > 70) {
      setError('Claiming age must be between 62 and 70');
      return;
    }

    if (cola < 0 || cola > 10) {
      setError('COLA rate must be between 0% and 10%');
      return;
    }

    onSave({
      fraMonthlyBenefit: benefit,
      claimingAge: age,
      colaRate: cola,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <h3>Social Security Benefits</h3>
      
      <div className="form-group">
        <label htmlFor="fraMonthlyBenefit">Monthly Benefit at Full Retirement Age ($)</label>
        <input
          id="fraMonthlyBenefit"
          type="number"
          min="0"
          step="0.01"
          value={fraMonthlyBenefit}
          onChange={(e) => setFraMonthlyBenefit(e.target.value)}
          placeholder="From your SSA statement"
        />
        <small>Find this amount on your Social Security statement</small>
      </div>

      <div className="form-group">
        <label htmlFor="claimingAge">When Will You Claim? (Age)</label>
        <input
          id="claimingAge"
          type="number"
          min="62"
          max="70"
          step="0.01"
          value={claimingAge}
          onChange={(e) => setClaimingAge(e.target.value)}
        />
        <small>Ages 62–70; claiming early reduces benefits, delaying increases them</small>
      </div>

      <div className="form-group">
        <label htmlFor="colaRate">Annual COLA Rate (%)</label>
        <input
          id="colaRate"
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={colaRate}
          onChange={(e) => setColaRate(e.target.value)}
        />
        <small>Cost of Living Adjustment (historical average ~2.5%)</small>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary">Save Social Security Plan</button>
    </form>
  );
};
