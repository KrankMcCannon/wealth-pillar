"use client";

import { ArrowLeft, MoreVertical, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNavigation from "@/components/bottom-navigation";

export default function BudgetsPage() {
  const [selectedBudget, setSelectedBudget] = useState("all");
  const router = useRouter();
  
  // Sample data for budgets
  const budgets = [
    { id: 1, name: "Groceries", amount: 500, spent: 350, color: "bg-green-500", icon: "🛒" },
    { id: 2, name: "Entertainment", amount: 300, spent: 250, color: "bg-yellow-500", icon: "🎬" },
    { id: 3, name: "Shopping", amount: 800, spent: 400, color: "bg-blue-500", icon: "🛍️" },
    { id: 4, name: "Transportation", amount: 200, spent: 180, color: "bg-purple-500", icon: "🚗" },
    { id: 5, name: "Utilities", amount: 300, spent: 250, color: "bg-red-500", icon: "⚡" }
  ];

  // Get current budget data based on selection
  const getCurrentBudgetData = () => {
    if (selectedBudget === "all") {
      const totalBudgetAmount = budgets.reduce((sum, budget) => sum + budget.amount, 0);
      const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
      return {
        name: "All Budgets",
        amount: totalBudgetAmount,
        spent: totalSpent,
        available: totalBudgetAmount - totalSpent,
        icon: "💰"
      };
    } else {
      const budget = budgets.find(b => b.id.toString() === selectedBudget);
      if (budget) {
        return {
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent,
          available: budget.amount - budget.spent,
          icon: budget.icon
        };
      }
    }
    return { name: "All Budgets", amount: 0, spent: 0, available: 0, icon: "💰" };
  };

  const currentBudget = getCurrentBudgetData();
  const progressPercentage = currentBudget.amount > 0 ? (currentBudget.spent / currentBudget.amount) * 100 : 0;

  // Sample expense data for line graph (last 7 days)
  const expenseData = [45, 52, 48, 61, 55, 67, 73];
  const incomeData = [120, 0, 0, 250, 0, 180, 0];

  // Sample daily expense data with categories (last 7 days)
  const dailyExpenseData = [
    { day: "Mon", groceries: 25, entertainment: 15, shopping: 5 },
    { day: "Tue", groceries: 30, entertainment: 20, shopping: 2 },
    { day: "Wed", groceries: 20, entertainment: 18, shopping: 10 },
    { day: "Thu", groceries: 35, entertainment: 16, shopping: 10 },
    { day: "Fri", groceries: 25, entertainment: 20, shopping: 10 },
    { day: "Sat", groceries: 30, entertainment: 25, shopping: 12 },
    { day: "Sun", groceries: 40, entertainment: 18, shopping: 15 }
  ];

  const categories = [
    { name: "Groceries", color: "#10b981" },
    { name: "Entertainment", color: "#f59e0b" },
    { name: "Shopping", color: "#3b82f6" },
    { name: "Transportation", color: "#8b5cf6" },
    { name: "Utilities", color: "#ef4444" }
  ];

  // Sample transactions for the period
  const transactions = [
    { id: 1, title: "Grocery Store", category: "Groceries", amount: 45, date: "2024-01-15" },
    { id: 2, title: "Movie Theater", category: "Entertainment", amount: 25, date: "2024-01-14" },
    { id: 3, title: "Online Shopping", category: "Shopping", amount: 89, date: "2024-01-13" },
    { id: 4, title: "Gas Station", category: "Transportation", amount: 35, date: "2024-01-12" },
    { id: 5, title: "Electricity Bill", category: "Utilities", amount: 120, date: "2024-01-10" }
  ];

  const maxExpense = Math.max(...expenseData);
  const maxIncome = Math.max(...incomeData);

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col" style={{fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC'}}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-[#7578EC]/10 text-[#7578EC]"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* Center - Title */}
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Budgets</h1>
          
          {/* Right - Three dots menu */}
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
                <span className="mr-2">💰</span>
                Add New Budget
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <span className="mr-2">🏷️</span>
                Add New Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Divider Line */}
      <div className="h-px bg-gray-200 mx-4"></div>

      <main className="flex-1 p-4 space-y-6 pb-20">
        {/* Budget Selector */}
        <section className="bg-white px-4 py-4 shadow-sm rounded-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Budget Overview</h2>
              <p className="text-sm text-gray-500">Select a budget to view details</p>
            </div>
            <Select value={selectedBudget} onValueChange={setSelectedBudget}>
              <SelectTrigger className="w-52 h-11 bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-xl px-4 hover:border-[#7578EC]/40 focus:border-[#7578EC] focus:ring-2 focus:ring-[#7578EC]/20 transition-all">
                <SelectValue placeholder="Select budget" className="font-medium text-gray-700" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-xl p-2 min-w-52">
                <SelectItem 
                  value="all"
                  className="hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors font-medium"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💰</span>
                    <span>All Budgets</span>
                  </div>
                </SelectItem>
                {budgets.map((budget) => (
                  <SelectItem 
                    key={budget.id} 
                    value={budget.id.toString()}
                    className="hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{budget.icon}</span>
                      <span>{budget.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Budget Display */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{currentBudget.icon}</span>
              <h3 className="text-lg font-medium text-gray-700">{currentBudget.name}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">Available Amount</p>
            <p className={`text-3xl font-bold ${currentBudget.available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Math.abs(currentBudget.available).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              of ${currentBudget.amount.toLocaleString('en-US')} budgeted
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spent: ${currentBudget.spent.toLocaleString('en-US')}</span>
              <span className="text-gray-600">{progressPercentage.toFixed(1)}% used</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-700 ${
                  progressPercentage >= 100 ? 'bg-red-500' : 
                  progressPercentage >= 80 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`} 
                style={{width: `${Math.min(progressPercentage, 100)}%`}}
              />
            </div>
          </div>
        </section>

        {/* Expense and Income Cards */}
        <section className="grid grid-cols-2 gap-4">
          {/* Expense Card */}
          <Card className="gap-0 p-4 bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Expenses</h3>
            </div>
            
            {/* Simple line graph visualization */}
            <div className="h-20 flex items-end justify-between mb-4 px-1">
              {expenseData.map((value, index) => (
                <div
                  key={index}
                  className="w-3 bg-gradient-to-t from-red-500 to-red-400 rounded-t shadow-sm"
                  style={{ height: `${(value / maxExpense) * 100}%` }}
                />
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                ${currentBudget.spent.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-gray-500 font-medium">This period</p>
            </div>
          </Card>

          {/* Income Card */}
          <Card className="gap-0 p-4 bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Income</h3>
            </div>
            
            {/* Simple line graph visualization */}
            <div className="h-20 flex items-end justify-between mb-4 px-1">
              {incomeData.map((value, index) => (
                <div
                  key={index}
                  className="w-3 bg-gradient-to-t from-green-500 to-green-400 rounded-t shadow-sm"
                  style={{ height: value > 0 ? `${(value / maxIncome) * 100}%` : '3px' }}
                />
              ))}
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${incomeData.reduce((sum, val) => sum + val, 0).toLocaleString('en-US')}
              </p>
              <p className="text-xs text-gray-500 font-medium">This period</p>
            </div>
          </Card>
        </section>

        {/* Daily Expense Bar Graph */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Daily Expenses by Category</h3>
          </div>
          
          <Card className="p-3 bg-white shadow-sm border border-gray-200">
            {/* Bar Graph */}
            <div className="flex items-end justify-between gap-3 px-3">
              {dailyExpenseData.map((day, index) => {
                const total = day.groceries + day.entertainment + day.shopping;
                const maxTotal = Math.max(...dailyExpenseData.map(d => d.groceries + d.entertainment + d.shopping));
                const barHeight = Math.max((total / maxTotal) * 120, 8);
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="flex-1 flex flex-col justify-end">
                      <div 
                        className="w-10 flex flex-col rounded-t overflow-hidden shadow-sm"
                        style={{ height: `${barHeight}px` }}
                      >
                        <div 
                          className="bg-gradient-to-t from-green-500 to-green-400"
                          style={{ height: `${(day.groceries / total) * 100}%` }}
                        />
                        <div 
                          className="bg-gradient-to-t from-yellow-500 to-yellow-400"
                          style={{ height: `${(day.entertainment / total) * 100}%` }}
                        />
                        <div 
                          className="bg-gradient-to-t from-blue-500 to-blue-400"
                          style={{ height: `${(day.shopping / total) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 mt-3">{day.day}</span>
                    <span className="text-xs text-gray-400">${total}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 justify-center pt-3 border-t border-gray-100">
              {categories.slice(0, 3).map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Total Transactions Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Recent Transactions</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm font-medium text-[#7578EC] hover:text-[#7578EC] hover:bg-[#7578EC]/10"
              onClick={() => router.push('/transactions?from=budgets')}
            >
              View All →
            </Button>
          </div>
          
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const category = categories.find(c => c.name === transaction.category);
              
              return (
                <Card key={transaction.id} className="px-4 py-3 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: category?.color || '#6b7280' }}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{transaction.title}</h4>
                        <p className="text-sm text-gray-500">{transaction.category} • {new Date(transaction.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-red-600">
                      -${transaction.amount.toLocaleString('en-US')}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
      
      <BottomNavigation />
    </div>
  );
}