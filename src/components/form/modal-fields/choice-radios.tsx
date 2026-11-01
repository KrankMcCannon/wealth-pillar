'use client';

import { cn } from '@/lib/utils';
import { formModalStyles as s } from '@/components/form/form-modal-styles';

export type ChoiceRadioOption = {
  value: string;
  label: string;
  description?: string;
};

export type ChoiceRadiosProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly ChoiceRadioOption[];
  label: string;
  variant?: 'rows' | 'cards' | 'segments';
  disabled?: boolean | undefined;
  errorId?: string | undefined;
  invalid?: boolean | undefined;
  /** Sheet rows are full-bleed and need horizontal inset. Page cards already pad. */
  padded?: boolean | undefined;
};

export function ChoiceRadios({
  name,
  value,
  onChange,
  options,
  label,
  variant = 'rows',
  disabled,
  errorId,
  invalid,
  padded = true,
}: Readonly<ChoiceRadiosProps>) {
  const isCards = variant === 'cards';
  const isSegments = variant === 'segments';

  return (
    <fieldset
      className={s.choice.fieldset}
      aria-invalid={invalid || undefined}
      aria-describedby={errorId}
    >
      <legend className={cn(s.choice.legend, !padded && s.choice.legendFlush)}>{label}</legend>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          isSegments ? s.choice.segments : isCards ? s.choice.cards : s.choice.rows,
          isSegments && !padded && 'mx-0',
          !padded && (isCards ? s.choice.cardsFlush : '[&>label]:px-0')
        )}
      >
        {options.map((option) => {
          const selected = option.value === value;
          const radioMark = (
            <span
              className={cn(
                s.choice.radio,
                isCards && s.choice.radioCard,
                selected && s.choice.radioSelected
              )}
              aria-hidden
            >
              {selected ? <span className={s.choice.radioDot} /> : null}
            </span>
          );
          const text = (
            <span className={s.choice.text}>
              <span className={s.choice.title}>{option.label}</span>
              {option.description ? (
                <span className={s.choice.description}>{option.description}</span>
              ) : null}
            </span>
          );

          return (
            <label
              key={option.value}
              className={cn(
                isSegments ? s.choice.segment : isCards ? s.choice.card : s.choice.row,
                isSegments && selected && s.choice.segmentSelected,
                selected && isCards && s.choice.cardSelected,
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                disabled && 'pointer-events-none opacity-45'
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
                aria-label={
                  option.description ? `${option.label}, ${option.description}` : option.label
                }
              />
              {isSegments ? (
                <span className="min-w-0 whitespace-nowrap text-sm font-semibold leading-snug">
                  {option.label}
                </span>
              ) : isCards ? (
                <>
                  {radioMark}
                  {text}
                </>
              ) : (
                <>
                  {text}
                  {radioMark}
                </>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
