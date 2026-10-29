'use client';

import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
} from '@/hooks';
import { useUserFilter } from '@/hooks/state/use-user-filter';

export function useEntityFormPermissions() {
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const groupId = useRequiredGroupId();
  const { selectedUserId } = useUserFilter();

  const { shouldDisableUserField, defaultFormUserId, userFieldHelperText } = usePermissions({
    currentUser,
    selectedUserId,
  });

  return {
    currentUser,
    groupUsers,
    groupId,
    selectedUserId,
    shouldDisableUserField,
    defaultFormUserId,
    userFieldHelperText,
  };
}
