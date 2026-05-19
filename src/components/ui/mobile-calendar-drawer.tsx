/**
 * Mobile Calendar Drawer — uses ModalWrapper (drawer on mobile, dialog on desktop).
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
      maxWidth="md"
      repositionInputs
    >
      <CalendarPanel value={value} onChange={onChange} onClose={onClose} size="mobile" />
    </ModalWrapper>
  );
}
