"use client";

/**
 * Transactions Content - Client Component
 *
 * Handles interactive transactions UI with client-side state management
 * Data is pre-hydrated from server via HydrationBoundary
 */

import { Suspense } from "react";
import { ArrowLeft, MoreVertical, Plus, Search, Filter } from "lucide-react";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
} from "@/src/components/ui";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import TabNavigation from "@/src/components/shared/tab-navigation";
import UserSelector from "@/src/components/shared/user-selector";
import { RecurringSeriesSection, RecurringSeriesForm } from "@/src/features/recurring";
import { FilterDialog, GroupedTransactionCard, TransactionForm } from "@/src/features/transactions";
import { transactionStyles } from "@/src/features/transactions/theme/transaction-styles";
import { UserSelectorSkeleton } from "@/src/features/dashboard";
import {
  SearchFilterSkeleton,
  TransactionListSkeleton,
  RecurringSeriesSkeleton,
} from "@/src/features/transactions/components/transaction-skeletons";

/**
 * Transactions Content Component
 * Separated to enable proper error handling and Suspense boundaries
 * Data is fetched client-side via TanStack Query with parallel execution
 */
export default function TransactionsContent() {
  return (
    <div
      className={transactionStyles.page.container}
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      {/* Header */}
      <header className={transactionStyles.header.container}>
        <div className={transactionStyles.header.inner}>
          {/* Back button */}
          <Button variant="ghost" size="sm" className={transactionStyles.header.button} onClick={() => {}}>
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
            <DropdownMenuContent
              align="end"
              className="w-56 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
              sideOffset={8}
            >
              <DropdownMenuItem
                className="text-sm font-medium text-primary hover:bg-primary hover:text-white rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                onClick={() => {}}
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
          users={[]}
          currentUser={null}
          selectedGroupFilter={""}
          onGroupFilterChange={() => {}}
          className="bg-card border-border"
        />
      </Suspense>

      {/* Tab Navigation */}
      <div className="px-3">
        <TabNavigation
          tabs={[
            { id: "Transactions", label: "Transazioni" },
            { id: "Recurrent", label: "Ricorrenti" },
          ]}
          activeTab={"Transactions"}
          onTabChange={() => {}}
          variant="modern"
        />
      </div>

      {/* Main Content */}
      <main className={transactionStyles.page.main}>
        {/* Active Filters Display - Show when coming from budgets */}
        {false && (false || false) && (
          <div className={transactionStyles.activeFilters.container}>
            <div className={transactionStyles.activeFilters.header}>
              <Filter className={transactionStyles.activeFilters.icon} />
              <span className={transactionStyles.activeFilters.label}>Filtri Attivi:</span>
              <div className={transactionStyles.activeFilters.badges}>
                {false && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                    Membro: {""}
                  </Badge>
                )}
                {false && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                    Categoria: {""}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className={transactionStyles.activeFilters.clearButton}
            >
              Cancella Tutto
            </Button>
          </div>
        )}

        {/* Transactions Tab Content */}
        {false && (
          <>
            {/* Search and Filter */}
            <Suspense fallback={<SearchFilterSkeleton />}>
              <div className={transactionStyles.searchFilter.container}>
                <div className={transactionStyles.searchFilter.searchContainer}>
                  <Search className={transactionStyles.searchFilter.searchIcon} />
                  <Input
                    type="text"
                    placeholder="Cerca transazioni..."
                    value={undefined}
                    onChange={() => {}}
                    className={transactionStyles.searchFilter.searchInput}
                  />
                </div>
                <FilterDialog
                  isOpen={false}
                  onOpenChange={() => {}}
                  selectedFilter={""}
                  selectedCategory={""}
                  categories={[]}
                  onFilterChange={() => {}}
                  onCategoryChange={() => {}}
                  onReset={() => {}}
                  hasActiveFilters={false}
                />
              </div>
            </Suspense>

            {/* Transactions List */}
            {(() => {
              if (false) {
                return <TransactionListSkeleton />;
              }

              if (false) {
                return (
                  <div className="space-y-6">
                    {[].map(() => (
                      <section key={""}>
                        <div className={transactionStyles.dayGroup.header}>
                          <h2 className={transactionStyles.dayGroup.title}>{""}</h2>
                          <div className={transactionStyles.dayGroup.stats}>
                            <div className={transactionStyles.dayGroup.statsTotal}>
                              <span className={transactionStyles.dayGroup.statsTotalLabel}>Totale:</span>
                              <span
                                className={`${transactionStyles.dayGroup.statsTotalValue} ${
                                  0 >= 0
                                    ? transactionStyles.dayGroup.statsTotalValuePositive
                                    : transactionStyles.dayGroup.statsTotalValueNegative
                                }`}
                              >
                                {0}
                              </span>
                            </div>
                            <div className={transactionStyles.dayGroup.statsCount}>
                              {1 === 1 ? "transazione" : "transazioni"}
                            </div>
                          </div>
                        </div>
                        <GroupedTransactionCard
                          transactions={[]}
                          accountNames={{}}
                          variant="regular"
                          onEditTransaction={() => {}}
                          onDeleteTransaction={() => {}}
                        />
                      </section>
                    ))}
                  </div>
                );
              }

              return (
                <div className={transactionStyles.emptyState.container}>
                  <div className={transactionStyles.emptyState.icon}>
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className={transactionStyles.emptyState.title}>Nessuna Transazione</h3>
                  <p className={transactionStyles.emptyState.text}>
                    Non ci sono transazioni da visualizzare per i filtri selezionati
                  </p>
                </div>
              );
            })()}
          </>
        )}

        {/* Recurring Tab Content */}
        {false && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              selectedUserId={""}
              className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-muted/30"
              showStats={true}
              maxItems={10}
              showActions={true}
              onCreateRecurringSeries={() => {}}
              onEditRecurringSeries={() => {}}
            />
          </Suspense>
        )}
      </main>

      <BottomNavigation />

      {/* Modal Forms */}
      <TransactionForm
        isOpen={false}
        onOpenChange={() => {}}
        initialType={undefined}
        selectedUserId={""}
        transaction={undefined}
        mode={undefined}
      />
      <RecurringSeriesForm
        isOpen={false}
        onOpenChange={() => {}}
        selectedUserId={""}
        series={undefined}
        mode={undefined}
      />
    </div>
  );
}
