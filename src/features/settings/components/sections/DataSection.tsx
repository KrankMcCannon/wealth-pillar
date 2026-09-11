'use client';

import { Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchHome, stitchSettings as s } from '@/styles/home-design-foundation';
import { useModalState } from '@/lib/navigation/url-state';
import { SettingsRow } from './settings-row';

export function DataSection() {
  const t = useTranslations('SettingsSections.Data');
  const { openModal } = useModalState();

  return (
    <section className={stitchHome.scanSection}>
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <SettingsRow
          icon={<Upload className={s.rowIcon} aria-hidden />}
          label={t('importTransactions')}
          onClick={() => openModal('import')}
          divider={false}
        />
      </div>
    </section>
  );
}
