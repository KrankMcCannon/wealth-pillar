<div align="center">

# 💰 Wealth Pillar

**Modern Family Financial Management**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Scripts & Automation](#-scripts--automation)

</div>

---

## 🏛️ Product Overview

**Wealth Pillar** is a financial management platform for families and small groups. It consolidates bank accounts, budgets, transactions, and investment portfolios into one shared workspace with role-based access.

The platform provides a command center for:

- **Financial consolidation** — multiple accounts and investment holdings in one place
- **Controlled collaboration** — shared group finances with permissions
- **Budgeting & analysis** — multi-period budgets with real-time tracking
- **Automated workflows** — recurring transactions and daily market-data cache updates

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 💳 Account Management

- Multi-account support (checking, savings, cash, investments)
- Real-time balance tracking with optimistic updates
- Account grouping by household/family

### 📊 Transaction Tracking

- Full CRUD with infinite scroll
- Advanced filtering (date, category, user, account)
- Transfer linking between accounts
- Recurring transaction series

### 💰 Budget Management

- Category-based budgeting
- Visual progress indicators
- Multi-period budget tracking
- Spending analysis by category

</td>
<td width="50%">

### 📈 Investments & Market Data

- Portfolio tracking with allocation views
- Benchmark charts and price history
- Cached market data from [Twelve Data](https://twelvedata.com/)
- Share search and watchlist support

### 📉 Financial Insights

- Home dashboard with key metrics
- Category spending breakdown
- Monthly income vs expense trends
- Savings tracking

### 👥 Family/Group Management

- Multi-user with role-based access
- Group-level financial overview
- Per-user transaction filtering
- Admin controls and invitations

</td>
</tr>
</table>

### 🎨 Modern UI/UX

- **Mobile-first** responsive design
- **Dark mode** with OKLCH color system
- **Internationalization** — English and Italian (`next-intl`)
- **Smooth animations** via Framer Motion
- **Accessible** components (Radix UI primitives)
- **Touch-friendly** swipe gestures

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 22.13.0 (see `.nvmrc`, currently 22.14.0)
- **pnpm** 10.x (used in CI and Netlify)
- **Supabase** account (PostgreSQL database)
- **Clerk** account (authentication)
- **Twelve Data** API key (investment price data)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wealth-pillar

# Install dependencies
pnpm install

# Configure environment (create .env from your secrets)
# See Environment Variables below

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...

# Market data (investments)
TWELVE_DATA_API_KEY=...

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.example.com
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Next.js App Router (app/[locale]/)             │
└─────────────────────────────┬───────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Server          │  │ Client          │  │ Features        │
│ Components      │  │ Components      │  │ (Domain UI)     │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              src/features/{domain}/actions                  │
│                    (Server Actions)                         │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   src/server/use-cases                      │
│                  (Application logic)                        │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 src/server/repositories                     │
│              (Data access + domain rules)                   │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│     Supabase client + Drizzle ORM → PostgreSQL              │
└─────────────────────────────────────────────────────────────┘
```

### Key Patterns

| Pattern               | Description                                         |
| --------------------- | --------------------------------------------------- |
| **Server Components** | Data fetching in `app/[locale]/` pages              |
| **Server Actions**    | Mutations in `src/features/{domain}/actions`        |
| **Use cases**         | Application logic in `src/server/use-cases`         |
| **Repositories**      | Database access in `src/server/repositories`        |
| **Zustand stores**    | Client-side cache and UI state                      |
| **Feature modules**   | Self-contained domain UI in `src/features`          |
| **i18n**              | Locale routing and messages via `next-intl`           |

---

## 📁 Project Structure

```
wealth-pillar/
├── app/
│   ├── [locale]/              # Localized routes (en, it)
│   │   ├── (auth)/            # Sign-in, sign-up, onboarding
│   │   ├── home/              # Dashboard / overview
│   │   ├── accounts/
│   │   ├── budgets/
│   │   ├── transactions/
│   │   ├── investments/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/webhooks/clerk/    # Clerk user sync webhook
│   └── globals.css            # Design tokens (OKLCH)
├── src/
│   ├── components/            # Shared UI (ui, form, layout)
│   ├── features/              # Domain modules (12 features)
│   ├── hooks/                 # Global React hooks
│   ├── i18n/                  # Locale routing and config
│   ├── lib/                   # Utilities, auth, Twelve Data client
│   ├── server/
│   │   ├── db/                # Supabase, Drizzle schema
│   │   ├── domain/            # Domain types and rules
│   │   ├── repositories/      # Data access layer
│   │   └── use-cases/         # Application logic
│   └── stores/                # Zustand stores
├── scripts/
│   ├── update-market-data-cache.mjs   # Refresh market_data_cache
│   └── seed-available-shares.js         # Seed share catalog
├── .github/workflows/
│   └── update-market-data.yml           # Daily market data cron
├── messages/                  # i18n translation files (en.json, it.json)
└── tests/                     # Playwright E2E tests
```

---

## 🛠️ Tech Stack

| Category         | Technology                                                                  |
| ---------------- | --------------------------------------------------------------------------- |
| **Framework**    | [Next.js 16](https://nextjs.org/) (App Router, RSC, Server Actions)         |
| **React**        | [React 19](https://react.dev/)                                              |
| **Language**     | [TypeScript 5](https://www.typescriptlang.org/) (strict mode)               |
| **Database**     | [Supabase](https://supabase.com/) (PostgreSQL)                              |
| **ORM**          | [Drizzle ORM](https://orm.drizzle.team/)                                    |
| **Auth**         | [Clerk](https://clerk.com/)                                                 |
| **i18n**         | [next-intl](https://next-intl.dev/) (English, Italian)                      |
| **Styling**      | [Tailwind CSS 4](https://tailwindcss.com/) (OKLCH tokens)                   |
| **State**        | [Zustand 5](https://zustand-demo.pmnd.rs/)                                  |
| **Forms**        | [React Hook Form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) |
| **UI**           | [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| **Animations**   | [Framer Motion](https://www.framer.com/motion/)                             |
| **Charts**       | [Recharts](https://recharts.org/)                                           |
| **Market data**  | [Twelve Data API](https://twelvedata.com/)                                  |
| **E2E Testing**  | [Playwright](https://playwright.dev/)                                       |
| **Unit Testing** | [Vitest](https://vitest.dev/)                                               |
| **Package mgr**  | [pnpm](https://pnpm.io/) 10.x                                               |

---

## 📜 Scripts & Automation

### Available Scripts

| Script                    | Description                        |
| ------------------------- | ---------------------------------- |
| `pnpm dev`                | Start development server           |
| `pnpm build`              | Production build                   |
| `pnpm start`              | Start production server            |
| `pnpm lint`               | Run ESLint                         |
| `pnpm lint:fix`           | Run ESLint with auto-fix           |
| `pnpm format`             | Format code with Prettier          |
| `pnpm format:check`       | Check Prettier formatting          |
| `pnpm typecheck`          | Run TypeScript checks              |
| `pnpm test`               | Run unit tests (Vitest)            |
| `pnpm test:coverage`      | Unit tests with coverage           |
| `pnpm test:e2e`           | Run E2E tests (Playwright)         |
| `pnpm test:e2e:ui`        | E2E tests with Playwright UI       |
| `pnpm test:e2e:headed`    | E2E tests in headed browser        |
| `pnpm test:e2e:coverage`  | E2E tests with coverage reporting  |

### Market Data Cache

Investment charts read from the `market_data_cache` table. A GitHub Actions workflow refreshes it daily at 05:00 UTC and can also be triggered manually.

**Workflow:** `.github/workflows/update-market-data.yml`

**Required GitHub secrets:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWELVE_DATA_API_KEY`

**Run locally:**

```bash
# Update all symbols from the investments table
node scripts/update-market-data-cache.mjs

# Dry run for a single symbol
node scripts/update-market-data-cache.mjs --symbols=AAPL --dry-run

# Limit batch size or read from available_shares
node scripts/update-market-data-cache.mjs --from=available_shares --limit=10
```

The script exits with code 1 if any symbol fails, so CI can detect partial failures.

**Seed available shares** (one-time catalog setup):

```bash
node scripts/seed-available-shares.js
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# E2E with UI
pnpm test:e2e:ui
```

---

## 🚢 Deployment

### Netlify

The project is configured for Netlify via `netlify.toml`:

```bash
pnpm build
```

Netlify uses Node 22.14.0 and `pnpm run build`.

Ensure all environment variables listed above are set in your deployment platform.

---

## 🤝 Contributing

1. **Follow** the feature module pattern for new UI and actions
2. **Use** Server Actions for mutations, use cases for application logic, repositories for data access
3. **Apply** centralized styles from `globals.css`
4. **Run** `pnpm lint && pnpm typecheck` before committing

### Git Commit Convention

```bash
# Format: type(scope): description
feat(transactions): add receipt image upload
fix(budgets): correct period calculation
docs: update README
refactor(auth): simplify onboarding flow
```

---

## 📄 License

[MIT](./LICENSE)

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, and Supabase**

</div>
