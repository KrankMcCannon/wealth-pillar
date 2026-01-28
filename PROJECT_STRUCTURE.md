# Project Structure

This document outlines the architecture and logical organization of the Wealth Pillar codebase.

## Root Directories

### `/app`
Next.js 13+ App Router directory. Contains all the routes, pages, and layouts of the application.
- **`(auth)`**: Route group for authentication-related pages (e.g., login, signup).
- **`(dashboard)`**: Route group for the main authenticated user interface.
- **`api`**: Backend API routes.
- **`globals.css`**: Global stylesheet.

### `/src`
Contains the core business logic, reusable components, and utilities.
- **`components`**: Reusable UI components generic enough to be used across multiple features (buttons, inputs, cards).
- **`features`**: Feature-specific logic and components. Each folder likely represents a domain feature (e.g., `investments`, `auth`) containing its own components and hooks.
- **`hooks`**: specialized Custom React hooks.
- **`lib`**: General utility functions, helper classes, and configuration (e.g., `utils.ts`, `constants.ts`).
- **`providers`**: React Context providers (e.g., ThemeProvider, AuthProvider) that wrap the application.
- **`server`**: Server-side logic, including Server Actions, database schemas (if using Drizzle/Prisma), and services.
- **`stores`**: Global state management stores (e.g., using Zustand or similar).
- **`styles`**: Additional style configurations or mixins.

### `/scripts`
Standalone scripts for maintenance, data seeding, or automation tasks.
- Example: `seed-available-shares.js`, `update-market-data-cache.mjs`.

### `/.agent`
Contains configuration and memory for AI agents (Antigravity).
- **`workflows`**: Markdown definitions of agentic workflows.
- **`brain`**: Agent memory and artifacts.

### `/.clerk`
Clerk authentication configuration and localized files.

### `/.github`
GitHub configuration.
- **`workflows`**: CI/CD pipelines (GitHub Actions).

### `/.netlify`
Netlify deployment configuration and build artifacts.

## File Placement Guidelines
- **Pages**: Go in `/app`.
- **UI Components**: generic ones in `/src/components`, feature-specific ones in `/src/features/{feature}/components`.
- **Logic**: Custom hooks in `/src/hooks` or `/src/features/{feature}/hooks`.
- **Database/Server**: Server actions and database calls in `/src/server`.
