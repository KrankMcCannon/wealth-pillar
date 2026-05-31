'use client';

import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { cn } from '@/lib/utils';

export interface SettingsRowProps {
  icon: ReactNode;
  label: string;
  value?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
  href?: string | undefined;
  showChevron?: boolean | undefined;
  divider?: boolean | undefined;
  trailing?: ReactNode | undefined;
  className?: string | undefined;
}

export function SettingsRow({
  icon,
  label,
  value,
  onClick,
  href,
  showChevron = true,
  divider = true,
  trailing,
  className,
}: Readonly<SettingsRowProps>) {
  const rowClassName = cn(s.row, divider && s.rowDivider, className);

  const content = (
    <>
      <div className={s.rowLeft}>
        <div className={s.rowIconWrap}>{icon}</div>
        <span className={s.rowLabel}>{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {value ? <span className={s.rowValue}>{value}</span> : null}
        {trailing ?? (showChevron ? <ChevronRight className={s.rowChevron} aria-hidden /> : null)}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={rowClassName} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={rowClassName} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
