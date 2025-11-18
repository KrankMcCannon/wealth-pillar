/**
 * BudgetTransactionsList Component
 * Displays transactions grouped by day with totals
 */

"use client";

import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui";
import { Transaction, Category } from "@/lib";
import { GroupedTransactionCard } from "@/features/transactions";
import { budgetStyles } from "../theme/budget-styles";
import { formatCurrency } from "@/lib/utils/currency-formatter";
import React from "react";
import { Budget } from "@/lib";

export interface GroupedTransaction {
  date: string;
  formattedDate: string;
  transactions: Transaction[];
  total: number;
}

export interface BudgetTransactionsListProps {
  groupedTransactions: GroupedTransaction[];
  accountNames: Record<string, string>;
  categories: Category[];
  transactionCount: number;
  selectedBudget: Budget | null;
  selectedViewUserId: string;
  periodInfo: { startDate: string; endDate: string | null } | null;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transactionId: string) => void;
  onViewAll: () => void;
}

export function BudgetTransactionsList({
  groupedTransactions,
  accountNames,
  categories,
  transactionCount,
  selectedBudget,
  periodInfo,
  onEditTransaction,
  onDeleteTransaction,
  onViewAll,
}: BudgetTransactionsListProps) {
  return (
    <section>
      <SectionHeader
        title="Transazioni Budget"
        subtitle={
          periodInfo
            ? `${new Date(periodInfo.startDate).toLocaleDateString("it-IT")} - ${
                periodInfo.endDate ? new Date(periodInfo.endDate).toLocaleDateString("it-IT") : "Oggi"
              }`
            : `${transactionCount} ${transactionCount === 1 ? "transazione" : "transazioni"}`
        }
        className="mb-4"
      />

      <div className={budgetStyles.transactions.container}>
        {groupedTransactions.length > 0 ? (
          groupedTransactions.map((group) => (
            <section key={group.date}>
              <div className={budgetStyles.transactions.dayHeader}>
                <h2 className={budgetStyles.transactions.dayTitle}>{group.formattedDate}</h2>
                <div className={budgetStyles.transactions.dayStats}>
                  <div className={budgetStyles.transactions.dayStatsTotal}>
                    <span className={budgetStyles.transactions.dayStatsTotalLabel}>Totale:</span>
                    <span className={`${budgetStyles.transactions.dayStatsTotalValue} text-destructive`}>
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                  <div className={budgetStyles.transactions.dayStatsCount}>
                    {group.transactions.length} {group.transactions.length === 1 ? 'transazione' : 'transazioni'}
                  </div>
                </div>
              </div>
              <GroupedTransactionCard
                transactions={group.transactions}
                accountNames={accountNames}
                categories={categories}
                variant="regular"
                onEditTransaction={onEditTransaction}
                onDeleteTransaction={onDeleteTransaction}
              />
            </section>
          ))
        ) : (
          <div className={budgetStyles.transactions.emptyMessage}>
            <p>Nessuna transazione trovata per questo budget</p>
          </div>
        )}
      </div>

      {/* Visualizza Tutte Button */}
      {transactionCount > 0 && selectedBudget && (
        <div className={budgetStyles.transactions.seeAllButtonContainer}>
          <Button variant="ghost" size="sm" className={budgetStyles.transactions.seeAllButton} onClick={onViewAll}>
            <span className="mr-2 text-primary">Vedi tutte</span>
            <span className="group-hover:translate-x-0.5 transition-transform duration-200 text-primary">→</span>
          </Button>
        </div>
      )}
    </section>
  );
}
