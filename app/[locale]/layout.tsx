import React, { Suspense } from 'react';
import type { Metadata, Viewport } from 'next';
import { Figtree, Source_Serif_4 as SourceSerif } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { LocaleLayoutBody, LocaleLayoutHtmlFallback } from './locale-layout-body';
import '../globals.css';

const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  fallback: ['system-ui', 'arial'],
});

const sourceSerif = SourceSerif({
  variable: '--font-source-serif',
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700'],
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});

const fontClassName = `${figtree.variable} ${sourceSerif.variable}`;

export const metadata: Metadata = {
  title: 'Wealth Pillar — finanze di casa',
  description:
    'Spendibile, conti, budget e un portafoglio al dettaglio per famiglie e piccoli gruppi.',
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
    <Suspense fallback={<LocaleLayoutHtmlFallback className={fontClassName} />}>
      <LocaleLayoutBody className={fontClassName} params={params}>
        {children}
      </LocaleLayoutBody>
    </Suspense>
  );
}
