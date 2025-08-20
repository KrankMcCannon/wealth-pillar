import React, { memo } from 'react';
import { Transaction } from '../../types';
import { LinkIcon, PencilIcon, TrashIcon, ChevronDownIcon } from '../common';
import { DropdownMenu } from '../ui';

interface TransactionActionMenuProps {
  transaction: Transaction;
  isTransfer: boolean;
  reconciliationCount?: number;
  onOpenReconcile: (tx: Transaction) => void;
  onEdit: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

export const TransactionActionMenu = memo<TransactionActionMenuProps>(
  ({ transaction, isTransfer, reconciliationCount = 0, onOpenReconcile, onEdit, onDelete }) => {
    const items: Array<{ label: string; onClick: () => void; icon?: React.ReactNode; className?: string }> = [];

    if (reconciliationCount > 0) {
      const reconciledText = reconciliationCount === 1
        ? 'Mostra transazione riconciliata'
        : `Mostra ${reconciliationCount} transazioni riconciliate`;
      items.push({
        label: reconciledText,
        onClick: () => {
          // Reserved for future: open details panel
          console.log('Show reconciled items');
        },
        icon: <ChevronDownIcon className="w-4 h-4" />,
        className: 'text-blue-600 dark:text-blue-400',
      });
    }

    if (!transaction.isReconciled && !isTransfer) {
      items.push({
        label: 'Riconcilia',
        onClick: () => onOpenReconcile(transaction),
        icon: <LinkIcon className="w-4 h-4" />,
        className: 'text-purple-600 dark:text-purple-400',
      });
    }

    items.push({
      label: 'Modifica transazione',
      onClick: () => onEdit(transaction),
      icon: <PencilIcon className="w-4 h-4" />,
    });

    if (onDelete) {
      items.push({
        label: 'Elimina transazione',
        onClick: () => onDelete(transaction),
        icon: <TrashIcon className="w-4 h-4" />,
        className: 'text-red-600 dark:text-red-400',
      });
    }

    return <DropdownMenu items={items} />;
  }
);

TransactionActionMenu.displayName = 'TransactionActionMenu';

