import React, { useState } from 'react';

interface UserProfileFormProps {
  onSave: (data: UserProfileData) => void;
  initialData?: UserProfileData | null;
}

export interface UserProfileData {
  birthYear: number;
  filingStatus: 'single' | 'mfj' | 'hoh';
  retirementAge: number;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ onSave, initialData }) => {
  const [birthYear, setBirthYear] = useState(initialData?.birthYear?.toString() || '');
  const [filingStatus, setFilingStatus] = useState<'single' | 'mfj' | 'hoh'>(initialData?.filingStatus || 'single');
  const [retirementAge, setRetirementAge] = useState(initialData?.retirementAge?.toString() || '65');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!birthYear || !retirementAge) {
      setError('All fields are required');
      return;
    }

    const year = parseInt(birthYear);
    const age = parseInt(retirementAge);

    if (isNaN(year) || isNaN(age)) {
      setError('Please enter valid numbers');
      return;
    }

    if (year < 1900 || year > 2020) {
      setError('Please enter a valid birth year');
      return;
    }

    if (age < 50 || age > 100) {
      setError('Retirement age should be between 50 and 100');
      return;
    }

    onSave({
      birthYear: year,
      filingStatus,
      retirementAge: age,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <h3>Your Profile</h3>
      
      <div className="form-group">
        <label htmlFor="birthYear">Birth Year</label>
        <input
          id="birthYear"
          type="number"
          min="1900"
          max={new Date().getFullYear()}
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          placeholder="YYYY"
        />
      </div>

      <div className="form-group">
        <label htmlFor="filingStatus">Tax Filing Status</label>
        <select
          id="filingStatus"
          value={filingStatus}
          onChange={(e) => setFilingStatus(e.target.value as 'single' | 'mfj' | 'hoh')}
        >
          <option value="single">Single</option>
          <option value="mfj">Married Filing Jointly</option>
          <option value="hoh">Head of Household</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="retirementAge">Planned Retirement Age</label>
        <input
          id="retirementAge"
          type="number"
          min="50"
          max="100"
          value={retirementAge}
          onChange={(e) => setRetirementAge(e.target.value)}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary">Save Profile</button>
    </form>
  );
};
