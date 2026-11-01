'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { SettingsRow } from './sections/settings-row';
import { CategoryBadge } from '@/components/ui/category-badge';
import { Badge } from '@/components/ui/badge';
import { ModalWrapper, ModalBody, ModalSection } from '@/components/ui/modal-wrapper';
import { useRequiredCurrentUser } from '@/hooks';
import {
  useCategories,
  useUsedCategoryKeys,
  useReferenceDataStore,
} from '@/stores/reference-data-store';
import { useModalState } from '@/lib/navigation/url-state';
import { getAllCategoriesAction } from '@/features/categories/actions/category-actions';
import { ModalSearchInput } from '@/components/form/modal-fields/modal-search-input';
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
  const scopeName = useId();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'group' | 'system'>('all');
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    try {
      const result = await getAllCategoriesAction();
      if (result.data) useReferenceDataStore.getState().refreshCategories(result.data);
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getAllCategoriesAction()
      .then((result) => {
        if (!active) return;
        if (result.data) useReferenceDataStore.getState().refreshCategories(result.data);
        else setFailed(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen, refresh]);

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
  const normalizedQuery = query
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const matches = (category: { label: string }) =>
    category.label
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .includes(normalizedQuery);
  const visibleCustom = filter === 'system' ? [] : customCategories.filter(matches);
  const visibleSystem = filter === 'group' ? [] : systemCategories.filter(matches);
  const hasResults = visibleCustom.length > 0 || visibleSystem.length > 0;
  const filterOptions = [
    {
      value: 'all' as const,
      label: t('allFilter'),
      count: customCategories.length + systemCategories.length,
    },
    { value: 'group' as const, label: t('groupFilter'), count: customCategories.length },
    { value: 'system' as const, label: t('systemFilter'), count: systemCategories.length },
  ];

  return (
    <ModalWrapper isOpen={isOpen} onOpenChange={onClose} title={t('modalTitle')}>
      <div className="shrink-0 space-y-3 border-b border-border px-4 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <ModalSearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
          />
          <button
            type="button"
            onClick={() => openModal('category')}
            aria-label={t('addLabel')}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </div>
        <fieldset className="m-0 flex min-w-0 gap-1 rounded-xl border-0 bg-muted p-1">
          <legend className="sr-only">{t('filterLabel')}</legend>
          {filterOptions.map((option) => (
            <label
              key={option.value}
              className="relative flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg px-1 text-sm font-medium has-[:checked]:bg-background has-[:checked]:shadow-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
            >
              <input
                type="radio"
                name={`category-scope-${scopeName}`}
                value={option.value}
                checked={filter === option.value}
                onChange={() => setFilter(option.value)}
                className="peer sr-only"
              />
              <span>{option.label}</span>
              <span className="tabular-nums text-muted-foreground">{option.count}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <ModalBody className="flex flex-col gap-5 pb-4">
        {loading ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t('loading')}
          </p>
        ) : null}
        {failed ? (
          <div role="alert">
            <p>{t('loadError')}</p>
            <button type="button" onClick={() => refresh()} className="min-h-11 underline">
              {t('retry')}
            </button>
          </div>
        ) : null}
        {!loading && !failed && !hasResults ? (
          <p role="status" className={s.emptyHint}>
            {t(normalizedQuery ? 'noResults' : filter === 'system' ? 'emptySystem' : 'emptyCustom')}
          </p>
        ) : null}
        {visibleCustom.length > 0 ? (
          <ModalSection title={t('customTitle')} className="shrink-0">
            <div className={s.sectionCard}>
              {visibleCustom.map((category, index) => {
                const isUsed = usedSet.has(category.key);
                const isLast = index === visibleCustom.length - 1;

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
              })}
            </div>
          </ModalSection>
        ) : null}

        {visibleSystem.length > 0 ? (
          <ModalSection title={t('systemTitle')} className="shrink-0">
            <div className={s.sectionCard}>
              {visibleSystem.map((category, index) => {
                const isLast = index === visibleSystem.length - 1;

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
              })}
            </div>
          </ModalSection>
        ) : null}
      </ModalBody>
    </ModalWrapper>
  );
}
