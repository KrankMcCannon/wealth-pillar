# Technology Stack

**Analysis Date:** 2025-03-03

## Languages

**Primary:**
- TypeScript 5.x - Used throughout the entire codebase for both frontend and backend logic. Strict mode is enabled.

**Secondary:**
- SQL - Used for Supabase migrations and RPC functions in `migrations/`.

## Runtime

**Environment:**
- Node.js >=22.12.0 - Specified in `package.json` engines.

**Package Manager:**
- npm - Verified by the presence of `package-lock.json`.
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- Next.js 16.1.1 (App Router) - Primary application framework. Uses Server Components, Server Actions, and Route Handlers.
- React 19.2.3 - UI library.

**Testing:**
- Vitest 4.0.18 - Unit and integration testing.
- Playwright 1.58.1 - End-to-end testing.

**Build/Dev:**
- Tailwind CSS v4.1.18 - Utility-first CSS framework.
- ESLint 9.x - Linting tool.
- Prettier 3.x - Code formatting.

## Key Dependencies

**Critical:**
- `@clerk/nextjs` ^6.36.5 - Authentication and user management.
- `@supabase/supabase-js` ^2.57.4 - Database client and real-time features.
- `zustand` ^5.0.9 - Client-side state management.
- `zod` ^4.2.1 - Schema validation for forms and API responses.
- `react-hook-form` ^7.69.0 - Form management and validation.

**Infrastructure:**
- `next-intl` ^4.8.2 - Internationalization support.
- `nuqs` ^2.8.6 - Type-safe search params state management.
- `framer-motion` ^12.23.12 - Animation library.
- `lucide-react` ^0.542.0 - Icon set.
- `recharts` ^3.7.0 - Data visualization library.

## Configuration

**Environment:**
- Configured via `.env` files (e.g., `.env.example`).
- Requires `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TWELVE_DATA_API_KEY`.

**Build:**
- `next.config.ts`: Next.js configuration including image remote patterns and next-intl plugin.
- `tsconfig.json`: TypeScript configuration with path aliases (`@/*`).
- `tailwind.config.js`: Tailwind CSS configuration (integrated via `@tailwindcss/postcss` in newer versions).
- `components.json`: Shadcn UI configuration.

## Platform Requirements

**Development:**
- Node.js >=22.12.0
- Supabase account and project.
- Clerk account and project.
- Twelve Data API key.

**Production:**
- Optimized for deployment on platforms like Netlify (verified by `netlify.toml`) or Vercel.

---

*Stack analysis: 2025-03-03*
