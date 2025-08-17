import { useState, useEffect, useCallback } from "react";
import { Account } from "../../../types";

interface AccountWithData {
  account: Account;
  balance: number;
  personName?: string;
}

export const useAccountOrdering = (accountsWithData: AccountWithData[]) => {
  const [orderedAccounts, setOrderedAccounts] = useState<AccountWithData[]>(accountsWithData);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [tempOrderedAccounts, setTempOrderedAccounts] = useState<AccountWithData[]>(accountsWithData);

  // Salva l'ordine nel localStorage
  const saveOrder = useCallback((accounts: AccountWithData[]) => {
    try {
      const accountIds = accounts.map((acc) => acc.account.id);
      const orderData = JSON.stringify(accountIds);
      localStorage.setItem("accountCardOrder", orderData);
    } catch (error) {
      console.error("Errore nel salvataggio dell'ordine:", error);
    }
  }, []);

  // Carica l'ordine salvato dal localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem("accountCardOrder");

    if (savedOrder) {
      try {
        const savedAccountIds = JSON.parse(savedOrder) as string[];

        const ordered = [...accountsWithData].sort((a, b) => {
          const aIndex = savedAccountIds.indexOf(a.account.id);
          const bIndex = savedAccountIds.indexOf(b.account.id);

          // Se entrambi sono salvati, usa l'ordine salvato
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          // Se solo uno è salvato, metti quello salvato prima
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          // Se nessuno è salvato, mantieni l'ordine originale
          return 0;
        });

        setOrderedAccounts(ordered);
        setTempOrderedAccounts(ordered);
      } catch (error) {
        console.error("Errore nel caricamento dell'ordine delle account:", error);
        setOrderedAccounts(accountsWithData);
        setTempOrderedAccounts(accountsWithData);
      }
    } else {
      setOrderedAccounts(accountsWithData);
      setTempOrderedAccounts(accountsWithData);
    }
  }, [accountsWithData]);

  // Sincronizza tempOrderedAccounts con orderedAccounts quando necessario
  useEffect(() => {
    if (draggedIndex === null && dragOverIndex === null) {
      setTempOrderedAccounts(orderedAccounts);
    }
  }, [orderedAccounts, draggedIndex, dragOverIndex]);

  // Gestisce l'inizio del drag
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
    setDragOverIndex(null);
    setShowSuccessFeedback(false);
  }, []);

  // Gestisce la fine del drag
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Gestisce il drag over con riordinamento in tempo reale
  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        setDragOverIndex(index);

        // Riorganizza le card in tempo reale solo se la posizione è cambiata
        const currentTempOrder = tempOrderedAccounts;
        const draggedItemIndex = currentTempOrder.findIndex(
          (item) => item.account.id === orderedAccounts[draggedIndex].account.id
        );

        if (draggedItemIndex !== index && draggedItemIndex !== -1) {
          const newTempOrder = [...currentTempOrder];
          const [draggedItem] = newTempOrder.splice(draggedItemIndex, 1);
          newTempOrder.splice(index, 0, draggedItem);
          setTempOrderedAccounts(newTempOrder);
        }
      }
    },
    [draggedIndex, orderedAccounts, tempOrderedAccounts]
  );

  // Gestisce il drop
  const handleDrop = useCallback(
    (draggedAccountId: string, toIndex: number) => {
      // Usa l'ordine corrente (tempOrderedAccounts) per il riordinamento
      const currentOrder = tempOrderedAccounts;

      // Trova l'indice dell'elemento trascinato nell'ordine corrente
      const fromIndex = currentOrder.findIndex((item) => item.account.id === draggedAccountId);
      if (fromIndex === -1) {
        console.error("Elemento trascinato non trovato:", draggedAccountId);
        return;
      }

      // Forza sempre il salvataggio se c'è stato un drag
      if (draggedIndex !== null) {
        const newOrder = [...currentOrder];

        // Trova l'elemento trascinato
        const draggedItem = currentOrder[fromIndex];
        if (!draggedItem) {
          console.error("Elemento trascinato non trovato");
          return;
        }

        // Rimuovi l'elemento dalla posizione corrente
        newOrder.splice(fromIndex, 1);
        // Inseriscilo nella nuova posizione
        newOrder.splice(toIndex, 0, draggedItem);

        // Aggiorna entrambi gli stati
        setOrderedAccounts(newOrder);
        setTempOrderedAccounts(newOrder);

        // Salva il nuovo ordine
        saveOrder(newOrder);
        setDragOverIndex(null);

        // Mostra feedback di successo
        setShowSuccessFeedback(true);
        setTimeout(() => setShowSuccessFeedback(false), 2000);
      }
    },
    [tempOrderedAccounts, draggedIndex, saveOrder]
  );

  return {
    orderedAccounts: tempOrderedAccounts,
    draggedIndex,
    dragOverIndex,
    showSuccessFeedback,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  };
};
