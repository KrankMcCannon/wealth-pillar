# Pages Documentation

**Version**: 1.0
**Last Updated**: October 2025
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Pages](#authentication-pages)
3. [Dashboard Pages](#dashboard-pages)
4. [Layouts](#layouts)
5. [Page Patterns](#page-patterns)
6. [Best Practices](#best-practices)

---

## Overview

### Next.js 15 App Router

Wealth Pillar uses Next.js 15 App Router with the following structure:

```
/app
  /(auth)/                    # Authentication route group
    /sign-in/                 # Sign in page
    /sign-up/                 # Sign up page
    /forgot-password/         # Password reset
    /verify-email/            # Email verification
    layout.tsx                # Auth layout wrapper
  /(dashboard)/               # Dashboard route group
    /dashboard/               # Main dashboard
    /transactions/            # Transaction management
    /budgets/                 # Budget tracking
    /investments/             # Portfolio management
    /reports/                 # Financial reports
    /settings/                # App settings
    layout.tsx                # Dashboard layout wrapper
  layout.tsx                  # Root layout
  page.tsx                    # Landing page
  not-found.tsx               # 404 page
```

### Route Groups

**Purpose**: Organize routes without affecting URL structure

- `(auth)` - Public authentication pages
- `(dashboard)` - Protected dashboard pages

### Page Architecture (MVC Pattern)

All pages follow the **Model-View-Controller** pattern:

```
┌─────────────────────────────────────────┐
│  Page Component (View)                  │
│  - Pure presentation                    │
│  - No business logic                    │
│  - Consumes view model                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Controller Hook (Controller)           │
│  - Data orchestration                   │
│  - State management                     │
│  - Action handlers                      │
│  - View model creation                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Services / API (Model)                 │
│  - Business logic                       │
│  - Data fetching                        │
│  - Calculations                         │
└─────────────────────────────────────────┘
```

---

## Authentication Pages

### Sign In (`/sign-in`)

**File**: `app/(auth)/sign-in/[[...sign-in]]/page.tsx`

**Scope**: User authentication via email/password or SSO

**Controller**: `useSignInController` (hooks/useSignInController.ts)

**Features**:
- ✅ Email/password authentication
- ✅ OAuth providers (Google, etc.)
- ✅ "Remember me" functionality
- ✅ Forgot password link
- ✅ Client-side validation

**Behavior**:
1. User enters credentials
2. Controller validates input
3. Clerk handles authentication
4. On success → redirect to `/dashboard`
5. On error → display error message

**Structure**:
```tsx
export default function SignInPage() {
  const controller = useSignInController();

  return (
    <AuthCard title="Sign In" description="Welcome back">
      <form onSubmit={controller.handleSubmit}>
        <FormField label="Email" error={controller.errors.email}>
          <Input
            type="email"
            value={controller.form.email}
            onChange={(e) => controller.setField('email', e.target.value)}
          />
        </FormField>

        <FormField label="Password" error={controller.errors.password}>
          <PasswordInput
            value={controller.form.password}
            onChange={(e) => controller.setField('password', e.target.value)}
          />
        </FormField>

        <Button type="submit" disabled={controller.isSubmitting}>
          Sign In
        </Button>
      </form>

      <SocialButtons />
    </AuthCard>
  );
}
```

**Usage**: Entry point for existing users

---

### Sign Up (`/sign-up`)

**File**: `app/(auth)/sign-up/[[...sign-up]]/page.tsx`

**Scope**: New user registration

**Controller**: `useSignUpController` (hooks/useSignUpController.ts)

**Features**:
- ✅ Email/password registration
- ✅ OAuth providers
- ✅ Password strength validation
- ✅ Password requirements display
- ✅ Terms & conditions checkbox

**Behavior**:
1. User enters name, email, password
2. Client validates password strength
3. Clerk creates user account
4. Email verification sent (optional)
5. On success → redirect to `/dashboard`
6. Auto-creates default categories and settings

**Structure**:
```tsx
export default function SignUpPage() {
  const controller = useSignUpController();

  return (
    <AuthCard title="Sign Up" description="Create your account">
      <form onSubmit={controller.handleSubmit}>
        <FormField label="Name" required error={controller.errors.name}>
          <Input
            value={controller.form.name}
            onChange={(e) => controller.setField('name', e.target.value)}
          />
        </FormField>

        <FormField label="Email" required error={controller.errors.email}>
          <Input
            type="email"
            value={controller.form.email}
            onChange={(e) => controller.setField('email', e.target.value)}
          />
        </FormField>

        <FormField label="Password" required error={controller.errors.password}>
          <PasswordInput
            value={controller.form.password}
            onChange={(e) => controller.setField('password', e.target.value)}
          />
          <PasswordStrength password={controller.form.password} />
          <PasswordRequirements password={controller.form.password} />
        </FormField>

        <Button type="submit" disabled={controller.isSubmitting}>
          Create Account
        </Button>
      </form>

      <SocialButtons />
    </AuthCard>
  );
}
```

**Usage**: Entry point for new users

---

### Forgot Password (`/forgot-password`)

**File**: `app/(auth)/forgot-password/page.tsx`

**Scope**: Password reset request

**Controller**: `usePasswordResetController` (hooks/usePasswordResetController.ts)

**Features**:
- ✅ Email-based password reset
- ✅ Reset link generation
- ✅ Success/error feedback

**Behavior**:
1. User enters email address
2. Controller validates email format
3. Clerk sends reset link via email
4. Display confirmation message
5. User clicks link → redirected to reset form

**Structure**:
```tsx
export default function ForgotPasswordPage() {
  const controller = usePasswordResetController();

  if (controller.isSuccess) {
    return <SuccessMessage message="Check your email for reset link" />;
  }

  return (
    <AuthCard title="Forgot Password" description="Reset your password">
      <form onSubmit={controller.handleSubmit}>
        <FormField label="Email" error={controller.errors.email}>
          <Input
            type="email"
            value={controller.form.email}
            onChange={(e) => controller.setField('email', e.target.value)}
          />
        </FormField>

        <Button type="submit" disabled={controller.isSubmitting}>
          Send Reset Link
        </Button>
      </form>
    </AuthCard>
  );
}
```

**Usage**: Password recovery flow

---

### Verify Email (`/verify-email`)

**File**: `app/(auth)/verify-email/page.tsx`

**Scope**: Email verification confirmation

**Behavior**:
- Displays verification status
- Handles verification token from URL
- Redirects to dashboard on success

**Structure**:
```tsx
export default function VerifyEmailPage() {
  const { isLoading, isSuccess, error } = useEmailVerification();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (isSuccess) return <SuccessMessage message="Email verified!" />;

  return null;
}
```

**Usage**: Email verification callback

---

## Dashboard Pages

### Dashboard (`/dashboard`)

**File**: `app/(dashboard)/dashboard/page.tsx`

**Scope**: Financial overview - balance summary, recent transactions, budget status

**Controller**: `useDashboardController` (hooks/controllers/useDashboardController.ts)

**Features**:
- ✅ Multi-user balance view with user selector
- ✅ Total balance across all accounts
- ✅ Recent transactions (last 5)
- ✅ Budget overview cards
- ✅ Quick action buttons (Add Transaction, Add Budget)

**Data Sources**:
- `useDashboardCore()` - Core dashboard data
- `useDashboardBudgets()` - Budget-specific metrics
- `useUserSelection()` - User filter state

**Behavior**:
1. Load dashboard data (balance, transactions, budgets)
2. Display user selector for filtering
3. Show account cards with balances
4. Display recent transaction list
5. Show budget progress cards
6. Handle quick actions (modals)

**Structure**:
```tsx
export default function DashboardPage() {
  const controller = useDashboardController();

  return (
    <div className="space-y-6">
      {/* User Selector */}
      <UserSelector
        selectedUserId={controller.selectedUserId}
        onSelectionChange={controller.handleUserChange}
      />

      {/* Balance Section */}
      <BalanceSection
        accounts={controller.viewModel.accounts}
        totalBalance={controller.viewModel.totalBalance}
        onAccountClick={controller.handleAccountClick}
      />

      {/* Recent Transactions */}
      <Section title="Recent Transactions">
        {controller.viewModel.recentTransactions.map(tx => (
          <TransactionCard
            key={tx.id}
            transaction={tx}
            accountNames={controller.viewModel.accountNames}
            onClick={() => controller.handleTransactionClick(tx)}
          />
        ))}
      </Section>

      {/* Budget Overview */}
      <BudgetSection
        budgets={controller.viewModel.budgetsWithProgress}
        onBudgetClick={controller.handleBudgetClick}
      />

      {/* Modals */}
      <TransactionForm
        isOpen={controller.isTransactionFormOpen}
        onOpenChange={controller.setTransactionFormOpen}
      />
    </div>
  );
}
```

**View Model**:
```typescript
interface DashboardViewModel {
  accounts: Account[];
  accountBalances: Record<string, number>;
  totalBalance: number;
  recentTransactions: Transaction[];
  budgetsWithProgress: BudgetWithProgress[];
  accountNames: Record<string, string>;
}
```

**Usage**: Landing page after authentication

---

### Transactions (`/transactions`)

**File**: `app/(dashboard)/transactions/page.tsx`

**Scope**: Transaction management (CRUD), filtering, grouping, recurring series

**Controller**: `useTransactionsController` (hooks/controllers/useTransactionsController.ts)

**Features**:
- ✅ Transaction list with grouping by day
- ✅ Advanced filtering (type, category, date range, account, user)
- ✅ Search by description
- ✅ Create/edit/delete transactions
- ✅ Recurring transaction series management
- ✅ URL state persistence for filters

**Data Sources**:
- `useTransactions()` - All transactions
- `useAccounts()` - Account lookup
- `useCategories()` - Category lookup
- `useUsers()` - User lookup
- `useRecurringSeries()` - Recurring series data

**Behavior**:
1. Load transactions with filters from URL
2. Apply user selection filter
3. Group transactions by day
4. Display filter controls at top
5. Show transaction cards (clickable)
6. Handle CRUD operations via modals
7. Sync filters to URL on change

**Structure**:
```tsx
export default function TransactionsPage() {
  const controller = useTransactionsController();

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <PageHeader
        title="Transactions"
        action={
          <Button onClick={() => controller.openTransactionForm()}>
            Add Transaction
          </Button>
        }
      />

      {/* User Selector */}
      <UserSelector
        selectedUserId={controller.selectedUserId}
        onSelectionChange={controller.handleUserChange}
      />

      {/* Filter Bar */}
      <FilterDialog
        filters={controller.filters}
        onFiltersChange={controller.handleFiltersChange}
        categories={controller.viewModel.categories}
        accounts={controller.viewModel.accounts}
      />

      {/* Transaction List (Grouped by Day) */}
      {controller.viewModel.groupedTransactions.map(group => (
        <div key={group.date}>
          <Text variant="muted" size="sm">{group.dateLabel}</Text>
          {group.transactions.map(tx => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              accountNames={controller.viewModel.accountNames}
              onClick={() => controller.openTransactionForm(tx)}
            />
          ))}
        </div>
      ))}

      {/* Empty State */}
      {controller.viewModel.groupedTransactions.length === 0 && (
        <EmptyState
          title="No transactions"
          description="Add your first transaction to get started"
          action={<Button onClick={() => controller.openTransactionForm()}>Add Transaction</Button>}
        />
      )}

      {/* Recurring Series Section */}
      <RecurringSeriesSection
        series={controller.viewModel.recurringSeries}
        onSeriesClick={controller.handleSeriesClick}
      />

      {/* Modals */}
      <TransactionForm
        isOpen={controller.isTransactionFormOpen}
        onOpenChange={controller.setTransactionFormOpen}
        transaction={controller.selectedTransaction}
        mode={controller.formMode}
      />
    </div>
  );
}
```

**URL State**:
```
/transactions?type=expense&category=food&from=2025-01-01&to=2025-01-31&user=user-id
```

**View Model**:
```typescript
interface TransactionsViewModel {
  groupedTransactions: {
    date: string;
    dateLabel: string;
    transactions: Transaction[];
    totalIncome: number;
    totalExpense: number;
  }[];
  categories: Category[];
  accounts: Account[];
  accountNames: Record<string, string>;
  recurringSeries: RecurringSeries[];
  filterCounts: {
    total: number;
    income: number;
    expense: number;
    transfer: number;
  };
}
```

**Usage**: Primary transaction management interface

---

### Budgets (`/budgets`)

**File**: `app/(dashboard)/budgets/page.tsx`

**Scope**: Budget management, tracking, period navigation, analysis

**Controller**: `useBudgetsController` (hooks/controllers/useBudgetsController.ts)

**Features**:
- ✅ Budget list with progress indicators
- ✅ Budget period selector (current/previous periods)
- ✅ Budget detail view with charts
- ✅ Category breakdown chart
- ✅ Line chart for spending over time
- ✅ Create/edit/delete budgets
- ✅ End period and start new period

**Data Sources**:
- `useBudgets()` - All budgets
- `useBudgetPeriods()` - Budget periods
- `useCurrentBudgetPeriod()` - Active period
- `useBudgetAnalysis(budgetId)` - Detailed analytics
- `useCategories()` - Category lookup

**Behavior**:
1. Load budgets for current period
2. Display budget cards with progress bars
3. Allow period navigation
4. Click budget → show detail view with charts
5. Handle budget CRUD via modals
6. Manage period lifecycle (end/start)

**Structure**:
```tsx
export default function BudgetsPage() {
  const controller = useBudgetsController();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Budgets"
        action={
          <Button onClick={() => controller.openBudgetForm()}>
            Add Budget
          </Button>
        }
      />

      {/* Period Selector */}
      <BudgetPeriodManager
        currentPeriod={controller.currentPeriod}
        onPeriodChange={controller.handlePeriodChange}
        onEndPeriod={controller.handleEndPeriod}
      />

      {/* Budget List */}
      <div className="grid gap-4">
        {controller.viewModel.budgetsWithProgress.map(budget => (
          <BudgetCard
            key={budget.id}
            budget={budget}
            budgetInfo={budget.progressInfo}
            onClick={() => controller.handleBudgetClick(budget)}
          />
        ))}
      </div>

      {/* Empty State */}
      {controller.viewModel.budgetsWithProgress.length === 0 && (
        <EmptyState
          title="No budgets"
          description="Create your first budget"
          action={<Button onClick={() => controller.openBudgetForm()}>Add Budget</Button>}
        />
      )}

      {/* Budget Detail Modal */}
      {controller.selectedBudget && (
        <BudgetDetailModal
          isOpen={controller.isBudgetDetailOpen}
          onOpenChange={controller.setBudgetDetailOpen}
          budget={controller.selectedBudget}
          analysis={controller.budgetAnalysis}
        >
          {/* Line Chart - Spending Over Time */}
          <LineChart
            data={controller.budgetAnalysis.dailySpending}
            xKey="date"
            yKey="amount"
          />

          {/* Category Breakdown Pie Chart */}
          <PieChart
            data={controller.budgetAnalysis.categoryBreakdown}
            nameKey="category"
            valueKey="amount"
          />
        </BudgetDetailModal>
      )}

      {/* Modals */}
      <BudgetForm
        isOpen={controller.isBudgetFormOpen}
        onOpenChange={controller.setBudgetFormOpen}
        budget={controller.selectedBudget}
        mode={controller.formMode}
      />
    </div>
  );
}
```

**Charts**:
1. **Line Chart** - Daily spending vs. budget limit
2. **Pie Chart** - Category breakdown of spending

**View Model**:
```typescript
interface BudgetsViewModel {
  budgetsWithProgress: {
    budget: Budget;
    progressInfo: {
      spent: number;
      remaining: number;
      progress: number; // 0-100
      status: 'on-track' | 'warning' | 'exceeded';
    };
  }[];
  currentPeriod: BudgetPeriod;
  availablePeriods: BudgetPeriod[];
}
```

**Usage**: Budget tracking and management

---

### Investments (`/investments`)

**File**: `app/(dashboard)/investments/page.tsx`

**Scope**: Portfolio management, holdings, performance metrics

**Controller**: `useInvestmentsController` (hooks/controllers/useInvestmentsController.ts)

**Features**:
- ✅ Portfolio overview (total value, gains/losses)
- ✅ Holdings list with current values
- ✅ Performance metrics (daily/monthly/yearly)
- ✅ Allocation breakdown chart
- ✅ Add/edit/delete holdings

**Data Sources**:
- `useInvestmentHoldings()` - All holdings
- `usePortfolioMetrics()` - Aggregated metrics

**Behavior**:
1. Load investment holdings
2. Calculate portfolio totals
3. Display holdings list
4. Show performance metrics
5. Handle holding CRUD via modals

**Structure**:
```tsx
export default function InvestmentsPage() {
  const controller = useInvestmentsController();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Investments"
        action={
          <Button onClick={() => controller.openHoldingForm()}>
            Add Holding
          </Button>
        }
      />

      {/* Portfolio Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          label="Total Value"
          value={controller.viewModel.totalValue}
          trend={controller.viewModel.totalGainPercent}
        />
        <MetricCard
          label="Today's Gain"
          value={controller.viewModel.todayGain}
          trend={controller.viewModel.todayGainPercent}
        />
        <MetricCard
          label="Total Gain"
          value={controller.viewModel.totalGain}
          trend={controller.viewModel.totalGainPercent}
        />
      </div>

      {/* Holdings List */}
      <Section title="Holdings">
        {controller.viewModel.holdings.map(holding => (
          <HoldingCard
            key={holding.id}
            holding={holding}
            onClick={() => controller.handleHoldingClick(holding)}
          />
        ))}
      </Section>

      {/* Allocation Chart */}
      <PieChart
        data={controller.viewModel.allocationData}
        title="Portfolio Allocation"
      />

      {/* Modals */}
      <HoldingForm
        isOpen={controller.isHoldingFormOpen}
        onOpenChange={controller.setHoldingFormOpen}
        holding={controller.selectedHolding}
        mode={controller.formMode}
      />
    </div>
  );
}
```

**View Model**:
```typescript
interface InvestmentsViewModel {
  holdings: InvestmentHolding[];
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  todayGain: number;
  todayGainPercent: number;
  allocationData: { name: string; value: number }[];
}
```

**Usage**: Investment portfolio tracking

---

### Reports (`/reports`)

**File**: `app/(dashboard)/reports/page.tsx`

**Scope**: Financial analytics, monthly/yearly reports, trends

**Controller**: `useReportsController` (hooks/controllers/useReportsController.ts)

**Features**:
- ✅ Monthly income/expense summary
- ✅ Yearly comparison
- ✅ Category spending breakdown
- ✅ Savings rate calculation
- ✅ Trend charts

**Data Sources**:
- `useTransactionSummary(startDate, endDate)` - Aggregated data
- `useTransactionTrends(period)` - Trend analysis

**Behavior**:
1. Load transaction data for selected period
2. Calculate financial metrics
3. Display summary cards
4. Show trend charts
5. Allow period selection (month/year)

**Structure**:
```tsx
export default function ReportsPage() {
  const controller = useReportsController();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Reports" />

      {/* Period Selector */}
      <Tabs value={controller.period} onValueChange={controller.setPeriod}>
        <TabsList>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="year">This Year</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Income" value={controller.viewModel.totalIncome} />
        <MetricCard label="Expenses" value={controller.viewModel.totalExpenses} />
        <MetricCard label="Net" value={controller.viewModel.netIncome} />
        <MetricCard label="Savings Rate" value={`${controller.viewModel.savingsRate}%`} />
      </div>

      {/* Category Breakdown */}
      <Section title="Spending by Category">
        <BarChart
          data={controller.viewModel.categoryBreakdown}
          xKey="category"
          yKey="amount"
        />
      </Section>

      {/* Trend Chart */}
      <Section title="Income vs. Expenses">
        <LineChart
          data={controller.viewModel.trendData}
          xKey="date"
          lines={[
            { key: 'income', color: 'green', label: 'Income' },
            { key: 'expenses', color: 'red', label: 'Expenses' }
          ]}
        />
      </Section>
    </div>
  );
}
```

**View Model**:
```typescript
interface ReportsViewModel {
  period: 'month' | 'year';
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  categoryBreakdown: { category: string; amount: number }[];
  trendData: { date: string; income: number; expenses: number }[];
}
```

**Usage**: Financial insights and analytics

---

### Settings (`/settings`)

**File**: `app/(dashboard)/settings/page.tsx`

**Scope**: Account configuration, user management, categories, preferences

**Controller**: `useSettingsController` (hooks/controllers/useSettingsController.ts)

**Features**:
- ✅ User profile editing
- ✅ Group member management (admin only)
- ✅ Category management
- ✅ Account management
- ✅ Budget preferences
- ✅ App theme toggle (future)

**Data Sources**:
- `useCurrentUser()` - Logged-in user
- `useUsers()` - All group members
- `useCategories()` - All categories
- `useAccounts()` - All accounts

**Behavior**:
1. Display tabbed interface
2. Each tab manages a settings domain
3. Handle CRUD operations for entities
4. Save preferences to localStorage

**Structure**:
```tsx
export default function SettingsPage() {
  const controller = useSettingsController();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader title="Settings" />

      {/* Tabs */}
      <Tabs value={controller.activeTab} onValueChange={controller.setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <ProfileForm user={controller.currentUser} />
        </TabsContent>

        {/* Users Tab (Admin Only) */}
        {controller.isAdmin && (
          <TabsContent value="users">
            <UserManagement
              users={controller.viewModel.users}
              onInvite={controller.handleInviteUser}
              onRoleChange={controller.handleRoleChange}
            />
          </TabsContent>
        )}

        {/* Categories Tab */}
        <TabsContent value="categories">
          <CategoryList
            categories={controller.viewModel.categories}
            onAdd={controller.openCategoryForm}
            onEdit={(cat) => controller.openCategoryForm(cat)}
            onDelete={controller.handleDeleteCategory}
          />
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <AccountList
            accounts={controller.viewModel.accounts}
            onAdd={controller.openAccountForm}
            onEdit={(acc) => controller.openAccountForm(acc)}
            onDelete={controller.handleDeleteAccount}
          />
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <PreferencesForm
            preferences={controller.preferences}
            onSave={controller.handleSavePreferences}
          />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CategoryForm
        isOpen={controller.isCategoryFormOpen}
        onOpenChange={controller.setCategoryFormOpen}
        category={controller.selectedCategory}
        mode={controller.categoryFormMode}
      />
    </div>
  );
}
```

**View Model**:
```typescript
interface SettingsViewModel {
  currentUser: User;
  users: User[];
  categories: Category[];
  accounts: Account[];
  isAdmin: boolean;
}
```

**Usage**: App configuration and management

---

## Layouts

### Root Layout (`app/layout.tsx`)

**Scope**: Global app wrapper, providers, fonts, metadata

**Features**:
- ✅ ClerkProvider for authentication
- ✅ QueryClientProvider for React Query
- ✅ Font loading (Spline Sans)
- ✅ Global metadata (title, description)
- ✅ Analytics integration (future)

**Structure**:
```tsx
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClientProvider } from '@tanstack/react-query';
import { Spline_Sans } from 'next/font/google';
import { queryClient } from '@/lib/query-client';
import './globals.css';

const splineSans = Spline_Sans({
  subsets: ['latin'],
  variable: '--font-spline-sans'
});

export const metadata = {
  title: 'Wealth Pillar - Family Financial Management',
  description: 'Track expenses, manage budgets, and grow your wealth'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="it" className={splineSans.variable}>
        <body className="font-sans antialiased">
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

---

### Auth Layout (`app/(auth)/layout.tsx`)

**Scope**: Authentication pages wrapper

**Features**:
- ✅ Centered auth card layout
- ✅ Background styling
- ✅ Public route (no auth required)

**Structure**:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
```

---

### Dashboard Layout (`app/(dashboard)/layout.tsx`)

**Scope**: Protected routes wrapper, navigation

**Features**:
- ✅ Protected route (requires authentication)
- ✅ Header with user menu
- ✅ Sidebar navigation (desktop)
- ✅ Bottom navigation (mobile)
- ✅ Role-based access control
- ✅ Responsive layout

**Structure**:
```tsx
import { auth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { BottomNavigation } from '@/components/bottom-navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header (Desktop) */}
      <Header />

      <div className="flex">
        {/* Sidebar (Desktop) */}
        <Sidebar className="hidden lg:block" />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <BottomNavigation className="lg:hidden" />
    </div>
  );
}
```

**Navigation Items**:
- Dashboard
- Transactions
- Budgets
- Investments
- Reports
- Settings

---

## Page Patterns

### Controller Pattern

**All pages use controller hooks for logic separation**:

```tsx
// ❌ BAD - Logic in page component
export default function Page() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(res => setData(res));
  }, []);

  const handleSubmit = async (values) => {
    // Complex logic here
  };

  return <UI data={data} onSubmit={handleSubmit} />;
}

// ✅ GOOD - Logic in controller hook
export default function Page() {
  const controller = usePageController();

  return <UI viewModel={controller.viewModel} actions={controller.actions} />;
}
```

**Controller Hook Structure**:
```typescript
export function usePageController() {
  // 1. Data fetching
  const { data } = useQuery(...);

  // 2. UI state
  const [isModalOpen, setModalOpen] = useState(false);

  // 3. View model (memoized)
  const viewModel = useMemo(() => createViewModel(data), [data]);

  // 4. Actions (callbacks)
  const handleAction = useCallback(() => {}, []);

  // 5. Return API
  return { viewModel, isModalOpen, setModalOpen, handleAction };
}
```

---

### Data Fetching

**Server-side via API routes + React Query**:

```tsx
// Page component
export default function Page() {
  const { data, isLoading, error } = useTransactions();

  if (isLoading) return <Spinner />;
  if (error) return <ErrorBoundary error={error} />;

  return <TransactionList data={data} />;
}
```

**Benefits**:
- ✅ Automatic caching
- ✅ Background refetch
- ✅ Optimistic updates
- ✅ Error handling
- ✅ Loading states

---

### URL State Management

**Use search params for shareable filters**:

```tsx
// Hook usage
export function useTransactionFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters = {
    type: searchParams.get('type') || 'all',
    category: searchParams.get('category') || 'all',
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || ''
  };

  const setFilters = useCallback((newFilters) => {
    const params = new URLSearchParams(newFilters);
    router.push(`?${params.toString()}`);
  }, [router]);

  return { filters, setFilters };
}
```

**Benefits**:
- ✅ Shareable URLs
- ✅ Browser back/forward works
- ✅ Persistent state across refreshes

---

### Error Boundaries

**Wrap pages in error boundaries**:

```tsx
// app/(dashboard)/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function Layout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

**Fallback UI**:
- Friendly error message
- Retry button
- Navigate to dashboard link

---

### Loading States

**Use Suspense for loading UI**:

```tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
```

---

## Best Practices

### Page Component Guidelines

1. **Keep pages under 300 lines** - Extract complex UI to components
2. **Use controller hooks** - No business logic in pages
3. **Consume view models** - Don't transform data in pages
4. **Handle loading/error states** - Always provide feedback
5. **Use semantic HTML** - `<main>`, `<section>`, `<article>`

### Controller Hook Guidelines

1. **One controller per page** - Single responsibility
2. **Return clear API** - `{ viewModel, state, actions }`
3. **Memoize calculations** - Use `useMemo` for derived data
4. **Use callbacks** - `useCallback` for action handlers
5. **Group related state** - Don't create 10+ useState calls

### Data Fetching Guidelines

1. **Use React Query hooks** - Don't fetch directly
2. **Configure staleTime** - Balance freshness vs. performance
3. **Handle loading states** - Show skeletons, not blank screens
4. **Handle errors gracefully** - Error boundaries + retry logic
5. **Prefetch on hover** - Improve perceived performance

### URL State Guidelines

1. **Use for filters** - Shareable, persistent filtering
2. **Don't use for modals** - Too noisy in URL
3. **Validate params** - Don't trust URL values
4. **Debounce updates** - Avoid excessive history entries
5. **Clear invalid params** - Remove on reset

### Performance Guidelines

1. **Code split pages** - Use dynamic imports for heavy pages
2. **Lazy load charts** - Charts are expensive
3. **Virtualize long lists** - For 100+ items
4. **Optimize images** - Use Next.js Image component
5. **Monitor bundle size** - Keep pages under 100KB

---

## Common Patterns

### Page with User Filter

```tsx
export default function Page() {
  const { selectedUserId, handleUserChange } = useUserSelection();
  const { data } = useTransactions(selectedUserId);

  return (
    <>
      <UserSelector selectedUserId={selectedUserId} onChange={handleUserChange} />
      <DataView data={data} />
    </>
  );
}
```

### Page with Modal Form

```tsx
export default function Page() {
  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <>
      <List onItemClick={(item) => { setSelected(item); setOpen(true); }} />
      <Form isOpen={isOpen} onOpenChange={setOpen} item={selected} />
    </>
  );
}
```

### Page with Filters

```tsx
export default function Page() {
  const { filters, setFilters } = useFilters();
  const { data } = useFilteredData(filters);

  return (
    <>
      <FilterBar filters={filters} onChange={setFilters} />
      <DataView data={data} />
    </>
  );
}
```

---

**Status**: ✅ Production Ready
**Last Updated**: October 2025
**Maintainer**: Wealth Pillar Team
