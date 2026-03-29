'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { Header, PageContainer, BottomNavigation } from '@/components/layout';
import { budgetStyles } from '@/styles/system';
import type { User, UserBudgetSummary } from '@/lib/types';
import type { BudgetsPageData } from '@/server/services/page-data.service';
import { TransactionDayList } from '@/features/transactions/components';
import UserSelector from '@/components/shared/user-selector';
import { useBudgetSummaryContent } from './useBudgetSummaryContent';
import { BudgetSummaryCards } from './components/BudgetSummaryCards';
import { BudgetSummaryActiveList } from './components/BudgetSummaryActiveList';

type BudgetSummaryPagePayload = BudgetsPageData & {
  budgetsByUser: Record<string, UserBudgetSummary>;
};

interface BudgetSummaryContentProps {
  currentUser: User;
  groupUsers: User[];
  pageDataPromise: Promise<BudgetSummaryPagePayload>;
}

export default function BudgetSummaryContent({
  currentUser,
  groupUsers,
  pageDataPromise,
}: Readonly<BudgetSummaryContentProps>) {
  const t = useTranslations('Budgets.SummaryPage');

  const { categories, budgets, transactions, accounts, budgetsByUser } = use(pageDataPromise);

  const {
    userSummary,
    groupedTransactions,
    accountNamesMap,
    currentActiveUserId,
    handleUserSelect,
    router,
  } = useBudgetSummaryContent({
    categories,
    budgets,
    transactions,
    accounts,
    currentUser,
    groupUsers,
    precalculatedData: budgetsByUser,
  });

  return (
    <PageContainer className={budgetStyles.page.container}>
      <Header
        title={t('title')}
        showBack
        onBack={() => router.push('/home')}
        className={budgetStyles.header.container}
      />

      <UserSelector
        users={groupUsers}
        currentUser={currentUser}
        isLoading={false}
        className="mb-4"
        value={currentActiveUserId}
        onChange={handleUserSelect}
        showAllOption={false}
      />

      {userSummary ? (
        <main className={`${budgetStyles.page.main} px-3 pb-24 pt-3 md:pb-8`}>
          <div className="space-y-4 md:grid md:grid-cols-12 md:items-start md:gap-6 md:space-y-0">
            <div className="space-y-4 md:col-span-5">
              <BudgetSummaryCards userSummary={userSummary} />

              <div className={budgetStyles.summary.activeList.container}>
                <BudgetSummaryActiveList
                  userSummary={userSummary}
                  budgets={budgets}
                  onBudgetClick={(id) => router.push(`/budgets?budget=${id}`)}
                />
              </div>
            </div>

            <div className="hidden space-y-3 md:col-span-7 md:block">
              <TransactionDayList
                groupedTransactions={groupedTransactions}
                accountNames={accountNamesMap}
                categories={categories}
                sectionTitle={t('transactions.sectionTitle')}
                emptyTitle={t('transactions.emptyTitle')}
                emptyDescription={t('transactions.emptyDescription')}
                expensesOnly
                onEditTransaction={() => {}}
                onDeleteTransaction={() => {}}
              />
            </div>
          </div>
        </main>
      ) : (
        <div className={budgetStyles.summary.emptyState}>{t('emptyState')}</div>
      )}
      <BottomNavigation />
    </PageContainer>
  );
}
