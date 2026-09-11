import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

/**
 * Dashboard layout — persistent shell (header + bottom nav) shared across all tab routes.
 * Page `loading.tsx` files are the navigation fallback while route data resolves.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
