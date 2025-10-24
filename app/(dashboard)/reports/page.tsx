"use client";

import { SectionHeader } from "@/components/layout";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { PageLoader } from "@/components/shared";
import UserSelector from "@/components/shared/user-selector";
import { useReportsController } from "@/features/dashboard/hooks/use-reports-controller";
import { formatCurrency } from "@/lib";
import { Calendar, PieChart, Target, Clock } from "lucide-react";

export default function ReportsPage() {
  // Controller orchestrates all business logic
  const {
    currentUser,
    selectedViewUserId,
    users,
    financialData,
    isLoading,
    updateViewUserId,
    handleBackClick,
  } = useReportsController();

  // Show loader while data is loading
  if (isLoading) {
    return <PageLoader message="Caricamento report..." />;
  }

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              className="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors"
              onClick={handleBackClick}
            >
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
              iconClassName="text-primary"
              className="mb-4"
            />
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm mb-1">Total Income</p>
                  <p className="text-2xl font-bold text-primary">
                    {financialData ? formatCurrency(financialData.totalIncome) : '€0'}
                  </p>
                  <p className="text-xs text-primary">This month</p>
                </div>
                <div className="text-center">
                  <p className="text-sm mb-1">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600">
                    {financialData ? formatCurrency(financialData.totalExpenses) : '€0'}
                  </p>
                  <p className="text-xs text-red-600">This month</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm mb-1">Net Savings</p>
                <p className={`text-3xl font-bold ${
                  financialData && financialData.netSavings >= 0
                    ? 'text-primary'
                    : 'text-red-600'
                }`}>
                  {financialData ? formatCurrency(financialData.netSavings) : '€0'}
                </p>
                <p className="text-xs">This month</p>
              </div>
            </div>
          </section>

          {/* Spending by Category */}
          <section className="mb-6">
            <SectionHeader
              title="Spending by Category"
              icon={PieChart}
              iconClassName="text-primary"
              className="mb-4"
            />
            <div className="space-y-3">
              {financialData && financialData.categoryData.length > 0 ? (
                financialData.categoryData.map((category, index) => {
                  const colors = [
                    { bg: 'bg-primary', text: 'text-blue-500' },
                    { bg: 'bg-primary', text: 'text-green-500' },
                    { bg: 'bg-yellow-500', text: 'text-yellow-500' },
                    { bg: 'bg-purple-500', text: 'text-purple-500' },
                    { bg: 'bg-red-500', text: 'text-red-500' }
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <div key={category.category} className="bg-card rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${color.bg}`}></div>
                          <span className="text-sm font-medium capitalize">
                            {category.category}
                          </span>
                        </div>
                        <span className="text-sm font-bold">
                          {formatCurrency(category.amount)}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`${color.bg} h-2 rounded-full`}
                          style={{ width: `${Math.round(category.percentage)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs mt-1">
                        {Math.round(category.percentage)}% of total expenses
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-card rounded-xl p-6 shadow-sm text-center">
                  <p>No expense data available for this month</p>
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
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium">Annual Goal</span>
                <span className="text-sm font-bold">
                  {financialData ? formatCurrency(financialData.savingsGoal) : '€15,000'}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full ${
                    financialData && financialData.yearSavings >= 0
                      ? 'bg-primary'
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
                    ? 'text-primary'
                    : 'text-red-600'
                }`}>
                  {financialData ? formatCurrency(financialData.yearSavings) : '€0'} saved
                </span>
                <span>
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
              <button className="flex flex-col items-center gap-2 bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#7578EC] text-white">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M216,40H136V24a8,8,0,0,0-16,0V40H40A16,16,0,0,0,24,56V176a16,16,0,0,0,16,16H79.36L57.75,219a8,8,0,0,0,12.5,10l29.59-37h56.32l29.59,37a8,8,0,1,0,12.5-10l-21.61-27H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,136H40V56H216V176ZM104,120v24a8,8,0,0,1-16,0V120a8,8,0,0,1,16,0Zm32-16v40a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm32-16v56a8,8,0,0,1-16,0V88a8,8,0,0,1,16,0Z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Export Report</span>
              </button>
              
              <button className="flex flex-col items-center gap-2 bg-card rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary text-white">
                  <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm48-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V88a8,8,0,0,1,16,0v32h32A8,8,0,0,1,176,128Z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium">Set Goals</span>
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
