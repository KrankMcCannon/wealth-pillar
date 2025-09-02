"use client";

import { Home, Wifi, CreditCard, Building2, PiggyBank, User, Settings, Bell, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import {
  currentUser,
  currentUserPlan,
  membersData,
  upcomingTransactionsData
} from "@/lib/dummy-data";
import {
  formatCurrency,
  getPlanBadgeColor,
  getMemberDataById,
  canManageGroup,
  convertMemberDataToBankAccounts,
  convertMemberDataToBudgets
} from "@/lib/utils";
import { AccountTypeMap } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");

  const planBadgeColor = getPlanBadgeColor(currentUserPlan.type);
  const planInfo = {
    name: currentUserPlan.name,
    color: planBadgeColor.split(' ')[1]
  };

  const currentMemberData = getMemberDataById(membersData, selectedGroupFilter);
  const bankAccounts = convertMemberDataToBankAccounts(currentMemberData);
  const budgets = convertMemberDataToBudgets(currentMemberData, selectedGroupFilter);
  const upcomingTransactions = upcomingTransactionsData[selectedGroupFilter as keyof typeof upcomingTransactionsData] || [];
  const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);

  const handleAccountClick = (id: string) => {
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
                <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                <p className={`text-xs ${planInfo.color}`}>{planInfo.name}</p>
              </div>
            </div>

            {/* Right - Settings and Notifications */}
            <div className="flex items-center gap-2">
              <button className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#EFF2FE] hover:bg-[#7578EC]/10 transition-colors">
                <Bell className="h-5 w-5 text-[#7578EC]" />
              </button>
              <button
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#EFF2FE] hover:bg-[#7578EC]/10 transition-colors"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-5 w-5 text-[#7578EC]" />
              </button>
            </div>
          </div>
        </header>

        {/* Group Selector - Only for superadmin and admin */}
        {canManageGroup(currentUserPlan.type) && (
          <section className="bg-[#F8FAFC] px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-4 w-4 text-[#7578EC]" />
              <h3 className="text-sm font-medium text-gray-700">Visualizza Dati per:</h3>
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[{ id: 'all', name: 'Tutti i Membri', avatar: '👥' }, ...membersData].map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedGroupFilter(member.id)}
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

        <main className="pb-16">
          {/* Total Balance Section - Different Background */}
          <section className="bg-white px-4 py-6 shadow-sm">
            {/* Total Balance and Bank Accounts Count */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Saldo Totale</p>
                <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(totalBalance))}
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
                  // Map icon names to components
                  const iconMap = {
                    "Building2": Building2,
                    "PiggyBank": PiggyBank,
                    "CreditCard": CreditCard
                  };
                  const IconComponent = iconMap[account.icon as keyof typeof iconMap] || Building2;

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
                        <div className="flex flex-col flex-1 mx-3">
                          <h3 className="font-semibold text-gray-900 text-sm">{account.name}</h3>
                          <p className="text-xs text-gray-500">{AccountTypeMap[account.type as keyof typeof AccountTypeMap] || account.type}</p>
                        </div>

                        {/* Right - Amount */}
                        <div className="flex flex-col text-right">
                          <p className={`text-base font-bold ${account.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(Math.abs(account.balance))}
                          </p>
                          {account.balance < 0 && (
                            <p className="text-xs text-red-500 font-medium">DEBITO</p>
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
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Budget</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[#7578EC] hover:text-[#7578EC] hover:bg-[#7578EC]/10"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedGroupFilter !== 'all') {
                      params.set('member', selectedGroupFilter);
                    }
                    const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
                    router.push(url);
                  }}
                >
                  Vai a
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {budgets.length > 0 ? (
                <Card className="bg-white shadow-sm border border-gray-200 py-0">
                  <div className="divide-y divide-gray-100">
                    {budgets.map((budget) => {
                    return (
                      <div
                        key={budget.id}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set('budget', budget.id);
                          if (selectedGroupFilter !== 'all') {
                            params.set('member', selectedGroupFilter);
                          }
                          router.push(`/budgets?${params.toString()}`);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`flex size-10 items-center justify-center rounded-full ${budget.color} bg-opacity-10`}>
                              <span className="text-lg">{budget.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(budget.spent)} di {formatCurrency(budget.amount)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${(budget.amount - budget.spent) <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {(budget.amount - budget.spent) <= 0 ? 'Budget superato' : `${formatCurrency(budget.amount - budget.spent)} rimanenti`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nessun budget trovato</p>
                </div>
              )}
            </section>

            {/* Upcoming Transactions Section */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Transazioni Programmate</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[#7578EC] hover:text-[#7578EC] hover:bg-[#7578EC]/10"
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('from', 'dashboard');
                    params.set('tab', 'recurrent');
                    if (selectedGroupFilter !== 'all') {
                      params.set('member', selectedGroupFilter);
                    }
                    router.push(`/transactions?${params.toString()}`);
                  }}
                >
                  Vai a
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {upcomingTransactions.map((transaction) => {
                  // Map icon names to components
                  const iconMap = {
                    "Home": Home,
                    "Wifi": Wifi
                  };
                  const IconComponent = iconMap[transaction.icon as keyof typeof iconMap] || Home;

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
                              <p className="text-sm text-gray-500">{transaction.bankAccount} • {transaction.daysRemaining} giorni rimanenti</p>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-bold text-red-600">
                              -{formatCurrency(transaction.amount)}
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