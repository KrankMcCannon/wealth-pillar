'use client';

import { forwardRef, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

export interface ModalSelectorTriggerProps {
  label: string;
  value: string;
  valueMuted?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
  expanded?: boolean;
}

export const ModalSelectorTrigger = forwardRef<
  HTMLButtonElement,
  Readonly<ModalSelectorTriggerProps>
>(function ModalSelectorTrigger(
  { label, value, valueMuted = false, disabled, onClick, className, children, expanded },
  ref
) {
  const inner = (
    <>
      <p className={s.selectorLabel}>{label}</p>
      <span className={valueMuted ? s.selectorValueMuted : s.selectorValue}>{value}</span>
      <ChevronRight className={s.selectorChevron} aria-hidden />
      {children}
    </>
  );

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className={cn(s.selectorTrigger, className)}
    >
      {inner}
    </button>
  );
});
