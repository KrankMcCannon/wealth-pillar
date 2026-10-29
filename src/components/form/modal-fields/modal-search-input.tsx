'use client';

import { Search } from 'lucide-react';
import type { KeyboardEventHandler } from 'react';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

export interface ModalSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}

export function ModalSearchInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
  'aria-label': ariaLabel,
  onKeyDown,
}: Readonly<ModalSearchInputProps>) {
  return (
    <div className={s.categorySearchWrap}>
      <Search className={s.categorySearchIcon} aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={s.categorySearchInput}
        autoComplete="off"
        onKeyDown={onKeyDown}
        {...(ariaLabel !== undefined ? { 'aria-label': ariaLabel } : {})}
      />
    </div>
  );
}
