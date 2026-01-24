import React from 'react';

export interface AccountsListProps {
  accounts: Array<{ id: string; type: string; balance: number }>;
  onRemove: (accountId: string) => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({ accounts, onRemove }) => {
  if (accounts.length === 0) {
    return <div className="empty-state">No accounts added yet</div>;
  }

  return (
    <div className="accounts-list">
      <h3>Your Accounts</h3>
      <ul>
        {accounts.map((account) => (
          <li key={account.id} className="account-item">
            <div className="account-info">
              <span className="account-type">{account.type}</span>
              <span className="account-balance">${account.balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
            </div>
            <button
              type="button"
              onClick={() => onRemove(account.id)}
              className="btn-remove"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="accounts-total">
        <strong>Total Portfolio Value:</strong>
        <strong>${accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
      </div>
    </div>
  );
};
