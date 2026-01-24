import { useState, useEffect, type ReactElement } from 'react';
import './App.css';
import { UserProfileForm, type UserProfileData } from './components/UserProfileForm';
import { RothAccountForm } from './components/RothAccountForm';
import { TraditionalAccountForm } from './components/TraditionalAccountForm';
import { TaxableAccountForm } from './components/TaxableAccountForm';
import { RealEstateAccountForm } from './components/RealEstateAccountForm';
import { SSAIncomeForm, type SSAIncomeData } from './components/SSAIncomeForm';
import { STORAGE_KEYS } from './utils/storage';
import { createExportFile, type ExportData, type Account } from './utils/export';
import { validateUserProfile, validateAccount } from './utils/validation';

const CURRENT_VERSION = '1.0.0';

const handleSSAIncomeSave = (setSsaIncome: (data: SSAIncomeData) => void): ((data: SSAIncomeData) => void) => (data: SSAIncomeData): void => {
  setSsaIncome(data);
};

function App(): ReactElement {
  const { USER_PROFILE, ACCOUNTS, SSA_INCOME } = STORAGE_KEYS;
  
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(() => {
    const saved = localStorage.getItem(USER_PROFILE);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(ACCOUNTS);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [ssaIncome, setSsaIncome] = useState<SSAIncomeData | null>(() => {
    const saved = localStorage.getItem(SSA_INCOME);
    return saved ? JSON.parse(saved) : null;
  });

  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<string>('');
  const [showRothForm, setShowRothForm] = useState(false);
  const [showTraditionalForm, setShowTraditionalForm] = useState(false);
  const [showTaxableForm, setShowTaxableForm] = useState(false);
  const [showRealEstateForm, setShowRealEstateForm] = useState(false);
  
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem(USER_PROFILE, JSON.stringify(userProfile));
    } else {
      localStorage.removeItem(USER_PROFILE);
    }
  }, [userProfile, USER_PROFILE]);
  
  useEffect(() => {
    if (ssaIncome) {
      localStorage.setItem(SSA_INCOME, JSON.stringify(ssaIncome));
    } else {
      localStorage.removeItem(SSA_INCOME);
    }
  }, [ssaIncome, SSA_INCOME]);
  
  useEffect(() => {
    localStorage.setItem(ACCOUNTS, JSON.stringify(accounts));
  }, [accounts, ACCOUNTS]);

  const handleExport = (): void => {
    const exportData: ExportData = {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      userProfile,
      accounts,
      ssaIncome,
    };

    createExportFile(exportData);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = (e): void => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as ExportData;

        if (!importedData.version) {
          throw new Error('Invalid file format: missing version');
        }

        const [majorVersion] = importedData.version.split('.');
        const [currentMajor] = CURRENT_VERSION.split('.');
        
        if (majorVersion !== currentMajor) {
          setImportError(`Version mismatch: file is ${importedData.version}, current is ${CURRENT_VERSION}`);
          return;
        }

        const { userProfile: importedProfile, accounts: importedAccounts, ssaIncome: importedSsaIncome } = importedData;
        
        if (importedProfile) {
          if (!validateUserProfile(importedProfile)) {
            throw new Error('Invalid user profile data');
          }
          setUserProfile(importedProfile);
        }

        if (Array.isArray(importedAccounts)) {
          const validAccounts = importedAccounts.filter(validateAccount);
          setAccounts(validAccounts);
        }
        
        if (importedSsaIncome) {
          setSsaIncome(importedSsaIncome);
        }

        
        setImportSuccess(`Successfully imported data from ${importedData.exportedAt ? new Date(importedData.exportedAt).toLocaleDateString() : 'backup'}`);
      } catch (error) {
        setImportError(`Failed to import file: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
      }
    };

    reader.onerror = (): void => {
      setImportError('Failed to read file');
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearAll = (): void => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone. Consider exporting your data first.')) {
      setUserProfile(null);
      setAccounts([]);
      setSsaIncome(null);
      localStorage.removeItem(USER_PROFILE);
      localStorage.removeItem(ACCOUNTS);
      localStorage.removeItem(SSA_INCOME);
    }
  };

  const handleProfileSave = (data: UserProfileData): void => {
    setUserProfile(data);
  };

  const handleAccountSave = (data: Account): void => {
    const { accountType } = data;
    setAccounts([...accounts, data]);
    if (accountType === 'roth') setShowRothForm(false);
    if (accountType === 'traditional') setShowTraditionalForm(false);
    if (accountType === 'taxable') setShowTaxableForm(false);
    if (accountType === 'realEstate') setShowRealEstateForm(false);
  };

  const handleAccountRemove = (accountId: string): void => {
    setAccounts(accounts.filter(acc => acc.accountId !== accountId));
  };

  const rothAccounts = accounts.filter(acc => acc.accountType === 'roth');
  const traditionalAccounts = accounts.filter(acc => acc.accountType === 'traditional');
  const taxableAccounts = accounts.filter(acc => acc.accountType === 'taxable');
  const realEstateAccounts = accounts.filter(acc => acc.accountType === 'realEstate');

  return (
    <div className="app-container">
      <div className="header">
        <h1>Retirement Savings Calculator</h1>
        <div className="header-actions">
          <button onClick={handleExport} className="btn btn-export">
            📥 Export Data
          </button>
          <label className="btn btn-import">
            📤 Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="file-input"
            />
          </label>
          <button onClick={handleClearAll} className="btn btn-clear">
            🗑️ Clear All
          </button>
        </div>
      </div>

      {importError && (
        <div className="alert alert-error">
          {importError}
        </div>
      )}

      {importSuccess && (
        <div className="alert alert-success">
          {importSuccess}
        </div>
      )}
      
      <section className="section">
        <h2>User Profile</h2>
        <UserProfileForm onSave={handleProfileSave} />
        {userProfile && (() => {
          const { birthYear, filingStatus, retirementAge } = userProfile;
          return (
            <div className="info-display profile-display">
              <strong>Current Profile:</strong> Born {birthYear}, 
              Filing Status: {filingStatus}, 
              Retirement Age: {retirementAge}
            </div>
          );
        })()}
      </section>

      <section className="section">
        <h2>Retirement Accounts</h2>
        
        <div className="accounts-group">
          <h3>Roth IRA / 401(k) ({rothAccounts.length})</h3>
          <div className="accounts-grid">
            {rothAccounts.map(({ accountId, balance }) => (
              <div key={accountId} className="account-card account-card-roth">
                <div className="account-card-content">
                  <div className="account-card-balance">${balance.toLocaleString()}</div>
                  <div className="account-card-details">Roth Account</div>
                </div>
                <div className="account-card-actions">
                  <button onClick={() => handleAccountRemove(accountId)} className="btn-remove">Remove</button>
                </div>
              </div>
            ))}
          </div>
          {showRothForm ? (
            <RothAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowRothForm(true)} className="btn btn-primary">+ Add Roth Account</button>
          )}
        </div>

        <div className="accounts-group">
          <h3>Traditional IRA / 401(k) ({traditionalAccounts.length})</h3>
          <div className="accounts-grid">
            {traditionalAccounts.map(({ accountId, balance }) => (
              <div key={accountId} className="account-card account-card-traditional">
                <div className="account-card-content">
                  <div className="account-card-balance">${balance.toLocaleString()}</div>
                  <div className="account-card-details">Traditional Account</div>
                </div>
                <div className="account-card-actions">
                  <button onClick={() => handleAccountRemove(accountId)} className="btn-remove">Remove</button>
                </div>
              </div>
            ))}
          </div>
          {showTraditionalForm ? (
            <TraditionalAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowTraditionalForm(true)} className="btn btn-secondary">+ Add Traditional Account</button>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Taxable Accounts</h2>
        <div className="accounts-group">
          <h3>Brokerage Accounts ({taxableAccounts.length})</h3>
          <div className="accounts-grid">
            {taxableAccounts.map(({ accountId, balance, costBasis }) => (
              <div key={accountId} className="account-card account-card-taxable">
                <div className="account-card-content">
                  <div className="account-card-balance">${balance.toLocaleString()}</div>
                  <div className="account-card-details">
                    Cost Basis: ${costBasis.toLocaleString()}
                    <br />
                    Gains: ${(balance - costBasis).toLocaleString()}
                  </div>
                </div>
                <div className="account-card-actions">
                  <button onClick={() => handleAccountRemove(accountId)} className="btn-remove">Remove</button>
                </div>
              </div>
            ))}
          </div>
          {showTaxableForm ? (
            <TaxableAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowTaxableForm(true)} className="btn btn-tertiary">+ Add Taxable Account</button>
          )}
        </div>

        <div className="accounts-group">
          <h3>Real Estate ({realEstateAccounts.length})</h3>
          <div className="accounts-grid">
            {realEstateAccounts.map((acc) => {
              if (acc.accountType !== 'realEstate') return null;
              const { accountId, nickname, currentValue, yearlyValueIncrease } = acc;
              return (
                <div key={accountId} className="account-card account-card-realEstate">
                  <div className="account-card-content">
                    <div className="account-card-balance">${currentValue.toLocaleString()}</div>
                    <div className="account-card-details">
                      {nickname}
                      <br />
                      Growth: {yearlyValueIncrease}% /year
                    </div>
                  </div>
                  <div className="account-card-actions">
                    <button onClick={() => handleAccountRemove(accountId)} className="btn-remove">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          {showRealEstateForm ? (
            <RealEstateAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowRealEstateForm(true)} className="btn btn-quaternary">+ Add Real Estate</button>
          )}
        </div>
      </section>

      <section className="section">
        <h2>Social Security</h2>
        <SSAIncomeForm onSave={handleSSAIncomeSave(setSsaIncome)} />
        {ssaIncome && (() => {
          const { fraMonthlyBenefit, claimingAge } = ssaIncome;
          return (
            <div className="info-display ssa-display">
              <strong>Current Plan:</strong> ${fraMonthlyBenefit.toLocaleString()}/month at FRA, 
              claiming at age {claimingAge}
            </div>
          );
        })()}
      </section>

      <section>
        <h2>Portfolio Summary</h2>
        <div className="summary-container">
          <div className="summary-item">
            <strong>Total Retirement Accounts:</strong> ${[...rothAccounts, ...traditionalAccounts]
              .reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
          </div>
          <div className="summary-item">
            <strong>Total Taxable Accounts:</strong> ${taxableAccounts
              .reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
          </div>
          <div className="summary-item">
            <strong>Total Real Estate:</strong> ${realEstateAccounts
              .reduce((sum, acc) => {
                if (acc.accountType === 'realEstate') {
                  return sum + acc.currentValue;
                }
                return sum;
              }, 0).toLocaleString()}
          </div>
          <div className="summary-total">
            <strong>Total Portfolio:</strong> ${accounts
              .reduce((sum, acc) => {
                if (acc.accountType === 'realEstate') {
                  return sum + acc.currentValue;
                }
                return sum + acc.balance;
              }, 0).toLocaleString()}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
