/**
 * CategoryField - Reusable category selector field
 */

"use client";

import { useCategories } from '@/src/lib';
import { useMemo } from "react";
import { FormField } from "../form-field";
import { FormSelect, sortSelectOptions } from "../form-select";

interface CategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
}

export function CategoryField({
  value,
  onChange,
  error,
  required = true,
  label = "Categoria"
}: CategoryFieldProps) {
  const { data: categories = [] } = useCategories();

  const options = useMemo(() =>
    sortSelectOptions(
      categories.map(c => ({ value: c.key, label: c.label }))
    ),
    [categories]
  );

  return (
    <FormField label={label} required={required} error={error}>
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder="Seleziona categoria"
      />
    </FormField>
  );
}
