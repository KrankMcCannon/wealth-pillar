'use client';

import { useMemo } from 'react';
import { Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { SettingsRow } from './settings-row';
import { useRequiredCurrentUser } from '@/hooks';
import { useCategories } from '@/stores/reference-data-store';

interface CategoriesSectionProps {
  onManageCategories: () => void;
}

export function CategoriesSection({ onManageCategories }: Readonly<CategoriesSectionProps>) {
  const t = useTranslations('SettingsSections.Categories');
  const currentUser = useRequiredCurrentUser();
  const categories = useCategories();

  const customCount = useMemo(
    () => categories.filter((cat) => cat.group_id === currentUser.group_id).length,
    [categories, currentUser.group_id]
  );

  return (
    <section className="flex flex-col gap-2">
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <SettingsRow
          icon={<Tag className={s.rowIcon} aria-hidden />}
          label={t('manageTitle')}
          value={customCount > 0 ? String(customCount) : undefined}
          onClick={onManageCategories}
          divider={false}
        />
      </div>
    </section>
  );
}
