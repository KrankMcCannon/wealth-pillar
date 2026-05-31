'use client';

import { Gavel, HelpCircle, LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { SettingsRow } from './settings-row';

interface SupportSectionProps {
  isSigningOut: boolean;
  onSignOut: () => void;
}

export function SupportSection({ isSigningOut, onSignOut }: Readonly<SupportSectionProps>) {
  const t = useTranslations('SettingsSections.Support');

  return (
    <section className="flex flex-col gap-2">
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <SettingsRow
          icon={<HelpCircle className={s.rowIcon} aria-hidden />}
          label={t('helpCenterLabel')}
          href={t('helpCenterHref')}
        />
        <SettingsRow
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
