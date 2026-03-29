/**
 * Budget Summary Page - Server Component
 */

import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import BudgetSummaryContent from './budget-summary-content';

export default async function BudgetSummaryPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = await requireGroupId(currentUser);

  let pageData;
  try {
    pageData = await PageDataService.getBudgetsPageData(groupId);
  } catch (err) {
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedBudgets'), { cause: err });
  }

  return (
    <BudgetSummaryContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />
  );
}
