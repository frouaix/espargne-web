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
    <form onSubmit={handleSubmit} style={{ marginBottom: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Property Nickname:
          <input
            type="text"
            value={nickname}
            onChange={(e): void => setNickname(e.target.value)}
            placeholder="e.g., Main Street Rental"
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Current Value ($):
          <input
            type="number"
            value={currentValue}
            onChange={(e): void => setCurrentValue(e.target.value)}
            placeholder="e.g., 500000"
            min="0"
            step="1000"
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Expected Yearly Value Increase (%):
          <input
            type="number"
            value={yearlyValueIncrease}
            onChange={(e): void => setYearlyValueIncrease(e.target.value)}
            placeholder="e.g., 3.5"
            step="0.1"
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <button type="submit" style={{ padding: '8px 16px', background: '#9C27B0', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Save Real Estate
      </button>
    </form>
  );
};
