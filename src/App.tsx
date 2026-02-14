import { useState, useEffect, type ReactElement } from 'react';
import './App.css';
import { UserProfileForm, type UserProfileData } from './components/UserProfileForm';
import { RothAccountForm } from './components/RothAccountForm';
import { TraditionalAccountForm } from './components/TraditionalAccountForm';
import { TaxableAccountForm } from './components/TaxableAccountForm';
import { RealEstateAccountForm } from './components/RealEstateAccountForm';
import { MortgageAccountForm } from './components/MortgageAccountForm';
import { SSAIncomeForm, type SSAIncomeData } from './components/SSAIncomeForm';
import { ScenarioRunner } from './components/ScenarioRunner';
import { STORAGE_KEYS } from './utils/storage';
import { createExportFile, type ExportData, type Account } from './utils/export';
import { validateUserProfile, validateAccount } from './utils/validation';
import { formatCurrency } from './utils/format';

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
  const [showMortgageForm, setShowMortgageForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  
  // Initialize collapsed state based on whether accounts exist
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    // Start collapsed if there are accounts in localStorage
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const savedAccounts = saved ? JSON.parse(saved) : [];
    if (savedAccounts.length > 0) {
      return {
        'profile': true,
        'retirement': true,
        'taxable': true,
        'ssa': true,
        'liabilities': true,
        'summary': false  // Keep summary expanded
      } as Record<string, boolean>;
    }
    return {} as Record<string, boolean>;
  });
  
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>(() => {
    // Start with all cards collapsed if there are accounts
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const savedAccounts = saved ? JSON.parse(saved) : [];
    if (savedAccounts.length > 0) {
      const collapsed: Record<string, boolean> = {};
      savedAccounts.forEach((acc: any) => {
        collapsed[acc.accountId] = true;
      });
      return collapsed;
    }
    return {};
  });
  
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
    
    if (editingAccount) {
      // Update existing account
      setAccounts(accounts.map(acc => 
        acc.accountId === editingAccount.accountId ? data : acc
      ));
      setEditingAccount(null);
    } else {
      // Add new account
      setAccounts([...accounts, data]);
    }
    
    // Close forms
    if (accountType === 'roth') setShowRothForm(false);
    if (accountType === 'traditional') setShowTraditionalForm(false);
    if (accountType === 'taxable') setShowTaxableForm(false);
    if (accountType === 'realEstate') setShowRealEstateForm(false);
    if (accountType === 'mortgage') setShowMortgageForm(false);
  };

  const handleAccountEdit = (account: Account): void => {
    setEditingAccount(account);
    // Show the appropriate form
    if (account.accountType === 'roth') setShowRothForm(true);
    if (account.accountType === 'traditional') setShowTraditionalForm(true);
    if (account.accountType === 'taxable') setShowTaxableForm(true);
    if (account.accountType === 'realEstate') setShowRealEstateForm(true);
    if (account.accountType === 'mortgage') setShowMortgageForm(true);
    
    // Expand the section if collapsed
    if (account.accountType === 'roth' || account.accountType === 'traditional') {
      setCollapsedSections(prev => ({ ...prev, retirement: false }));
    } else if (account.accountType === 'taxable') {
      setCollapsedSections(prev => ({ ...prev, taxable: false }));
    } else if (account.accountType === 'realEstate' || account.accountType === 'mortgage') {
      setCollapsedSections(prev => ({ ...prev, liabilities: false }));
    }
  };

  const handleAccountRemove = (accountId: string): void => {
    setAccounts(accounts.filter(acc => acc.accountId !== accountId));
  };

  const rothAccounts = accounts.filter(acc => acc.accountType === 'roth');
  const traditionalAccounts = accounts.filter(acc => acc.accountType === 'traditional');
  const taxableAccounts = accounts.filter(acc => acc.accountType === 'taxable');
  const realEstateAccounts = accounts.filter(acc => acc.accountType === 'realEstate');
  const mortgageAccounts = accounts.filter(acc => acc.accountType === 'mortgage');

  const toggleSection = (sectionId: string): void => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const toggleCard = (cardId: string): void => {
    setCollapsedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const collapseAll = (): void => {
    const allSections = ['profile', 'retirement', 'taxable', 'ssa', 'liabilities', 'summary'];
    const newCollapsedSections: Record<string, boolean> = {};
    allSections.forEach(section => {
      newCollapsedSections[section] = true;
    });
    setCollapsedSections(newCollapsedSections);

    const allCardIds = accounts.map(acc => acc.accountId);
    const newCollapsedCards: Record<string, boolean> = {};
    allCardIds.forEach(cardId => {
      newCollapsedCards[cardId] = true;
    });
    setCollapsedCards(newCollapsedCards);
  };

  const expandAll = (): void => {
    setCollapsedSections({});
    setCollapsedCards({});
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Retirement Savings Calculator</h1>
        <div className="header-actions">
          <button 
            onClick={() => {
              const hasAnyExpanded = Object.keys(collapsedSections).length === 0 || 
                Object.values(collapsedSections).some(val => !val);
              if (hasAnyExpanded) {
                collapseAll();
              } else {
                expandAll();
              }
            }} 
            className="btn btn-tertiary"
          >
            {Object.keys(collapsedSections).length === 0 || Object.values(collapsedSections).some(val => !val) ? '📉 Collapse All' : '📈 Expand All'}
          </button>
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
        <div className="section-header" onClick={() => toggleSection('profile')}>
          <h2>User Profile</h2>
          {collapsedSections['profile'] && userProfile && (
            <span className="section-summary">
              Born {userProfile.birthYear}, {userProfile.filingStatus}, Retirement at {userProfile.retirementAge}
            </span>
          )}
          <span className={`section-toggle ${collapsedSections['profile'] ? 'collapsed' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${collapsedSections['profile'] ? 'collapsed' : ''}`}>
          <UserProfileForm onSave={handleProfileSave} initialData={userProfile} />
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
        </div>
      </section>

      <section className="section">
        <div className="section-header" onClick={() => toggleSection('retirement')}>
          <h2>Retirement Accounts</h2>
          {collapsedSections['retirement'] && (
            <span className="section-summary">
              {rothAccounts.length} Roth: ${formatCurrency(rothAccounts.reduce((sum, acc) => sum + acc.balance, 0))} • {traditionalAccounts.length} Traditional: ${formatCurrency(traditionalAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
            </span>
          )}
          <span className={`section-toggle ${collapsedSections['retirement'] ? 'collapsed' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${collapsedSections['retirement'] ? 'collapsed' : ''}`}>
        <div className="accounts-group">
          <h3>Roth IRA / 401(k) ({rothAccounts.length})</h3>
          <div className="accounts-grid">
            {rothAccounts.map((acc) => {
              if (acc.accountType !== 'roth') return null;
              const { accountId, balance, nickname } = acc;
              const isCollapsed = collapsedCards[accountId];
              return (
                <div key={accountId} className={`account-card account-card-roth ${isCollapsed ? 'collapsed' : ''}`}>
                  <div className="account-card-header" onClick={() => toggleCard(accountId)}>
                    <div className="account-card-summary">
                      <div className="account-card-balance">${formatCurrency(balance)}</div>
                      {isCollapsed && <span className="account-card-type-label">{nickname}</span>}
                    </div>
                    <span className={`account-card-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  <div className={`account-card-details-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
                    <div className="account-card-content">
                      <div className="account-card-details">
                        {nickname && <div><strong>{nickname}</strong></div>}
                        <div>Roth Account</div>
                      </div>
                    </div>
                    <div className="account-card-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleAccountEdit(acc); }} className="btn-edit">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAccountRemove(accountId); }} className="btn-remove">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {showRothForm ? (
            <RothAccountForm 
              onSave={handleAccountSave} 
              initialData={editingAccount?.accountType === 'roth' ? editingAccount as any : undefined}
            />
          ) : (
            <button onClick={() => { setEditingAccount(null); setShowRothForm(true); }} className="btn btn-primary">+ Add Roth Account</button>
          )}
        </div>

        <div className="accounts-group">
          <h3>Traditional IRA / 401(k) ({traditionalAccounts.length})</h3>
          <div className="accounts-grid">
            {traditionalAccounts.map((acc) => {
              if (acc.accountType !== 'traditional') return null;
              const { accountId, balance, nickname } = acc;
              const isCollapsed = collapsedCards[accountId];
              return (
                <div key={accountId} className={`account-card account-card-traditional ${isCollapsed ? 'collapsed' : ''}`}>
                  <div className="account-card-header" onClick={() => toggleCard(accountId)}>
                    <div className="account-card-summary">
                      <div className="account-card-balance">${formatCurrency(balance)}</div>
                      {isCollapsed && <span className="account-card-type-label">{nickname}</span>}
                    </div>
                    <span className={`account-card-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  <div className={`account-card-details-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
                    <div className="account-card-content">
                      <div className="account-card-details">
                        {nickname && <div><strong>{nickname}</strong></div>}
                        <div>Traditional Account</div>
                      </div>
                    </div>
                    <div className="account-card-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleAccountEdit(acc); }} className="btn-edit">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAccountRemove(accountId); }} className="btn-remove">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {showTraditionalForm ? (
            <TraditionalAccountForm 
              onSave={handleAccountSave} 
              initialData={editingAccount?.accountType === 'traditional' ? editingAccount as any : undefined}
            />
          ) : (
            <button onClick={() => { setEditingAccount(null); setShowTraditionalForm(true); }} className="btn btn-secondary">+ Add Traditional Account</button>
          )}
        </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header" onClick={() => toggleSection('taxable')}>
          <h2>Taxable Accounts</h2>
          {collapsedSections['taxable'] && (
            <span className="section-summary">
              {taxableAccounts.length} Taxable: ${formatCurrency(taxableAccounts.reduce((sum, acc) => sum + acc.balance, 0))} • {realEstateAccounts.length} Real Estate: ${formatCurrency(realEstateAccounts.reduce((sum, acc) => acc.accountType === 'realEstate' ? sum + acc.currentValue : sum, 0))}
            </span>
          )}
          <span className={`section-toggle ${collapsedSections['taxable'] ? 'collapsed' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${collapsedSections['taxable'] ? 'collapsed' : ''}`}>
        <div className="accounts-group">
          <h3>Brokerage Accounts ({taxableAccounts.length})</h3>
          <div className="accounts-grid">
            {taxableAccounts.map((acc) => {
              if (acc.accountType !== 'taxable') return null;
              const { accountId, balance, costBasis, nickname, dividendYield } = acc;
              const isCollapsed = collapsedCards[accountId];
              const gains = balance - costBasis;
              return (
                <div key={accountId} className={`account-card account-card-taxable ${isCollapsed ? 'collapsed' : ''}`}>
                  <div className="account-card-header" onClick={() => toggleCard(accountId)}>
                    <div className="account-card-summary">
                      <div className="account-card-balance">${formatCurrency(balance)}</div>
                      {isCollapsed && (
                        <>
                          <span className="account-card-type-label">{nickname}</span>
                          {dividendYield > 0 && <span className="account-card-dividend">Div: {dividendYield}%</span>}
                        </>
                      )}
                    </div>
                    <span className={`account-card-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  <div className={`account-card-details-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
                    <div className="account-card-content">
                      <div className="account-card-details">
                        {nickname && <div><strong>{nickname}</strong></div>}
                        <div>Cost Basis: ${formatCurrency(costBasis)}</div>
                        <div>Gains: ${formatCurrency(gains)}</div>
                        {dividendYield > 0 && <div>Dividend Yield: {dividendYield}%</div>}
                      </div>
                    </div>
                    <div className="account-card-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleAccountEdit(acc); }} className="btn-edit">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleAccountRemove(accountId); }} className="btn-remove">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {showTaxableForm ? (
            <TaxableAccountForm 
              onSave={handleAccountSave} 
              initialData={editingAccount?.accountType === 'taxable' ? editingAccount as any : undefined}
            />
          ) : (
            <button onClick={() => { setEditingAccount(null); setShowTaxableForm(true); }} className="btn btn-tertiary">+ Add Taxable Account</button>
          )}
        </div>

        <div className="accounts-group">
          <h3>Real Estate ({realEstateAccounts.length})</h3>
          <div className="accounts-grid">
            {realEstateAccounts.map((acc) => {
              if (acc.accountType !== 'realEstate') return null;
              const { accountId, nickname, currentValue, yearlyValueIncrease } = acc;
              const isCollapsed = collapsedCards[accountId];
              return (
                <div key={accountId} className={`account-card account-card-realEstate ${isCollapsed ? 'collapsed' : ''}`}>
                  <div className="account-card-header" onClick={() => toggleCard(accountId)}>
                    <div className="account-card-summary">
                      <div className="account-card-balance">${formatCurrency(currentValue)}</div>
                      {isCollapsed && <span className="account-card-type-label">{nickname}</span>}
                    </div>
                    <span className={`account-card-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  <div className={`account-card-details-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
                    <div className="account-card-content">
                      <div className="account-card-details">
                        {nickname}
                        <br />
                        Growth: {yearlyValueIncrease}% /year
                      </div>
                    </div>
                    <div className="account-card-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleAccountRemove(accountId); }} className="btn-remove">Remove</button>
                    </div>
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
        </div>
      </section>

      <section className="section">
        <div className="section-header" onClick={() => toggleSection('ssa')}>
          <h2>Social Security</h2>
          {collapsedSections['ssa'] && ssaIncome && (
            <span className="section-summary">
              ${formatCurrency(ssaIncome.fraMonthlyBenefit)}/month at FRA, claiming at age {ssaIncome.claimingAge}
            </span>
          )}
          <span className={`section-toggle ${collapsedSections['ssa'] ? 'collapsed' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${collapsedSections['ssa'] ? 'collapsed' : ''}`}>
        <SSAIncomeForm onSave={handleSSAIncomeSave(setSsaIncome)} initialData={ssaIncome} />
        {ssaIncome && (() => {
          const { fraMonthlyBenefit, claimingAge } = ssaIncome;
          return (
            <div className="info-display ssa-display">
              <strong>Current Plan:</strong> ${formatCurrency(fraMonthlyBenefit)}/month at FRA, 
              claiming at age {claimingAge}
            </div>
          );
        })()}
        </div>
      </section>

      <section className="section">
        <div className="section-header" onClick={() => toggleSection('liabilities')}>
          <h2>Liabilities</h2>
          {collapsedSections['liabilities'] && (
            <span className="section-summary">
              {mortgageAccounts.length} Mortgage(s): ${formatCurrency(mortgageAccounts.reduce((sum, acc) => acc.accountType === 'mortgage' ? sum + acc.principalBalance : sum, 0))}
            </span>
          )}
          <span className={`section-toggle ${collapsedSections['liabilities'] ? 'collapsed' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${collapsedSections['liabilities'] ? 'collapsed' : ''}`}>
        <div className="accounts-group">
          <h3>Mortgages ({mortgageAccounts.length})</h3>
          <div className="accounts-grid">
            {mortgageAccounts.map((acc) => {
              if (acc.accountType !== 'mortgage') return null;
              const { accountId, propertyNickname, principalBalance, interestRate, monthlyPayment } = acc;
              const isCollapsed = collapsedCards[accountId];
              return (
                <div key={accountId} className={`account-card account-card-mortgage ${isCollapsed ? 'collapsed' : ''}`}>
                  <div className="account-card-header" onClick={() => toggleCard(accountId)}>
                    <div className="account-card-summary">
                      <div className="account-card-balance">${formatCurrency(principalBalance)}</div>
                      {isCollapsed && <span className="account-card-type-label">{propertyNickname}</span>}
                    </div>
                    <span className={`account-card-toggle ${isCollapsed ? 'collapsed' : ''}`}>▼</span>
                  </div>
                  <div className={`account-card-details-wrapper ${isCollapsed ? 'collapsed' : ''}`}>
                    <div className="account-card-content">
                      <div className="account-card-details">
                        {propertyNickname && <div><strong>{propertyNickname}</strong></div>}
                        <div>Rate: {interestRate}% APR</div>
                        <div>Payment: ${formatCurrency(monthlyPayment)}/month</div>
                      </div>
                    </div>
                    <div className="account-card-actions">
                      <button onClick={(e) => { e.stopPropagation(); handleAccountRemove(accountId); }} className="btn-remove">Remove</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {showMortgageForm ? (
            <MortgageAccountForm onSave={handleAccountSave} />
          ) : (
            <button onClick={() => setShowMortgageForm(true)} className="btn btn-liability">+ Add Mortgage</button>
          )}
        </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header" onClick={() => toggleSection('summary')}>
          <h2>Portfolio Summary</h2>
          {collapsedSections['summary'] && (() => {
            const totalAssets = accounts
              .filter(acc => acc.accountType !== 'mortgage')
              .reduce((sum, acc) => {
                if (acc.accountType === 'realEstate') {
                  return sum + acc.currentValue;
                }
                return sum + acc.balance;
              }, 0);
            const totalLiabilities = mortgageAccounts
              .reduce((sum, acc) => {
                if (acc.accountType === 'mortgage') {
                  return sum + acc.principalBalance;
                }
                return sum;
              }, 0);
            return (
              <span className="section-summary">
                Assets: ${formatCurrency(totalAssets)} • Liabilities: ${formatCurrency(totalLiabilities)} • Net Worth: ${formatCurrency(totalAssets - totalLiabilities)}
              </span>
            );
          })()}
          <span className={`section-toggle ${collapsedSections['summary'] ? 'collapsed' : ''}`}>▼</span>
        </div>
        <div className={`section-content ${collapsedSections['summary'] ? 'collapsed' : ''}`}>
        <div className="summary-container">
          <div className="summary-item">
            <strong>Total Retirement Accounts:</strong> ${formatCurrency([...rothAccounts, ...traditionalAccounts]
              .reduce((sum, acc) => sum + acc.balance, 0))}
          </div>
          <div className="summary-item">
            <strong>Total Taxable Accounts:</strong> ${formatCurrency(taxableAccounts
              .reduce((sum, acc) => sum + acc.balance, 0))}
          </div>
          <div className="summary-item">
            <strong>Total Real Estate:</strong> ${formatCurrency(realEstateAccounts
              .reduce((sum, acc) => {
                if (acc.accountType === 'realEstate') {
                  return sum + acc.currentValue;
                }
                return sum;
              }, 0))}
          </div>
          <div className="summary-item">
            <strong>Total Liabilities:</strong> ${formatCurrency(mortgageAccounts
              .reduce((sum, acc) => {
                if (acc.accountType === 'mortgage') {
                  return sum + acc.principalBalance;
                }
                return sum;
              }, 0))}
          </div>
          <div className="summary-total">
            <strong>Total Assets:</strong> ${formatCurrency(accounts
              .filter(acc => acc.accountType !== 'mortgage')
              .reduce((sum, acc) => {
                if (acc.accountType === 'realEstate') {
                  return sum + acc.currentValue;
                }
                return sum + acc.balance;
              }, 0))}
          </div>
          <div className="summary-total">
            <strong>Net Worth:</strong> ${(() => {
              const totalAssets = accounts
                .filter(acc => acc.accountType !== 'mortgage')
                .reduce((sum, acc) => {
                  if (acc.accountType === 'realEstate') {
                    return sum + acc.currentValue;
                  }
                  return sum + acc.balance;
                }, 0);
              const totalLiabilities = mortgageAccounts
                .reduce((sum, acc) => {
                  if (acc.accountType === 'mortgage') {
                    return sum + acc.principalBalance;
                  }
                  return sum;
                }, 0);
              return formatCurrency(totalAssets - totalLiabilities);
            })()}
          </div>
        </div>
        </div>
      </section>

      {/* Scenario Runner - only show if user profile is configured */}
      {userProfile && accounts.length > 0 && (
        <ScenarioRunner 
          userProfile={userProfile} 
          accounts={accounts}
          ssaIncome={ssaIncome}
        />
      )}
    </div>
  );
}

export default App;
