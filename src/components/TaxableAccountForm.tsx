import React, { useState } from 'react';

interface TaxableAccountFormProps {
  accountId?: string;
  onSave: (data: TaxableAccountData) => void;
}

export interface TaxableAccountData {
  accountId: string;
  accountType: 'taxable';
  nickname: string;
  balance: number;
  costBasis: number;
}

export const TaxableAccountForm: React.FC<TaxableAccountFormProps> = ({ accountId, onSave }) => {
  const [nickname, setNickname] = useState('');
  const [balance, setBalance] = useState('');
  const [costBasis, setCostBasis] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || !balance || !costBasis) {
      setError('All fields are required');
      return;
    }

    const balanceNum = parseFloat(balance);
    const basisNum = parseFloat(costBasis);

    if (isNaN(balanceNum) || isNaN(basisNum)) {
      setError('Please enter valid numbers');
      return;
    }

    if (basisNum > balanceNum) {
      setError('Cost basis cannot exceed account balance');
      return;
    }

    onSave({
      accountId: accountId || `taxable-${Date.now()}`,
      accountType: 'taxable',
      nickname: nickname.trim(),
      balance: balanceNum,
      costBasis: basisNum,
    });
    
    setNickname('');
    setBalance('');
    setCostBasis('');
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <h3>Taxable Brokerage Account</h3>
      
      <div className="form-group">
        <label htmlFor="nickname">Account Nickname</label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g., E*TRADE Brokerage"
          required
        />
      </div>
      
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

      <div className="form-group">
        <label htmlFor="costBasis">Cost Basis ($)</label>
        <input
          id="costBasis"
          type="number"
          min="0"
          step="0.01"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          placeholder="Enter total cost basis"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary">Save Taxable Account</button>
    </form>
  );
};
