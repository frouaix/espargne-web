import type { UserProfileData } from '../components/UserProfileForm';
import type { Account } from './export';

export const validateUserProfile = (profile: UserProfileData): boolean => {
  return Boolean(profile.birthYear && profile.filingStatus && profile.retirementAge);
};

export const validateAccount = (acc: Account): boolean => {
  return Boolean(acc.accountId && acc.accountType && typeof acc.balance === 'number');
};
