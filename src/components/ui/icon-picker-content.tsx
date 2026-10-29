'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ModalSearchInput } from '@/components/form/modal-fields/modal-search-input';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { searchIcons } from '@/lib/utils/icon-search';
import type { IconCategory } from '@/features/categories';
import { CATEGORIES, ICON_METADATA, getIconByName } from '@/features/categories';
import { iconPickerStyles as styles } from './icon-picker-styles';

const DEBOUNCE_DELAY = 300;

interface IconPickerContentProps {
  value: string;
  recent: string[];
  onSelect: (iconName: string) => void;
}

export function IconPickerContent({ value, recent, onSelect }: Readonly<IconPickerContentProps>) {
  const t = useTranslations('Forms.IconPicker');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<IconCategory>('all');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredIcons = React.useMemo(() => {
    if (debouncedQuery.trim()) {
      return searchIcons(debouncedQuery, selectedCategory).map((result) => result.icon);
    }

    if (selectedCategory === 'all') {
      return ICON_METADATA;
    }

    return ICON_METADATA.filter((icon) => icon.category === selectedCategory);
  }, [debouncedQuery, selectedCategory]);

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, iconName: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(iconName);
    }
  };

  const resultCountMessage = debouncedQuery
    ? t('results.found', { count: filteredIcons.length })
    : t('results.available', { count: filteredIcons.length });

  return (
    <div className={styles.container}>
      <div className={cn(styles.header.base, styles.header.mobile)}>
        <div className={styles.searchWrapper}>
          <ModalSearchInput
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
            aria-label={t('searchAria')}
          />
          {searchQuery ? (
            <button
              onClick={clearSearch}
              className={styles.searchClearButton}
              aria-label={t('clearSearchAria')}
              type="button"
            >
              <X className={styles.searchClearIcon} />
            </button>
          ) : null}
        </div>

        {recent.length > 0 ? (
          <div className={styles.recentContainer}>
            <Clock className={styles.recentIcon} />
            <span className={styles.recentLabel}>{t('recentLabel')}</span>
            <div className={styles.recentIconsWrapper}>
              {recent.slice(0, 3).map((iconName) => {
                const iconMeta = getIconByName(iconName);
                if (!iconMeta) return null;
                const IconComp = iconMeta.component;
                return (
                  <button
                    key={iconName}
                    onClick={() => onSelect(iconName)}
                    className={styles.recentIconButton}
                    title={iconName}
                    aria-label={t('recentIconAria', { iconName })}
                    type="button"
                  >
                    <IconComp className={styles.recentIconSize} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <Tabs
        value={selectedCategory}
        onValueChange={(v) => setSelectedCategory(v as IconCategory)}
        className="shrink-0"
      >
        <div className={styles.tabsContainer}>
          <TabsList className={styles.tabsList} aria-label={t('categoriesAria')}>
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.key}
                value={cat.key}
                className={styles.tabsTrigger}
                aria-label={t('filterByCategoryAria', { category: cat.label })}
                title={cat.description}
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className={cn(styles.resultsCount.base, styles.resultsCount.mobile)} aria-live="polite">
        {resultCountMessage}
      </div>

      <div className={styles.gridContainer} aria-label={t('iconListAria')}>
        {filteredIcons.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>{t('empty')}</p>
            {debouncedQuery ? (
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                {t('clearSearch')}
              </Button>
            ) : null}
          </div>
        ) : (
          <div className={styles.iconGridSimple}>
            {filteredIcons.map((icon) => {
              const IconComponent = icon.component;
              const isSelected = value === icon.name;

              return (
                <button
                  key={icon.name}
                  onClick={() => onSelect(icon.name)}
                  onKeyDown={(e) => handleKeyDown(e, icon.name)}
                  className={cn(
                    styles.iconButton.base,
                    isSelected ? styles.iconButton.selected : styles.iconButton.unselected
                  )}
                  title={icon.name}
                  aria-label={t('selectIconAria', { iconName: icon.name })}
                  aria-pressed={isSelected}
                  type="button"
                >
                  <IconComponent className={styles.iconSize.mobile} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
