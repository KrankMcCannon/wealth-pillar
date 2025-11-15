/**
 * BudgetTransactionsList Component
 * Displays transactions grouped by day with totals
 */

"use client";

import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui";
import { Transaction } from "@/lib";
import { GroupedTransactionCard } from "@/features/transactions";
import { budgetStyles } from "../theme/budget-styles";
import React from "react";
import { Budget } from "@/lib";

export interface BudgetTransactionsListProps {
  groupedTransactions: null[];
  accountNames: Record<string, string>;
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
          groupedTransactions.map(() => (
            <section key={""}>
              <div className={budgetStyles.transactions.dayHeader}>
                <h2 className={budgetStyles.transactions.dayTitle}>{""}</h2>
                <div className={budgetStyles.transactions.dayStats}>
                  <div className={budgetStyles.transactions.dayStatsTotal}>
                    <span className={budgetStyles.transactions.dayStatsTotalLabel}>Totale:</span>
                    <span className={`${budgetStyles.transactions.dayStatsTotalValue} ${""}`}>{0}</span>
                  </div>
                  <div className={budgetStyles.transactions.dayStatsCount}></div>
                </div>
              </div>
              <GroupedTransactionCard
                transactions={[]}
                accountNames={accountNames}
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
