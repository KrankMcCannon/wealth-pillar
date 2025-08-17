import { useMemo } from "react";
import type { Transaction } from "../../../types";
import { useFinance } from "../../core/useFinance";
import { useTransactionDisplay } from "../../ui/useTransactionDisplay";
import { getPersonAvatarIcon } from "../../../constants";

/**
 * Compute visual properties for a transaction. This hook builds upon
 * useTransactionDisplay and extracts repeated helper functions from UI
 * components such as TransactionRow and RecentTransactionItem. It returns
 * memoized values for person avatar icon, icon color, background color,
 * direction arrow and amount color based on whether the transaction is
 * income, expense or transfer. It also exposes the original transaction
 * display data for convenience.
 */
export const useTransactionVisual = (transaction: Transaction) => {
  const { getAccountById, getPersonById } = useFinance();
  const transactionData = useTransactionDisplay(transaction);

  // Derive the avatar icon of the first person associated with the transaction's account
  const personAvatarIcon = useMemo(() => {
    const account = getAccountById(transaction.accountId);
    if (!account || account.personIds.length === 0) return "?";
    const person = getPersonById(account.personIds[0]);
    if (!person) return "?";
    return getPersonAvatarIcon(person);
  }, [transaction.accountId, getAccountById, getPersonById]);

  // Fallback to initials if no avatar is available
  const personInitials = useMemo(() => {
    if (personAvatarIcon && personAvatarIcon.length === 1) return personAvatarIcon; // Use avatar icon instead
    const account = getAccountById(transaction.accountId);
    if (!account || account.personIds.length === 0) return "?";
    const person = getPersonById(account.personIds[0]);
    if (!person) return "?";
    return person.name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [transaction.accountId, getAccountById, getPersonById, personAvatarIcon]);

  // Determine the text color for the transaction's icon
  const iconColor = useMemo(() => {
    if (transactionData.isTransfer) return "text-blue-500";
    return transactionData.isIncome ? "text-green-500" : "text-red-500";
  }, [transactionData.isTransfer, transactionData.isIncome]);

  // Determine the background color for the transaction's avatar
  const backgroundColor = useMemo(() => {
    if (transactionData.isTransfer) return "bg-blue-100 dark:bg-blue-900";
    return transactionData.isIncome ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900";
  }, [transactionData.isTransfer, transactionData.isIncome]);

  // Determine the direction arrow to display on the avatar
  const directionArrow = useMemo(() => {
    if (transactionData.isTransfer) return "⇄";
    return transactionData.isIncome ? "→" : "←";
  }, [transactionData.isTransfer, transactionData.isIncome]);

  // Determine the color for the amount text
  const amountColor = useMemo(() => {
    if (transactionData.isTransfer) return "text-blue-600 dark:text-blue-400";
    return transactionData.isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  }, [transactionData.isTransfer, transactionData.isIncome]);

  return {
    transactionData,
    personAvatarIcon,
    personInitials,
    iconColor,
    backgroundColor,
    directionArrow,
    amountColor,
  };
};

/**
 * Compute the CSS class string for a transaction row. This utility function
 * consolidates the logic used in TransactionRow to determine background and
 * opacity classes based on linking state, reconciliation status and transfer
 * flags. It memoizes the result to avoid recalculations on each render.
 */
interface RowClassOptions {
  transaction: Transaction;
  transactionData: ReturnType<typeof useTransactionDisplay>;
  isLinkingMode: boolean;
  isThisLinkingTx: boolean;
  isLinkable: boolean;
}

export const useTransactionRowClasses = ({
  transaction,
  transactionData,
  isLinkingMode,
  isThisLinkingTx,
  isLinkable,
}: RowClassOptions) => {
  return useMemo(() => {
    const { isTransfer, shouldBlurTransaction } = transactionData;
    return [
      "border-b border-gray-200 dark:border-gray-700",
      isTransfer
        ? "bg-blue-50 dark:bg-blue-900/20"
        : transaction.isReconciled
        ? "bg-green-50 dark:bg-green-900/20"
        : "",
      shouldBlurTransaction ? "opacity-60" : "",
      isLinkingMode ? "transition-opacity duration-300" : "",
      isThisLinkingTx ? "bg-blue-100 dark:bg-blue-900/50" : "",
      isLinkable ? "cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/50 opacity-100" : "",
      isLinkingMode && !isLinkable && !isThisLinkingTx ? "opacity-30" : "",
    ].join(" ");
  }, [transactionData, transaction.isReconciled, isLinkingMode, isThisLinkingTx, isLinkable]);
};
