/**
 * DateField - Reusable date picker field
 */

"use client";

import { FormField, FormDatePicker } from "@/components/form";

interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  maxDate?: Date;
  minDate?: Date;
}

export function DateField({
  value,
  onChange,
  error,
  required = true,
  label = "Data",
  maxDate,
  minDate,
}: DateFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <FormDatePicker value={value} onChange={onChange} maxDate={maxDate} minDate={minDate} />
    </FormField>
  );
}
