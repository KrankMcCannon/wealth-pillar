"use client";

import BottomNavigation from "../../../components/bottom-navigation";
import { SectionHeader } from "@/components/section-header";
import UserSelector from "@/components/user-selector";
import { Calendar, PieChart, Target, Clock } from "lucide-react";
import { useMemo } from "react";
import { useTransactions, useUserSelection } from "@/hooks";
import { formatCurrency } from "@/lib/utils";

export default function ReportsPage() {
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();

  // Use centralized user selection
  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading
  } = useUserSelection();


  // Calculate real financial data based on selected user/group filter
  const financialData = useMemo(() => {
    if (!currentUser) return null;

    // Filter transactions based on selected group filter
    const filteredTransactions = selectedViewUserId === 'all'
      ? transactions
      : transactions.filter(tx => tx.user_id === selectedViewUserId);

    // Calculate current month data
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthTransactions = filteredTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const totalIncome = currentMonthTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const netSavings = totalIncome - totalExpenses;

    // Calculate expenses by category
    const expensesByCategory = currentMonthTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {} as Record<string, number>);

    // Convert to array and sort by amount
    const categoryData = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories

    // Calculate annual savings progress
    const yearStart = new Date(currentYear, 0, 1);
    const yearTransactions = filteredTransactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= yearStart;
    });

    const yearIncome = yearTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const yearExpenses = yearTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const yearSavings = yearIncome - yearExpenses;
    const savingsGoal = 15000; // This could come from user preferences
    const savingsProgress = Math.min((yearSavings / savingsGoal) * 100, 100);

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      categoryData,
      yearSavings,
      savingsGoal,
      savingsProgress
    };
  }, [currentUser, transactions, selectedViewUserId]);

  const isLoading = userSelectionLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7578EC]"></div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button className="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors">
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 className="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Reports</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <UserSelector
          users={users}
          currentUser={currentUser}
          selectedGroupFilter={selectedViewUserId}
          onGroupFilterChange={updateViewUserId}
        />

        <main className="p-4 pb-24">
          {/* Monthly Overview */}
          <section className="mb-6">
            <SectionHeader
              title="Monthly Overview"
              icon={Calendar}
              iconClassName="text-blue-600"
              className="mb-4"
            />
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    {financialData ? formatCurrency(financialData.totalIncome) : '€0'}
                  </p>
                  <p className="text-xs text-green-600">This month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {financialData ? formatCurrency(financialData.totalExpenses) : '€0'}
                  </p>
                  <p className="text-xs text-red-600">This month</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Net Savings</p>
                <p className={`text-3xl font-bold ${
                  financialData && financialData.netSavings >= 0
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`}>
                  {financialData ? formatCurrency(financialData.netSavings) : '€0'}
                </p>
                <p className="text-xs text-gray-600">This month</p>
              </div>
            </div>
          </section>

          {/* Spending by Category */}
          <section className="mb-6">
            <SectionHeader
              title="Spending by Category"
              icon={PieChart}
              iconClassName="text-green-600"
              className="mb-4"
            />
            <div className="space-y-3">
              {financialData && financialData.categoryData.length > 0 ? (
                financialData.categoryData.map((category, index) => {
                  const colors = [
                    { bg: 'bg-blue-500', text: 'text-blue-500' },
                    { bg: 'bg-green-500', text: 'text-green-500' },
                    { bg: 'bg-yellow-500', text: 'text-yellow-500' },
                    { bg: 'bg-purple-500', text: 'text-purple-500' },
                    { bg: 'bg-red-500', text: 'text-red-500' }
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <div key={category.category} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                          <span className="text-sm font-medium text-gray-800 capitalize">
                            {category.category}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${color.bg} h-2 rounded-full`}
                          style={{ width: `${Math.round(category.percentage)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round(category.percentage)}% of total expenses
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm text-center">
                  <p className="text-gray-500">No expense data available for this month</p>
                </div>
              )}
            </div>
          </section>

          {/* Savings Progress */}
          <section className="mb-6">
            <SectionHeader
              title="Savings Progress"
              icon={Target}
              iconClassName="text-emerald-600"
              className="mb-4"
            />
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-800">Annual Goal</span>
                <span className="text-sm font-bold text-gray-900">
                  {financialData ? formatCurrency(financialData.savingsGoal) : '€15,000'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full ${
                    financialData && financialData.yearSavings >= 0
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${financialData ? Math.max(0, Math.min(100, financialData.savingsProgress)) : 0}%`
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className={`font-medium ${
                  financialData && financialData.yearSavings >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {financialData ? formatCurrency(financialData.yearSavings) : '€0'} saved
                </span>
                <span className="text-gray-600">
                  {financialData ? Math.round(financialData.savingsProgress) : 0}% complete
                </span>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <SectionHeader
              title="Quick Actions"
              icon={Clock}
              iconClassName="text-purple-600"
              className="mb-4"
            />
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#7578EC] text-white">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176ZM104,120v24a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32-16v40a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v56a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Export Report</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-full bg-green-500 text-white">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-800">Set Goals</span>
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
