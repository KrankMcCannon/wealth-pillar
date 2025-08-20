-- Migrazione per la tabella reconciliation_groups
-- Supporta la riconciliazione multi-transazione e multi-persona

-- Crea la tabella reconciliation_groups
CREATE TABLE IF NOT EXISTS reconciliation_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    allocations JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_allocated_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_reconciliation_groups_source_transaction 
ON reconciliation_groups(source_transaction_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_groups_allocations 
ON reconciliation_groups USING GIN(allocations);

CREATE INDEX IF NOT EXISTS idx_reconciliation_groups_created_at 
ON reconciliation_groups(created_at);

-- Crea trigger per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reconciliation_groups_updated_at 
    BEFORE UPDATE ON reconciliation_groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Aggiungi commenti per documentazione
COMMENT ON TABLE reconciliation_groups IS 'Tabella per gestire le riconciliazioni multi-transazione';
COMMENT ON COLUMN reconciliation_groups.source_transaction_id IS 'ID della transazione sorgente per la riconciliazione';
COMMENT ON COLUMN reconciliation_groups.allocations IS 'Array JSON delle allocazioni con targetTransactionId, amount e personId';
COMMENT ON COLUMN reconciliation_groups.total_allocated_amount IS 'Importo totale allocato per la riconciliazione';
COMMENT ON COLUMN reconciliation_groups.remaining_amount IS 'Importo rimanente non ancora allocato';

-- Crea una vista per facilitare le query sulle riconciliazioni
CREATE OR REPLACE VIEW reconciliation_summary AS
SELECT 
    rg.id,
    rg.source_transaction_id,
    t.description as source_description,
    t.amount as source_amount,
    t.type as source_type,
    rg.total_allocated_amount,
    rg.remaining_amount,
    jsonb_array_length(rg.allocations) as allocation_count,
    rg.created_at,
    rg.updated_at
FROM reconciliation_groups rg
JOIN transactions t ON t.id = rg.source_transaction_id;

COMMENT ON VIEW reconciliation_summary IS 'Vista per riepiloghi delle riconciliazioni';
