'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ModalWrapper } from './modal-wrapper';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { iconPickerStyles as styles } from './icon-picker-styles';
import { IconPickerContent } from './icon-picker-content';
import { CategoryBadge } from './category-badge';

export interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
  disabled?: boolean | undefined;
  label?: string | undefined;
  color?: string | undefined;
}

const MAX_RECENT = 5;

export function IconPicker({
  value,
  onChange,
  className,
  disabled,
  label,
  color,
}: Readonly<IconPickerProps>) {
  const t = useTranslations('Forms.IconPicker');
  const [isOpen, setIsOpen] = React.useState(false);
  const [recent, setRecent] = useLocalStorage<string[]>('icon-picker-recent', []);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setRecent((prev) => {
      const filtered = prev.filter((name) => name !== iconName);
      return [iconName, ...filtered].slice(0, MAX_RECENT);
    });
    close();
  };

  function close() {
    setIsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button
        ref={triggerRef}
        variant="outline"
        className={styles.triggerButton}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={disabled}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <CategoryBadge
          categoryKey="Tag"
          icon={value}
          {...(color ? { color } : {})}
          size="md"
          aria-hidden
        />
        <span className="min-w-0 flex-1 text-left font-medium">
          {label ?? t('triggerDefaultText')}
        </span>
        <span className="text-sm text-muted-foreground">{value ? t('change') : t('choose')}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Button>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        title={t('selectorTitle')}
        nested
        repositionInputs
        className="flex max-h-[70vh] flex-col p-0"
      >
        <div className={cn(styles.dialogWrapper, 'h-[min(28rem,55dvh)]')}>
          <IconPickerContent value={value} recent={recent} onSelect={handleIconSelect} />
        </div>
      </ModalWrapper>
    </div>
  );
}
