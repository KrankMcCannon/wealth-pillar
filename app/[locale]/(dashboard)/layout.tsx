import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';

/**
 * Dashboard layout — persistent shell (header + bottom nav) shared across all tab routes.
 * Auth and page data resolve inside each page's Suspense boundary.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  return <DashboardShell>{children}</DashboardShell>;
}
