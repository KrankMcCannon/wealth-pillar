"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MoreVertical, Plus, Filter, Clock, RotateCcw, Calendar, Search, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BottomNavigation from "../../../components/bottom-navigation";
import {
  currentUserPlan,
  membersData,
  upcomingTransactionsList,
  recurrentTransactions
} from "@/lib/dummy-data";
import {
  getMemberDataById,
  filterTransactions,
  canManageGroup,
  parseFiltersFromUrl,
  applySearchFilter,
  getTotalForSection,
  formatCurrency,
  formatDateLabel
} from "@/lib/utils";
import { FilterState, CommonCategories, CategoryIcons } from "@/lib/types";

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

  // Get current member data with improved logic
  const currentMemberData = useMemo(() => {
    return getMemberDataById(membersData, selectedGroupFilter);
  }, [selectedGroupFilter]);

  const allTransactions = useMemo(() => {
    return currentMemberData?.transactions || [];
  }, [currentMemberData]);

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

  // Use centralized recurrent transaction data
  const filteredRecurrentData = useMemo(() => {
    if (selectedGroupFilter === 'all') {
      return {
        upcoming: upcomingTransactionsList,
        recurrent: recurrentTransactions
      };
    }

    return {
      upcoming: upcomingTransactionsList.filter(t => t.memberId === selectedGroupFilter),
      recurrent: recurrentTransactions.filter(t => t.memberId === selectedGroupFilter)
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
    <div className="relative flex size-full min-h-[100dvh] flex-col" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-[#7578EC]/10 text-[#7578EC]"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Center - Title */}
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Transazioni</h1>

          {/* Right - Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-[#7578EC]/10 text-[#7578EC]">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-xl p-2"
              sideOffset={8}
            >
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <Plus className="mr-2 h-4 w-4" />
                Aggiungi Transazione
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <RotateCcw className="mr-2 h-4 w-4" />
                Aggiungi Transazione Ricorrente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 bg-white/50 backdrop-blur-sm rounded-xl p-1">
          {[{ key: "Transactions", label: "Transazioni" }, { key: "Recurrent", label: "Ricorrenti" }].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.key
                ? "bg-[#7578EC] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Group Selector - Only for superadmin and admin */}
      {canManageGroup(currentUserPlan.type) && (
        <section className="bg-[#F8FAFC] px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-4 w-4 text-[#7578EC]" />
            <h3 className="text-sm font-medium text-gray-700">Visualizza Transazioni per:</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[{ id: 'all', name: 'Tutti i Membri', avatar: '👥' }, ...membersData].map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  setFilters(prev => ({ ...prev, member: member.id }));
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedGroupFilter === member.id
                    ? "bg-[#7578EC] text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="text-sm">{member.avatar}</span>
                {member.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Divider Line */}
      <div className="h-px bg-gray-200 mx-4"></div>

      <main className="flex-1 p-4 space-y-6 pb-20">
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
                      Membro: {membersData.find(m => m.id === searchParams.get('member'))?.name || searchParams.get('member')}
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

        {/* Search and Filter System */}
        {activeTab === "Transactions" && (
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca transazioni..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full pl-10 bg-white border-gray-200 focus:border-[#7578EC] focus:ring-[#7578EC]/20 h-10"
              />
            </div>

            {/* Rounded Filter Button */}
            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`rounded-full border-gray-200 hover:bg-[#7578EC]/10 hover:border-[#7578EC]/40 w-10 h-10 p-0 ${(selectedFilter !== "All" || selectedCategory !== "Tutte le Categorie" || searchQuery !== "")
                      ? "bg-[#7578EC] text-white hover:bg-[#7578EC]/90"
                      : "bg-white"
                    }`}
                >
                  <Filter
                    className={`h-4 w-4 ${(selectedFilter !== "All" || selectedCategory !== "Tutte le Categorie" || searchQuery !== "")
                        ? "fill-current"
                        : ""
                      }`}
                  />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-white">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-[#7578EC]" />
                    Filtra Transazioni
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 pt-4">
                  {/* Transaction Type Filter */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Tipo Transazione</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ key: "All", label: "Tutti" }, { key: "Income", label: "Entrate" }, { key: "Expenses", label: "Spese" }].map((type) => (
                        <Button
                          key={type.key}
                          variant={selectedFilter === type.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFilter(type.key)}
                          className={selectedFilter === type.key
                            ? "bg-[#7578EC] hover:bg-[#7578EC]/90 text-white"
                            : "bg-white hover:bg-[#7578EC]/10 hover:text-[#7578EC]"
                          }
                        >
                          {type.key === "All" && "📊"}
                          {type.key === "Income" && "💚"}
                          {type.key === "Expenses" && "💸"}
                          <span className="ml-1">{type.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Categoria</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: "Tutte le Categorie", icon: "📋" },
                        ...CommonCategories.slice(0, 5).map(cat => ({
                          name: cat,
                          icon: CategoryIcons[cat] || "📊"
                        }))
                      ].map((category) => (
                        <Button
                          key={category.name}
                          variant={selectedCategory === category.name ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(category.name)}
                          className={`justify-start ${selectedCategory === category.name
                            ? "bg-[#7578EC] hover:bg-[#7578EC]/90 text-white"
                            : "bg-white hover:bg-[#7578EC]/10 hover:text-[#7578EC]"
                            }`}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Reset Filters Button */}
                  <div className="pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFilter("All");
                        setSelectedCategory("Tutte le Categorie");
                        setSearchQuery("");
                      }}
                      className="w-full text-gray-600 hover:text-[#7578EC] hover:bg-[#7578EC]/10"
                    >
                      Ripristina Tutti i Filtri
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
                  <div className="flex items-center justify-between mb-4">
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
                      <Card key={transaction.id} className="p-3 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-full bg-[#EFF2FE] text-[#7578EC]">
                              <span className="text-lg">{transaction.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{transaction.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{transaction.category}</span>
                                <span>•</span>
                                <span>{transaction.account}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  In Scadenza
                </h2>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  {filteredRecurrentData.upcoming.length} pagamenti
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredRecurrentData.upcoming.map((transaction) => (
                  <Card key={transaction.id} className="p-3 bg-gradient-to-r from-orange-50 to-white border border-orange-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                          <span className="text-lg">{transaction.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{transaction.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium text-orange-600">
                              {transaction.daysLeft} giorn{transaction.daysLeft !== 1 ? 'i' : 'o'} rimasti
                            </span>
                            <span>•</span>
                            <span>{transaction.account}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          {formatCurrency(-transaction.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                          {transaction.category}
                        </Badge>
                      </div>
                    </div>
                  </Card>
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
                  <Card key={transaction.id} className="p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <span className="text-lg">{transaction.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{transaction.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Prossimo: {new Date(transaction.nextDate).toLocaleDateString('it-IT')}</span>
                            <span>•</span>
                            <span>{transaction.account}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                          {transaction.frequency}
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