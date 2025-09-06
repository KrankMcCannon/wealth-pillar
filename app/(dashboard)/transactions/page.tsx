"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MoreVertical, Plus, Filter, Clock, RotateCcw, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BottomNavigation from "../../../components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import {
  dummyUsers,
  dummyTransactions,
  dummyCategoryIcons
} from "@/lib/dummy-data";
import {
  formatCurrency,
  parseFiltersFromUrl,
  filterTransactions,
  applySearchFilter,
  getTotalForSection,
  formatDateLabel,
  formatDueDate,
  groupUpcomingTransactionsByDaysRemaining,
  getCategoryLabel,
  getAccountName,
  truncateText,
} from "@/lib/utils";
import { FilterState } from "@/lib/types";

function TransactionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("Transactions");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("Tutte le Categorie");

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState<FilterState>(() => {
    return parseFiltersFromUrl(searchParams);
  });

  const selectedGroupFilter = filters.member || 'all';
  const setSelectedGroupFilter = (value: string) => {
    setFilters(prev => ({ ...prev, member: value }));
  };

  // Get filtered transactions based on selected group filter
  const allTransactions = useMemo(() => {
    if (selectedGroupFilter === 'all') {
      return dummyTransactions;
    }
    return dummyTransactions.filter(tx => tx.user_id === selectedGroupFilter);
  }, [selectedGroupFilter]);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(allTransactions, filters);
  }, [allTransactions, filters]);

  // Optimized data processing with useMemo
  const processedTransactionData = useMemo(() => {
    const searchFiltered = applySearchFilter(searchQuery, filteredTransactions);

    // Sort transactions by date (newest first)
    const sortedTransactions = [...searchFiltered].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Group transactions by day
    const groupedByDay: Record<string, typeof filteredTransactions> = {};

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = [];
      }
      groupedByDay[dateKey].push(transaction);
    });

    // Convert to array format for easier rendering
    const dayGroups = Object.entries(groupedByDay)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()) // Sort by date descending
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
  }, [filteredTransactions, searchQuery]);

  // Get recurring transactions
  const filteredRecurrentData = useMemo(() => {
    const recurringTxs = dummyTransactions.filter(tx => 
      tx.frequency && (tx.frequency === 'weekly' || tx.frequency === 'biweekly' || tx.frequency === 'monthly' || tx.frequency === 'yearly')
    );

    const filtered = selectedGroupFilter === 'all' ? recurringTxs : recurringTxs.filter(tx => tx.user_id === selectedGroupFilter);
    
    // Group upcoming transactions by days remaining
    const upcomingGrouped = groupUpcomingTransactionsByDaysRemaining(filtered);
    
    return {
      upcomingGrouped,
      recurrent: filtered
    };
  }, [selectedGroupFilter]);

  // Check if we came from a specific source and set initial state
  useEffect(() => {
    // Sync UI state with URL filters
    if (filters.category && filters.category !== 'all') {
      setSelectedCategory(filters.category.charAt(0).toUpperCase() + filters.category.slice(1));
    } else {
      setSelectedCategory("Tutte le Categorie");
    }

    if (filters.type && filters.type !== 'all') {
      setSelectedFilter(filters.type.charAt(0).toUpperCase() + filters.type.slice(1));
    } else {
      setSelectedFilter("All");
    }

    const tab = searchParams.get('tab');
    if (tab === 'upcoming' || tab === 'recurrent') {
      setActiveTab('Recurrent');
    }
  }, [filters, searchParams]);

  // Update filters when URL changes
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl(searchParams);
    setFilters(urlFilters);
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.member && filters.member !== 'all') {
      params.set('member', filters.member);
    }

    if (filters.category && filters.category !== 'all') {
      params.set('category', encodeURIComponent(filters.category));
    }

    if (filters.type && filters.type !== 'all') {
      params.set('type', filters.type);
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      params.set('dateRange', filters.dateRange);
    }

    if (filters.minAmount) {
      params.set('minAmount', filters.minAmount);
    }

    if (filters.maxAmount) {
      params.set('maxAmount', filters.maxAmount);
    }

    if (searchParams.get('from')) {
      params.set('from', searchParams.get('from')!);
    }

    if (searchParams.get('budget')) {
      params.set('budget', searchParams.get('budget')!);
    }

    const newUrl = params.toString() ? `/transactions?${params.toString()}` : '/transactions';

    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    const currentUrl = currentPath + currentSearch;

    if (currentUrl !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, searchParams, router]);

  // Sync selectedFilter and selectedCategory with filters
  useEffect(() => {
    const expectedType = selectedFilter === "All" ? 'all' : selectedFilter.toLowerCase();
    const expectedCategory = selectedCategory === "Tutte le Categorie" ? 'all' : selectedCategory.toLowerCase();

    if (filters.type !== expectedType || filters.category !== expectedCategory) {
      setFilters(prev => ({
        ...prev,
        type: expectedType,
        category: expectedCategory
      }));
    }
  }, [selectedFilter, selectedCategory, filters.type, filters.category]);

  const handleBackClick = () => {
    const from = searchParams.get('from');
    if (from === 'dashboard') {
      router.push('/dashboard');
    } else if (from === 'budgets') {
      const params = new URLSearchParams();
      if (selectedGroupFilter !== 'all') {
        params.set('member', selectedGroupFilter);
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
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-[#7578EC]/10 text-[#7578EC] hover:text-[#7578EC] rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center group hover:scale-105"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 group-hover:-translate-x-0.5 transition-transform duration-200" />
          </Button>

          {/* Center - Title */}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Transazioni</h1>

          {/* Right - Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-[#7578EC]/10 text-[#7578EC] hover:text-[#7578EC] rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center group hover:scale-105">
                <MoreVertical className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-60 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-3 animate-in slide-in-from-top-2 duration-200"
              sideOffset={12}
            >
              <DropdownMenuItem className="text-sm font-semibold text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 group">
                <Plus className="mr-3 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                Aggiungi Transazione
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm font-semibold text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-xl px-3 py-3 cursor-pointer transition-all duration-200 group">
                <RotateCcw className="mr-3 h-4 w-4 group-hover:rotate-180 transition-transform duration-200" />
                Aggiungi Transazione Ricorrente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4 p-1.5 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
          {[{ key: "Transactions", label: "Transazioni" }, { key: "Recurrent", label: "Ricorrenti" }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 group ${activeTab === tab.key
                ? "bg-[#7578EC] text-white shadow-lg shadow-[#7578EC]/25 scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/70 hover:shadow-md"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <UserSelector 
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={(groupId) => setFilters(prev => ({ ...prev, member: groupId }))}
        className="bg-[#F8FAFC] border-gray-200"
      />

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
                      Membro: {dummyUsers.find(m => m.id === searchParams.get('member'))?.name || searchParams.get('member')}
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
                  setSelectedGroupFilter('all');
                  setSelectedCategory('Tutte le Categorie');
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
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#7578EC] z-10" />
              <Input
                type="text"
                placeholder="Cerca transazioni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-2xl pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200/50 focus:border-[#7578EC]/60 focus:ring-4 focus:ring-[#7578EC]/10 h-12 text-slate-700 placeholder:text-slate-400 shadow-lg shadow-slate-200/30 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40"
              />
            </div>

            {/* Enhanced Filter Button */}
            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`rounded-2xl border-slate-200/50 hover:bg-[#7578EC]/10 hover:border-[#7578EC]/40 w-12 h-12 p-0 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 hover:scale-105 group ${(selectedFilter !== "All" || selectedCategory !== "Tutte le Categorie" || searchQuery !== "")
                      ? "bg-gradient-to-r from-[#7578EC] to-[#6366F1] text-white hover:from-[#6366F1] hover:to-[#7578EC] border-transparent shadow-[#7578EC]/30"
                      : "bg-white/80 backdrop-blur-sm"
                    }`}
                >
                  <Filter
                    className={`h-5 w-5 transition-all duration-200 group-hover:rotate-12 ${(selectedFilter !== "All" || selectedCategory !== "Tutte le Categorie" || searchQuery !== "")
                        ? "fill-current drop-shadow-sm"
                        : "text-slate-600"
                      }`}
                  />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                    <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#6366F1]/10 border border-[#7578EC]/20">
                      <Filter className="h-5 w-5 text-[#7578EC]" />
                    </div>
                    Filtra Transazioni
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 pt-6">
                  {/* Enhanced Transaction Type Filter */}
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-xl">🏷️</span>
                      Tipo Transazione
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[{ key: "All", label: "Tutti", icon: "📊", color: "slate" }, { key: "Income", label: "Entrate", icon: "💚", color: "green" }, { key: "Expenses", label: "Spese", icon: "💸", color: "red" }].map((type) => (
                        <Button
                          key={type.key}
                          variant={selectedFilter === type.key ? "default" : "outline"}
                          size="default"
                          onClick={() => setSelectedFilter(type.key)}
                          className={`rounded-2xl py-4 px-3 transition-all duration-300 hover:scale-105 group ${
                            selectedFilter === type.key
                              ? "bg-gradient-to-r from-[#7578EC] to-[#6366F1] hover:from-[#6366F1] hover:to-[#7578EC] text-white shadow-lg shadow-[#7578EC]/30 border-transparent"
                              : "bg-white/80 backdrop-blur-sm hover:bg-[#7578EC]/10 hover:text-[#7578EC] border-slate-200/50 hover:border-[#7578EC]/40 hover:shadow-lg hover:shadow-slate-200/50"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${selectedFilter === type.key ? 'drop-shadow-sm' : ''}`}>{type.icon}</span>
                            <span className="text-sm font-semibold">{type.label}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Category Filter */}
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      Categoria
                    </h4>
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                      {[
                        { name: "Tutte le Categorie", icon: "📋" },
                        ...Object.keys(dummyCategoryIcons).slice(0, 7).map(cat => ({
                          name: cat,
                          icon: dummyCategoryIcons[cat] || "📊"
                        }))
                      ].map((category) => (
                        <Button
                          key={category.name}
                          variant={selectedCategory === category.name ? "default" : "outline"}
                          size="default"
                          onClick={() => setSelectedCategory(category.name)}
                          className={`justify-start py-3 px-4 rounded-2xl transition-all duration-300 hover:scale-105 group ${
                            selectedCategory === category.name
                              ? "bg-gradient-to-r from-[#7578EC] to-[#6366F1] hover:from-[#6366F1] hover:to-[#7578EC] text-white shadow-lg shadow-[#7578EC]/30 border-transparent"
                              : "bg-white/80 backdrop-blur-sm hover:bg-[#7578EC]/10 hover:text-[#7578EC] border-slate-200/50 hover:border-[#7578EC]/40 hover:shadow-lg hover:shadow-slate-200/50"
                          }`}
                        >
                          <span className={`mr-3 text-lg transition-transform duration-200 group-hover:scale-110 ${selectedCategory === category.name ? 'drop-shadow-sm' : ''}`}>{category.icon}</span>
                          <span className="font-medium truncate">{category.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced Reset Filters Button */}
                  <div className="pt-4 border-t border-slate-200/50">
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => {
                        setSelectedFilter("All");
                        setSelectedCategory("Tutte le Categorie");
                        setSearchQuery("");
                      }}
                      className="w-full py-3 px-4 rounded-2xl text-slate-600 hover:text-[#7578EC] hover:bg-[#7578EC]/10 font-semibold transition-all duration-300 hover:scale-105 group border border-slate-200/50 hover:border-[#7578EC]/40 hover:shadow-md"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg group-hover:rotate-180 transition-transform duration-300">🔄</span>
                        <span>Ripristina Tutti i Filtri</span>
                      </div>
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "Transactions" && (
          <div className="space-y-6">
            {processedTransactionData.dayGroups.length > 0 ? (
              processedTransactionData.dayGroups.map((dayGroup) => (
                <section key={dayGroup.date}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold tracking-tight text-gray-900">{dayGroup.dateLabel}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Totale:</span>
                      <span className={`text-sm font-bold ${dayGroup.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(dayGroup.total)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {dayGroup.transactions.map((transaction) => (
                      <Card key={transaction.id} className="p-3 mb-2 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 rounded-2xl group cursor-pointer hover:scale-[1.01]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 text-[#7578EC] shadow-md shadow-slate-200/30 group-hover:shadow-lg transition-all duration-200 shrink-0">
                              <span className="text-base">{dummyCategoryIcons[transaction.category] || "💳"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors truncate text-sm mb-1">{transaction.description}</h3>
                              <div className="space-y-0.5">
                                <div className="text-xs text-gray-600">
                                  {truncateText(getAccountName(transaction.account_id), 20)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getCategoryLabel(transaction.category)}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-base font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(transaction.type === 'income' ? transaction.amount : -transaction.amount)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
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
          <div className="space-y-6">

            {/* Upcoming Payments Section */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  In Scadenza
                </h2>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  {Object.values(filteredRecurrentData.upcomingGrouped).flat().length} pagamenti
                </Badge>
              </div>

              <div className="space-y-6">
                {Object.entries(filteredRecurrentData.upcomingGrouped).map(([groupName, transactions]) => (
                  <div key={groupName}>
                    <h3 className="text-sm font-semibold text-orange-700 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      {groupName} ({transactions.length})
                    </h3>
                    <div className="space-y-2">
                      {transactions.map((transaction) => (
                        <Card key={transaction.id} className="p-3 bg-gradient-to-r from-orange-50/80 via-white/80 to-white/60 backdrop-blur-sm border border-orange-200/50 hover:shadow-xl hover:shadow-orange-200/30 transition-all duration-300 rounded-2xl group cursor-pointer hover:scale-[1.01] hover:bg-gradient-to-r hover:from-orange-50 hover:via-white hover:to-white">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 shadow-md shadow-orange-200/30 group-hover:shadow-lg group-hover:shadow-orange-200/40 transition-all duration-300 shrink-0 border border-orange-200/50">
                                <span className="text-base">{dummyCategoryIcons[transaction.category] || "💳"}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors truncate text-sm mb-1">{transaction.description}</h3>
                                <div className="space-y-0.5">
                                  <div className="text-xs text-gray-600">
                                    {truncateText(getAccountName(transaction.account_id), 20)}
                                  </div>
                                  {transaction.next_due_date && (
                                    <div className="text-xs text-orange-600 font-medium">
                                      {formatDueDate(transaction.next_due_date)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-bold text-orange-600 mb-1">
                                {formatCurrency(-transaction.amount)}
                              </p>
                              <Badge variant="outline" className="text-xs border-orange-200/70 text-orange-700 bg-orange-50/50 font-medium px-2 py-1">
                                {transaction.frequency ? `${transaction.frequency}` : 'Una volta'}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Regular Recurring Transactions Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-500" />
                  Abbonamenti e Pagamenti Ricorrenti
                </h2>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {filteredRecurrentData.recurrent.length} attivi
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredRecurrentData.recurrent.map((transaction) => (
                  <Card key={transaction.id} className="p-4 bg-gradient-to-r from-blue-50/80 via-white/80 to-white/60 backdrop-blur-sm border border-blue-200/50 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-300 rounded-2xl group cursor-pointer hover:scale-[1.01] hover:bg-gradient-to-r hover:from-blue-50 hover:via-white hover:to-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 shadow-md shadow-blue-200/30 group-hover:shadow-lg group-hover:shadow-blue-200/40 transition-all duration-300 shrink-0 border border-blue-200/50">
                          <span className="text-base">{dummyCategoryIcons[transaction.category] || "💳"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors truncate text-sm mb-1">{transaction.description}</h3>
                          <div className="text-xs text-gray-600">
                            {truncateText(getAccountName(transaction.account_id), 20)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-blue-600 mb-1">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs border-blue-200/70 text-blue-700 bg-blue-50/50 font-medium px-2 py-1">
                          {transaction.frequency || 'Una volta'}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNavigation />
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