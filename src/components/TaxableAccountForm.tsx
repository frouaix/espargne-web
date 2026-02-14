// Copyright (c) 2026 François Rouaix
import React, { useState } from 'react';
import { generateAccountId } from '../utils/ids';

interface TaxableAccountFormProps {
  accountId?: string;
  initialData?: TaxableAccountData;
  onSave: (data: TaxableAccountData) => void;
}

export interface TaxableAccountData {
  accountId: string;
  accountType: 'taxable';
  nickname: string;
  balance: number;
  costBasis: number;
  dividendYield: number;
}

export const TaxableAccountForm: React.FC<TaxableAccountFormProps> = ({ accountId, initialData, onSave }) => {
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [balance, setBalance] = useState(initialData?.balance?.toString() || '');
  const [costBasis, setCostBasis] = useState(initialData?.costBasis?.toString() || '');
  const [dividendYield, setDividendYield] = useState(initialData?.dividendYield?.toString() || '');
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
    const yieldNum = dividendYield ? parseFloat(dividendYield) : 0;

    if (isNaN(balanceNum) || isNaN(basisNum) || (dividendYield && isNaN(yieldNum))) {
      setError('Please enter valid numbers');
      return;
    }

    if (basisNum > balanceNum) {
      setError('Cost basis cannot exceed account balance');
      return;
    }

    if (yieldNum < 0 || yieldNum > 10) {
      setError('Dividend yield must be between 0% and 10%');
      return;
    }

    onSave({
      accountId: accountId || initialData?.accountId || generateAccountId('taxable'),
      accountType: 'taxable',
      nickname: nickname.trim(),
      balance: balanceNum,
      costBasis: basisNum,
      dividendYield: yieldNum,
    });
    
    // Only clear form if not editing (creating new account)
    if (!initialData) {
      setNickname('');
      setBalance('');
      setCostBasis('');
      setDividendYield('');
    }
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

      <div className="form-group">
        <label htmlFor="dividendYield">Dividend Yield (%)</label>
        <input
          id="dividendYield"
          type="number"
          min="0"
          max="10"
          step="0.01"
          value={dividendYield}
          onChange={(e) => setDividendYield(e.target.value)}
          placeholder="e.g., 2.5 for 2.5%"
        />
        <small className="form-help">Optional. Annual dividend yield as a percentage.</small>
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary">Save Taxable Account</button>
    </form>
  );
};
