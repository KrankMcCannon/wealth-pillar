'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { ModalWrapper } from './modal-wrapper';
import { useMediaQuery } from '@/hooks/use-media-query';
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
  const isDesktop = useMediaQuery('(min-width: 768px)');
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

  const triggerButton = (
    <Button {...triggerProps} type="button">
      <SelectedIcon className={styles.triggerIcon} aria-hidden="true" />
      <span className={styles.triggerText}>{value || t('triggerDefaultText')}</span>
    </Button>
  );

  const mobileTriggerButton = (
    <Button {...triggerProps} type="button" onClick={() => setIsOpen(true)}>
      <SelectedIcon className={styles.triggerIcon} aria-hidden="true" />
      <span className={styles.triggerText}>{value || t('triggerDefaultText')}</span>
    </Button>
  );

  return (
    <div className={cn('space-y-2', className)}>
      {isDesktop ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            className={styles.popoverContent}
            style={{ height: '600px', maxHeight: '600px' }}
            align="start"
            side="bottom"
            sideOffset={5}
            aria-label={t('selectorAria')}
          >
            <IconPickerContent
              value={value}
              recent={recent}
              onSelect={handleIconSelect}
              isMobile={false}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {mobileTriggerButton}
          <ModalWrapper
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            title={t('selectorTitle')}
            maxWidth="lg"
            className="flex max-h-[70vh] flex-col p-0"
          >
            <div className={cn(styles.dialogWrapper, 'min-h-[420px]')}>
              <IconPickerContent
                value={value}
                recent={recent}
                onSelect={handleIconSelect}
                isMobile
              />
            </div>
          </ModalWrapper>
        </>
      )}
    </div>
  );
}
