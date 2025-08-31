"use client";

import { ShoppingCart, Home, Wifi, CreditCard, Building2, PiggyBank, User, Settings, Bell, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";

export default function DashboardPage() {
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null);
  const router = useRouter();

  const bankAccounts = [
    {
      id: 1,
      name: "Checking",
      type: "Current Account",
      owner: "Alex Morgan",
      balance: 12450.50,
      icon: Building2,
      color: "bg-blue-500"
    },
    {
      id: 2,
      name: "Savings",
      type: "Savings Account",
      owner: "Alex Morgan",
      balance: 35820.00,
      icon: PiggyBank,
      color: "bg-green-500"
    },
    {
      id: 3,
      name: "Credit Card",
      type: "Credit Card",
      owner: "Alex Morgan",
      balance: -2100.30,
      icon: CreditCard,
      color: "bg-red-500"
    }
  ];

  const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);

  const budgets = [
    {
      id: 1,
      name: "Groceries",
      amount: 500,
      spent: 350,
      color: "bg-green-500",
      icon: "🛒",
      categories: [
        { name: "Supermarket", transactions: 12, amount: 280 },
        { name: "Restaurants", transactions: 5, amount: 70 }
      ]
    },
    {
      id: 2,
      name: "Entertainment",
      amount: 300,
      spent: 250,
      color: "bg-yellow-500",
      icon: "🎬",
      categories: [
        { name: "Movies", transactions: 4, amount: 120 },
        { name: "Concerts", transactions: 2, amount: 130 }
      ]
    },
    {
      id: 3,
      name: "Shopping",
      amount: 800,
      spent: 400,
      color: "bg-blue-500",
      icon: "🛍️",
      categories: [
        { name: "Clothing", transactions: 8, amount: 300 },
        { name: "Electronics", transactions: 3, amount: 100 }
      ]
    }
  ];

  // Upcoming transactions for the next 3 days
  const upcomingTransactions = [
    {
      id: 1,
      title: "Rent Payment",
      bankAccount: "Checking",
      daysRemaining: 1,
      amount: 1200,
      icon: Home
    },
    {
      id: 2,
      title: "Internet Bill",
      bankAccount: "Checking", 
      daysRemaining: 2,
      amount: 50,
      icon: Wifi
    },
    {
      id: 3,
      title: "Grocery Shopping",
      bankAccount: "Credit Card",
      daysRemaining: 3,
      amount: 120,
      icon: ShoppingCart
    }
  ];

  const handleAccountClick = (id: number) => {
    setExpandedAccount(expandedAccount === id ? null : id);
  };

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC' }}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            {/* Left - User Profile */}
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EFF2FE]">
                <User className="h-5 w-5 text-[#7578EC]" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-900">Alex Morgan</p>
                <p className="text-xs text-gray-500">Premium Plan</p>
              </div>
            </div>

            {/* Right - Settings and Notifications */}
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#EFF2FE] hover:bg-[#7578EC]/10 transition-colors">
                <Bell className="h-5 w-5 text-[#7578EC]" />
              </button>
              <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#EFF2FE] hover:bg-[#7578EC]/10 transition-colors">
                <Settings className="h-5 w-5 text-[#7578EC]" />
              </button>
            </div>
          </div>
        </header>

        <main className="pb-16">
          {/* Total Balance Section - Different Background */}
          <section className="bg-white px-4 py-6 shadow-sm">
            {/* Total Balance and Bank Accounts Count */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Balance</p>
                <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(totalBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#7578EC]" />
                <p className="text-sm text-gray-600">{bankAccounts.length}</p>
              </div>
            </div>

            {/* Horizontal Bank Accounts Slider */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 pb-2">
                {bankAccounts.map((account) => {
                  const IconComponent = account.icon;

                  return (
                    <Card
                      key={account.id}
                      className="px-3 py-2 min-w-[180px] flex-shrink-0 bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handleAccountClick(account.id)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left - Icon */}
                        <div className={`flex size-10 items-center justify-center rounded-full ${account.color} bg-opacity-10`}>
                          <IconComponent className={`h-5 w-5 ${account.color.replace('bg-', 'text-')}`} />
                        </div>
                        
                        {/* Center - Title and Type */}
                        <div className="flex flex-col items-center text-center flex-1 mx-3">
                          <h3 className="font-semibold text-gray-900 text-sm">{account.name}</h3>
                          <p className="text-xs text-gray-500">{account.type}</p>
                        </div>
                        
                        {/* Right - Amount */}
                        <div className="flex flex-col text-right">
                          <p className={`text-base font-bold ${account.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          {account.balance < 0 && (
                            <p className="text-xs text-red-500 font-medium">DEBT</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Divider Line */}
          <div className="h-px bg-gray-200 mx-4"></div>

          {/* Lower Sections with Different Background */}
          <div className="bg-[#F8FAFC] px-4 pt-4">
            {/* Budget Section */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Budgets</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm font-medium text-[#7578EC] hover:text-[#7578EC] hover:bg-[#7578EC]/10"
                  onClick={() => router.push('/budgets')}
                >
                  Go to
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              
              <Card className="bg-white shadow-sm border border-gray-200 py-0">
                <div className="divide-y divide-gray-100">
                  {budgets.map((budget) => {
                    return (
                      <div key={budget.id} className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`flex size-10 items-center justify-center rounded-full ${budget.color} bg-opacity-10`}>
                              <span className="text-lg">{budget.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                              <p className="text-sm text-gray-500">
                                ${budget.spent} of ${budget.amount}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${(budget.amount - budget.spent) <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ${(budget.amount - budget.spent).toFixed(0)} left
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>

            {/* Upcoming Transactions Section */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Upcoming Transactions</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-sm font-medium text-[#7578EC] hover:text-[#7578EC] hover:bg-[#7578EC]/10"
                  onClick={() => router.push('/transactions?from=dashboard&tab=recurrent')}
                >
                  Go to
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {upcomingTransactions.map((transaction) => {
                  const IconComponent = transaction.icon;
                  
                  return (
                    <Card key={transaction.id} className="bg-white shadow-sm border border-gray-200 py-0">
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#EFF2FE] text-[#7578EC]">
                              <IconComponent className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{transaction.title}</h3>
                              <p className="text-sm text-gray-500">{transaction.bankAccount} • {transaction.daysRemaining} days remaining</p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-red-600">
                              -${transaction.amount.toLocaleString('en-US')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}