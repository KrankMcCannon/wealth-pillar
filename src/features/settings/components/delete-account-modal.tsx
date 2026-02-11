'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, ModalBody, ModalFooter, ModalWrapper } from '@/components/ui';
import { settingsStyles } from '@/features/settings/theme';

interface DeleteAccountModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal for confirming account deletion
 * Shows warning and list of what will be deleted
 */
export function DeleteAccountModal({
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: Readonly<DeleteAccountModalProps>) {
  const t = useTranslations('SettingsModals.DeleteAccount');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title={t('title')}
      description={t('description')}
      titleClassName={settingsStyles.modals.deleteAccount.title}
      descriptionClassName={settingsStyles.modals.description}
      disableOutsideClose={isDeleting}
    >
      <ModalBody>
        <div className={settingsStyles.modals.deleteAccount.body}>
          <p className={settingsStyles.modals.deleteAccount.bodyText}>{t('confirmPrompt')}</p>

          <div className={settingsStyles.modals.deleteAccount.warningBox}>
            <p className={settingsStyles.modals.deleteAccount.warningTitle}>{t('warningTitle')}</p>
            <ul className={settingsStyles.modals.deleteAccount.warningList}>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>{t('items.userAccount')}</span>
              </li>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>{t('items.bankAccounts')}</span>
              </li>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>{t('items.transactions')}</span>
              </li>
              <li className={settingsStyles.modals.deleteAccount.warningItem}>
                <span className={settingsStyles.modals.deleteAccount.warningDot}>•</span>
                <span>{t('items.budgets')}</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className={settingsStyles.modals.deleteAccount.warningAlert}>
              <AlertTriangle className={settingsStyles.modals.deleteAccount.warningAlertIcon} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          variant="outline"
          className={settingsStyles.modals.deleteAccount.button}
        >
          {t('cancelButton')}
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className={`${settingsStyles.modals.deleteAccount.button} ${settingsStyles.modals.deleteAccount.confirmButton}`}
        >
          {isDeleting ? (
            <>
              <Loader2 className={settingsStyles.modals.loadingIcon} />
              {t('deletingButton')}
            </>
          ) : (
            t('deleteButton')
          )}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  );
}
