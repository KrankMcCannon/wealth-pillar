'use client';

import { UserFilterProvider } from '@/contexts';

/**
 * Dashboard Layout with SSR Streaming Support
 *
 * This layout provides the structure for progressive data loading
 * with Suspense boundaries for streaming responses in Next.js 15
 *
 * Architecture:
 * - All children are client components (for now, can be converted to server components later)
 * - Suspense boundaries wrap data-heavy components
 * - Fallbacks use skeleton loaders for perceived performance
 * - UserFilterProvider wraps all dashboard pages for global user selection state
 *
 * Future: Convert to async Server Component with per-segment prefetching
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserFilterProvider>
      {children}
    </UserFilterProvider>
  );
}
