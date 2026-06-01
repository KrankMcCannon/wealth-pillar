/**
 * Accounts Page — Server Component.
 *
 * Auth e `groupId` risolti subito; i dati conti sono in `Suspense` con fallback
 * [`AccountsLoading`](./loading.tsx) (stessa shell della UI risolta).
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import type { User } from '@/lib/types';
import { getAccountsPageData } from '@/server/use-cases';
import AccountsContent from './accounts-content';
import AccountsLoading from './loading';

async function AccountsPageData({
  groupId,
  currentUser,
  groupUsers,
}: Readonly<{
  groupId: string;
  currentUser: User;
  groupUsers: User[];
}>) {
  let pageData;
  try {
    pageData = await getAccountsPageData(
      groupId,
      groupUsers.map((u) => u.id),
      currentUser
    );
  } catch (err) {
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedAccounts'), { cause: err });
  }

  return <AccountsContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />;
}

export default async function AccountsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = await requireGroupId(currentUser);

  return (
    <Suspense fallback={<AccountsLoading />}>
      <AccountsPageData groupId={groupId} currentUser={currentUser} groupUsers={groupUsers} />
    </Suspense>
  );
}
