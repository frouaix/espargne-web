import React, { useState } from 'react';

interface TraditionalAccountFormProps {
  accountId?: string;
  onSave: (data: TraditionalAccountData) => void;
}

export interface TraditionalAccountData {
  accountId: string;
  accountType: 'traditional';
  balance: number;
}

export const TraditionalAccountForm: React.FC<TraditionalAccountFormProps> = ({ accountId, onSave }) => {
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!balance) {
      setError('Balance is required');
      return;
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) {
      setError('Please enter a valid number');
      return;
    }

    onSave({
      accountId: accountId || `traditional-${Date.now()}`,
      accountType: 'traditional',
      balance: balanceNum,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <h3>Traditional IRA / 401(k)</h3>
      
      <div className="form-group">
        <label htmlFor="balance">Account Balance ($)</label>
        <input
          id="balance"
          type="number"
          min="0"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="Enter account balance"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary">Save Traditional Account</button>
    </form>
  );
};
