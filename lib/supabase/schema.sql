-- Wealth Pillar Database Schema
-- Execute this script in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create People table
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    theme_color VARCHAR(7) DEFAULT '#3B82F6',
    budget_start_date INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('stipendio', 'contanti', 'risparmi', 'investimenti')) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0,
    initial_balance DECIMAL(15,2) DEFAULT 0,
    person_ids UUID[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    type VARCHAR(10) CHECK (type IN ('entrata', 'spesa')) NOT NULL,
    category VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    is_reconciled BOOLEAN DEFAULT FALSE,
    parent_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    period VARCHAR(10) CHECK (period IN ('monthly', 'annually')) NOT NULL,
    categories TEXT[] NOT NULL DEFAULT '{}',
    person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_is_reconciled ON transactions(is_reconciled);
CREATE INDEX IF NOT EXISTS idx_transactions_parent_id ON transactions(parent_transaction_id);

CREATE INDEX IF NOT EXISTS idx_accounts_person_ids ON accounts USING GIN(person_ids);
CREATE INDEX IF NOT EXISTS idx_budgets_person_id ON budgets(person_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for migration)
-- These policies allow operations for both authenticated and anonymous users
-- In production, you should make these more restrictive

-- People policies
CREATE POLICY "Allow all operations on people" ON people
    FOR ALL USING (true);

-- Accounts policies  
CREATE POLICY "Allow all operations on accounts" ON accounts
    FOR ALL USING (true);

-- Categories policies
CREATE POLICY "Allow all operations on categories" ON categories
    FOR ALL USING (true);

-- Transactions policies
CREATE POLICY "Allow all operations on transactions" ON transactions
    FOR ALL USING (true);

-- Budgets policies
CREATE POLICY "Allow all operations on budgets" ON budgets
    FOR ALL USING (true);

-- Insert real categories from db.json
INSERT INTO categories (name) VALUES
    ('abbonamenti_necessari'),
    ('abbonamenti_tv'),
    ('altro'),
    ('analisi_mediche'),
    ('benzina'),
    ('bolletta_acqua'),
    ('bolletta_depuratore'),
    ('bolletta_gas'),
    ('bolletta_luce'),
    ('bolletta_tari'),
    ('bolletta_tim'),
    ('bollo_auto'),
    ('bonifico'),
    ('cibo_asporto'),
    ('cibo_fuori'),
    ('cibo_thor'),
    ('contanti'),
    ('estetista'),
    ('eventi'),
    ('haircare'),
    ('investimenti'),
    ('medicine'),
    ('medicine_thor'),
    ('palestra'),
    ('parrucchiere'),
    ('rata_auto'),
    ('regali'),
    ('ricarica_telefono'),
    ('risparmi'),
    ('skincare'),
    ('spesa'),
    ('stipendio'),
    ('tagliando_auto'),
    ('taglio_thor'),
    ('vestiti'),
    ('veterinario'),
    ('visite_mediche'),
    ('trasferimento'),
    ('yuup_thor')
ON CONFLICT (name) DO NOTHING;
