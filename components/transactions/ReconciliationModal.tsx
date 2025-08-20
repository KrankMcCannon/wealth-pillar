import { memo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Transaction, Person } from '../../types';
import { XMarkIcon, UserIcon, CheckIcon } from '../common';
import { formatCurrency, formatDate } from '../../constants';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTransaction: Transaction | null;
  onReconciliationComplete?: () => void;
  loadPersons: () => Promise<Person[]>;
  loadTransactionsForPerson: (personId: string) => Promise<Transaction[]>;
  executeReconciliation: (allocations: { targetTransactionId: string; amount: number; personId?: string }[]) => Promise<boolean>;
  isLoading: boolean;
}

type ModalStep = 'person-selection' | 'transaction-selection' | 'amount-allocation';

/**
 * Modale semplice per la riconciliazione senza oscurare lo sfondo
 */
export const ReconciliationModal = memo<ReconciliationModalProps>(
  ({ 
    isOpen, 
    onClose, 
    sourceTransaction, 
    onReconciliationComplete,
    loadPersons,
    loadTransactionsForPerson,
    executeReconciliation,
    isLoading
  }) => {
    console.log('ReconciliationModal: Render', { isOpen, sourceTransactionId: sourceTransaction?.id });
    const [currentStep, setCurrentStep] = useState<ModalStep>('person-selection');
    const [availablePersons, setAvailablePersons] = useState<Person[]>([]);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
    const [availableTransactions, setAvailableTransactions] = useState<Transaction[]>([]);
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());
    const [allocations, setAllocations] = useState<{ transactionId: string; amount: number }[]>([]);

    // Carica le persone quando si apre il modale
    useEffect(() => {
      if (isOpen && currentStep === 'person-selection') {
        loadPersons().then(setAvailablePersons);
      }
    }, [isOpen, currentStep, loadPersons]);

    // Monitora i cambiamenti di step
    useEffect(() => {
      console.log('ReconciliationModal: Step changed to:', currentStep);
    }, [currentStep]);

    // Gestisce la selezione di una persona
    const handlePersonSelect = async (person: Person) => {
      console.log('ReconciliationModal: handlePersonSelect called for person:', person.id, person.name);
      setSelectedPerson(person);
      const transactions = await loadTransactionsForPerson(person.id);
      console.log('ReconciliationModal: Transactions loaded:', transactions.length);
      setAvailableTransactions(transactions);
      console.log('ReconciliationModal: Setting step to transaction-selection');
      setCurrentStep('transaction-selection');
    };

    // Gestisce la selezione delle transazioni
    const handleTransactionToggle = (transaction: Transaction) => {
      const newSelectedIds = new Set(selectedTransactionIds);
      if (newSelectedIds.has(transaction.id)) {
        newSelectedIds.delete(transaction.id);
      } else {
        newSelectedIds.add(transaction.id);
      }
      setSelectedTransactionIds(newSelectedIds);
    };

    // Conferma la selezione delle transazioni
    const handleConfirmTransactionSelection = () => {
      const selected = availableTransactions.filter(tx => selectedTransactionIds.has(tx.id));
      
      // Inizializza le allocazioni con importi uguali
      const totalAmount = Math.abs(sourceTransaction?.amount || 0);
      const amountPerTransaction = totalAmount / selected.length;
      
      const initialAllocations = selected.map(tx => ({
        transactionId: tx.id,
        amount: amountPerTransaction
      }));
      
      setAllocations(initialAllocations);
      setCurrentStep('amount-allocation');
    };

    // Gestisce l'aggiornamento dell'allocazione
    const handleAllocationChange = (transactionId: string, amount: string) => {
      const numAmount = parseFloat(amount) || 0;
      setAllocations(prev => 
        prev.map(alloc => 
          alloc.transactionId === transactionId 
            ? { ...alloc, amount: numAmount } 
            : alloc
        )
      );
    };

    // Esegue la riconciliazione
    const handleExecuteReconciliation = async () => {
      try {
        const reconciliationAllocations = allocations.map(alloc => ({
          targetTransactionId: alloc.transactionId,
          amount: alloc.amount,
          personId: selectedPerson?.id
        }));

        const success = await executeReconciliation(reconciliationAllocations);
        if (success) {
          onReconciliationComplete?.();
          onClose();
        }
      } catch (error) {
        console.error('Errore nella riconciliazione:', error);
      }
    };

    // Torna al passo precedente
    const goBack = () => {
      switch (currentStep) {
        case 'transaction-selection':
          setCurrentStep('person-selection');
          setSelectedPerson(null);
          setAvailableTransactions([]);
          break;
        case 'amount-allocation':
          setCurrentStep('transaction-selection');
          setSelectedTransactionIds(new Set());
          setAllocations([]);
          break;
        default:
          break;
      }
    };

    // Calcola l'importo totale allocato
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const sourceAmount = Math.abs(sourceTransaction?.amount || 0);
    const remainingAmount = sourceAmount - totalAllocated;

    if (!isOpen || !sourceTransaction) return null;

    const modalContent = (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/20">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700 m-4">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {currentStep !== 'person-selection' && (
                <button
                  onClick={goBack}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ←
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Riconciliazione
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {sourceTransaction.description} - {formatCurrency(Math.abs(sourceTransaction.amount))}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Contenuto */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Step 1: Selezione Persona */}
            {currentStep === 'person-selection' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Seleziona la persona per la riconciliazione
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePersons.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => handlePersonSelect(person)}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{person.name}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Selezione Transazioni */}
            {currentStep === 'transaction-selection' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Seleziona le transazioni di {selectedPerson?.name}
                  </h3>
                </div>

                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Caricamento transazioni...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {availableTransactions.length} transazioni disponibili
                      </p>
                      <button
                        onClick={handleConfirmTransactionSelection}
                        disabled={selectedTransactionIds.size === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Conferma ({selectedTransactionIds.size})
                      </button>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {availableTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          onClick={() => handleTransactionToggle(transaction)}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedTransactionIds.has(transaction.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(transaction.date)} - {transaction.category}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`font-semibold ${
                                transaction.amount > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {formatCurrency(Math.abs(transaction.amount))}
                              </span>
                              {selectedTransactionIds.has(transaction.id) && (
                                <CheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Allocazione Importi */}
            {currentStep === 'amount-allocation' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Alloca gli importi per {selectedPerson?.name}
                  </h3>
                </div>

                {/* Riepilogo */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Importo originale:</span>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(sourceAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Totale allocato:</span>
                      <p className={`font-semibold ${
                        totalAllocated === sourceAmount 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {formatCurrency(totalAllocated)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Rimanente:</span>
                      <p className={`font-semibold ${
                        remainingAmount === 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {formatCurrency(remainingAmount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista transazioni con input importi */}
                <div className="space-y-3">
                  {availableTransactions
                    .filter(tx => selectedTransactionIds.has(tx.id))
                    .map((transaction) => {
                      const allocation = allocations.find(a => a.transactionId === transaction.id);
                      return (
                        <div
                          key={transaction.id}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(transaction.date)} - {transaction.category}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Importo originale</p>
                                <p className={`font-semibold ${
                                  transaction.amount > 0 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {formatCurrency(Math.abs(transaction.amount))}
                                </p>
                              </div>
                              <div className="w-32">
                                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
                                  Importo da riconciliare
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={Math.abs(transaction.amount)}
                                  value={allocation?.amount || 0}
                                  onChange={(e) => handleAllocationChange(transaction.id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Pulsante di conferma */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleExecuteReconciliation}
                    disabled={isLoading || remainingAmount < 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Elaborazione...' : 'Conferma Riconciliazione'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    // Renderizza il modale usando un portale per assicurarsi che sia al centro dello schermo
    return createPortal(modalContent, document.body);
  }
);

ReconciliationModal.displayName = 'ReconciliationModal';
