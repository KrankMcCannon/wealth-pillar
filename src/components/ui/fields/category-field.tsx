/**
 * CategoryField - Reusable category selector field
 */

"use client";

import { FormField } from "../form-field";
import { FormSelect } from "../form-select";

interface CategoryFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
}

export function CategoryField({ value, onChange, error, required = true, label = "Categoria" }: CategoryFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <FormSelect value={value} onValueChange={onChange} options={[]} placeholder="Seleziona categoria" />
    </FormField>
  );
}
