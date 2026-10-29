'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { stitchHome } from '@/styles/home-design-foundation';

export interface PlainListRowProps {
  title: string;
  meta?: string;
  children: ReactNode;
  onClick?: (() => void) | undefined;
  testId?: string | undefined;
  ariaLabel?: string | undefined;
  className?: string | undefined;
}

/** Home-density list row. Do not add icons or card chrome — use RowCard for that. */
export function PlainListRow({
  title,
  meta,
  children,
  onClick,
  testId,
  ariaLabel,
  className,
}: PlainListRowProps) {
  const content = (
    <>
      <span className="min-w-0">
        <span className={stitchHome.plainRowTitle}>{title}</span>
        {meta ? <span className={stitchHome.plainRowMeta}>{meta}</span> : null}
      </span>
      <span className="shrink-0">{children}</span>
    </>
  );

  const rowClassName = cn(stitchHome.plainRow, className);

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={rowClassName}
        {...(testId ? { 'data-testid': testId } : {})}
        {...(ariaLabel ? { 'aria-label': ariaLabel } : {})}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={rowClassName} {...(testId ? { 'data-testid': testId } : {})}>
      {content}
    </div>
  );
}
