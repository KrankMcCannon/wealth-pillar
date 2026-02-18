# Testing Strategy

**Analysis Date:** 2026-02-18

## Unit & Integration Testing
- **Runner**: Vitest (v4.0.18) with `jsdom` environment.
- **Location**: Co-located with source files using `.test.ts` or `.test.tsx` extensions.
- **Mocking**: Extensive use of `vi.mock` for Supabase, Clerk, and internal services.
- **Patterns**: `describe/it/expect` blocks. Use of factory functions for mock data.

## End-to-End Testing
- **Runner**: Playwright (v1.55.1).
- **Location**: Centralized in the `tests/` root directory using `.spec.ts` extension.
- **Authentication**: Bypassed using custom Clerk mocks (e.g., `tests/mocks/clerk-mock.ts`).
- **Features**: Parallel execution, HTML and Monocart reporting, and coverage support.

## Test Data Management
- Use of mock data generators to ensure consistent test states.
- Mocking of external APIs (Twelve Data, Clerk) to prevent network-dependent failures.
