'use client';

import type { Category } from '@/lib/types';
import { CategoryPicker } from './category-picker';

export interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: Category[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showRecentCategories?: boolean;
  recentCategoriesLimit?: number;
  captionLabel?: string;
}
export function findCategoryByValue(categories: Category[], value: string | undefined) {
  return value
    ? categories.find((category) => category.key === value || category.id === value)
    : undefined;
}
export function CategorySelect({
  value,
  onValueChange,
  categories,
  placeholder,
  disabled,
  className,
  captionLabel,
}: CategorySelectProps) {
  return (
    <CategoryPicker
      options={categories.map((category) => ({
        value: category.key,
        label: category.label,
        color: category.color,
      }))}
      value={[findCategoryByValue(categories, value)?.key ?? value]}
      onChange={(keys) => {
        if (keys[0]) onValueChange(keys[0]);
      }}
      label={captionLabel}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
