'use client';

import { BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SettingsRow } from '@/features/settings/components/sections/settings-row';
import { stitchHome, stitchSettings as s } from '@/styles/home-design-foundation';

export function BankNotificationsSection({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations('BankNotifications');
  return (
    <section className={stitchHome.scanSection}>
      <h3 className={s.sectionEyebrow}>{t('sectionTitle')}</h3>
      <div className={s.sectionCard}>
        <SettingsRow
          icon={<BellRing className={s.rowIcon} aria-hidden />}
          label={t('title')}
          value="Revolut"
          onClick={onOpen}
          divider={false}
        />
      </div>
    </section>
  );
}
