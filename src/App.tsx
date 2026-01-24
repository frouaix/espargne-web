import { useState, useEffect } from 'react';
import './App.css';
import { UserProfileForm, type UserProfileData } from './components/UserProfileForm';
import { RothAccountForm, type RothAccountData } from './components/RothAccountForm';
import { TraditionalAccountForm, type TraditionalAccountData } from './components/TraditionalAccountForm';
import { TaxableAccountForm, type TaxableAccountData } from './components/TaxableAccountForm';
import { SSAIncomeForm, type SSAIncomeData } from './components/SSAIncomeForm';
import { AccountsList } from './components/AccountsList';

type Account = RothAccountData | TraditionalAccountData | TaxableAccountData;

const STORAGE_KEYS = {
  USER_PROFILE: 'retirement-calc-user-profile',
  ACCOUNTS: 'retirement-calc-accounts',
  SSA_INCOME: 'retirement-calc-ssa-income',
};

const CURRENT_VERSION = '1.0.0';

interface ExportData {
  version: string,
  exportedAt: string,
  userProfile: UserProfileData | null,
  accounts: Account[],
  ssaIncome: SSAIncomeData | null,
}

const createExportFile = (exportData: ExportData): void => {
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `retirement-calc-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const validateUserProfile = (profile: UserProfileData): boolean => {
  return Boolean(profile.birthYear && profile.filingStatus && profile.retirementAge);
};

const validateAccount = (acc: Account): boolean => {
  return Boolean(acc.accountId && acc.accountType && typeof acc.balance === 'number');
};

const handleSSAIncomeSave = (setSsaIncome: (data: SSAIncomeData) => void) => (data: SSAIncomeData) => {
  setSsaIncome(data);
  console.log('SSA Income Saved:', data);
};

function App() {
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

  const handleExport = () => {
    const exportData: ExportData = {
      version: CURRENT_VERSION,
      exportedAt: new Date().toISOString(),
      userProfile,
      accounts,
      ssaIncome,
    };

    createExportFile(exportData);
    console.log('Data exported successfully');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportSuccess('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as ExportData;

        if (!importedData.version) {
          throw new Error('Invalid file format: missing version');
        }

        const [majorVersion] = importedData.version.split('.');
        const [currentMajor] = CURRENT_VERSION.split('.');
        
        if (majorVersion !== currentMajor) {
          console.warn(`Version mismatch: file is ${importedData.version}, current is ${CURRENT_VERSION}`)
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
        console.log('Data imported successfully', importedData);
      } catch (error) {
        setImportError(`Failed to import file: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
        console.error('Import error:', error);
      }
    };

    reader.onerror = () => {
      setImportError('Failed to read file');
    };

    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone. Consider exporting your data first.')) {
      setUserProfile(null);
      setAccounts([]);
      setSsaIncome(null);
      localStorage.removeItem(USER_PROFILE);
      localStorage.removeItem(ACCOUNTS);
      localStorage.removeItem(SSA_INCOME);
      console.log('All data cleared');
    }
  };

  const handleProfileSave = (data: UserProfileData) => {
    setUserProfile(data);
    console.log('User Profile Saved:', data);
  };

  const handleAccountSave = (data: Account) => {
    const { accountType } = data;
    setAccounts([...accounts, data]);
    console.log('Account Saved:', data);
    if (accountType === 'roth') setShowRothForm(false);
    if (accountType === 'traditional') setShowTraditionalForm(false);
    if (accountType === 'taxable') setShowTaxableForm(false);
  };

  const handleAccountRemove = (accountId: string) => {
    setAccounts(accounts.filter(acc => acc.accountId !== accountId));
    console.log('Account Removed:', accountId);
  };

  const rothAccounts = accounts.filter(acc => acc.accountType === 'roth');
  const traditionalAccounts = accounts.filter(acc => acc.accountType === 'traditional');
  const taxableAccounts = accounts.filter(acc => acc.accountType === 'taxable');

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Retirement Savings Calculator</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExport} style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            📥 Export Data
          </button>
          <label style={{
            padding: '8px 16px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            📤 Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleClearAll} style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            🗑️ Clear All
          </button>
        </div>
      </div>

      {importError && (
        <div style={{ 
          padding: '10px', 
          background: '#ffebee', 
          color: '#c62828', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #ef5350'
        }}>
          {importError}
        </div>
      )}

      {importSuccess && (
        <div style={{ 
          padding: '10px', 
          background: '#e8f5e9', 
          color: '#2e7d32', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #66bb6a'
        }}>
          {importSuccess}
        </div>
      )}
      
      <section style={{ marginBottom: '30px' }}>
        <h2>User Profile</h2>
        <UserProfileForm onSave={handleProfileSave} />
        {userProfile && (() => {
          const { birthYear, filingStatus, retirementAge } = userProfile;
          return (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
              <strong>Current Profile:</strong> Born {birthYear}, 
              Filing Status: {filingStatus}, 
              Retirement Age: {retirementAge}
            </div>
          );
        })()}
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Retirement Accounts</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>Roth IRA / 401(k) ({rothAccounts.length})</h3>
          {rothAccounts.map(({ accountId, balance }) => (
            <div key={accountId} style={{ 
              padding: '10px', 
              background: '#e8f5e9', 
              marginBottom: '8px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Balance: ${balance.toLocaleString()}</span>
              <button onClick={() => handleAccountRemove(accountId)} style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>Remove</button>
            </div>
          ))}
          {showRothForm ? (
            <RothAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowRothForm(true)} style={{
              padding: '8px 16px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>+ Add Roth Account</button>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Traditional IRA / 401(k) ({traditionalAccounts.length})</h3>
          {traditionalAccounts.map(({ accountId, balance }) => (
            <div key={accountId} style={{ 
              padding: '10px', 
              background: '#fff3e0', 
              marginBottom: '8px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Balance: ${balance.toLocaleString()}</span>
              <button onClick={() => handleAccountRemove(accountId)} style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>Remove</button>
            </div>
          ))}
          {showTraditionalForm ? (
            <TraditionalAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowTraditionalForm(true)} style={{
              padding: '8px 16px',
              background: '#FF9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>+ Add Traditional Account</button>
          )}
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Taxable Accounts</h2>
        <div style={{ marginBottom: '20px' }}>
          <h3>Brokerage Accounts ({taxableAccounts.length})</h3>
          {taxableAccounts.map(({ accountId, balance, costBasis }) => (
            <div key={accountId} style={{ 
              padding: '10px', 
              background: '#e3f2fd', 
              marginBottom: '8px',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span>Balance: ${balance.toLocaleString()}</span>
                {' | '}
                <span>Cost Basis: ${costBasis.toLocaleString()}</span>
                {' | '}
                <span>Gains: ${(balance - costBasis).toLocaleString()}</span>
              </div>
              <button onClick={() => handleAccountRemove(accountId)} style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>Remove</button>
            </div>
          ))}
          {showTaxableForm ? (
            <TaxableAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowTaxableForm(true)} style={{
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>+ Add Taxable Account</button>
          )}
        </div>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2>Social Security</h2>
        <SSAIncomeForm onSave={handleSSAIncomeSave(setSsaIncome)} />
        {ssaIncome && (() => {
          const { fraMonthlyBenefit, claimingAge } = ssaIncome;
          return (
            <div style={{ marginTop: '10px', padding: '10px', background: '#e8f5e9', borderRadius: '4px' }}>
              <strong>Current Plan:</strong> ${fraMonthlyBenefit.toLocaleString()}/month at FRA, 
              claiming at age {claimingAge}
            </div>
          );
        })()}
      </section>

      <section>
        <h2>Portfolio Summary</h2>
        <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Total Retirement Accounts:</strong> ${[...rothAccounts, ...traditionalAccounts]
              .reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Total Taxable Accounts:</strong> ${taxableAccounts
              .reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '1.2em', marginTop: '15px', paddingTop: '15px', borderTop: '2px solid #ccc' }}>
            <strong>Total Portfolio:</strong> ${accounts
              .reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
