'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { ModalWrapper, ModalFooter } from '@/components/ui/modal-wrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formModalStyles as s } from './form-modal-styles';
import { CategoryBadge } from '@/components/ui/category-badge';

export type CategoryPickerOption = {
  value: string;
  label: string;
  color?: string | null;
  categoryIcon?: string | null;
  description?: string;
};

export type CategoryPickerStep = {
  listId: string;
  open: boolean;
  onOpen: (trigger: HTMLButtonElement) => void;
};

/** Shared by category selectors and the transaction form's category step. */
export function CategoryPickerList({
  id,
  options,
  value,
  onSelect,
  label,
  multiple = false,
  focusOnMount = false,
}: {
  id: string;
  options: CategoryPickerOption[];
  value: string[];
  onSelect: (value: string) => void;
  label: string;
  multiple?: boolean;
  focusOnMount?: boolean;
}) {
  const t = useTranslations('Forms.CategorySelect');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const [activeValue, setActiveValue] = useState<string>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const normalize = (text: string) =>
      text
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase(locale);
    const query = normalize(search.trim());
    const words = query ? query.split(/\s+/) : [];
    return options
      .filter((option) => {
        const text = normalize(`${option.label} ${option.description ?? ''}`);
        return words.every((word) => text.includes(word));
      })
      .sort((a, b) => {
        if (!query) {
          const selectedFirst = Number(value.includes(b.value)) - Number(value.includes(a.value));
          if (selectedFirst) return selectedFirst;
        } else {
          const startsWithQuery =
            Number(normalize(b.label).startsWith(query)) -
            Number(normalize(a.label).startsWith(query));
          if (startsWithQuery) return startsWithQuery;
        }
        return a.label.localeCompare(b.label, locale);
      });
  }, [options, search, locale, value]);

  const activeIndex = Math.max(
    0,
    filtered.findIndex((option) => option.value === activeValue)
  );

  useEffect(() => {
    if (!focusOnMount) return;
    const isDesktopPointer = window.matchMedia('(pointer: fine)').matches;
    const focusTarget = isDesktopPointer ? inputRef.current : wrapperRef.current;
    focusTarget?.focus({ preventScroll: true });
  }, [focusOnMount]);

  function updateSearch(next: string) {
    setSearch(next);
    setActiveValue(undefined);
    if (listRef.current) listRef.current.scrollTop = 0;
  }

  function focusOption(index: number) {
    const option = filtered[index];
    if (!option) return;
    setActiveValue(option.value);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-option-index="${index}"]`)?.focus();
  }

  return (
    <div ref={wrapperRef} tabIndex={-1} className="flex min-h-0 flex-1 flex-col outline-none">
      <div className="relative shrink-0 px-4 pt-3 pb-3 sm:px-5">
        <Search
          className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted-foreground sm:left-8"
          aria-hidden
        />
        <Input
          ref={inputRef}
          type="search"
          aria-label={t('searchPlaceholder')}
          aria-controls={id}
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(event) => updateSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Enter') event.preventDefault();
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              focusOption(event.key === 'ArrowDown' ? 0 : filtered.length - 1);
            }
          }}
          className="h-11 pr-12 pl-9 shadow-none focus-visible:border-ring [&::-webkit-search-cancel-button]:hidden"
          autoComplete="off"
        />
        {search ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-4 size-11 text-muted-foreground sm:right-5"
            aria-label={t('clearSearch')}
            onClick={() => {
              updateSearch('');
              inputRef.current?.focus();
            }}
          >
            <X aria-hidden />
          </Button>
        ) : null}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border/60 px-3 pt-1 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-4"
      >
        <div
          id={id}
          role="listbox"
          aria-label={label}
          aria-multiselectable={multiple || undefined}
          onKeyDown={(event) => {
            switch (event.key) {
              case 'Home':
                focusOption(0);
                break;
              case 'End':
                focusOption(filtered.length - 1);
                break;
              case 'ArrowDown':
                focusOption(Math.min(activeIndex + 1, filtered.length - 1));
                break;
              case 'ArrowUp':
                if (activeIndex === 0) inputRef.current?.focus();
                else focusOption(activeIndex - 1);
                break;
              default:
                return;
            }
            event.preventDefault();
          }}
        >
          {filtered.map((option, index) => {
            const isSelected = value.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={index === activeIndex ? 0 : -1}
                data-option-index={index}
                onFocus={() => setActiveValue(option.value)}
                onClick={() => onSelect(option.value)}
                className={cn(
                  'flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                  isSelected && 'bg-primary/10 hover:bg-primary/15'
                )}
              >
                <CategoryBadge
                  categoryKey={option.value}
                  icon={option.categoryIcon ?? undefined}
                  {...(option.color ? { color: option.color } : {})}
                  size="sm"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 wrap-break-word leading-snug">
                  <span className="block text-base font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="block text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {isSelected ? <Check className="size-5 shrink-0 text-primary" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
        <div role="status" className="text-center">
          {filtered.length === 0 ? (
            <div className="px-4 py-9">
              <p className="text-base font-medium">{t(search.trim() ? 'empty' : 'noCategories')}</p>
              {search.trim() ? (
                <p className="mt-1 text-sm text-muted-foreground">{t('tryAnotherSearch')}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CategoryPicker({
  options,
  value,
  onChange,
  label,
  placeholder,
  multiple = false,
  disabled = false,
  className,
  step,
}: {
  options: CategoryPickerOption[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string | undefined;
  placeholder?: string | undefined;
  multiple?: boolean | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  step?: CategoryPickerStep | undefined;
}) {
  const t = useTranslations('Forms.CategorySelect');
  const common = useTranslations('Common');
  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = options.filter((option) => value.includes(option.value));
  const summary = selected.map((option) => option.label).join(', ');
  const selectedOption = multiple ? undefined : selected[0];

  function close() {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function openPicker() {
    setDraftValue(value);
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        role="combobox"
        aria-haspopup={step ? 'listbox' : 'dialog'}
        aria-expanded={step?.open ?? open}
        aria-controls={step?.open ? step.listId : open ? id : undefined}
        aria-label={label ?? placeholder ?? t('placeholder')}
        aria-describedby={summary ? `${id}-value` : undefined}
        disabled={disabled}
        className={cn(s.selectorTrigger, className)}
        onClick={(event) => {
          if (step) step.onOpen(event.currentTarget);
          else openPicker();
        }}
      >
        {label ? <span className={s.selectorLabel}>{label}</span> : null}
        <span
          className={cn(
            summary ? s.selectorValue : s.selectorValueMuted,
            'flex items-center justify-end gap-2'
          )}
        >
          {selectedOption ? (
            <CategoryBadge
              categoryKey={selectedOption.value}
              icon={selectedOption.categoryIcon ?? undefined}
              {...(selectedOption.color ? { color: selectedOption.color } : {})}
              size="xs"
              aria-hidden
            />
          ) : null}
          <span id={`${id}-value`} className="truncate">
            {summary || placeholder || t('placeholder')}
          </span>
        </span>
        <ChevronRight className={s.selectorChevron} aria-hidden />
      </button>

      {!step ? (
        <ModalWrapper
          isOpen={open}
          onOpenChange={(next) => {
            if (!next) close();
          }}
          title={label ?? t('title')}
          contentId={id}
          nested
          repositionInputs
        >
          <div className="flex h-[min(28rem,60dvh)] min-h-0 flex-col">
            <CategoryPickerList
              id={`${id}-list`}
              options={options}
              value={multiple ? draftValue : value}
              label={label ?? t('title')}
              multiple={multiple}
              onSelect={(key) => {
                const selected = multiple ? draftValue : value;
                const next = multiple
                  ? selected.includes(key)
                    ? selected.filter((item) => item !== key)
                    : [...selected, key]
                  : [key];
                if (multiple) setDraftValue(next);
                else {
                  onChange(next);
                  close();
                }
              }}
            />
          </div>
          {multiple ? (
            <ModalFooter>
              <button
                type="button"
                className={s.footer.dualSubmit}
                onClick={() => {
                  onChange(draftValue);
                  close();
                }}
              >
                {common('confirm')}
              </button>
            </ModalFooter>
          ) : null}
        </ModalWrapper>
      ) : null}
    </>
  );
}
