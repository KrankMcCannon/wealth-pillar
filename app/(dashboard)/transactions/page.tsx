"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MoreVertical, Plus, Filter, Clock, RotateCcw, Calendar, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { transactionsPageData, upcomingTransactionsList, recurrentTransactions } from "@/lib/dummy-data";
import BottomNavigation from "../../../components/bottom-navigation";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("Transactions");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we came from a specific source and set initial state
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
      router.push('/budgets');
    } else {
      router.back();
    }
  };

  // Calculate totals for each section
  const getTotalForSection = (transactions: any[]) => {
    return transactions.reduce((sum, tx) => {
      return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
    }, 0);
  };

  const todayTotal = getTotalForSection(transactionsPageData.today);
  const yesterdayTotal = getTotalForSection(transactionsPageData.yesterday);
  const thisWeekTotal = getTotalForSection(transactionsPageData.thisWeek);

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
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Transactions</h1>

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
                Add Transaction
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <RotateCcw className="mr-2 h-4 w-4" />
                Add Recurrent Transaction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-4 bg-white/50 backdrop-blur-sm rounded-xl p-1">
          {["Transactions", "Recurrent"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab
                ? "bg-[#7578EC] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Divider Line */}
      <div className="h-px bg-gray-200 mx-4"></div>

      <main className="flex-1 p-4 space-y-6 pb-20">
        {/* Enhanced Filter System */}
        {activeTab === "Transactions" && (
          <Card className="p-4 bg-white/50 backdrop-blur-sm border-gray-200/80">
            <div className="space-y-4">
              {/* Filter Title */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-medium text-gray-700">Filter Transactions</h3>
              </div>

              {/* Filter Dropdowns */}
              <div className="flex gap-3 flex-wrap">
                {/* Transaction Type Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white border-gray-200 hover:bg-[#7578EC]/10 hover:border-[#7578EC]/40"
                    >
                      <span className="mr-2">💱</span>
                      {selectedFilter}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-40 bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-xl p-2"
                    sideOffset={8}
                  >
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedFilter("All")}
                    >
                      <span className="mr-2">📊</span>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedFilter("Income")}
                    >
                      <span className="mr-2">💚</span>
                      Income
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedFilter("Expenses")}
                    >
                      <span className="mr-2">💸</span>
                      Expenses
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Category Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white border-gray-200 hover:bg-[#7578EC]/10 hover:border-[#7578EC]/40"
                    >
                      <span className="mr-2">🏷️</span>
                      {selectedCategory}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-48 bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-xl p-2"
                    sideOffset={8}
                  >
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory("All Categories")}
                    >
                      <span className="mr-2">📋</span>
                      All Categories
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory("Groceries")}
                    >
                      <span className="mr-2">🛒</span>
                      Groceries
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory("Entertainment")}
                    >
                      <span className="mr-2">🎬</span>
                      Entertainment
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory("Utilities")}
                    >
                      <span className="mr-2">⚡</span>
                      Utilities
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory("Transportation")}
                    >
                      <span className="mr-2">🚗</span>
                      Transportation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onClick={() => setSelectedCategory("Salary")}
                    >
                      <span className="mr-2">💰</span>
                      Salary
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        )}

        {/* Transactions Tab */}
        {activeTab === "Transactions" && (
          <div className="space-y-6">
            {/* Today Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-gray-900">Today</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Total:</span>
                  <span className={`text-sm font-bold ${todayTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {todayTotal >= 0 ? '+' : ''}${Math.abs(todayTotal).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {transactionsPageData.today.map((transaction) => (
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
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Yesterday Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-gray-900">Yesterday</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Total:</span>
                  <span className={`text-sm font-bold ${yesterdayTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {yesterdayTotal >= 0 ? '+' : ''}${Math.abs(yesterdayTotal).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {transactionsPageData.yesterday.map((transaction) => (
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
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* This Week Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-gray-900">This Week</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Total:</span>
                  <span className={`text-sm font-bold ${thisWeekTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {thisWeekTotal >= 0 ? '+' : ''}${Math.abs(thisWeekTotal).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {transactionsPageData.thisWeek.map((transaction) => (
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
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
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
                  Due Soon
                </h2>
                <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                  {upcomingTransactionsList.length} payments
                </Badge>
              </div>

              <div className="space-y-3">
                {upcomingTransactionsList.map((transaction) => (
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
                              {transaction.daysLeft} day{transaction.daysLeft !== 1 ? 's' : ''} left
                            </span>
                            <span>•</span>
                            <span>{transaction.account}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-600">
                          -${transaction.amount.toFixed(2)}
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
                  Subscriptions & Regular Payments
                </h2>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  {recurrentTransactions.length} active
                </Badge>
              </div>

              <div className="space-y-3">
                {recurrentTransactions.map((transaction) => (
                  <Card key={transaction.id} className="p-3 bg-gradient-to-r from-blue-50 to-white border border-blue-100 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <span className="text-lg">{transaction.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{transaction.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Next: {new Date(transaction.nextDate).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{transaction.account}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          ${transaction.amount.toFixed(2)}
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