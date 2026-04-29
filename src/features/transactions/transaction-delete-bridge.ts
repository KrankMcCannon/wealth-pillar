/**
 * Collega la richiesta di eliminazione dal TransactionFormModal (global provider)
 * al flusso useTransactionsContent sulla pagina transazioni.
 */
let deleteHandler: ((transactionId: string) => void) | null = null;

export function registerTransactionDeleteHandler(fn: (transactionId: string) => void): void {
  deleteHandler = fn;
}

export function unregisterTransactionDeleteHandler(): void {
  deleteHandler = null;
}

export function requestTransactionDelete(transactionId: string): void {
  deleteHandler?.(transactionId);
}
