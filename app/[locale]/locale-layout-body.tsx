import React, { Suspense } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { routing } from '@/i18n/routing';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { withTimeout } from '@/lib/utils/with-timeout';
import { AccessScope } from '@/lib/permissions/access-scope';
import { getSelectableUsers } from '@/lib/utils/permissions';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { getUsedCategoryKeysByGroupUseCase } from '@/server/use-cases/transactions/get-transactions.use-case';
import { ModalProvider } from '@/providers/modal-provider';
import { ReferenceDataInitializer } from '@/providers/reference-data-initializer';
import { UserProvider } from '@/providers/user-provider';

export function LocaleLayoutHtmlFallback({ className }: { className: string }): React.JSX.Element {
  return (
    <html lang="it" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${className} antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <div className="min-h-screen bg-background" aria-hidden />
      </body>
    </html>
  );
}

/**
 * Resolves locale params + i18n inside the parent Suspense boundary.
 * Session data is a nested hole so a blank html fallback cannot block the page.
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
  // ClerkProvider reads `new Date()` (keyless drift). cacheComponents requires
  // request data first: https://nextjs.org/docs/messages/next-prerender-current-time
  await connection();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${className} antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ClerkProvider telemetry={false}>
          <NextIntlClientProvider messages={messages}>
            <NuqsAdapter>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem={false}
                storageKey="wp-theme-daylight"
                disableTransitionOnChange
              >
                <Suspense fallback={children}>
                  <UserSessionGate>{children}</UserSessionGate>
                </Suspense>
                <Toaster />
              </ThemeProvider>
            </NuqsAdapter>
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

async function UserSessionGate({ children }: { children: React.ReactNode }) {
  const currentUser = await withTimeout(
    getCurrentUser(),
    2000,
    null,
    'locale-layout:getCurrentUser'
  );

  if (!currentUser) {
    return children;
  }

  if (!currentUser.group_id) {
    return (
      <UserProvider currentUser={currentUser} groupUsers={[currentUser]}>
        {children}
      </UserProvider>
    );
  }

  type GroupUsers = Awaited<ReturnType<typeof getGroupUsers>>;
  type GroupAccounts = Awaited<ReturnType<typeof getAccountsByGroupDeduped>>;
  type AllCategories = Awaited<ReturnType<typeof getAllCategoriesDeduped>>;

  const [allGroupUsers, accounts, categories, usedCategoryKeys] = await Promise.all([
    withTimeout(getGroupUsers(), 1500, [currentUser] as GroupUsers),
    withTimeout(getAccountsByGroupDeduped(currentUser.group_id), 1500, [] as GroupAccounts),
    withTimeout(getAllCategoriesDeduped(), 1200, [] as AllCategories),
    withTimeout(getUsedCategoryKeysByGroupUseCase(currentUser.group_id), 1500, [] as string[]),
  ]);

  const groupUsers = getSelectableUsers(currentUser, allGroupUsers);
  const scopedAccounts = AccessScope.for(currentUser).filterShared(accounts || []);

  return (
    <UserProvider currentUser={currentUser} groupUsers={groupUsers}>
      <ReferenceDataInitializer
        data={{
          accounts: scopedAccounts,
          categories: categories || [],
          usedCategoryKeys: usedCategoryKeys || [],
        }}
      >
        <ModalProvider>{children}</ModalProvider>
      </ReferenceDataInitializer>
    </UserProvider>
  );
}
