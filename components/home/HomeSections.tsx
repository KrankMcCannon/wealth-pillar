import { memo } from 'react';
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
  }>;
}

/**
 * Componente BudgetSection
 */
export const BudgetSection = memo<BudgetSectionProps>(({
  budgetsWithData,
  people,
  isAllView
}) => {
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
 * Componente RecentTransactionsSection
 */
export const RecentTransactionsSection = memo<RecentTransactionsSectionProps>(({ recentTransactionsWithData }) => (
  <Card>
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
      Transazioni Recenti
    </h2>
    {recentTransactionsWithData.length > 0 ? (
      <ul className="space-y-2">
        {recentTransactionsWithData.map(({ transaction, accountName }) => (
          <RecentTransactionItem
            key={transaction.id}
            transaction={transaction}
            accountName={accountName}
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
