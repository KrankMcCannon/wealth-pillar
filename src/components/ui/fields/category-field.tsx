/**
 * CategoryField - Reusable category selector field
 */

'use client';

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
  label = 'Categoria',
  placeholder = 'Seleziona categoria',
  categories = [],
}: Readonly<CategoryFieldProps>) {
  return (
    <FormField label={label} required={required} error={error}>
      <CategorySelect
        value={value}
        onValueChange={onChange}
        categories={categories}
        placeholder={placeholder}
        showRecentCategories={true}
        recentCategoriesLimit={3}
      />
    </FormField>
  );
}
