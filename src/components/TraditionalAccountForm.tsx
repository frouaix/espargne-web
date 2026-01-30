import React, { useState } from 'react';
import { generateAccountId } from '../utils/ids';

interface TraditionalAccountFormProps {
  accountId?: string;
  initialData?: TraditionalAccountData;
  onSave: (data: TraditionalAccountData) => void;
}

export interface TraditionalAccountData {
  accountId: string;
  accountType: 'traditional';
  nickname: string;
  balance: number;
}

export const TraditionalAccountForm: React.FC<TraditionalAccountFormProps> = ({ accountId, initialData, onSave }) => {
  const [nickname, setNickname] = useState(initialData?.nickname || '');
  const [balance, setBalance] = useState(initialData?.balance?.toString() || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim() || !balance) {
      setError('All fields are required');
      return;
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum)) {
      setError('Please enter a valid number');
      return;
    }

    onSave({
      accountId: accountId || initialData?.accountId || generateAccountId('traditional'),
      accountType: 'traditional',
      nickname: nickname.trim(),
      balance: balanceNum,
    });
    
    // Only clear form if not editing
    if (!initialData) {
      setNickname('');
      setBalance('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <h3>Traditional IRA / 401(k)</h3>
      
      <div className="form-group">
        <label htmlFor="nickname">Account Nickname</label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="e.g., Vanguard 401(k)"
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

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary">Save Traditional Account</button>
    </form>
  );
};
