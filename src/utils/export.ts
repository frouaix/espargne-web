import type { UserProfileData } from '../components/UserProfileForm';
import type { RothAccountData } from '../components/RothAccountForm';
import type { TraditionalAccountData } from '../components/TraditionalAccountForm';
import type { TaxableAccountData } from '../components/TaxableAccountForm';
import type { SSAIncomeData } from '../components/SSAIncomeForm';

export type Account = RothAccountData | TraditionalAccountData | TaxableAccountData;

export interface ExportData {
  version: string,
  exportedAt: string,
  userProfile: UserProfileData | null,
  accounts: Account[],
  ssaIncome: SSAIncomeData | null,
}

export const createExportFile = (exportData: ExportData): void => {
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
