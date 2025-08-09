import { useState } from 'react';
import { Transaction } from '../../../types';
import { useFinance } from '../../useFinance';

/**
 * Hook personalizzato per gestire la riconciliazione delle transazioni
 * Principio SRP: Single Responsibility - gestisce solo la logica di linking
 * Principio DRY: Don't Repeat Yourself - centralizza la logica di riconciliazione
 */
export const useTransactionLinking = () => {
  const { linkTransactions, transactions } = useFinance();
  const [linkingTx, setLinkingTx] = useState<Transaction | null>(null);

  /**
   * Inizia il processo di riconciliazione con una transazione
   */
  const handleStartLink = (tx: Transaction) => {
    setLinkingTx(tx);
  };

  /**
   * Annulla il processo di riconciliazione
   */
  const handleCancelLink = () => {
    setLinkingTx(null);
  };

  /**
   * Seleziona una transazione da collegare con quella corrente
   */
  const handleSelectToLink = (targetTxId: string) => {
    if (linkingTx) {
      const targetTx = transactions.find(t => t.id === targetTxId);
      if (targetTx && window.confirm(
        `Sei sicuro di voler riconciliare "${linkingTx.description}" con "${targetTx.description}"?`
      )) {
        linkTransactions(linkingTx.id, targetTxId);
        setLinkingTx(null);
      }
    }
  };

  /**
   * Verifica se una transazione può essere collegata
   */
  const isTransactionLinkable = (transaction: Transaction): boolean => {
    if (!linkingTx) return false;
    
    const isThisLinkingTx = linkingTx.id === transaction.id;
    const isTransfer = transaction.category === 'trasferimento';
    const isDifferentType = linkingTx.type !== transaction.type;
    const isNotReconciled = !transaction.isReconciled;
    
    return !isThisLinkingTx && isDifferentType && isNotReconciled && !isTransfer;
  };

  /**
   * Verifica se è la transazione correntemente in modalità linking
   */
  const isThisLinkingTransaction = (transaction: Transaction): boolean => {
    return linkingTx?.id === transaction.id;
  };

  return {
    // Stati
    linkingTx,
    
    // Handlers
    handleStartLink,
    handleCancelLink,
    handleSelectToLink,
    
    // Utilities
    isTransactionLinkable,
    isThisLinkingTransaction,
    
    // Flags
    isLinkingMode: !!linkingTx
  };
};
