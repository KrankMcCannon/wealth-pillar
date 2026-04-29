/**
 * CategoryField - Reusable category selector field
 */

'use client';

import { useTranslations } from 'next-intl';
import { CategorySelect } from '@/components/form/category-select';
import type { Category } from '@/lib/types';

interface CategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  categories?: Category[] | undefined;
}

export function CategoryField({
  value,
  onChange,
  error,
  label,
  placeholder,
  categories = [],
}: Readonly<CategoryFieldProps>) {
  const t = useTranslations('Forms.Fields.Category');
  const resolvedLabel = label ?? t('label');
  const resolvedPlaceholder = placeholder ?? t('placeholder');

  return (
    <div className="space-y-1">
      <CategorySelect
        value={value}
        onValueChange={onChange}
        categories={categories}
        placeholder={resolvedPlaceholder}
        showRecentCategories
        recentCategoriesLimit={3}
        captionLabel={resolvedLabel}
      />
      {error ? <p className="px-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
