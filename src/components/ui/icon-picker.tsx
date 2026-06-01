'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ModalWrapper } from './modal-wrapper';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getIconByName } from '@/features/categories';
import { iconPickerStyles as styles } from './icon-picker-styles';
import { IconPickerContent } from './icon-picker-content';

export interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  className?: string;
}

const MAX_RECENT = 5;

export function IconPicker({ value, onChange, className }: Readonly<IconPickerProps>) {
  const t = useTranslations('Forms.IconPicker');
  const [isOpen, setIsOpen] = React.useState(false);
  const [recent, setRecent] = useLocalStorage<string[]>('icon-picker-recent', []);

  const selectedIconMetadata = React.useMemo(() => {
    if (!value) return null;
    return getIconByName(value);
  }, [value]);

  const SelectedIcon = selectedIconMetadata?.component || HelpCircle;

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setRecent((prev) => {
      const filtered = prev.filter((name) => name !== iconName);
      return [iconName, ...filtered].slice(0, MAX_RECENT);
    });
    setIsOpen(false);
  };

  const triggerProps = {
    variant: 'outline' as const,
    className: styles.triggerButton,
    'aria-label': value ? t('triggerSelectedAria', { iconName: value }) : t('triggerDefaultAria'),
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': isOpen,
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button {...triggerProps} type="button" onClick={() => setIsOpen(true)}>
        <SelectedIcon className={styles.triggerIcon} aria-hidden="true" />
        <span className={styles.triggerText}>{value || t('triggerDefaultText')}</span>
      </Button>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title={t('selectorTitle')}
        nested
        repositionInputs
        className="flex max-h-[70vh] flex-col p-0"
      >
        <div className={cn(styles.dialogWrapper, 'min-h-[360px]')}>
          <IconPickerContent value={value} recent={recent} onSelect={handleIconSelect} />
        </div>
      </ModalWrapper>
    </div>
  );
}
