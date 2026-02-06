/**
 * CategoryField - Reusable category selector field
 */

'use client';

import { useTranslations } from 'next-intl';
import { FormField } from '@/components/form';
import { CategorySelect } from '@/components/form/category-select';
import type { Category } from '@/lib/types';

interface CategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  categories?: Category[];
}

export function CategoryField({
  value,
  onChange,
  error,
  required = true,
  label,
  placeholder,
  categories = [],
}: Readonly<CategoryFieldProps>) {
  const t = useTranslations('Forms.Fields.Category');
  const resolvedLabel = label ?? t('label');
  const resolvedPlaceholder = placeholder ?? t('placeholder');

  return (
    <FormField label={resolvedLabel} required={required} error={error}>
      <CategorySelect
        value={value}
        onValueChange={onChange}
        categories={categories}
        placeholder={resolvedPlaceholder}
        showRecentCategories={true}
        recentCategoriesLimit={3}
      />
    </FormField>
  );
}
