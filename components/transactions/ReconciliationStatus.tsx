import { memo, useState, useEffect } from 'react';
import { Transaction, ReconciliationGroup } from '../../types';
import { ServiceFactory } from '../../lib/supabase/services/service-factory';
import { Card } from '../ui/Card';
import { LinkIcon, XMarkIcon } from '../common';

interface ReconciliationStatusProps {
  transaction: Transaction;
  onReconciliationDeleted?: () => void;
}

/**
 * Componente per visualizzare lo stato delle riconciliazioni di una transazione
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione dello stato
 */
export const ReconciliationStatus = memo<ReconciliationStatusProps>(({
  transaction,
  onReconciliationDeleted
}) => {
  const [reconciliation, setReconciliation] = useState<ReconciliationGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadReconciliation = async () => {
      setIsLoading(true);
      try {
        const reconciliationService = ServiceFactory.createReconciliationService();
        const reconciliationData = await reconciliationService.getReconciliationBySourceTransaction(transaction.id);
        setReconciliation(reconciliationData);
      } catch (error) {
        console.error('Errore nel caricamento della riconciliazione:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReconciliation();
  }, [transaction.id]);

  const handleDeleteReconciliation = async () => {
    if (!reconciliation) return;

    if (!window.confirm('Sei sicuro di voler eliminare questa riconciliazione?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const reconciliationService = ServiceFactory.createReconciliationService();
      await reconciliationService.deleteReconciliation(reconciliation.id);
      setReconciliation(null);
      onReconciliationDeleted?.();
    } catch (error) {
      console.error('Errore nell\'eliminazione della riconciliazione:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!reconciliation) {
    return null;
  }

  const totalAllocated = reconciliation.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
  const originalAmount = Math.abs(transaction.amount);
  const remainingAmount = originalAmount - totalAllocated;
  const isFullyReconciled = remainingAmount === 0;

  return (
    <Card>
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Riconciliazione Multi-Transazione
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleDeleteReconciliation}
              disabled={isDeleting}
              className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors disabled:opacity-50"
              title="Elimina riconciliazione"
            >
              <XMarkIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Riepilogo importi */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs">
            <span>Importo originale:</span>
            <span className="font-medium">{originalAmount.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Allocato:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {totalAllocated.toFixed(2)}€
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Rimanente:</span>
            <span className={`font-medium ${
              isFullyReconciled 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-orange-600 dark:text-orange-400'
            }`}>
              {remainingAmount.toFixed(2)}€
            </span>
          </div>
        </div>

        {/* Lista allocazioni */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transazioni riconciliate ({reconciliation.allocations.length}):
          </p>
          {reconciliation.allocations.map((allocation, index) => (
            <div key={allocation.targetTransactionId} className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
              <span className="truncate flex-1">
                Transazione #{index + 1}
                {allocation.personId && (
                  <span className="text-gray-500 ml-1">(Persona: {allocation.personId})</span>
                )}
              </span>
              <span className="font-medium text-blue-600 dark:text-blue-400 ml-2">
                {allocation.amount.toFixed(2)}€
              </span>
            </div>
          ))}
        </div>

        {/* Stato completamento */}
        {isFullyReconciled && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
            <p className="text-xs text-green-800 dark:text-green-200 font-medium">
              ✓ Riconciliazione completata
            </p>
          </div>
        )}
      </div>
    </Card>
  );
});

ReconciliationStatus.displayName = 'ReconciliationStatus';
