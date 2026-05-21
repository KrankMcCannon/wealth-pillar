/**
 * Mobile Calendar Drawer — calendar picker in ModalWrapper drawer.
 */

'use client';

import { useTranslations } from 'next-intl';
import { ModalWrapper } from './modal-wrapper';
import { CalendarPanel } from './calendar-panel';

export interface MobileCalendarDrawerProps {
  value: string;
  onChange: (date: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function MobileCalendarDrawer({
  value,
  onChange,
  isOpen,
  onClose,
}: Readonly<MobileCalendarDrawerProps>) {
  const t = useTranslations('Forms.DateDrawer');

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={t('drawerTitle')}
      description={t('drawerAriaLabel')}
      repositionInputs
    >
      <CalendarPanel value={value} onChange={onChange} onClose={onClose} />
    </ModalWrapper>
  );
}
