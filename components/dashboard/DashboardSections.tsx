import React, { memo } from 'react';
import { Card } from '../ui';
import { BudgetProgress, RecentTransactionItem } from '.';
import { Budget, Transaction, Person } from '../../types';

/**
 * Props per BudgetSection
 */
interface BudgetSectionProps {
  budgetsWithData: Array<{ budget: Budget; person: Person }>;
  transactions: Transaction[];
  people: Person[];
  isAllView: boolean;
}

/**
 * Props per RecentTransactionsSection
 */
interface RecentTransactionsSectionProps {
  recentTransactionsWithData: Array<{
    transaction: Transaction;
    accountName: string;
    personName?: string;
  }>;
  isAllView: boolean;
}

/**
 * Componente BudgetSection ottimizzato
 * Principio SRP: Single Responsibility - gestisce solo la sezione budget
 */
export const BudgetSection = memo<BudgetSectionProps>(({ 
  budgetsWithData, 
  transactions, 
  people,
  isAllView 
}) => {
  // Estrai solo i budget dall'array budgetsWithData
  const budgets = budgetsWithData.map(({ budget }) => budget);
  
  return (
    <Card>
      <BudgetProgress 
        budgets={budgets}
        people={people}
        selectedPersonId={!isAllView ? budgetsWithData[0]?.person.id : undefined}
      />
    </Card>
  );
});

/**
 * Componente RecentTransactionsSection ottimizzato
 * Principio SRP: Single Responsibility - gestisce solo la sezione transazioni recenti
 */
export const RecentTransactionsSection = memo<RecentTransactionsSectionProps>(({ 
  recentTransactionsWithData, 
  isAllView 
}) => (
  <Card>
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
      Transazioni Recenti
    </h2>
    {recentTransactionsWithData.length > 0 ? (
      <ul className="space-y-2">
        {recentTransactionsWithData.map(({ transaction, accountName, personName }) => (
          <RecentTransactionItem
            key={transaction.id}
            transaction={transaction}
            accountName={accountName}
            personName={personName}
            isAllView={isAllView}
          />
        ))}
      </ul>
    ) : (
      <p className="text-gray-500 dark:text-gray-400">
        Nessuna transazione recente trovata.
      </p>
    )}
  </Card>
));

BudgetSection.displayName = 'BudgetSection';
RecentTransactionsSection.displayName = 'RecentTransactionsSection';
