'use client';

import { UserPlus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchHome, stitchSettings as s } from '@/styles/home-design-foundation';
import { SettingsRow } from './settings-row';

interface GroupSectionProps {
  isAdmin: boolean;
  groupName?: string;
  onInviteMember: () => void;
  onManageGroup?: () => void;
}

export function GroupSection({
  isAdmin,
  groupName,
  onInviteMember,
  onManageGroup,
}: Readonly<GroupSectionProps>) {
  const t = useTranslations('SettingsSections.Group');

  return (
    <section className={stitchHome.scanSection}>
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <SettingsRow
          icon={<Users className={s.rowIcon} aria-hidden />}
          label={t('manageGroupTitle')}
          value={groupName || undefined}
          onClick={onManageGroup}
          divider={isAdmin}
        />
        {isAdmin ? (
          <SettingsRow
            icon={<UserPlus className={s.rowIcon} aria-hidden />}
            label={t('inviteMemberTitle')}
            onClick={onInviteMember}
            divider={false}
          />
        ) : null}
      </div>
    </section>
  );
}
