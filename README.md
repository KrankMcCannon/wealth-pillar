<div align="center">

# 💰 Wealth Pillar

**Modern Family Financial Management**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

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

### 📈 Financial Insights

- Dashboard with key metrics
- Category spending breakdown
- Monthly income vs expense trends
- Savings tracking

### 🔄 Recurring Transactions

- Flexible frequency options
- Automatic execution tracking
- Pause/resume functionality
- Missed payment detection

### 👥 Family/Group Management

- Multi-user with role-based access
- Group-level financial overview
- Per-user transaction filtering
- Admin controls

</td>
</tr>
</table>

### 🎨 Modern UI/UX

- **Mobile-first** responsive design
- **Dark mode** with OKLCH color system
- **Smooth animations** via Framer Motion
- **Accessible** components (Radix UI primitives)
- **Touch-friendly** swipe gestures

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥22.12.0 (see `.nvmrc`)
- **npm** 9+
- **Supabase** account (database)
- **Clerk** account (authentication)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd wealth-pillar

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and Clerk credentials

# Start development server
npm run dev
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
SUPABASE_SERVICE_KEY=eyJ...
DATABASE_URL=postgresql://...
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                       │
│                  /app (Routes, Layouts)                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Server          │  │ Client          │  │ Features        │
│ Components      │  │ Components      │  │ (Domain Logic)  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              /src/features/{domain}/actions                 │
│                    (Server Actions)                         │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   /src/server/services                      │
│             (Business Logic + Database Access)              │
└─────────────────────────────┬───────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase (PostgreSQL)                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Patterns

| Pattern               | Description                                    |
| --------------------- | ---------------------------------------------- |
| **Server Components** | Data fetching in `/app` pages, passed as props |
| **Server Actions**    | Mutations in `/src/features/{domain}/actions`  |
| **Service Layer**     | Business logic in `/src/server/services`       |
| **Zustand Stores**    | Client-side cache and UI state                 |
| **Feature Modules**   | Self-contained domain logic in `/src/features` |

---

## 📁 Project Structure

```
wealth-pillar/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Public auth pages (Clerk)
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── accounts/        # Bank accounts
│   │   ├── budgets/         # Budget management
│   │   ├── dashboard/       # Main overview
│   │   ├── investments/     # Portfolio tracking
│   │   ├── reports/         # Financial reports
│   │   ├── settings/        # User settings
│   │   └── transactions/    # Transaction list
│   ├── api/webhooks/        # Clerk webhooks
│   └── globals.css          # Design tokens (OKLCH)
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Base primitives (Button, Input, etc.)
│   │   ├── form/            # Form components
│   │   ├── layout/          # Header, BottomNavigation
│   │   └── shared/          # Shared utilities
│   ├── features/            # Domain modules (12 features)
│   │   ├── accounts/        # Account management
│   │   ├── auth/            # Authentication
│   │   ├── budgets/         # Budget tracking
│   │   ├── categories/      # Transaction categories
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── investments/     # Portfolio management
│   │   ├── onboarding/      # User onboarding flow
│   │   ├── permissions/     # RBAC system
│   │   ├── recurring/       # Recurring transactions
│   │   ├── reports/         # Financial analytics
│   │   ├── settings/        # Settings pages
│   │   └── transactions/    # Transaction CRUD
│   ├── hooks/               # Global React hooks
│   ├── lib/                 # Utilities, types, cache
│   ├── server/              # Server-side code
│   │   ├── db/              # Supabase client
│   │   └── services/        # Business logic (18 services)
│   ├── stores/              # Zustand stores (9 stores)
│   └── styles/              # Shared style objects
├── tests/                   # Playwright E2E tests
├── migrations/              # Supabase migrations
└── PROJECT_STRUCTURE.md     # Detailed agent documentation
```

> 📖 See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for comprehensive architecture documentation.

---

## 🛠️ Tech Stack

| Category         | Technology                                                                  |
| ---------------- | --------------------------------------------------------------------------- |
| **Framework**    | [Next.js 16.1](https://nextjs.org/) (App Router, RSC, Server Actions)       |
| **React**        | [React 19.2](https://react.dev/)                                            |
| **Language**     | [TypeScript 5](https://www.typescriptlang.org/) (strict mode)               |
| **Database**     | [Supabase](https://supabase.com/) (PostgreSQL)                              |
| **Auth**         | [Clerk](https://clerk.com/)                                                 |
| **Styling**      | [Tailwind CSS 4.1](https://tailwindcss.com/) (OKLCH tokens)                 |
| **State**        | [Zustand 5](https://zustand-demo.pmnd.rs/)                                  |
| **Forms**        | [React Hook Form](https://react-hook-form.com/) + [Zod 4](https://zod.dev/) |
| **UI**           | [Radix UI](https://www.radix-ui.com/) primitives                            |
| **Animations**   | [Framer Motion](https://www.framer.com/motion/)                             |
| **Charts**       | [Recharts](https://recharts.org/)                                           |
| **E2E Testing**  | [Playwright](https://playwright.dev/)                                       |
| **Unit Testing** | [Vitest](https://vitest.dev/)                                               |

---

## � Available Scripts

| Script              | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Production build         |
| `npm run start`     | Start production server  |
| `npm run lint`      | Run ESLint               |
| `npm run typecheck` | Run TypeScript checks    |

---

## 🧪 Testing

```bash
# Run E2E tests (Playwright)
npx playwright test

# Run E2E with UI
npx playwright test --ui

# Run unit tests (Vitest)
npm run test
```

---

## 📚 Documentation

| Document                                       | Purpose                                                   |
| ---------------------------------------------- | --------------------------------------------------------- |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Complete architecture reference for agents and developers |
| [CHANGELOG.md](./CHANGELOG.md)                 | Version history and release notes                         |

---

## 🚢 Deployment

### Netlify (Configured)

The project includes `netlify.toml` for automatic deployment:

```bash
npm run build
```

### Environment Setup

Ensure all environment variables from `.env.example` are configured in your deployment platform.

---

## 🤝 Contributing

1. **Read** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for architecture context
2. **Follow** the feature module pattern for new features
3. **Use** Server Actions for mutations, Services for business logic
4. **Apply** centralized styles from `globals.css`
5. **Run** `npm run lint && npm run typecheck` before committing

### Git Commit Convention

```bash
# Format: type(scope): description
feat(transactions): add receipt image upload
fix(budgets): correct period calculation
docs: update PROJECT_STRUCTURE.md
refactor(auth): simplify onboarding flow
```

---

## 📄 License

[MIT](./LICENSE)

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, and Supabase**

</div>
