# Mock API Setup with JSON Server

This project uses json-server for local development to simulate the new database structure before applying migrations to the real Supabase database.

## Quick Start

### 1. Run the Mock API Server

```bash
npm run mock-api
```

The API will be available at `http://localhost:3001`

### 2. Available Endpoints

json-server automatically creates REST endpoints for each entity in `db.json`:

#### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `PATCH /users/:id` - Partial update
- `DELETE /users/:id` - Delete user

**Note:** Users no longer have `budget_periods` field (moved to separate table)

#### Budget Periods (NEW)
- `GET /budget_periods` - Get all periods
- `GET /budget_periods?user_id=:userId` - Get periods for user
- `GET /budget_periods?is_active=true` - Get active periods
- `GET /budget_periods/:id` - Get period by ID
- `POST /budget_periods` - Create period
- `PUT /budget_periods/:id` - Update period
- `DELETE /budget_periods/:id` - Delete period

#### Budgets
- `GET /budgets` - Get all budgets
- `GET /budgets?user_id=:userId` - Get budgets for user
- `GET /budgets/:id` - Get budget by ID
- `POST /budgets` - Create budget
- `PUT /budgets/:id` - Update budget
- `DELETE /budgets/:id` - Delete budget

**Note:** Budgets now have `current_balance` and `balance_updated_at` fields

#### Transactions
- `GET /transactions` - Get all transactions
- `GET /transactions?user_id=:userId` - Get transactions for user
- `GET /transactions?date_gte=2024-12-01&date_lte=2024-12-31` - Filter by date range
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

#### Other Endpoints
- `GET /accounts`
- `GET /categories`
- `GET /groups`
- `GET /recurring_transaction_series`

### 3. Query Examples

```bash
# Get active period for user-1
curl http://localhost:3001/budget_periods?user_id=user-1&is_active=true

# Get all budgets with balances
curl http://localhost:3001/budgets

# Get transactions for December 2024
curl "http://localhost:3001/transactions?date_gte=2024-12-01&date_lte=2024-12-31"

# Get user without budget_periods field
curl http://localhost:3001/users/user-1
```

## New Database Structure

### Key Changes

1. **budget_periods** - New separate table
   - Moved from `users.budget_periods` JSONB array
   - Proper relational structure with indexes
   - One active period per user (enforced in real DB)

2. **budgets** - Enhanced with balance caching
   - `current_balance` - Cached computed balance (can be NULL)
   - `balance_updated_at` - When balance was last calculated

3. **users** - Simplified
   - Removed `budget_periods` field
   - Kept `budget_start_date` (user preference)

## Development Workflow

1. **Develop with Mock API**: Use json-server for all development
2. **Test Logic**: Ensure all CRUD operations work correctly
3. **Ready for Production**: Run SQL migrations to apply schema to Supabase
4. **Switch to Real DB**: Update environment to use Supabase

## SQL Migrations

When ready to apply to real database, run migrations in order:

1. `migrations/001_create_budget_periods_table.sql`
2. `migrations/002_migrate_budget_periods_data.sql`
3. `migrations/003_verify_migration.sql` (verification)
4. `migrations/004_add_budget_balance_columns.sql`
5. `migrations/005_create_budget_triggers.sql`
6. `migrations/006_drop_old_budget_periods_column.sql` (after 2+ weeks)

## Sample Data

The `db.json` file contains:
- 2 users (Mario Rossi, Giulia Bianchi)
- 1 group (Famiglia Rossi)
- 3 budget periods (2 for user-1, 1 for user-2)
- 3 budgets with cached balances
- 3 accounts
- 6 categories
- 7 transactions
- 2 recurring series

## Switching Between Mock and Real Database

### Using Mock API (Current):
```bash
# Terminal 1: Run mock API
npm run mock-api

# Terminal 2: Run Next.js dev server
npm run dev
```

Update your service layer to point to `http://localhost:3001` instead of Supabase.

### Using Supabase (After Migration):
1. Run all SQL migrations on Supabase
2. Revert service layer to use Supabase client
3. Stop json-server

## Notes

- json-server automatically generates IDs for new records if not provided
- All changes are persisted to `db.json` file
- Data resets to initial state when you restart json-server
- For testing, you can manually edit `db.json` while server is stopped
