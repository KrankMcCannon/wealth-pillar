'use client';

import type { MouseEvent } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stitchTransactionFilterTriggers } from '@/styles/home-design-foundation';

export interface FilterChipTriggerProps {
  readonly label: string;
  readonly isActive: boolean;
  readonly hasValue: boolean;
  readonly onClick: () => void;
  readonly onClear?: () => void;
  readonly clearAriaLabel?: string;
}

export function FilterChipTrigger({
  label,
  isActive,
  hasValue,
  onClick,
  onClear,
  clearAriaLabel,
}: FilterChipTriggerProps) {
  const handleClearClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClear?.();
  };

  if (hasValue && !isActive) {
    return (
      <div className={stitchTransactionFilterTriggers.wrapper}>
        <button
          type="button"
          onClick={onClick}
          aria-haspopup="dialog"
          aria-expanded={false}
          className={stitchTransactionFilterTriggers.buttonHasValue}
        >
          <span>{label}</span>
        </button>
        <button
          type="button"
          onClick={handleClearClick}
          className={stitchTransactionFilterTriggers.clearButton}
          aria-label={clearAriaLabel ?? label}
        >
          <X className={stitchTransactionFilterTriggers.clearIcon} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={isActive}
      className={cn(
        stitchTransactionFilterTriggers.buttonBase,
        isActive
          ? stitchTransactionFilterTriggers.buttonOpen
          : stitchTransactionFilterTriggers.buttonIdle
      )}
    >
      <span>{label}</span>
      <ChevronDown
        className={cn(
          stitchTransactionFilterTriggers.chevron,
          isActive && stitchTransactionFilterTriggers.chevronOpen
        )}
      />
    </button>
  );
}
