import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Spline_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const splineSans = Spline_Sans({
  variable: '--font-spline-sans',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: 'Wealth Pillar - Gestione Finanziaria Intelligente',
  description: 'Piattaforma completa per la gestione delle finanze personali e familiari',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

/**
 * Root Layout
 *
 * Provides authentication context via Clerk and TanStack Query provider for the entire app.
 * SSR hydration with server-scoped QueryClient is implemented in dashboard layouts
 * to avoid issues with static prerendering.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <ClerkProvider telemetry={false}>
      <html lang="it" data-scroll-behavior="smooth" suppressHydrationWarning>
        <body className={`${splineSans.variable} antialiased min-h-screen bg-card text-primary`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
