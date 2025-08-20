import { memo } from 'react';
import { formatCurrency } from '../../constants';

interface TransactionAmountProps {
  amount: number;
  isTransfer: boolean;
  isIncome: boolean;
  remainingAmount?: number;
  showRemainingAmount?: boolean;
  fullyReconciled?: boolean;
  align?: 'left' | 'right';
}

export const TransactionAmount = memo<TransactionAmountProps>(
  ({ amount, isTransfer, isIncome, remainingAmount = 0, showRemainingAmount = false, fullyReconciled = false, align = 'right' }) => {
    const color = isTransfer
      ? 'text-blue-600 dark:text-blue-400'
      : isIncome
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';

    const container = align === 'right' ? 'items-end text-right' : 'items-start text-left';

    return (
      <div className={`flex flex-col ${container}`}>
        <span className={`font-mono ${color}`}>{isTransfer ? '' : isIncome ? '+' : '-'} {formatCurrency(amount)}</span>
        {showRemainingAmount && !fullyReconciled && remainingAmount > 0 && (
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Disponibile: {formatCurrency(remainingAmount)}
          </span>
        )}
      </div>
    );
  }
);

TransactionAmount.displayName = 'TransactionAmount';

interface StatusChipProps {
  isReconciled: boolean;
  fullyReconciled: boolean;
}

export const TransactionStatusChip = memo<StatusChipProps>(({ isReconciled, fullyReconciled }) => {
  if (!isReconciled) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
        Aperto
      </span>
    );
  }
  const style = fullyReconciled
    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {fullyReconciled ? '✓ Completamente riconciliato' : '✓ Parzialmente riconciliato'}
    </span>
  );
});

TransactionStatusChip.displayName = 'TransactionStatusChip';

interface TransactionAvatarProps {
  initials: string;
  isIncome: boolean;
  isTransfer: boolean;
}

export const TransactionAvatar = memo<TransactionAvatarProps>(({ initials, isIncome, isTransfer }) => {
  const bg = isIncome ? 'bg-green-100 dark:bg-green-900' : (isTransfer ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900');
  const iconColor = isIncome ? 'text-green-500' : (isTransfer ? 'text-blue-500' : 'text-red-500');
  const arrow = isIncome ? '→' : (isTransfer ? '⇄' : '←');
  return (
    <div className="relative flex-shrink-0">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg} overflow-hidden`}>
        <span className="text-lg font-bold text-gray-800 dark:text-white">{initials}</span>
      </div>
      <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full flex items-center justify-center ${bg} border border-white dark:border-gray-800`}>
        <span className={`text-xs ${iconColor}`}>{arrow}</span>
      </div>
    </div>
  );
});

TransactionAvatar.displayName = 'TransactionAvatar';
