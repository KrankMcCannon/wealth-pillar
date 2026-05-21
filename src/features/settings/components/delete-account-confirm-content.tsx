'use client';

import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { settingsStyles } from '@/features/settings/theme';

interface DeleteAccountConfirmContentProps {
  error: string | null;
}

export function DeleteAccountConfirmContent({ error }: Readonly<DeleteAccountConfirmContentProps>) {
  const t = useTranslations('SettingsModals.DeleteAccount');

  return (
    <>
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
      </div>

      {error ? (
        <div role="alert" className={settingsStyles.modals.deleteAccount.warningAlert}>
          <AlertTriangle className={settingsStyles.modals.deleteAccount.warningAlertIcon} />
          <span>{error}</span>
        </div>
      ) : null}
    </>
  );
}
