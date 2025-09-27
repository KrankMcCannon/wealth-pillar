"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MoreVertical, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BottomNavigation from "../../../components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import { GroupedTransactionCard } from "@/components/grouped-transaction-card";
import { FilterDialog } from "@/components/filter-dialog";
import { TransactionForm } from "@/components/transaction-form";
import { RecurringSeriesForm } from "@/components/recurring-series-form";
import TabNavigation from "@/components/tab-navigation";
import { RecurringSeriesSection } from "@/components/recurring-series-section";
import type { RecurringTransactionSeries } from "@/lib/types";
import {
  useTransactions,
  useCategories,
  useAccounts,
  useUserSelection
} from "@/hooks";
import {
  formatCurrency,
  getTotalForSection,
  formatDateLabel,
  pluralize
} from "@/lib/utils";
import type { User, Transaction } from "@/lib/types";

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Transactions");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<"expense" | "income" | "transfer">("expense");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionFormMode, setTransactionFormMode] = useState<'create' | 'edit'>('create');
  const [editingSeries, setEditingSeries] = useState<RecurringTransactionSeries | null>(null);
  const [recurringFormMode, setRecurringFormMode] = useState<'create' | 'edit'>('create');

  const [accountNames, setAccountNames] = useState<Record<string, string>>({});

  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();

  // Use centralized user selection
  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading
  } = useUserSelection();


  // State for filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(tx => tx.category === selectedCategory);
    }

    // User filter
    if (selectedViewUserId !== "all") {
      filtered = filtered.filter(tx => tx.user_id === selectedViewUserId);
    }

    // Type filter
    if (selectedFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === selectedFilter);
    }

    return filtered;
  }, [transactions, searchQuery, selectedCategory, selectedViewUserId, selectedFilter]);

  const hasActiveFilters = searchQuery !== "" || selectedFilter !== "all" || selectedCategory !== "all" || selectedViewUserId !== "all";

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedCategory("all");
    updateViewUserId("all");
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormMode('edit');
    setIsTransactionFormOpen(true);
  };

  const handleCreateTransaction = (type: "expense" | "income" | "transfer" = "expense") => {
    setEditingTransaction(null);
    setTransactionFormMode('create');
    setTransactionFormType(type);
    setIsTransactionFormOpen(true);
  };

  const handleCreateRecurringSeries = () => {
    setEditingSeries(null);
    setRecurringFormMode('create');
    setIsRecurringFormOpen(true);
  };

  const handleEditRecurringSeries = (series: RecurringTransactionSeries) => {
    setEditingSeries(series);
    setRecurringFormMode('edit');
    setIsRecurringFormOpen(true);
  };

  useEffect(() => {
    // Build account names map
    if (accounts && accounts.length > 0) {
      const names: Record<string, string> = {};
      accounts.forEach(a => { names[a.id] = a.name; });
      setAccountNames(names);
    }
  }, [accounts]);

  const processedTransactionData = useMemo(() => {
    const safeParse = (d: string | Date) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const sortedTransactions = [...filteredTransactions]
      .filter(t => !!safeParse(t.date))
      .sort((a, b) => {
        const da = safeParse(a.date)!;
        const db = safeParse(b.date)!;
        return db.getTime() - da.getTime();
      });

    const groupedByDay: Record<string, typeof filteredTransactions> = {};

    sortedTransactions.forEach(transaction => {
      const date = safeParse(transaction.date);
      if (!date) return;
      const dateKey = date.toISOString().split('T')[0];

      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = [];
      }
      groupedByDay[dateKey].push(transaction);
    });

    const dayGroups = Object.entries(groupedByDay)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, transactions]) => ({
        date,
        transactions,
        total: getTotalForSection(transactions),
        dateLabel: formatDateLabel(date)
      }));

    return {
      dayGroups,
      allTotal: getTotalForSection(sortedTransactions)
    };
  }, [filteredTransactions]);


  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'upcoming' || tab === 'recurrent') {
      setActiveTab('Recurrent');
    }
  }, [searchParams]);

  const handleBackClick = () => {
    const from = searchParams.get('from');
    if (from === 'dashboard') {
      router.push('/dashboard');
    } else if (from === 'budgets') {
      const params = new URLSearchParams();
      if (selectedViewUserId !== 'all') {
        params.set('member', selectedViewUserId);
      }
      const budgetParam = searchParams.get('budget');
      if (budgetParam && budgetParam !== 'all') {
        params.set('budget', budgetParam);
      }
      const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
      router.push(url);
    } else {
      router.back();
    }
  };

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      {txLoading || userSelectionLoading || categoriesLoading || accountsLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left - Back button */}
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-primary/10 text-primary hover:text-primary rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center group hover:scale-105"
                onClick={handleBackClick}
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 group-hover:-translate-x-0.5 transition-transform duration-200" />
              </Button>

              {/* Center - Title */}
              <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Transazioni</h1>

              {/* Right - Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10 text-primary hover:text-primary rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center group hover:scale-105">
                    <MoreVertical className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-60 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-3 animate-in slide-in-from-top-2 duration-200"
                  sideOffset={12}
                >
                  <DropdownMenuItem
                    className="text-sm font-semibold text-slate-700 hover:bg-primary/10 hover:text-primary rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 group"
                    onClick={() => handleCreateTransaction("expense")}
                  >
                    <Plus className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
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
            className="bg-[#F8FAFC] border-gray-200"
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Filtri Attivi:</span>
                    <div className="flex gap-2">
                      {searchParams.get('member') && searchParams.get('member') !== 'all' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                          Membro: {users.find((m: User) => m.id === searchParams.get('member'))?.name || searchParams.get('member')}
                        </Badge>
                      )}
                      {searchParams.get('category') && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
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
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
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
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary z-10" />
                  <Input
                    type="text"
                    placeholder="Cerca transazioni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-2xl pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/50 focus:border-primary/60 focus:ring-4 focus:ring-primary/10 h-12 text-slate-700 placeholder:text-slate-400 shadow-lg shadow-slate-200/30 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40"
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
                  hasActiveFilters={hasActiveFilters}
                />
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === "Transactions" && (
              <div className="space-y-6">
                {processedTransactionData.dayGroups.length > 0 ? (
                  processedTransactionData.dayGroups.map((dayGroup) => (
                    <section key={dayGroup.date}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h2 className="text-lg font-bold tracking-tight text-gray-900">{dayGroup.dateLabel}</h2>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm text-gray-500">Totale:</span>
                            <span className={`text-sm font-bold ${dayGroup.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(dayGroup.total)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {pluralize(dayGroup.transactions.length, 'transazione', 'transazioni')}
                          </div>
                        </div>
                      </div>
                      <GroupedTransactionCard
                        transactions={dayGroup.transactions}
                        accountNames={accountNames}
                        variant="regular"
                        onEditTransaction={handleEditTransaction}
                      />
                    </section>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna Transazione</h3>
                    <p className="text-gray-500">Non ci sono transazioni da visualizzare per i filtri selezionati</p>
                  </div>
                )}
              </div>
            )}

            {/* Recurrent Tab */}
            {activeTab === "Recurrent" && (
              <RecurringSeriesSection
                selectedUserId={selectedViewUserId}
                className="bg-white/80 backdrop-blur-sm border border-slate-200/50 shadow-lg shadow-slate-200/30"
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
      )}
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
