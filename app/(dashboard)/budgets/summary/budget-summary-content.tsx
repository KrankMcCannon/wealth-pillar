'use client';

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
        title="Riepilogo Budget"
        showBack={true}
        onBack={() => router.push('/dashboard')}
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
        <main className={budgetStyles.page.main}>
          {/* Summary Info Cards */}
          <BudgetSummaryCards userSummary={userSummary} />

          {/* Related Budgets List (Grouped Style) */}
          <div className={budgetStyles.summary.activeList.container}>
            <BudgetSummaryActiveList
              userSummary={userSummary}
              budgets={budgets}
              onBudgetClick={(id) => router.push(`/budgets?budget=${id}`)}
            />
          </div>

          {/* Related Transactions */}
          <div className="space-y-3">
            <TransactionDayList
              groupedTransactions={groupedTransactions}
              accountNames={accountNamesMap}
              categories={categories}
              sectionTitle="Transazioni Correlate"
              emptyTitle="Nessuna transazione"
              emptyDescription="Non ci sono transazioni collegate a questi budget nel periodo corrente."
              expensesOnly
              onEditTransaction={() => {}}
              onDeleteTransaction={() => {}}
            />
          </div>
        </main>
      ) : (
        <div className={budgetStyles.summary.emptyState}>
          Seleziona un utente con budget attivi per visualizzare il riepilogo.
        </div>
      )}
      <BottomNavigation />
    </PageContainer>
  );
}
