-- ================================================
-- WEALTH PILLAR - SCHEMA AGGIORNATO CON AUTENTICAZIONE
-- ================================================

-- Abilita RLS su tutte le tabelle esistenti
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Aggiungi colonna user_id a tutte le tabelle per collegare i dati agli utenti
ALTER TABLE people ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crea indici per migliorare le performance
CREATE INDEX IF NOT EXISTS people_user_id_idx ON people(user_id);
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id);
CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);
CREATE INDEX IF NOT EXISTS categories_user_id_idx ON categories(user_id);

-- ================================================
-- RLS POLICIES - Solo i dati dell'utente autenticato
-- ================================================

-- Policies per people
DROP POLICY IF EXISTS "Users can view own people" ON people;
DROP POLICY IF EXISTS "Users can insert own people" ON people;
DROP POLICY IF EXISTS "Users can update own people" ON people;
DROP POLICY IF EXISTS "Users can delete own people" ON people;

CREATE POLICY "Users can view own people" ON people
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own people" ON people
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own people" ON people
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own people" ON people
    FOR DELETE USING (auth.uid() = user_id);

-- Policies per accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;

CREATE POLICY "Users can view own accounts" ON accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Policies per transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;

CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Policies per budgets
DROP POLICY IF EXISTS "Users can view own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can insert own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can update own budgets" ON budgets;
DROP POLICY IF EXISTS "Users can delete own budgets" ON budgets;

CREATE POLICY "Users can view own budgets" ON budgets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON budgets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON budgets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON budgets
    FOR DELETE USING (auth.uid() = user_id);

-- Policies per categories
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;

CREATE POLICY "Users can view own categories" ON categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON categories
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- FUNZIONI HELPER
-- ================================================

-- Funzione per creare categorie di default per un nuovo utente
CREATE OR REPLACE FUNCTION create_default_categories_for_user(user_uuid UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO categories (name, user_id) VALUES
    ('Alimentari', user_uuid),
    ('Trasporti', user_uuid),
    ('Abbonamenti Necessari', user_uuid),
    ('Bollette', user_uuid),
    ('Casa', user_uuid),
    ('Salute', user_uuid),
    ('Intrattenimento', user_uuid),
    ('Shopping', user_uuid),
    ('Viaggi', user_uuid),
    ('Altro', user_uuid),
    ('Stipendio', user_uuid),
    ('Entrata', user_uuid),
    ('Trasferimento', user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- TRIGGERS
-- ================================================

-- Trigger per creare automaticamente categorie di default quando si registra un nuovo utente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    -- Crea le categorie di default per il nuovo utente
    PERFORM create_default_categories_for_user(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop del trigger esistente se presente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crea il trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
