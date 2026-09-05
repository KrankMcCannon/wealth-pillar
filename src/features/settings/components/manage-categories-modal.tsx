'use client';

import { useMemo } from 'react';
import { Plus, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { SettingsRow } from './sections/settings-row';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Badge } from '@/components/ui/badge';
import { ModalWrapper, ModalBody, ModalSection } from '@/components/ui/modal-wrapper';
import { useRequiredCurrentUser } from '@/hooks';
import { useCategories, useUsedCategoryKeys } from '@/stores/reference-data-store';
import { useModalState } from '@/lib/navigation/url-state';
import { isSystemCategory } from '@/features/categories/utils/category-helpers';

export interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageCategoriesModal({ isOpen, onClose }: Readonly<ManageCategoriesModalProps>) {
  const t = useTranslations('SettingsSections.Categories');
  const currentUser = useRequiredCurrentUser();
  const categories = useCategories();
  const usedCategoryKeys = useUsedCategoryKeys();
  const { openModal } = useModalState();

  const { customCategories, systemCategories } = useMemo(() => {
    const groupId = currentUser.group_id;
    const custom = categories
      .filter((cat) => cat.group_id === groupId)
      .sort((a, b) => a.label.localeCompare(b.label));
    const system = categories
      .filter((cat) => isSystemCategory(cat))
      .sort((a, b) => a.label.localeCompare(b.label));

    return { customCategories: custom, systemCategories: system };
  }, [categories, currentUser.group_id]);

  const usedSet = useMemo(() => new Set(usedCategoryKeys), [usedCategoryKeys]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={t('modalTitle')}
      description={t('modalDescription')}
    >
      <ModalBody className="flex flex-col gap-5 pb-4">
        <ModalSection title={t('customTitle')}>
          <div className={s.sectionCard}>
            <SettingsRow
              icon={<Plus className={s.rowIcon} aria-hidden />}
              label={t('addLabel')}
              onClick={() => openModal('category')}
              divider={customCategories.length > 0}
            />
            {customCategories.length === 0 ? (
              <p className={s.emptyHint}>{t('emptyCustom')}</p>
            ) : (
              customCategories.map((category, index) => {
                const isUsed = usedSet.has(category.key);
                const isLast = index === customCategories.length - 1;

                return (
                  <SettingsRow
                    key={category.id}
                    bareIcon
                    icon={
                      <CategoryBadge
                        categoryKey={category.icon}
                        color={category.color}
                        size="xs"
                        className="size-8 rounded-lg"
                      />
                    }
                    label={category.label}
                    onClick={() => openModal('category', category.id)}
                    divider={!isLast}
                    trailing={
                      isUsed ? (
                        <Badge variant="secondary" className="shrink-0 text-xs font-medium">
                          {t('inUseBadge')}
                        </Badge>
                      ) : undefined
                    }
                  />
                );
              })
            )}
          </div>
        </ModalSection>

        <ModalSection title={t('systemTitle')}>
          <div className={s.sectionCard}>
            {systemCategories.length === 0 ? (
              <p className={s.emptyHint}>{t('emptySystem')}</p>
            ) : (
              systemCategories.map((category, index) => {
                const isLast = index === systemCategories.length - 1;

                return (
                  <SettingsRow
                    key={category.id}
                    bareIcon
                    icon={
                      <CategoryBadge
                        categoryKey={category.icon}
                        color={category.color}
                        size="xs"
                        className="size-8 rounded-lg"
                      />
                    }
                    label={category.label}
                    showChevron={false}
                    divider={!isLast}
                    trailing={<Tag className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  />
                );
              })
            )}
          </div>
        </ModalSection>
      </ModalBody>
    </ModalWrapper>
  );
}
