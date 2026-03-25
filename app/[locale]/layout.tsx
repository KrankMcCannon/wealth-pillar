import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Spline_Sans as SplineSans } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { LocaleLayoutBody, LocaleLayoutHtmlFallback } from './locale-layout-body';
import '../globals.css';

const splineSans = SplineSans({
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
  maximumScale: 2,
  userScalable: true,
  viewportFit: 'cover',
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale Layout
 *
 * `await params` and dynamic data live inside `<Suspense>` (see LocaleLayoutBody) so auth routes can prerender.
 */
export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>): React.JSX.Element {
  return (
    <Suspense fallback={<LocaleLayoutHtmlFallback className={splineSans.variable} />}>
      <LocaleLayoutBody className={splineSans.variable} params={params}>
        {children}
      </LocaleLayoutBody>
    </Suspense>
  );
}
