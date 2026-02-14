// Copyright (c) 2026 François Rouaix
import { useState, type ReactElement } from 'react';
import { generateAccountId } from '../utils/ids';

export interface RealEstateAccountData {
  accountId: string,
  accountType: 'realEstate',
  nickname: string,
  currentValue: number,
  yearlyValueIncrease: number,
}

interface RealEstateAccountFormProps {
  onSave: (data: RealEstateAccountData) => void,
}

export const RealEstateAccountForm = ({ onSave }: RealEstateAccountFormProps): ReactElement => {
  const [nickname, setNickname] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [yearlyValueIncrease, setYearlyValueIncrease] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    const value = parseFloat(currentValue);
    const increase = parseFloat(yearlyValueIncrease);
    
    if (!nickname.trim() || isNaN(value) || value < 0 || isNaN(increase)) {
      return;
    }

    const accountData: RealEstateAccountData = {
      accountId: generateAccountId('real-estate'),
      accountType: 'realEstate',
      nickname: nickname.trim(),
      currentValue: value,
      yearlyValueIncrease: increase,
    };

    onSave(accountData);
    setNickname('');
    setCurrentValue('');
    setYearlyValueIncrease('');
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <h3>Real Estate</h3>
      
      <div className="form-group">
        <label htmlFor="nickname">Property Nickname</label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e): void => setNickname(e.target.value)}
          placeholder="e.g., Main Street Rental"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="currentValue">Current Value ($)</label>
        <input
          id="currentValue"
          type="number"
          value={currentValue}
          onChange={(e): void => setCurrentValue(e.target.value)}
          placeholder="e.g., 500000"
          min="0"
          step="1000"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="yearlyValueIncrease">Expected Yearly Value Increase (%)</label>
        <input
          id="yearlyValueIncrease"
          type="number"
          value={yearlyValueIncrease}
          onChange={(e): void => setYearlyValueIncrease(e.target.value)}
          placeholder="e.g., 3.5"
          step="0.1"
          required
        />
      </div>

      <button type="submit" className="btn-quaternary">
        Save Real Estate
      </button>
    </form>
  );
};
