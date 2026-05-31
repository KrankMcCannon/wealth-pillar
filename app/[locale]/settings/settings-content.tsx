'use client';

import { use } from 'react';
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
  preferencesPromise: Promise<UserPreferences>;
}

export default function SettingsContent({ currentUser, preferencesPromise }: SettingsContentProps) {
  const initialPreferences = use(preferencesPromise);
  const t = useTranslations('SettingsContent');

  const {
    preferences,
    isAdmin,
    userInitials,
    isSigningOut,
    openSettingsModal,
    handleSignOut,
    handlePreferenceUpdate,
  } = useSettings(currentUser, initialPreferences);

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
        preferences: preferences ?? null,
        isAdmin,
        onPreferenceUpdate: handlePreferenceUpdate,
      }}
    >
      <AppPage
        currentUser={currentUser}
        headerUser={settingsHeaderUser}
        title={t('headerTitle')}
        showBack
        onBack={() => router.push('/home')}
      >
        <main className={stitchSettings.pageMain}>
          <ProfileSection
            currentUser={currentUser}
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
