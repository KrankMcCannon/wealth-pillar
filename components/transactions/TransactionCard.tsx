import { memo } from "react";
import { Transaction } from "../../types";
import { LinkIcon, PencilIcon, TrashIcon } from "../common";
import { formatCurrency, formatDate } from "../../constants";
import { useTransactionVisual, useTransactionRowClasses } from "../../hooks/features/transactions/useTransactionVisual";
import { useFinance } from "../../hooks/core/useFinance";
import { DropdownMenu } from "../ui";

interface TransactionCardProps {
  transaction: Transaction;
  accountName: string;
  personName?: string;
  isAllView: boolean;
  isLinkingMode: boolean;
  isThisLinkingTx: boolean;
  isLinkable: boolean;
  onLinkClick: (tx: Transaction) => void;
  onSelectToLink: (txId: string) => void;
  onEditClick: (tx: Transaction) => void;
  onDeleteClick?: (tx: Transaction) => void;
}

/**
 * Componente card per la transazione (vista mobile)
 */
export const TransactionCard = memo<TransactionCardProps>(
  ({
    transaction,
    accountName,
    personName,
    isAllView,
    isLinkingMode,
    isThisLinkingTx,
    isLinkable,
    onLinkClick,
    onSelectToLink,
    onEditClick,
    onDeleteClick,
  }) => {
    const { transactionData, personAvatarIcon, personInitials, iconColor, backgroundColor, directionArrow } =
      useTransactionVisual(transaction);

    const cardClasses = useTransactionRowClasses({
      transaction,
      transactionData,
      isLinkingMode,
      isThisLinkingTx,
      isLinkable,
    });

    const { getCategoryName } = useFinance();

    const { isTransfer, isIncome, showRemainingAmount, remainingAmount, transferData } = transactionData;

    const getStatusColor = () => {
      if (transaction.isReconciled) {
        return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300";
      }
      return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
    };

    const getAmountColor = () => {
      if (isTransfer) return "text-blue-600 dark:text-blue-400";
      if (isIncome) return "text-green-600 dark:text-green-400";
      return "text-red-600 dark:text-red-400";
    };

    return (
      <div
        className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 transition-all duration-300 ${cardClasses} ${
          isThisLinkingTx ? "ring-2 ring-blue-500" : ""
        } ${isLinkable && !isLinkingMode ? "hover:border-blue-300 dark:hover:border-blue-600" : ""} ${
          !isTransfer ? "bg-white dark:bg-gray-800" : ""
        }`}
        onClick={() => {
          if (isLinkingMode && isLinkable) {
            onSelectToLink(transaction.id);
          }
        }}
      >
        {/* Header con avatar e descrizione */}
        <div className="flex items-start space-x-3">
          {/* Cerchio con avatar/iniziali e freccia sporgente */}
          <div className="relative flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${backgroundColor} overflow-hidden`}
            >
              {personAvatarIcon ? (
                <span className="text-lg font-bold text-gray-800 dark:text-white">{personAvatarIcon}</span>
              ) : (
                <span className="text-lg font-bold text-gray-800 dark:text-white">{personInitials}</span>
              )}
            </div>
            {/* Freccia sporgente alla base */}
            <div
              className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full flex items-center justify-center ${backgroundColor} border border-white dark:border-gray-800`}
            >
              <span className={`text-xs ${iconColor}`}>{directionArrow}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm lg:text-base truncate">
              {transaction.description}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isTransfer ? `${accountName} → ${transferData.toAccount.name || "Account sconosciuto"}` : accountName}
            </p>
          </div>

          {/* Importo */}
          <div className={`text-right flex-shrink-0 ${getAmountColor()}`}>
            <div className="text-lg font-bold">
              {isTransfer ? "" : isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
            </div>
            {showRemainingAmount && (
              <div
                className={`text-xs font-medium ${
                  remainingAmount > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {remainingAmount > 0 ? `Disponibile: ${formatCurrency(remainingAmount)}` : "Completamente riconciliato"}
              </div>
            )}
          </div>
        </div>

        {/* Dettagli aggiuntivi */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Categoria:</span>
            <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">{getCategoryName(transaction.category)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Data:</span>
            <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">{formatDate(transaction.date)}</p>
          </div>
          {isAllView && personName && (
            <div className="col-span-2">
              <span className="text-gray-500 dark:text-gray-400">Persona:</span>
              <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">{personName}</p>
            </div>
          )}
        </div>

        {/* Footer con stato e azioni */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          {/* Stato riconciliazione */}
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
            {transaction.isReconciled ? "✓ Riconciliato" : "Aperto"}
          </span>

          {/* Azioni */}
          {!isLinkingMode && (
            <DropdownMenu
              items={[
                ...(!transaction.isReconciled && !isTransfer
                  ? [
                      {
                        label: "Riconcilia transazione",
                        onClick: () => onLinkClick(transaction),
                        icon: <LinkIcon className="w-4 h-4" />,
                        className: "text-blue-600 dark:text-blue-400",
                      },
                    ]
                  : []),
                {
                  label: "Modifica transazione",
                  onClick: () => onEditClick(transaction),
                  icon: <PencilIcon className="w-4 h-4" />,
                },
                ...(onDeleteClick
                  ? [
                      {
                        label: "Elimina transazione",
                        onClick: () => onDeleteClick(transaction),
                        icon: <TrashIcon className="w-4 h-4" />,
                        className: "text-red-600 dark:text-red-400",
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      </div>
    );
  }
);

TransactionCard.displayName = "TransactionCard";
