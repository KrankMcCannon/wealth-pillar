-- Reset completo del database
-- ATTENZIONE: Questo eliminerà TUTTI i dati!

-- Drop triggers
DROP TRIGGER IF EXISTS update_people_updated_at ON people;
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop policies
DROP POLICY IF EXISTS "Allow all operations on people" ON people;
DROP POLICY IF EXISTS "Allow all operations on accounts" ON accounts;
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
DROP POLICY IF EXISTS "Allow all operations on transactions" ON transactions;
DROP POLICY IF EXISTS "Allow all operations on budgets" ON budgets;

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Now run the complete schema.sql script
