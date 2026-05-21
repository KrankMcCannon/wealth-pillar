'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { AppPage, toAppPageHeaderUser } from '@/components/layout';
import { useRouter } from '@/i18n/routing';
import {
  useSettings,
  settingsStyles,
  ProfileSection,
  GroupSection,
  PreferencesSection,
  NotificationsSection,
  SecuritySection,
  AccountSection,
} from '@/features/settings';
import { SettingsModalsProvider } from '@/features/settings/context/settings-modals-context';
import type { User, UserPreferences } from '@/lib/types';

interface SettingsData {
  accountCount: number;
  transactionCount: number;
  preferences: UserPreferences;
}

interface SettingsContentProps {
  currentUser: User;
  groupUsers: User[];
  settingsDataPromise: Promise<SettingsData>;
}

export default function SettingsContent({
  currentUser,
  groupUsers,
  settingsDataPromise,
}: SettingsContentProps) {
  const {
    accountCount,
    transactionCount,
    preferences: initialPreferences,
  } = use(settingsDataPromise);
  const t = useTranslations('SettingsContent');

  const {
    preferences,
    isAdmin,
    userInitials,
    isSigningOut,
    isDeletingAccount,
    deleteError,
    openSettingsModal,
    handleSignOut,
    handleDeleteAccountClick,
    handleDeleteAccountConfirm,
    handleCloseDeleteModal,
    handleNotificationToggle,
    handlePreferenceUpdate,
  } = useSettings(currentUser, initialPreferences, groupUsers);

  const router = useRouter();

  if (!currentUser) return null;

  const settingsHeaderUser = {
    ...toAppPageHeaderUser(currentUser),
    role:
      currentUser.role === 'superadmin' || currentUser.role === 'admin'
        ? 'admin'
        : ((currentUser.role || 'member') as 'admin' | 'member'),
  };

  return (
    <SettingsModalsProvider
      value={{
        currentUser,
        groupUsers,
        preferences: preferences ?? null,
        isAdmin,
        isDeletingAccount,
        deleteError,
        onPreferenceUpdate: handlePreferenceUpdate,
        onDeleteAccountConfirm: handleDeleteAccountConfirm,
        onCloseDeleteModal: handleCloseDeleteModal,
      }}
    >
      <AppPage
        currentUser={currentUser}
        headerUser={settingsHeaderUser}
        pageContainerClassName={settingsStyles.page.container}
        title={t('headerTitle')}
        showBack
        onBack={() => router.push('/home')}
        showActions
      >
        <main className={settingsStyles.main.container}>
          <ProfileSection
            currentUser={currentUser}
            accountCount={accountCount}
            transactionCount={transactionCount}
            userInitials={userInitials}
            onEditProfile={() => openSettingsModal('profile')}
          />

          <GroupSection
            groupUsers={groupUsers}
            isAdmin={isAdmin}
            onInviteMember={() => openSettingsModal('invite')}
            onManageSubscription={() => openSettingsModal('subscription')}
          />

          <PreferencesSection
            preferences={preferences}
            onOpenCurrency={() => openSettingsModal('currency')}
            onOpenLanguage={() => openSettingsModal('language')}
            onOpenTimezone={() => openSettingsModal('timezone')}
          />

          <NotificationsSection preferences={preferences} onToggle={handleNotificationToggle} />

          <SecuritySection isSigningOut={isSigningOut} onSignOut={handleSignOut} />

          <AccountSection onDeleteAccount={handleDeleteAccountClick} />
        </main>
      </AppPage>
    </SettingsModalsProvider>
  );
}
