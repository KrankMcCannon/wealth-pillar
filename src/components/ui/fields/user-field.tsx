/**
 * UserField - Reusable user selector field
 */

"use client";

import { FormField, FormSelect } from "@/components/form";
import type { User } from "@/lib/types";

interface UserFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  users?: User[];
}

export function UserField({
  value,
  onChange,
  error,
  required = true,
  label = "Utente",
  placeholder = "Seleziona utente",
  users = []
}: UserFieldProps) {
  const options = users.map((user) => ({
    value: user.id,
    label: user.name,
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
