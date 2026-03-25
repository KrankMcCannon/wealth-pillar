import { cache } from 'react';

import { AccountService } from '@/server/services/account.service';
import { CategoryService } from '@/server/services/category.service';
import { GroupService } from '@/server/services/group.service';

/**
 * Request-scoped deduplication for hot paths shared by `app/[locale]/layout.tsx` and `PageDataService`.
 * Same arguments in one React render tree → single underlying service call.
 */
export const getAccountsByGroupDeduped = cache((groupId: string) =>
  AccountService.getAccountsByGroup(groupId)
);

export const getAllCategoriesDeduped = cache(() => CategoryService.getAllCategories());

export const getGroupUsersByGroupIdDeduped = cache((groupId: string) =>
  GroupService.getGroupUsers(groupId)
);
