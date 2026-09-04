'use client';

/**
 * MultiUserSelect — checkbox list for the nested users picker.
 * Always keeps at least the current user selected.
 */

import type { User } from '@/lib/types';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formModalStyles as s } from './form-modal-styles';

interface MultiUserSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  users: User[];
  currentUserId: string;
  className?: string;
}

export function MultiUserSelect({
  value,
  onChange,
  users,
  currentUserId,
  className,
}: Readonly<MultiUserSelectProps>) {
  const t = useTranslations('Forms.MultiUser');

  const handleToggle = (userId: string) => {
    if (value.includes(userId)) {
      const next = value.filter((id) => id !== userId);
      onChange(next.length === 0 ? [currentUserId] : next);
      return;
    }
    onChange([...value, userId]);
  };

  return (
    <div className={cn(s.multiUser.container, className)} role="group">
      {users.map((user) => {
        const checked = value.includes(user.id);
        return (
          <label key={user.id} className={s.multiUser.row}>
            <span className={s.multiUser.userRow}>
              <span className={s.multiUser.name}>{user.name ?? ''}</span>
              {user.id === currentUserId ? (
                <span className={s.multiUser.current}>{t('currentUser')}</span>
              ) : null}
            </span>
            <Checkbox
              checked={checked}
              onCheckedChange={() => handleToggle(user.id)}
              className={s.multiUser.checkbox}
            />
          </label>
        );
      })}
    </div>
  );
}
