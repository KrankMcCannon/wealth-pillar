"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MoreVertical, Plus, Search, Filter } from "lucide-react";
import { Badge } from '@/src/components/ui';
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import { PageLoader } from "@/src/components/shared";
import TabNavigation from "@/src/components/shared/tab-navigation";
import UserSelector from "@/src/components/shared/user-selector";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input } from "@/src/components/ui";
import { RecurringSeriesSection, RecurringSeriesForm } from "@/src/features/recurring";
import { useTransactionsController, FilterDialog, GroupedTransactionCard, TransactionForm } from "@/src/features/transactions";
import { User, formatCurrency, pluralize } from "@/src/lib";

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Controller orchestrates all business logic
  const {
    viewModel,
    categories,
    users,
    currentUser,
    selectedViewUserId,
    activeTab,
    searchQuery,
    selectedFilter,
    selectedCategory,
    isFilterModalOpen,
    isTransactionFormOpen,
    transactionFormType,
    editingTransaction,
    transactionFormMode,
    isRecurringFormOpen,
    editingSeries,
    recurringFormMode,
    isLoading,
    setActiveTab,
    setSearchQuery,
    setSelectedFilter,
    setSelectedCategory,
    setIsFilterModalOpen,
    setIsTransactionFormOpen,
    setIsRecurringFormOpen,
    updateViewUserId,
    handleEditTransaction,
    handleDeleteTransaction,
    handleCreateTransaction,
    handleCreateRecurringSeries,
    handleEditRecurringSeries,
    resetFilters,
    handleBackClick
  } = useTransactionsController();

  // Show loader while data is loading
  if (isLoading) {
    return <PageLoader message="Caricamento transazioni..." />;
  }

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-card" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
        <>
          {/* Header */}
          <header className="sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left - Back button */}
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={handleBackClick}
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>

              {/* Center - Title */}
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Transazioni</h1>

              {/* Right - Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
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
                    onClick={() => handleCreateTransaction("expense")}
                  >
                    <Plus className="mr-3 h-4 w-4" />
                    Aggiungi Transazione
                  </DropdownMenuItem>
                  {/* Ricorrente non è più un tipo: usa la frequenza nel form */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <UserSelector
            users={users}
            currentUser={currentUser}
            selectedGroupFilter={selectedViewUserId}
            onGroupFilterChange={updateViewUserId}
            className="bg-card border-border"
          />

          <div className="px-3">
            <TabNavigation
              tabs={[
                { id: "Transactions", label: "Transazioni" },
                { id: "Recurrent", label: "Ricorrenti" }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="modern"
            />
          </div>

          <main className="flex-1 p-3 space-y-6 pb-20">

            {/* Active Filters Display - Show when coming from budgets */}
            {(searchParams.get('from') === 'budgets' && (searchParams.get('member') || searchParams.get('category'))) && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Filtri Attivi:</span>
                    <div className="flex gap-2">
                      {searchParams.get('member') && searchParams.get('member') !== 'all' && (
                        <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                          Membro: {users.find((m: User) => m.id === searchParams.get('member'))?.name || searchParams.get('member')}
                        </Badge>
                      )}
                      {searchParams.get('category') && (
                        <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                          Categoria: {searchParams.get('category')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      updateViewUserId('all');
                      resetFilters();
                      router.replace('/transactions');
                    }}
                    className="text-primary hover:text-primary hover:bg-primary/8"
                  >
                    Cancella Tutto
                  </Button>
                </div>
              </div>
            )}

            {/* Modern Search and Filter System */}
            {activeTab === "Transactions" && (
              <div className="flex items-center gap-3">
                {/* Enhanced Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/60 z-10" />
                  <Input
                    type="text"
                    placeholder="Cerca transazioni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-2xl pl-12 pr-4 py-3 bg-card/80 backdrop-blur-sm border border-primary/20 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 h-12 shadow-sm hover:shadow-md transition-all duration-300 placeholder:text-muted-foreground"
                  />
                </div>

                {/* Enhanced Filter Button */}
                <FilterDialog
                  isOpen={isFilterModalOpen}
                  onOpenChange={setIsFilterModalOpen}
                  selectedFilter={selectedFilter}
                  selectedCategory={selectedCategory}
                  categories={categories}
                  onFilterChange={setSelectedFilter}
                  onCategoryChange={setSelectedCategory}
                  onReset={() => {
                    resetFilters();
                    setSearchQuery("");
                  }}
                  hasActiveFilters={viewModel.hasActiveFilters}
                />
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "Transactions" && (
              <div className="space-y-6">
                {viewModel.groupedByDay.length > 0 ? (
                  viewModel.groupedByDay.map((dayGroup) => (
                    <section key={dayGroup.date}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h2 className="text-lg font-bold tracking-tight">{dayGroup.dateLabel}</h2>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm">Totale:</span>
                            <span className={`text-sm font-bold ${dayGroup.total >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {formatCurrency(dayGroup.total)}
                            </span>
                          </div>
                          <div className="text-xs mt-0.5">
                            {pluralize(dayGroup.transactions.length, 'transazione', 'transazioni')}
                          </div>
                        </div>
                      </div>
                      <GroupedTransactionCard
                        transactions={dayGroup.transactions}
                        accountNames={viewModel.accountNamesMap}
                        variant="regular"
                        onEditTransaction={handleEditTransaction}
                        onDeleteTransaction={handleDeleteTransaction}
                      />
                    </section>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nessuna Transazione</h3>
                    <p>Non ci sono transazioni da visualizzare per i filtri selezionati</p>
                  </div>
                )}
              </div>
            )}

            {/* Recurrent Tab */}
            {activeTab === "Recurrent" && (
              <RecurringSeriesSection
                selectedUserId={selectedViewUserId}
                className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-muted/30"
                showStats={true}
                maxItems={10}
                showActions={true}
                onCreateRecurringSeries={handleCreateRecurringSeries}
                onEditRecurringSeries={handleEditRecurringSeries}
              />
            )}
          </main>


          <BottomNavigation />

          {/* Transaction Form */}
          <TransactionForm
            isOpen={isTransactionFormOpen}
            onOpenChange={setIsTransactionFormOpen}
            initialType={transactionFormType}
            selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : ''}
            transaction={editingTransaction || undefined}
            mode={transactionFormMode}
          />
          <RecurringSeriesForm
            isOpen={isRecurringFormOpen}
            onOpenChange={setIsRecurringFormOpen}
            selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : currentUser?.id}
            series={editingSeries ?? undefined}
            mode={recurringFormMode}
          />
        </>
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <TransactionsContent />
    </Suspense>
  );
}
