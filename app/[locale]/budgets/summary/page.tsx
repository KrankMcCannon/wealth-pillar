/**
 * Budget Summary Page - Server Component
 */

import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import BudgetSummaryContent from './budget-summary-content';

export default async function BudgetSummaryPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = requireGroupId(currentUser);

  let pageData;
  try {
    pageData = await PageDataService.getBudgetsPageData(groupId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore nel caricamento del riepilogo';
    throw new Error(message, { cause: err });
  }

  return (
    <BudgetSummaryContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />
  );
}
