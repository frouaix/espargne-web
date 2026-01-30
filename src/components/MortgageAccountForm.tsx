import { useState, type ReactElement } from 'react';
import { generateAccountId } from '../utils/ids';

export interface MortgageAccountData {
  accountId: string,
  accountType: 'mortgage',
  propertyNickname: string,
  principalBalance: number,
  interestRate: number,
  monthlyPayment: number,
}

interface MortgageAccountFormProps {
  onSave: (data: MortgageAccountData) => void,
}

export const MortgageAccountForm = ({ onSave }: MortgageAccountFormProps): ReactElement => {
  const [propertyNickname, setPropertyNickname] = useState('');
  const [principalBalance, setPrincipalBalance] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    const balance = parseFloat(principalBalance);
    const rate = parseFloat(interestRate);
    const payment = parseFloat(monthlyPayment);
    
    if (!propertyNickname.trim() || isNaN(balance) || balance < 0 || isNaN(rate) || rate < 0 || isNaN(payment) || payment < 0) {
      return;
    }

    const accountData: MortgageAccountData = {
      accountId: generateAccountId('mortgage'),
      accountType: 'mortgage',
      propertyNickname: propertyNickname.trim(),
      principalBalance: balance,
      interestRate: rate,
      monthlyPayment: payment,
    };

    onSave(accountData);
    setPropertyNickname('');
    setPrincipalBalance('');
    setInterestRate('');
    setMonthlyPayment('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '10px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Property Nickname:
          <input
            type="text"
            value={propertyNickname}
            onChange={(e): void => setPropertyNickname(e.target.value)}
            placeholder="e.g., Main Street Rental"
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Principal Balance ($):
          <input
            type="number"
            value={principalBalance}
            onChange={(e): void => setPrincipalBalance(e.target.value)}
            placeholder="e.g., 350000"
            min="0"
            step="1000"
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Interest Rate (%):
          <input
            type="number"
            value={interestRate}
            onChange={(e): void => setInterestRate(e.target.value)}
            placeholder="e.g., 3.5 or 1.875"
            min="0"
            step="0.001"
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Monthly Payment ($):
          <input
            type="number"
            value={monthlyPayment}
            onChange={(e): void => setMonthlyPayment(e.target.value)}
            placeholder="e.g., 1500"
            min="0"
            step="0.01"
            required
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
      </div>
      <button type="submit" style={{ padding: '8px 16px', background: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Save Mortgage
      </button>
    </form>
  );
};
