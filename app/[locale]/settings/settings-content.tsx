'use client';

import { useTranslations } from 'next-intl';
import { AppPage, toAppPageHeaderUser } from '@/components/layout';
import { useRouter } from '@/i18n/routing';
import { stitchSettings } from '@/styles/home-design-foundation';
import {
  useSettings,
  ProfileSection,
  GroupSection,
  PreferencesSection,
  SupportSection,
} from '@/features/settings';
import { SettingsModalsProvider } from '@/features/settings/context/settings-modals-context';
import SettingsModalRenderer from '@/features/settings/components/settings-modal-renderer';
import type { User, UserPreferences } from '@/lib/types';

interface SettingsContentProps {
  currentUser: User;
  initialPreferences: UserPreferences;
}

export default function SettingsContent({ currentUser, initialPreferences }: SettingsContentProps) {
  const t = useTranslations('SettingsContent');

  const {
    displayUser,
    preferences,
    isAdmin,
    userInitials,
    isSigningOut,
    openSettingsModal,
    handleSignOut,
    handlePreferenceUpdate,
    handleProfileUpdate,
  } = useSettings(currentUser, initialPreferences);

  const router = useRouter();

  if (!displayUser) return null;

  const settingsHeaderUser = {
    ...toAppPageHeaderUser(displayUser),
    role:
      displayUser.role === 'superadmin' || displayUser.role === 'admin'
        ? 'admin'
        : ((displayUser.role || 'member') as 'admin' | 'member'),
  };

  return (
    <SettingsModalsProvider
      value={{
        currentUser: displayUser,
        preferences: preferences ?? null,
        isAdmin,
        onPreferenceUpdate: handlePreferenceUpdate,
        onProfileUpdate: handleProfileUpdate,
      }}
    >
      <AppPage
        currentUser={displayUser}
        headerUser={settingsHeaderUser}
        title={t('headerTitle')}
        showBack
        onBack={() => router.push('/home')}
      >
        <main className={stitchSettings.pageMain}>
          <ProfileSection
            currentUser={displayUser}
            userInitials={userInitials}
            onEditProfile={() => openSettingsModal('profile')}
          />

          <GroupSection
            isAdmin={isAdmin}
            onInviteMember={() => openSettingsModal('invite')}
            onManageGroup={() => openSettingsModal('invite')}
          />

          <PreferencesSection
            preferences={preferences}
            onOpenCurrency={() => openSettingsModal('currency')}
            onOpenLanguage={() => openSettingsModal('language')}
            onOpenTimezone={() => openSettingsModal('timezone')}
          />

          <SupportSection isSigningOut={isSigningOut} onSignOut={handleSignOut} />
        </main>
      </AppPage>
      <SettingsModalRenderer />
    </SettingsModalsProvider>
  );
}
