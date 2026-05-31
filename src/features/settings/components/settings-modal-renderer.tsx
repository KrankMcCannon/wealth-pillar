'use client';

import { lazy, Suspense } from 'react';
import { useSettingsModalsContextOptional } from '@/features/settings/context/settings-modals-context';
import { useModalState, type SettingsModalKind } from '@/lib/navigation/url-state';

const EditProfileModal = lazy(() =>
  import('./edit-profile-modal').then((m) => ({ default: m.EditProfileModal }))
);
const InviteMemberModal = lazy(() =>
  import('./invite-member-modal').then((m) => ({ default: m.InviteMemberModal }))
);
const ManageGroupModal = lazy(() =>
  import('./manage-group-modal').then((m) => ({ default: m.ManageGroupModal }))
);
const ManageCategoriesModal = lazy(() =>
  import('./manage-categories-modal').then((m) => ({ default: m.ManageCategoriesModal }))
);
const CurrencyPreferenceModal = lazy(() =>
  import('./settings-preference-modals').then((m) => ({ default: m.CurrencyPreferenceModal }))
);
const LanguagePreferenceModal = lazy(() =>
  import('./settings-preference-modals').then((m) => ({ default: m.LanguagePreferenceModal }))
);
const TimezonePreferenceModal = lazy(() =>
  import('./settings-preference-modals').then((m) => ({ default: m.TimezonePreferenceModal }))
);

function parseSettingsModalKind(modal: string | null): SettingsModalKind | null {
  if (!modal?.startsWith('settings:')) return null;
  return modal.replace('settings:', '') as SettingsModalKind;
}

export default function SettingsModalRenderer() {
  const { modal, closeModal } = useModalState();
  const ctx = useSettingsModalsContextOptional();
  const activeKind = parseSettingsModalKind(modal);

  if (!ctx || !activeKind) {
    return null;
  }

  const { currentUser, isAdmin, groupName } = ctx;

  return (
    <Suspense fallback={null}>
      {activeKind === 'profile' ? (
        <EditProfileModal
          isOpen
          onClose={closeModal}
          userId={currentUser.id}
          currentName={currentUser.name ?? ''}
          currentEmail={currentUser.email ?? ''}
        />
      ) : null}

      {activeKind === 'currency' ? <CurrencyPreferenceModal /> : null}
      {activeKind === 'language' ? <LanguagePreferenceModal /> : null}
      {activeKind === 'timezone' ? <TimezonePreferenceModal /> : null}

      {activeKind === 'invite' && isAdmin ? (
        <InviteMemberModal
          isOpen
          onClose={closeModal}
          groupId={currentUser.group_id || ''}
          currentUserId={currentUser.id}
        />
      ) : null}

      {activeKind === 'group' ? (
        <ManageGroupModal
          isOpen
          onClose={closeModal}
          groupId={currentUser.group_id || ''}
          groupName={groupName}
          isAdmin={isAdmin}
        />
      ) : null}

      {activeKind === 'categories' ? <ManageCategoriesModal isOpen onClose={closeModal} /> : null}
    </Suspense>
  );
}
