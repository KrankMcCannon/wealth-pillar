/**
 * AccountHeader Component
 * Displays the header with back button, title, account count, and add button
 * Shows skeleton while loading
 */

'use client';

import { ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { accountStyles } from '../theme/account-styles';

/**
 * Skeleton for account header
 */
function AccountHeaderSkeleton() {
  return (
    <header className={accountStyles.header.container}>
      <div className={accountStyles.header.inner}>
        <div className={accountStyles.header.leftSection}>
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>

        <div className={accountStyles.header.rightSection}>
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </header>
  );
}

interface AccountHeaderProps {
  totalAccounts: number;
  onAddAccount?: () => void;
  isLoading?: boolean;
}

export const AccountHeader = ({
  totalAccounts,
  onAddAccount,
  isLoading = false,
}: AccountHeaderProps) => {
  const router = useRouter();

  if (isLoading) {
    return <AccountHeaderSkeleton />;
  }

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
              {totalAccounts} account{totalAccounts === 1 ? '' : 's'}
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
