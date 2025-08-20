# Riconciliazione Avanzata

## Panoramica

Il sistema di riconciliazione avanzata permette di gestire riconciliazioni complesse tra transazioni, supportando:

1. **Riconciliazione Multi-Transazione**: Una transazione può essere riconciliata da più transazioni
2. **Riconciliazione con Importo Personalizzato**: Possibilità di scegliere l'importo da riconciliare per ogni transazione
3. **Riconciliazione Multi-Persona**: Una transazione può essere riconciliata da transazioni di persone diverse

## Architettura

### Principi SOLID e DRY

Il sistema è stato progettato seguendo i principi SOLID e DRY:

- **Single Responsibility Principle (SRP)**: Ogni classe e hook ha una responsabilità specifica
- **Open/Closed Principle (OCP)**: Il sistema è estensibile senza modificare il codice esistente
- **Dependency Inversion Principle (DIP)**: Le dipendenze sono iniettate tramite il Service Factory
- **DRY (Don't Repeat Yourself)**: La logica di riconciliazione è centralizzata negli hooks

### Struttura del Database

#### Tabella `reconciliation_groups`

```sql
CREATE TABLE reconciliation_groups (
    id UUID PRIMARY KEY,
    source_transaction_id UUID NOT NULL REFERENCES transactions(id),
    allocations JSONB NOT NULL DEFAULT '[]',
    total_allocated_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Struttura JSON delle Allocazioni

```json
[
  {
    "targetTransactionId": "uuid",
    "amount": 15.50,
    "personId": "uuid" // opzionale per riconciliazione multi-persona
  }
]
```

## Componenti

### Hooks

#### `useAdvancedReconciliation`

Hook principale per gestire la riconciliazione avanzata:

```typescript
const {
  // Stati
  isReconciling,
  sourceTransaction,
  allocations,
  error,
  
  // Calcoli
  totalAllocatedAmount,
  remainingAmount,
  availableTransactions,
  isValid,
  
  // Handlers
  startAdvancedReconciliation,
  cancelReconciliation,
  addAllocation,
  removeAllocation,
  updateAllocationAmount,
  executeReconciliation,
  deleteReconciliation
} = useAdvancedReconciliation();
```

### Servizi

#### `ReconciliationService`

Servizio per la business logic della riconciliazione:

```typescript
class ReconciliationService {
  // Crea una riconciliazione multi-transazione
  async createMultiTransactionReconciliation(
    sourceTransactionId: string,
    allocations: ReconciliationAllocation[]
  ): Promise<ReconciliationGroup>
  
  // Aggiorna una riconciliazione esistente
  async updateReconciliation(
    groupId: string,
    allocations: ReconciliationAllocation[]
  ): Promise<ReconciliationGroup>
  
  // Elimina una riconciliazione
  async deleteReconciliation(groupId: string): Promise<void>
}
```

### Componenti UI

#### `AdvancedReconciliationModal`

Modal per la gestione della riconciliazione avanzata:

- Selezione delle transazioni target
- Assegnazione degli importi
- Validazione in tempo reale
- Riepilogo delle allocazioni

#### `ReconciliationStatus`

Componente per visualizzare lo stato delle riconciliazioni esistenti:

- Mostra le allocazioni attuali
- Permette di eliminare la riconciliazione
- Indica se la riconciliazione è completa o parziale

#### `ReconciliationSummary`

Componente per la dashboard che mostra un riepilogo delle riconciliazioni recenti.

## Utilizzo

### 1. Riconciliazione Semplice (Esistente)

```typescript
// Usa il sistema esistente per riconciliazione 1:1
const { handleStartLink, handleSelectToLink } = useTransactionLinking();
```

### 2. Riconciliazione Avanzata

```typescript
const {
  startAdvancedReconciliation,
  addAllocation,
  executeReconciliation
} = useAdvancedReconciliation();

// Inizia la riconciliazione
startAdvancedReconciliation(sourceTransaction);

// Aggiungi allocazioni
addAllocation(targetTransactionId, amount, personId);

// Esegui la riconciliazione
await executeReconciliation();
```

### 3. Visualizzazione dello Stato

```typescript
// Mostra lo stato di una riconciliazione
<ReconciliationStatus 
  transaction={transaction}
  onReconciliationDeleted={handleRefresh}
/>

// Mostra riepilogo nella dashboard
<ReconciliationSummary transactions={recentTransactions} />
```

## Validazioni

### Regole di Business

1. **Importo Totale**: L'importo totale allocato non può superare l'importo della transazione sorgente
2. **Transazioni Target**: Le transazioni target devono essere di tipo opposto alla sorgente
3. **Duplicati**: Non è possibile allocare la stessa transazione target più volte
4. **Stato**: Le transazioni già riconciliate non possono essere utilizzate come target

### Validazioni UI

- Controllo in tempo reale degli importi disponibili
- Feedback visivo per errori e stati
- Conferma prima di eliminare riconciliazioni

## Performance

### Ottimizzazioni

1. **Indici Database**: Indici su `source_transaction_id` e `allocations` (GIN)
2. **Lazy Loading**: Caricamento delle riconciliazioni solo quando necessario
3. **Memoization**: Hook ottimizzati con `useCallback` e `useMemo`
4. **Batch Operations**: Operazioni multiple eseguite in batch

### Monitoraggio

- Logging degli errori di riconciliazione
- Metriche sulle performance delle query
- Tracciamento delle operazioni di riconciliazione

## Estensibilità

### Aggiungere Nuovi Tipi di Riconciliazione

1. Estendi l'interfaccia `ReconciliationAllocation`
2. Aggiungi validazioni nel `ReconciliationService`
3. Aggiorna i componenti UI per supportare i nuovi campi

### Aggiungere Nuove Regole di Business

1. Modifica il metodo `validateMultiTransactionReconciliation`
2. Aggiorna le validazioni UI
3. Aggiungi test per le nuove regole

## Test

### Unit Tests

- Test per `ReconciliationService`
- Test per `useAdvancedReconciliation`
- Test per i componenti UI

### Integration Tests

- Test end-to-end del flusso di riconciliazione
- Test delle validazioni di business
- Test delle performance

## Migrazione

### Database

Esegui la migrazione SQL per creare la tabella `reconciliation_groups`:

```sql
-- Vedi docs/migrations/create_reconciliation_groups_table.sql
```

### Codice

1. Aggiorna le dipendenze
2. Importa i nuovi componenti
3. Integra i nuovi hook nelle pagine esistenti

## Troubleshooting

### Problemi Comuni

1. **Errore "Importo supera quello disponibile"**: Verifica che l'importo totale allocato non superi quello della transazione sorgente
2. **Transazione non trovata**: Verifica che la transazione target esista e non sia già riconciliata
3. **Errore di validazione**: Controlla che le transazioni siano di tipo opposto

### Debug

- Abilita il logging dettagliato nel `ReconciliationService`
- Usa i React DevTools per ispezionare lo stato degli hook
- Verifica le query del database con i log di Supabase
