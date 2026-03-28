import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/components/theme-provider';
import { DesktopSidebar } from '@/components/layout';
import { routing } from '@/i18n/routing';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { withTimeout } from '@/lib/utils/with-timeout';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { ModalProvider } from '@/providers/modal-provider';
import { ReferenceDataInitializer } from '@/providers/reference-data-initializer';
import { UserProvider } from '@/providers/user-provider';

export function LocaleLayoutHtmlFallback({ className }: { className: string }): React.JSX.Element {
  return (
    <html lang="it" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${className} antialiased min-h-screen bg-card text-primary`}
        suppressHydrationWarning
      >
        <div className="min-h-screen bg-card" aria-hidden />
      </body>
    </html>
  );
}

/**
 * Resolves locale params + i18n + session + reference data inside the parent Suspense boundary.
 */
export async function LocaleLayoutBody({
  children,
  params,
  className,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
  className: string;
}): Promise<React.JSX.Element> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const currentUser = await getCurrentUser();

  let appContent: React.ReactNode = children;

  if (currentUser) {
    if (currentUser.group_id) {
      type GroupUsers = Awaited<ReturnType<typeof getGroupUsers>>;
      type GroupAccounts = Awaited<ReturnType<typeof getAccountsByGroupDeduped>>;
      type AllCategories = Awaited<ReturnType<typeof getAllCategoriesDeduped>>;

      const [groupUsers, accounts, categories] = await Promise.all([
        withTimeout(getGroupUsers(), 1500, [currentUser] as GroupUsers),
        withTimeout(getAccountsByGroupDeduped(currentUser.group_id), 1500, [] as GroupAccounts),
        withTimeout(getAllCategoriesDeduped(), 1200, [] as AllCategories),
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
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${className} antialiased min-h-screen bg-card text-primary`}
        suppressHydrationWarning
      >
        <ClerkProvider telemetry={false}>
          <NextIntlClientProvider messages={messages}>
            <NuqsAdapter>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem={false}
                disableTransitionOnChange
              >
                <DesktopSidebar />
                {appContent}
                <Toaster />
              </ThemeProvider>
            </NuqsAdapter>
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
