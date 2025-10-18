"use client";

import { CategoryIcon, iconSizes } from '@/lib/icons';
import { ArrowLeft, MoreVertical, ShoppingCart } from "lucide-react";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNavigation from "@/components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import { SectionHeader } from "@/components/section-header";
import { GroupedTransactionCard } from "@/components/grouped-transaction-card";
import { TransactionForm } from "@/components/transaction-form";
import { formatCurrency, pluralize } from "@/lib/utils";
import { BudgetPeriodManager } from "@/components/budget-period-manager";
import { BudgetForm } from "@/components/budget-form";
import { CategoryForm } from "@/components/category-form";
import { PageLoader } from "@/components/page-loader";
import { useBudgetsController } from "@/hooks/controllers/useBudgetsController";

function BudgetsContent() {
  // Controller orchestrates all business logic
  const {
    viewModel,
    budgets: availableBudgets,
    users,
    currentUser,
    selectedViewUserId,
    userNamesMap,
    accountNamesMap,
    selectedBudget,
    isDropdownOpen,
    isTransactionFormOpen,
    editingTransaction,
    transactionFormMode,
    isBudgetFormOpen,
    editingBudget,
    budgetFormMode,
    isCategoryFormOpen,
    isLoading,
    setIsDropdownOpen,
    setIsTransactionFormOpen,
    setIsBudgetFormOpen,
    setIsCategoryFormOpen,
    updateViewUserId,
    handleEditTransaction,
    handleDeleteTransaction,
    handleEditBudget,
    handleDeleteBudget,
    handleCreateBudget,
    handleCreateCategory,
    handleBudgetSelect,
    handleBackClick,
    getCurrentPeriodForUser
  } = useBudgetsController();

  // Show loader while data is loading
  if (isLoading) {
    return <PageLoader message="Caricamento budget..." />;
  }

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Center - Title */}
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Budget</h1>

          {/* Right - Three dots menu */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
              sideOffset={8}
            >
              <DropdownMenuItem
                className="text-sm font-medium text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                onSelect={() => {
                  handleCreateBudget();
                  setIsDropdownOpen(false);
                }}
              >
                <span className="mr-2">💰</span>
                Nuovo Budget
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-sm font-medium text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                onSelect={() => {
                  handleCreateCategory();
                  setIsDropdownOpen(false);
                }}
              >
                <span className="mr-2">🏷️</span>
                Nuova Categoria
              </DropdownMenuItem>
              {selectedBudget && (
                <BudgetPeriodManager
                  budget={selectedBudget}
                  currentPeriod={getCurrentPeriodForUser(selectedBudget.user_id) || null}
                  onSuccess={() => setIsDropdownOpen(false)}
                  trigger={
                    <DropdownMenuItem
                      className="text-sm font-medium text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="mr-2">📅</span>
                      Gestisci Periodi
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* User Selector */}
      <UserSelector
        users={users}
        currentUser={currentUser}
        selectedGroupFilter={selectedViewUserId}
        onGroupFilterChange={updateViewUserId}
      />

      {/* Divider Line */}
      <div className="h-px bg-gray-200 mx-4"></div>

      <main className="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-6 pb-20 sm:pb-24">
        {/* Show empty state or content */}
        {!selectedBudget ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#7578EC]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <ShoppingCart className="w-8 h-8 text-[#7578EC]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nessun budget disponibile</h3>
            <p className="text-slate-600 text-sm">Crea il tuo primo budget per iniziare</p>
          </div>
        ) : (
          <>
            {/* Budget Selector */}
            <section className="bg-white/90 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-6 shadow-lg shadow-slate-200/40 rounded-xl sm:rounded-2xl border border-slate-200/50">
              {/* Section Header */}
              <div className="mb-4">
                <SectionHeader
                  title="Budget"
                  subtitle="Seleziona per visualizzare i dettagli"
                  className="space-y-1"
                />
              </div>

              {/* Budget Selector */}
              <div className="mb-4">
                <Select value={selectedBudget?.id} onValueChange={handleBudgetSelect}>
                  <SelectTrigger className="w-full h-12 bg-white border border-slate-200 shadow-sm rounded-xl px-4 hover:border-[#7578EC]/40 focus:border-[#7578EC] focus:ring-2 focus:ring-[#7578EC]/20 transition-all text-sm font-medium">
                    <SelectValue placeholder="Seleziona budget" className="font-medium text-slate-700" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-xl min-w-[320px]">
                    {availableBudgets.map((budget) => (
                      <SelectItem
                        key={budget.id}
                        value={budget.id}
                        className="hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-7 cursor-pointer transition-colors font-medium"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#7578EC]/10 flex-shrink-0">
                            <CategoryIcon
                              categoryKey={budget.categories[0] || 'altro'}
                              size={iconSizes.sm}
                              className="text-[#7578EC]"
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-semibold truncate text-slate-800">
                              {budget.description}
                            </span>
                            {selectedViewUserId === 'all' && userNamesMap[budget.user_id] && (
                              <span className="text-xs text-slate-500 flex-shrink-0">({userNamesMap[budget.user_id]})</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Budget Display - Horizontal Layout */}
              <div className="mb-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl p-4">
                  {/* Budget Icon, Name and Period */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm">
                        <CategoryIcon
                          categoryKey={selectedBudget.categories[0] || 'altro'}
                          size={iconSizes.lg}
                          className="text-[#7578EC]"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedBudget.description}</h3>
                          {/* Budget Actions Dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-[#7578EC]/10 rounded-lg">
                                <MoreVertical className="h-4 w-4 text-slate-600" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-xl p-2">
                              <DropdownMenuItem
                                className="text-sm font-medium text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                                onSelect={() => handleEditBudget(selectedBudget)}
                              >
                                <span className="mr-2">✏️</span>
                                Modifica Budget
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                                onSelect={() => handleDeleteBudget(selectedBudget.id)}
                              >
                                <span className="mr-2">🗑️</span>
                                Elimina Budget
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">Budget attivo</p>
                      </div>
                    </div>
                    {/* Budget Period Date */}
                    {selectedBudget && getCurrentPeriodForUser(selectedBudget.user_id) && (
                      <div className="text-right">
                        {(() => {
                          const period = getCurrentPeriodForUser(selectedBudget.user_id)!;
                          return (
                            <>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Periodo</p>
                              <p className="text-xs font-medium text-slate-700 whitespace-nowrap">
                                {new Date(period.start_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - {period.end_date ? new Date(period.end_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : 'In corso'}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Financial Info - 3 Column Layout */}
                  {viewModel && viewModel.periodInfo ? (
                    <div className="grid grid-cols-3 gap-3">
                      {/* Available Amount */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Disponibile</p>
                        <p className={`text-lg sm:text-xl font-bold tracking-tight ${viewModel.financialMetrics.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(viewModel.financialMetrics.remaining)}
                        </p>
                      </div>

                      {/* Spent Amount */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Speso</p>
                        <p className="text-lg sm:text-xl font-bold tracking-tight text-red-600">
                          {formatCurrency(viewModel.financialMetrics.totalSpent)}
                        </p>
                      </div>

                      {/* Total Budget */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Totale</p>
                        <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-700">
                          {formatCurrency(viewModel.financialMetrics.totalBudgeted)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Available Amount */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Disponibile</p>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-600">
                          {formatCurrency(0)}
                        </p>
                      </div>

                      {/* Total Budget */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Totale</p>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-700">
                          {formatCurrency(selectedBudget?.amount || 0)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Section - Integrated */}
              {viewModel && (
                <div className="bg-white/60 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        viewModel.progressData.status === 'danger' ? 'bg-red-500' :
                        viewModel.progressData.status === 'warning' ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}></div>
                      <span className="text-sm font-semibold text-slate-700">
                        Progresso Budget
                      </span>
                    </div>
                    <span className={`text-xl font-bold ${
                      viewModel.progressData.status === 'danger' ? 'text-red-600' :
                      viewModel.progressData.status === 'warning' ? 'text-amber-600' :
                      'text-green-600'
                    }`}>{Math.round(viewModel.progressData.percentage)}%</span>
                  </div>

                  <div className="relative">
                    <div className="w-full h-3 rounded-full bg-slate-200">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ease-out ${
                          viewModel.progressData.status === 'danger' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          viewModel.progressData.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                          'bg-gradient-to-r from-green-400 to-green-500'
                        }`}
                        style={{ width: `${Math.min(viewModel.progressData.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="text-center">
                    <p className="text-xs text-slate-600">
                      {viewModel.progressData.status === 'danger' ? '⚠️ Budget superato' :
                       viewModel.progressData.status === 'warning' ? '⚠️ Attenzione, quasi esaurito' :
                       '✅ Budget sotto controllo'}
                    </p>
                  </div>
                </div>
              )}

            </section>

            {/* Expense Chart - Only show when transaction data is loaded */}
            {viewModel && (
            <section>
              <Card className="p-0 bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
                    {/* Header with amount and comparison */}
                    <div className="px-6 pt-5 pb-2 flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Hai speso</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrency(viewModel.financialMetrics.totalSpent)}
                        </p>
                      </div>
                      {viewModel.periodComparison && viewModel.periodComparison.previousTotal > 0 && (
                        <div className={`px-3 py-1.5 rounded-lg ${viewModel.periodComparison.isHigher ? 'bg-red-50' : 'bg-green-50'}`}>
                          <p className={`text-sm font-semibold ${viewModel.periodComparison.isHigher ? 'text-red-600' : 'text-green-600'}`}>
                            {viewModel.periodComparison.isHigher ? '+' : ''}{formatCurrency(viewModel.periodComparison.difference)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Revolut-style Line Chart */}
                    <div className="relative h-48 bg-white px-6 pb-8">
                      <svg className="w-full h-full" viewBox="0 0 350 180" preserveAspectRatio="none">
                        {/* Subtle horizontal grid lines */}
                        {[25, 50, 75].map((percent) => (
                          <line
                            key={percent}
                            x1="0"
                            y1={180 - (percent * 1.8)}
                            x2="350"
                            y2={180 - (percent * 1.8)}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Line for cumulative amounts - using pre-calculated data from viewModel */}
                        {viewModel.chartData.pathD && viewModel.chartData.data.length > 0 && (() => {
                          const visiblePoints = viewModel.chartData.data.filter(p => !p.isFuture);
                          const lastPoint = visiblePoints[visiblePoints.length - 1];

                          if (!lastPoint) return null;

                          return (
                            <>
                              {/* Subtle gradient fill under line */}
                              <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#7578EC', stopOpacity: 0.08 }} />
                                  <stop offset="100%" style={{ stopColor: '#7578EC', stopOpacity: 0 }} />
                                </linearGradient>
                              </defs>
                              <path
                                d={`${viewModel.chartData.pathD} L ${lastPoint.x} 180 L 0 180 Z`}
                                fill="url(#lineGradient)"
                              />

                              {/* Main smooth line */}
                              <path
                                d={viewModel.chartData.pathD}
                                fill="none"
                                stroke="#7578EC"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              {/* Dot at the end of line */}
                              <circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r="4"
                                fill="#7578EC"
                              />
                            </>
                          );
                        })()}
                      </svg>

                      {/* Day numbers at bottom */}
                      {viewModel.periodInfo && (
                        <div className="relative px-1 mt-2 pb-2">
                          <div className="flex justify-between" style={{ width: '100%' }}>
                            {Array.from({ length: 30 }).map((_, index) => {
                              const startDate = new Date(viewModel.periodInfo!.startDate);
                              startDate.setHours(0, 0, 0, 0);
                              const currentDate = new Date(startDate);
                              currentDate.setDate(startDate.getDate() + index);
                              const dayOfMonth = currentDate.getDate();
                              const showDay = index % 5 === 0 || index === 29;
                              const position = (index / 29) * 100;

                              return (
                                <span
                                  key={index}
                                  className={`text-xs font-medium tabular-nums absolute ${showDay ? 'text-slate-600' : 'text-transparent'}`}
                                  style={{
                                    left: `${position}%`,
                                    transform: 'translateX(-50%)',
                                    fontVariantNumeric: 'tabular-nums'
                                  }}
                                >
                                  {dayOfMonth}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
              </Card>
            </section>
            )}

            {/* Budget Period Transactions Section */}
            {viewModel && (
            <section>
              <SectionHeader
                title="Transazioni Budget"
                subtitle={viewModel.periodInfo ?
                  `${new Date(viewModel.periodInfo.startDate).toLocaleDateString('it-IT')} - ${viewModel.periodInfo.endDate ? new Date(viewModel.periodInfo.endDate).toLocaleDateString('it-IT') : 'Oggi'}` :
                  `${viewModel.transactionCount} ${viewModel.transactionCount === 1 ? 'transazione' : 'transazioni'}`
                }
                className="mb-4"
              />

              <div className="space-y-6">
                {viewModel.groupedTransactions.length > 0 ? (
                  viewModel.groupedTransactions.map((dayGroup) => (
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
                        accountNames={accountNamesMap}
                        variant="regular"
                        onEditTransaction={handleEditTransaction}
                        onDeleteTransaction={handleDeleteTransaction}
                      />
                    </section>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nessuna transazione trovata per questo budget</p>
                  </div>
                )}
              </div>

              {/* Visualizza Tutte Button */}
              {viewModel.transactionCount > 0 && selectedBudget && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 px-5 py-2.5 min-h-[40px] border border-slate-200 hover:border-slate-300 hover:shadow-sm group"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('from', 'budgets');
                      if (selectedViewUserId !== 'all') {
                        params.set('member', selectedViewUserId);
                      }
                      params.set('budget', selectedBudget.id);
                      params.set('category', selectedBudget.description);
                      window.location.href = `/transactions?${params.toString()}`;
                    }}
                  >
                    <span className="mr-2">Vedi tutte</span>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                  </Button>
                </div>
              )}
            </section>
            )}
          </>
        )}
      </main>

      <BottomNavigation />

      {/* Transaction Form */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : ''}
        transaction={editingTransaction || undefined}
        mode={transactionFormMode}
      />

      {/* Budget Form */}
      <BudgetForm
        isOpen={isBudgetFormOpen}
        onOpenChange={setIsBudgetFormOpen}
        selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : undefined}
        budget={editingBudget || undefined}
        mode={budgetFormMode}
      />

      {/* Category Form */}
      <CategoryForm
        isOpen={isCategoryFormOpen}
        onOpenChange={setIsCategoryFormOpen}
        mode="create"
      />
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BudgetsContent />
    </Suspense>
  );
}
