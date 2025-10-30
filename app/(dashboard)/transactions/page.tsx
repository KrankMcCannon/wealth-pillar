'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MoreVertical, Plus, Search, Filter } from 'lucide-react';
import { Badge } from '@/src/components/ui';
import BottomNavigation from '@/src/components/layout/bottom-navigation';
import TabNavigation from '@/src/components/shared/tab-navigation';
import UserSelector from '@/src/components/shared/user-selector';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input } from '@/src/components/ui';
import { RecurringSeriesSection, RecurringSeriesForm } from '@/src/features/recurring';
import { useTransactionsData, useTransactionsState } from '@/src/features/transactions/hooks';
import { FilterDialog, GroupedTransactionCard, TransactionForm } from '@/src/features/transactions';
import { createTransactionsViewModel } from '@/src/features/transactions/services/transactions-view-model';
import { formatCurrency, pluralize } from '@/src/lib';
import { useUserSelection } from '@/src/lib/hooks/use-user-selection';
import { transactionStyles } from '@/src/features/transactions/theme/transaction-styles';
import { UserSelectorSkeleton } from '@/src/features/dashboard';
import { SearchFilterSkeleton, TransactionListSkeleton, RecurringSeriesSkeleton } from '@/src/features/transactions/components/transaction-skeletons';

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Load all data with progressive loading states
  const data = useTransactionsData();

  // Manage page state (selection, filters, forms, modals)
  const { state, actions } = useTransactionsState();

  // Get current user and selected view user from auth/selection hook
  const { currentUser, selectedViewUserId, updateViewUserId } = useUserSelection();

  // Create view model from raw data with applied filters
  const viewModel = useMemo(
    () =>
      createTransactionsViewModel(
        data.transactions.data,
        {
          searchQuery: state.debouncedSearchQuery,
          selectedFilter: state.selectedFilter,
          selectedCategory: state.selectedCategory,
          selectedUserId: selectedViewUserId
        },
        data.accounts.data as any,
        currentUser
      ),
    [data.transactions.data, state.debouncedSearchQuery, state.selectedFilter, state.selectedCategory, data.accounts.data, selectedViewUserId, currentUser]
  )

  return (
    <div className={transactionStyles.page.container} style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      {/* Header */}
      <header className={transactionStyles.header.container}>
        <div className={transactionStyles.header.inner}>
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className={transactionStyles.header.button}
            onClick={() => actions.handleBackClick(selectedViewUserId, searchParams)}
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          {/* Title */}
          <h1 className={transactionStyles.header.title}>Transazioni</h1>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={transactionStyles.header.button}>
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200" sideOffset={8}>
              <DropdownMenuItem
                className="text-sm font-medium text-primary hover:bg-primary hover:text-white rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                onClick={() => actions.handleCreateTransaction('expense')}
              >
                <Plus className="mr-3 h-4 w-4" />
                Aggiungi Transazione
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          users={data.users.data as any}
          currentUser={currentUser}
          selectedGroupFilter={selectedViewUserId}
          onGroupFilterChange={updateViewUserId}
          className="bg-card border-border"
        />
      </Suspense>

      {/* Tab Navigation */}
      <div className="px-3">
        <TabNavigation
          tabs={[
            { id: 'Transactions', label: 'Transazioni' },
            { id: 'Recurrent', label: 'Ricorrenti' }
          ]}
          activeTab={state.activeTab as string}
          onTabChange={(tabId) => actions.setActiveTab(tabId as 'Transactions' | 'Recurrent')}
          variant="modern"
        />
      </div>

      {/* Main Content */}
      <main className={transactionStyles.page.main}>
        {/* Active Filters Display - Show when coming from budgets */}
        {searchParams.get('from') === 'budgets' && (selectedViewUserId !== 'all' || searchParams.get('category')) && (
          <div className={transactionStyles.activeFilters.container}>
            <div className={transactionStyles.activeFilters.header}>
              <Filter className={transactionStyles.activeFilters.icon} />
              <span className={transactionStyles.activeFilters.label}>Filtri Attivi:</span>
              <div className={transactionStyles.activeFilters.badges}>
                {selectedViewUserId !== 'all' && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                    Membro: {data.users.data.find((m) => m.id === selectedViewUserId)?.name || selectedViewUserId}
                  </Badge>
                )}
                {searchParams.get('category') && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                    Categoria: {searchParams.get('category')}
                  </Badge>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { actions.resetFilters(); updateViewUserId('all'); router.replace('/transactions'); }} className={transactionStyles.activeFilters.clearButton}>
              Cancella Tutto
            </Button>
          </div>
        )}

        {/* Transactions Tab Content */}
        {state.activeTab === 'Transactions' && (
          <>
            {/* Search and Filter */}
            <Suspense fallback={<SearchFilterSkeleton />}>
              <div className={transactionStyles.searchFilter.container}>
                <div className={transactionStyles.searchFilter.searchContainer}>
                  <Search className={transactionStyles.searchFilter.searchIcon} />
                  <Input
                    type="text"
                    placeholder="Cerca transazioni..."
                    value={state.searchQuery}
                    onChange={(e) => actions.setSearchQuery(e.target.value)}
                    className={transactionStyles.searchFilter.searchInput}
                  />
                </div>
                <FilterDialog
                  isOpen={state.isFilterModalOpen}
                  onOpenChange={actions.setIsFilterModalOpen}
                  selectedFilter={state.selectedFilter}
                  selectedCategory={state.selectedCategory}
                  categories={data.categories.data}
                  onFilterChange={actions.setSelectedFilter}
                  onCategoryChange={actions.setSelectedCategory}
                  onReset={() => { actions.resetFilters(); actions.setSearchQuery(''); }}
                  hasActiveFilters={viewModel.hasActiveFilters}
                />
              </div>
            </Suspense>

            {/* Transactions List */}
            <Suspense fallback={<TransactionListSkeleton />}>
              {viewModel.groupedByDay.length > 0 ? (
                <div className="space-y-6">
                  {viewModel.groupedByDay.map((dayGroup) => (
                    <section key={dayGroup.date}>
                      <div className={transactionStyles.dayGroup.header}>
                        <h2 className={transactionStyles.dayGroup.title}>{dayGroup.dateLabel}</h2>
                        <div className={transactionStyles.dayGroup.stats}>
                          <div className={transactionStyles.dayGroup.statsTotal}>
                            <span className={transactionStyles.dayGroup.statsTotalLabel}>Totale:</span>
                            <span className={`${transactionStyles.dayGroup.statsTotalValue} ${dayGroup.total >= 0 ? transactionStyles.dayGroup.statsTotalValuePositive : transactionStyles.dayGroup.statsTotalValueNegative}`}>
                              {formatCurrency(dayGroup.total)}
                            </span>
                          </div>
                          <div className={transactionStyles.dayGroup.statsCount}>
                            {pluralize(dayGroup.transactions.length, 'transazione', 'transazioni')}
                          </div>
                        </div>
                      </div>
                      <GroupedTransactionCard
                        transactions={dayGroup.transactions}
                        accountNames={viewModel.accountNamesMap}
                        variant="regular"
                        onEditTransaction={actions.handleEditTransaction}
                        onDeleteTransaction={actions.handleDeleteTransaction}
                      />
                    </section>
                  ))}
                </div>
              ) : (
                <div className={transactionStyles.emptyState.container}>
                  <div className={transactionStyles.emptyState.icon}>
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className={transactionStyles.emptyState.title}>Nessuna Transazione</h3>
                  <p className={transactionStyles.emptyState.text}>Non ci sono transazioni da visualizzare per i filtri selezionati</p>
                </div>
              )}
            </Suspense>
          </>
        )}

        {/* Recurring Tab Content */}
        {state.activeTab === 'Recurrent' && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              selectedUserId={selectedViewUserId}
              className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-muted/30"
              showStats={true}
              maxItems={10}
              showActions={true}
              onCreateRecurringSeries={actions.handleCreateRecurringSeries}
              onEditRecurringSeries={actions.handleEditRecurringSeries}
            />
          </Suspense>
        )}
      </main>

      <BottomNavigation />

      {/* Modal Forms */}
      <TransactionForm
        isOpen={state.isTransactionFormOpen}
        onOpenChange={actions.setIsTransactionFormOpen}
        initialType={state.transactionFormType}
        selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : currentUser?.id}
        transaction={state.editingTransaction || undefined}
        mode={state.transactionFormMode}
      />
      <RecurringSeriesForm
        isOpen={state.isRecurringFormOpen}
        onOpenChange={actions.setIsRecurringFormOpen}
        selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : currentUser?.id}
        series={state.editingSeries ?? undefined}
        mode={state.recurringFormMode}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<SearchFilterSkeleton />}>
      <TransactionsContent />
    </Suspense>
  );
}
