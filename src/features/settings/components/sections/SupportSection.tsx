'use client';

import { ChevronRight, Gavel, HelpCircle, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';

interface SupportSectionProps {
  isSigningOut: boolean;
  onSignOut: () => void;
}

function SupportRow({
  icon,
  label,
  href,
  divider = true,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  href: string;
  divider?: boolean;
}>) {
  return (
    <a
      href={href}
      className={cn(s.row, divider && s.rowDivider)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={s.rowLeft}>
        <div className={s.rowIconWrap}>{icon}</div>
        <span className={s.rowLabel}>{label}</span>
      </div>
      <ChevronRight className={s.rowChevron} aria-hidden />
    </a>
  );
}

export function SupportSection({ isSigningOut, onSignOut }: Readonly<SupportSectionProps>) {
  const t = useTranslations('SettingsSections.Support');

  return (
    <section className="space-y-2">
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <SupportRow
          icon={<HelpCircle className={s.rowIcon} aria-hidden />}
          label={t('helpCenterLabel')}
          href={t('helpCenterHref')}
        />
        <SupportRow
          icon={<Gavel className={s.rowIcon} aria-hidden />}
          label={t('legalLabel')}
          href={t('legalHref')}
          divider={false}
        />
      </div>
      <button type="button" className={s.logoutButton} onClick={onSignOut} disabled={isSigningOut}>
        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
        {isSigningOut ? t('signingOutLabel') : t('logoutLabel')}
      </button>
    </section>
  );
}
