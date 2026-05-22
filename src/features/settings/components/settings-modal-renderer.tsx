'use client';

import { useSettingsModalsContextOptional } from '@/features/settings/context/settings-modals-context';
import { useModalState } from '@/lib/navigation/url-state';
import { EditProfileModal } from './edit-profile-modal';
import { InviteMemberModal } from './invite-member-modal';
import {
  CurrencyPreferenceModal,
  LanguagePreferenceModal,
  TimezonePreferenceModal,
} from './settings-preference-modals';

export default function SettingsModalRenderer() {
  const { modal, closeModal } = useModalState();
  const ctx = useSettingsModalsContextOptional();

  if (!ctx || !modal?.startsWith('settings:')) {
    return null;
  }

  const { currentUser, isAdmin } = ctx;

  return (
    <>
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
    </>
  );
}
