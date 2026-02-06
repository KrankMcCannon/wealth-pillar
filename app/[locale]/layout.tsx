import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Spline_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/components/theme-provider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { AccountService, CategoryService } from '@/server/services';
import { ModalProvider } from '@/providers/modal-provider';
import { ReferenceDataInitializer } from '@/providers/reference-data-initializer';
import { UserProvider } from '@/providers/user-provider';
import '../globals.css';

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

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Locale Layout
 *
 * Provides authentication context via Clerk and i18n context via next-intl.
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>): Promise<React.JSX.Element> {
  // Ensure that the incoming `locale` is valid

  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'it' | 'en')) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Restore dashboard provider chain required by global modals
  const currentUser = await getCurrentUser();

  let appContent: React.ReactNode = children;

  if (currentUser) {
    if (currentUser.group_id) {
      const [groupUsers, accounts, categories] = await Promise.all([
        getGroupUsers(),
        AccountService.getAccountsByGroup(currentUser.group_id),
        CategoryService.getAllCategories(),
      ]);

      appContent = (
        <UserProvider currentUser={currentUser} groupUsers={groupUsers}>
          <ReferenceDataInitializer
            data={{
              accounts: accounts || [],
              categories: categories || [],
            }}
          >
            <ModalProvider>{children}</ModalProvider>
          </ReferenceDataInitializer>
        </UserProvider>
      );
    } else {
      appContent = (
        <UserProvider currentUser={currentUser} groupUsers={[currentUser]}>
          {children}
        </UserProvider>
      );
    }
  }

  return (
    <ClerkProvider telemetry={false}>
      <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
        <body className={`${splineSans.variable} antialiased min-h-screen bg-card text-primary`}>
          <NextIntlClientProvider messages={messages}>
            <NuqsAdapter>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
              >
                {appContent}
                <Toaster />
              </ThemeProvider>
            </NuqsAdapter>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
