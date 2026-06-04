import type { User } from '@/lib/types';

export type AppPageHeaderUser = {
  name?: string;
  role?: string;
};

export function toAppPageHeaderUser(currentUser: User): AppPageHeaderUser {
  return {
    ...(currentUser.name != null ? { name: currentUser.name } : {}),
    role: currentUser.role || 'member',
  };
}
