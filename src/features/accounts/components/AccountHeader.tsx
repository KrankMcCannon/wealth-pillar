/**
 * AccountHeader Component
 * Displays the header with back button, title, account count, and add button
 */

'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { accountStyles } from '../theme/account-styles';

interface AccountHeaderProps {
  totalAccounts: number;
  onAddAccount?: () => void;
}

export const AccountHeader = ({ totalAccounts, onAddAccount }: AccountHeaderProps) => {
  const router = useRouter();

  return (
    <header className={accountStyles.header.container}>
      <div className={accountStyles.header.inner}>
        <div className={accountStyles.header.leftSection}>
          <button
            onClick={() => router.back()}
            className={accountStyles.header.backButton}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={accountStyles.header.title}>Bank Accounts</h1>
            <p className={accountStyles.header.subtitle}>
              {totalAccounts} account{totalAccounts !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className={accountStyles.header.rightSection}>
          <button
            className={accountStyles.header.addButton}
            onClick={onAddAccount}
            aria-label="Add new account"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AccountHeader;
