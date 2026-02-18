# External Integrations

**Analysis Date:** 2025-03-03

## APIs & External Services

**Financial Market Data:**
- **Twelve Data** - Primary source for real-time stock quotes and time-series data for the investments feature.
  - SDK/Client: `fetch` implementation in `src/lib/twelve-data.ts`.
  - Auth: `TWELVE_DATA_API_KEY` (server-side only).
  - Use case: Fetching stock prices, historical data for charts, and batch quotes for portfolios.

**Authentication & User Identity:**
- **Clerk** - Handles user registration, sign-in, and multi-factor authentication.
  - SDK/Client: `@clerk/nextjs`.
  - Auth: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
  - Implementation: `ClerkProvider` in `app/[locale]/layout.tsx`, `auth()` and `clerkClient` in server-side logic.

**User Assets:**
- **Dicebear** - Generates random/placeholder avatars for users.
  - Integration: `api.dicebear.com` (allowed remote pattern in `next.config.ts`).

## Data Storage

**Databases:**
- **Supabase (PostgreSQL)** - Primary data store for all application data (users, transactions, budgets, etc.).
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Client: `@supabase/supabase-js`.
  - Implementation: Initialized in `src/server/db/supabase.ts`.

**File Storage:**
- **Supabase Storage** - Likely used for user-uploaded assets (though not extensively seen in core services).

**Caching:**
- **In-Database Cache** - The `market_data_cache` table in Supabase is used to store Twelve Data API responses for 24 hours to reduce API consumption.
- **Next.js `cache`** - Used in services like `MarketDataService` to deduplicate requests during a single render cycle.

## Authentication & Identity

**Auth Provider:**
- **Clerk**
  - Implementation: Client-side hooks (`useUser`, `useAuth`) and server-side utilities (`auth`, `currentUser`).
  - SSO Support: Includes Google One Tap and social logins (configured in Clerk dashboard).

## Monitoring & Observability

**Error Tracking:**
- Not explicitly detected (no Sentry/LogRocket in dependencies).

**Logs:**
- **Console Logging** - Standard structured logging in services and middleware.
- **Supabase Logs** - Built-in logging for database operations and RPC functions.

## CI/CD & Deployment

**Hosting:**
- **Netlify** - Indicated by `netlify.toml`.

**CI Pipeline:**
- **GitHub Actions** - Configured for updating market data (`.github/workflows/update-market-data.yml`).

## Environment Configuration

**Required env vars:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWELVE_DATA_API_KEY`

**Secrets location:**
- Managed via `.env.local` during development and platform-specific environment variables in production (Netlify).

## Webhooks & Callbacks

**Incoming:**
- `/api/webhooks/clerk` - Clerk sends events like `user.created`, `user.updated`, `user.deleted` to keep the Supabase user profile in sync.
  - Implementation: `app/api/webhooks/clerk/route.ts` and `src/lib/webhooks/clerk-webhook-handler.ts`.
  - Security: Uses `svix` for signature verification.

**Outgoing:**
- None detected.

---

*Integration audit: 2025-03-03*
