'use client';

import type { Category } from '@/lib/types';
import { CategoryPicker, type CategoryPickerStep } from './category-picker';

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
  pickerStep?: CategoryPickerStep | undefined;
}
export function findCategoryByValue(categories: Category[], value: string | undefined) {
  return value
    ? categories.find((category) => category.key === value || category.id === value)
    : undefined;
}

export function toCategoryPickerOptions(categories: Category[]) {
  return categories.map((category) => ({
    value: category.key,
    label: category.label,
    color: category.color,
    categoryIcon: category.icon,
  }));
}

export function CategorySelect({
  value,
  onValueChange,
  categories,
  placeholder,
  disabled,
  className,
  captionLabel,
  pickerStep,
}: CategorySelectProps) {
  return (
    <CategoryPicker
      options={toCategoryPickerOptions(categories)}
      value={[findCategoryByValue(categories, value)?.key ?? value]}
      onChange={(keys) => {
        if (keys[0]) onValueChange(keys[0]);
      }}
      label={captionLabel}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      step={pickerStep}
    />
  );
}
