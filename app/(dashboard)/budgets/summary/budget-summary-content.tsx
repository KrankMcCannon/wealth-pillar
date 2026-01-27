"use client";

import { useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header, PageContainer, BottomNavigation } from "@/components/layout";
import { budgetStyles } from "@/styles/system";
import { Budget, Transaction, Account, Category, User, UserBudgetSummary } from "@/lib/types";
import { usePageDataStore } from "@/stores/page-data-store";
import { useIdNameMap, useUserFilter } from "@/hooks";
import { Amount } from "@/components/ui/primitives";
import { Card } from "@/components/ui/card";
import { BudgetCard } from "@/components/cards";
import { TransactionDayList } from "@/features/transactions/components";
import { toDateTime, toDateString, formatDateSmart } from "@/lib/utils/date-utils";
import { TrendingUp, Wallet } from "lucide-react";
import UserSelector from "@/components/shared/user-selector";

interface BudgetSummaryContentProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  currentUser: User;
  groupUsers: User[];
  precalculatedData?: Record<string, UserBudgetSummary>;
}

export default function BudgetSummaryContent({
  categories,
  budgets,
  transactions,
  accounts,
  currentUser,
  groupUsers,
  precalculatedData,
}: BudgetSummaryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");

  const { selectedUserId, setSelectedGroupFilter } = useUserFilter();

  // 1. Inbound Sync: URL -> Store
  useEffect(() => {
    if (userIdParam && userIdParam !== selectedUserId) {
      setSelectedGroupFilter(userIdParam);
    } else if (!userIdParam && !selectedUserId) {
      // Default to current user if neither URL nor Store has a value
      setSelectedGroupFilter(currentUser.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIdParam, setSelectedGroupFilter, currentUser.id]);

  // 2. Outbound Sync: Store -> URL
  // Update URL when user changes selection in the UI
  useEffect(() => {
    if (selectedUserId && selectedUserId !== userIdParam) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("userId", selectedUserId);
      router.replace(`/budgets/summary?${params.toString()}`);
    }
  }, [selectedUserId, userIdParam, router, searchParams]);

  // Identify the target user
  const targetUser = useMemo(() => {
    if (selectedUserId && selectedUserId !== 'all') {
      return groupUsers.find(u => u.id === selectedUserId) || currentUser;
    }
    return currentUser;
  }, [selectedUserId, groupUsers, currentUser]);

  const setBudgets = usePageDataStore((state) => state.setBudgets);

  // Load data into store
  useEffect(() => {
    setBudgets(budgets);
  }, [budgets, setBudgets]);

  // Get User Budget Summary
  const userSummary = useMemo(() => {
    if (precalculatedData && precalculatedData[targetUser.id]) {
      return precalculatedData[targetUser.id];
    }
    return null;
  }, [precalculatedData, targetUser.id]);

  // Filter budgets for this user
  const userBudgets = useMemo(() => {
    return budgets.filter(b => b.user_id === targetUser.id && b.amount > 0);
  }, [budgets, targetUser.id]);

  // Filter transactions
  const userTransactions = useMemo(() => {
    if (!userSummary?.periodStart) return [];

    const start = toDateTime(userSummary.periodStart);
    const end = userSummary.periodEnd ? toDateTime(userSummary.periodEnd) : null;

    let txs = transactions.filter(t => t.user_id === targetUser.id);

    if (start) {
      txs = txs.filter(t => {
        const date = toDateTime(t.date);
        if (!date) return false;
        if (date < start) return false;
        if (end && date > end) return false;
        return true;
      });
    }

    const budgetCategoryIds = new Set(userBudgets.flatMap(b => b.categories));

    return txs.filter(t => budgetCategoryIds.has(t.category));
  }, [transactions, targetUser.id, userSummary, userBudgets]);

  // Group transactions
  const groupedTransactions = useMemo(() => {
    const groupedMap: Record<string, Transaction[]> = {};
    for (const transaction of userTransactions) {
      const dateKey = toDateString(transaction.date);
      if (!groupedMap[dateKey]) {
        groupedMap[dateKey] = [];
      }
      groupedMap[dateKey].push(transaction);
    }

    return Object.entries(groupedMap)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, txs]) => ({
        date,
        formattedDate: formatDateSmart(date),
        transactions: txs.sort((a, b) => {
          const dtA = toDateTime(a.date);
          const dtB = toDateTime(b.date);
          if (!dtA || !dtB) return 0;
          return dtB.toMillis() - dtA.toMillis();
        }),
        total: txs.reduce((sum, t) => sum + t.amount, 0),
      }));
  }, [userTransactions]);

  const accountNamesMap = useIdNameMap(accounts);

  return (
    <PageContainer className={budgetStyles.page.container}>
      <Header
        title="Riepilogo Budget"
        showBack={true}
        onBack={() => router.push('/dashboard')}
        className={budgetStyles.header.container}
      />

      {/* User Selector */}
      <UserSelector
        users={groupUsers}
        currentUser={currentUser}
        isLoading={false}
        className="mb-4"
      />

      {userSummary ? (
        <main className={budgetStyles.page.main}>
          {/* Summary Info Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary/70 uppercase">Budget</span>
              </div>
              <Amount
                className="text-xl md:text-2xl font-bold text-primary"
              >
                {userSummary.totalBudget}
              </Amount>
            </Card>
            <Card className="p-4 bg-destructive/5 border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-destructive" />
                <span className="text-xs font-semibold text-destructive/70 uppercase">Speso</span>
              </div>
              <Amount
                className="text-xl md:text-2xl font-bold text-destructive"
              >
                {userSummary.totalSpent}
              </Amount>
            </Card>
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-600/70 uppercase">Disponibile</span>
              </div>
              <Amount
                className="text-xl md:text-2xl font-bold text-emerald-600"
              >
                {userSummary.totalBudget - userSummary.totalSpent}
              </Amount>
            </Card>
          </div>

          {/* Related Budgets List (Grouped Style) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-primary px-1">Budget Attivi</h3>
            {/* Using the same styling structure as dashboard group cards for consistency */}
            <div className={budgetStyles.section.groupCard}>
              {/* No header needed inside the card here as we selected the user above */}
              <div className="p-2 space-y-2">
                {/* Or use budgetStyles.section.cardsDivider logic if we want dividers */}
                {userSummary.budgets.map((bSummary, index) => {
                  const budgetDef = budgets.find(b => b.id === bSummary.id);
                  if (!budgetDef) return null;

                  return (
                    <div key={bSummary.id} className={index > 0 ? "pt-2 border-t border-border/50" : ""}>
                      <BudgetCard
                        budget={budgetDef}
                        budgetInfo={{
                          id: bSummary.id,
                          spent: bSummary.spent,
                          remaining: bSummary.remaining,
                          progress: bSummary.percentage
                        }}
                        onClick={() => router.push(`/budgets?budget=${budgetDef.id}`)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Related Transactions */}
          <div className="space-y-3">
            <TransactionDayList
              groupedTransactions={groupedTransactions}
              accountNames={accountNamesMap}
              categories={categories}
              sectionTitle="Transazioni Correlate"
              emptyTitle="Nessuna transazione"
              emptyDescription="Non ci sono transazioni collegate a questi budget nel periodo corrente."
              expensesOnly
              onEditTransaction={() => { }}
              onDeleteTransaction={() => { }}
            />
          </div>
        </main>
      ) : (
        <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
          Seleziona un utente con budget attivi per visualizzare il riepilogo.
        </div>
      )}
      <BottomNavigation />
    </PageContainer>
  );
}
