/**
 * AccountField - Reusable account selector field
 */

"use client";

import { useAccounts } from '@/src/lib';
import { useMemo } from "react";
import { FormField } from "../form-field";
import { FormSelect, sortSelectOptions } from "../form-select";

interface AccountFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  userId?: string; // Optional user filter
}

export function AccountField({
  value,
  onChange,
  error,
  required = true,
  label = "Conto",
  userId
}: AccountFieldProps) {
  const { data: accounts = [] } = useAccounts();

  const options = useMemo(() => {
    // Filter accounts by userId if provided
    const filteredAccounts = userId && userId !== "all"
      ? accounts.filter(a => a.user_ids?.includes(userId))
      : accounts;

    return sortSelectOptions(
      filteredAccounts.map(a => ({ value: a.id, label: a.name }))
    );
  }, [accounts, userId]);

  return (
    <FormField label={label} required={required} error={error}>
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder="Seleziona conto"
      />
    </FormField>
  );
}
