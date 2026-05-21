'use client';

import { useTranslations } from 'next-intl';
import { ConfirmationDialog } from '@/components/shared';
import { useModalState } from '@/lib/navigation/url-state';
import { useSettingsModalsContextOptional } from '@/features/settings/context/settings-modals-context';
import { DeleteAccountConfirmContent } from './delete-account-confirm-content';
import { EditProfileModal } from './edit-profile-modal';
import { InviteMemberModal } from './invite-member-modal';
import { SubscriptionModal } from './subscription-modal';
import {
  CurrencyPreferenceModal,
  LanguagePreferenceModal,
  TimezonePreferenceModal,
} from './settings-preference-modals';

export default function SettingsModalRenderer() {
  const { modal, closeModal } = useModalState();
  const ctx = useSettingsModalsContextOptional();
  const tDeleteAccount = useTranslations('SettingsModals.DeleteAccount');

  if (!ctx || !modal?.startsWith('settings:')) {
    return null;
  }

  const {
    currentUser,
    preferences,
    isAdmin,
    isDeletingAccount,
    deleteError,
    onDeleteAccountConfirm,
    onCloseDeleteModal,
  } = ctx;

  return (
    <>
      <ConfirmationDialog
        isOpen={modal === 'settings:delete-account'}
        isLoading={isDeletingAccount}
        onCancel={() => {
          onCloseDeleteModal();
          closeModal();
        }}
        onConfirm={onDeleteAccountConfirm}
        title={tDeleteAccount('title')}
        description={tDeleteAccount('description')}
        message=""
        confirmText={
          isDeletingAccount ? tDeleteAccount('deletingButton') : tDeleteAccount('deleteButton')
        }
        cancelText={tDeleteAccount('cancelButton')}
        variant="destructive"
      >
        <DeleteAccountConfirmContent error={deleteError} />
      </ConfirmationDialog>

      <EditProfileModal
        isOpen={modal === 'settings:profile'}
        onClose={closeModal}
        userId={currentUser.id}
        currentName={currentUser.name ?? ''}
        currentEmail={currentUser.email ?? ''}
      />

      <CurrencyPreferenceModal />
      <LanguagePreferenceModal />
      <TimezonePreferenceModal />

      {isAdmin ? (
        <InviteMemberModal
          isOpen={modal === 'settings:invite'}
          onClose={closeModal}
          groupId={currentUser.group_id || ''}
          currentUserId={currentUser.id}
        />
      ) : null}

      {isAdmin ? (
        <SubscriptionModal
          isOpen={modal === 'settings:subscription'}
          onClose={closeModal}
          groupId={currentUser.group_id || ''}
          currentPlan="free"
          billingCurrency={preferences?.currency ?? 'EUR'}
        />
      ) : null}
    </>
  );
}
