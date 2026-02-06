'use client';

import { useTranslations } from 'next-intl';
import { Header, PageContainer, BottomNavigation } from '@/components/layout';
import { budgetStyles } from '@/styles/system';
import { Budget, Transaction, Account, Category, User, UserBudgetSummary } from '@/lib/types';
import { TransactionDayList } from '@/features/transactions/components';
import UserSelector from '@/components/shared/user-selector';
import { useBudgetSummaryContent } from './useBudgetSummaryContent';
import { BudgetSummaryCards } from './components/BudgetSummaryCards';
import { BudgetSummaryActiveList } from './components/BudgetSummaryActiveList';

interface BudgetSummaryContentProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  currentUser: User;
  groupUsers: User[];
  precalculatedData?: Record<string, UserBudgetSummary>;
}

export default function BudgetSummaryContent(props: Readonly<BudgetSummaryContentProps>) {
  const t = useTranslations('Budgets.SummaryPage');
  const {
    userSummary,
    groupedTransactions,
    accountNamesMap,
    currentActiveUserId,
    handleUserSelect,
    router,
  } = useBudgetSummaryContent(props);

  const { categories, budgets, currentUser, groupUsers } = props;

  return (
    <PageContainer className={budgetStyles.page.container}>
      <Header
        title={t('title')}
        showBack={true}
        onBack={() => router.push('/home')}
        className={budgetStyles.header.container}
      />

      {/* User Selector - Controlled Component */}
      <UserSelector
        users={groupUsers}
        currentUser={currentUser}
        isLoading={false}
        className="mb-4"
        value={currentActiveUserId}
        onChange={handleUserSelect}
        showAllOption={false} // Disable "All User" option for this view
      />

      {userSummary ? (
        <main className={`${budgetStyles.page.main} px-3 pb-24 pt-3 md:pb-8`}>
          <div className="space-y-4 md:grid md:grid-cols-12 md:items-start md:gap-6 md:space-y-0">
            <div className="space-y-4 md:col-span-5">
              {/* Summary Info Cards */}
              <BudgetSummaryCards userSummary={userSummary} />

              {/* Related Budgets List */}
              <div className={budgetStyles.summary.activeList.container}>
                <BudgetSummaryActiveList
                  userSummary={userSummary}
                  budgets={budgets}
                  onBudgetClick={(id) => router.push(`/budgets?budget=${id}`)}
                />
              </div>
            </div>

            {/* Desktop-only transactions to keep mobile flow focused */}
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
