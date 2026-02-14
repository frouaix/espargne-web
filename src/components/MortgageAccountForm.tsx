// Copyright (c) 2026 François Rouaix
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
    <form onSubmit={handleSubmit} className="account-form">
      <h3>Mortgage</h3>
      
      <div className="form-group">
        <label htmlFor="propertyNickname">Property Nickname</label>
        <input
          id="propertyNickname"
          type="text"
          value={propertyNickname}
          onChange={(e): void => setPropertyNickname(e.target.value)}
          placeholder="e.g., Main Street Rental"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="principalBalance">Principal Balance ($)</label>
        <input
          id="principalBalance"
          type="number"
          value={principalBalance}
          onChange={(e): void => setPrincipalBalance(e.target.value)}
          placeholder="e.g., 350000"
          min="0"
          step="1000"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="interestRate">Interest Rate (%)</label>
        <input
          id="interestRate"
          type="number"
          value={interestRate}
          onChange={(e): void => setInterestRate(e.target.value)}
          placeholder="e.g., 3.5 or 1.875"
          min="0"
          step="0.001"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="monthlyPayment">Monthly Payment ($)</label>
        <input
          id="monthlyPayment"
          type="number"
          value={monthlyPayment}
          onChange={(e): void => setMonthlyPayment(e.target.value)}
          placeholder="e.g., 1500"
          min="0"
          step="0.01"
          required
        />
      </div>

      <button type="submit" className="btn-liability">
        Save Mortgage
      </button>
    </form>
  );
};
