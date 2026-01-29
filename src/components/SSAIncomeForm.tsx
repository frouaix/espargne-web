import React, { useState } from 'react';

interface SSAIncomeFormProps {
  onSave: (data: SSAIncomeData) => void;
  initialData?: SSAIncomeData | null;
}

export interface SSAIncomeData {
  fraMonthlyBenefit: number;
  claimingAge: number;
}

export const SSAIncomeForm: React.FC<SSAIncomeFormProps> = ({ onSave, initialData }) => {
  const [fraMonthlyBenefit, setFraMonthlyBenefit] = useState(initialData?.fraMonthlyBenefit?.toString() || '');
  const [claimingAge, setClaimingAge] = useState(initialData?.claimingAge?.toString() || '67');
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

    if (isNaN(benefit) || isNaN(age)) {
      setError('Please enter valid numbers');
      return;
    }

    if (age < 62 || age > 70) {
      setError('Claiming age must be between 62 and 70');
      return;
    }

    onSave({
      fraMonthlyBenefit: benefit,
      claimingAge: age,
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

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary">Save Social Security Plan</button>
    </form>
  );
};
