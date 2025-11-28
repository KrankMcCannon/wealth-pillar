/**
 * CategoryField - Reusable category selector field
 */

"use client";

import { FormField, FormSelect } from "@/components/form";
import type { Category } from "@/lib/types";

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
  label = "Categoria",
  placeholder = "Seleziona categoria",
  categories = []
}: CategoryFieldProps) {
  const options = categories.map((category) => ({
    value: category.key,
    label: category.label,
  }));

  return (
    <FormField label={label} required={required} error={error}>
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={placeholder}
      />
    </FormField>
  );
}
