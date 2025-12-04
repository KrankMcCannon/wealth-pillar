/**
 * AccountHeader Component
 * Displays the header with back button, title, account count, and add button
 * Shows skeleton while loading
 */

'use client';

import { Plus } from 'lucide-react';
import { accountStyles } from '../theme/account-styles';
import { PageHeaderWithBack } from '@/components/layout';

/**
 * Skeleton for account header
 */
function AccountHeaderSkeleton() {
  return (
    <header className={accountStyles.header.container}>
      <div className={accountStyles.header.inner}>
        <div className={accountStyles.header.leftSection}>
          <div className="w-10 h-10 bg-primary/10 rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-primary/15 rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-primary/15 rounded animate-pulse" />
          </div>
        </div>

        <div className={accountStyles.header.rightSection}>
          <div className="w-10 h-10 bg-primary/10 rounded-lg animate-pulse" />
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
  if (isLoading) {
    return <AccountHeaderSkeleton />;
  }

  return (
    <PageHeaderWithBack
      title="Bank Accounts"
      subtitle={`${totalAccounts} account${totalAccounts === 1 ? '' : 's'}`}
      className={accountStyles.header.container}
      contentClassName={accountStyles.header.inner}
      titleWrapperClassName="items-start text-left"
      titleClassName={accountStyles.header.title}
      subtitleClassName={accountStyles.header.subtitle}
      backButtonClassName={accountStyles.header.backButton}
      actionsMenu={onAddAccount ? [
        {
          label: 'Add Account',
          icon: Plus,
          onClick: onAddAccount,
        },
      ] : undefined}
    />
  );
};

export default AccountHeader;
