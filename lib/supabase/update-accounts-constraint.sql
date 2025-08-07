-- Aggiornamento constraint per tipi account esistenti
-- Questo aggiorna la tabella accounts per accettare i tipi reali dal JSON

-- Rimuovi il constraint esistente
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_type_check;

-- Aggiungi il nuovo constraint con i tipi corretti
ALTER TABLE accounts ADD CONSTRAINT accounts_type_check 
    CHECK (type IN ('stipendio', 'contanti', 'risparmi', 'investimenti'));
