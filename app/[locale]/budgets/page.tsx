/**
 * Budgets Page - Server Component
 *
 * Data is awaited here (not passed as a Promise to the client) so client-side
 * navigation from the desktop sidebar reliably receives a serializable payload.
 */

import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import BudgetsContent from './budgets-content';

export default async function BudgetsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = requireGroupId(currentUser);

  let pageData;
  try {
    pageData = await PageDataService.getBudgetsPageData(groupId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore nel caricamento dei budget';
    throw new Error(message, { cause: err });
  }

  return <BudgetsContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />;
}
