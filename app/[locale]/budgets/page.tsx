/**
 * Budgets Page - Server Component
 *
 * Data is awaited here (not passed as a Promise to the client) so client-side
 * navigation from the desktop sidebar reliably receives a serializable payload.
 */

import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getBudgetsPageData } from '@/server/use-cases';
import BudgetsContent from './budgets-content';

export default async function BudgetsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = await requireGroupId(currentUser);

  let pageData;
  try {
    pageData = await getBudgetsPageData(groupId);
  } catch (err) {
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedBudgets'), { cause: err });
  }

  return <BudgetsContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />;
}
