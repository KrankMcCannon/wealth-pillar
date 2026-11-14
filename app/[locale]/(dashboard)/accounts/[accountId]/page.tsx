import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getAccountDetailPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import AccountDetailContent from './account-detail-content';

export default async function AccountDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; accountId: string }>;
  searchParams: Promise<{ user?: string | string[] }>;
}>) {
  const { currentUser, groupId } = await resolvePageContext(params);
  const { accountId } = await params;
  const query = await searchParams;
  const selectedUserId =
    currentUser.role === 'member'
      ? currentUser.id
      : typeof query.user === 'string' && query.user !== 'all'
        ? query.user
        : undefined;
  let pageData;
  try {
    pageData = await getAccountDetailPageData(groupId, accountId, currentUser, selectedUserId);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') notFound();
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedAccounts'), { cause: error });
  }
  return <AccountDetailContent pageData={pageData} selectedUserId={selectedUserId} />;
}
