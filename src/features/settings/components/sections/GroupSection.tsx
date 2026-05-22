'use client';

import type { ReactNode } from 'react';
import { ChevronRight, UserPlus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';

interface GroupSectionProps {
  isAdmin: boolean;
  onInviteMember: () => void;
  onManageGroup?: () => void;
}

function SettingsRow({
  icon,
  label,
  onClick,
  showChevron = true,
  divider = true,
}: Readonly<{
  icon: ReactNode;
  label: string;
  onClick?: (() => void) | undefined;
  showChevron?: boolean;
  divider?: boolean;
}>) {
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      className={cn(s.row, divider && s.rowDivider)}
      onClick={onClick}
    >
      <div className={s.rowLeft}>
        <div className={s.rowIconWrap}>{icon}</div>
        <span className={s.rowLabel}>{label}</span>
      </div>
      {showChevron ? <ChevronRight className={s.rowChevron} aria-hidden /> : null}
    </Comp>
  );
}

export function GroupSection({
  isAdmin,
  onInviteMember,
  onManageGroup,
}: Readonly<GroupSectionProps>) {
  const t = useTranslations('SettingsSections.Group');

  return (
    <section className="space-y-2">
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <SettingsRow
          icon={<Users className={s.rowIcon} aria-hidden />}
          label={t('manageGroupTitle')}
          onClick={onManageGroup}
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
