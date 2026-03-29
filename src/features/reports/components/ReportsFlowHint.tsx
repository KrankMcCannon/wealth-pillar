'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'wealth-pillar.reports.flowHint.dismissed';

export function ReportsFlowHint({ className }: Readonly<{ className?: string }>) {
  const t = useTranslations('ReportsContent');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lettura localStorage solo lato client post-mount
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== '1');
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      suppressHydrationWarning
      role="note"
      className={cn(
        'flex gap-2 rounded-xl border border-primary/15 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground',
        className
      )}
    >
      <p className="min-w-0 flex-1 leading-snug">{t('flowHint')}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={dismiss}
        aria-label={t('flowHintDismissAria')}
      >
        <X className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
