"use client";

import { SectionHeader, BottomNavigation, PageContainer, Header } from "@/components/layout";
import { ListContainer, PageSection, RowCard, SettingsItem } from "@/components/ui/layout";
import { settingsStyles } from "@/styles/system";
import {
  deleteUserAction,
  DeleteAccountModal,
  EditProfileModal,
  PreferenceSelectModal,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  InviteMemberModal,
  SubscriptionModal,
} from "@/features/settings";
import {
  getUserPreferencesAction,
  updateUserPreferencesAction
} from "@/features/settings/actions";
import { usePermissions, useRequiredCurrentUser, useRequiredGroupUsers } from "@/hooks";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Plus,
  Settings,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { RoleBadge } from "@/features/permissions";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import type { Account, Transaction } from "@/lib/types";
import type { UserPreferences } from "@/server/services/user-preferences.service";

/**
 * Settings Content Props
 */
interface SettingsContentProps {
  accounts: Account[];
  transactions: Transaction[];
}

export default function SettingsContent({ accounts, transactions }: SettingsContentProps) {
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();

  const router = useRouter();
  const { signOut } = useClerk();

  // Modal visibility state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // User preferences state
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Other state
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Permission checks
  const { isAdmin } = usePermissions({ currentUser });

  // Load user preferences on mount
  useEffect(() => {
    const abortController = new AbortController();
    let mounted = true;

    const loadPreferences = async () => {
      try {
        setIsLoadingPreferences(true);

        const { data, error } = await getUserPreferencesAction(currentUser.id);

        // Only update state if component is still mounted
        if (!mounted || abortController.signal.aborted) {
          return;
        }

        if (error) {
          toast({
            title: "Errore",
            description: "Impossibile caricare le preferenze",
            variant: "destructive",
          });
          setIsLoadingPreferences(false);
          return;
        }

        if (data) {
          setPreferences(data);
        }

        setIsLoadingPreferences(false);
      } catch (error) {
        if (!mounted || abortController.signal.aborted) {
          return;
        }

        console.error("Error loading preferences:", error);
        toast({
          title: "Errore",
          description: "Errore durante il caricamento delle preferenze",
          variant: "destructive",
        });
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();

    // Cleanup function
    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [currentUser.id]); // Only depend on currentUser.id

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  }, [signOut, router]);

  const handleDeleteAccountClick = useCallback(() => {
    // Verify clerk_id exists
    if (!currentUser.clerk_id) {
      setDeleteError("Impossibile eliminare l'account: ID Clerk mancante.");
      setShowDeleteModal(true);
      return;
    }

    setDeleteError(null);
    setShowDeleteModal(true);
  }, [currentUser.clerk_id]);

  const handleDeleteAccountConfirm = useCallback(async () => {
    if (!currentUser.clerk_id) {
      setDeleteError("Impossibile eliminare l'account: ID Clerk mancante.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const { error } = await deleteUserAction(currentUser.id, currentUser.clerk_id);

      if (error) {
        setDeleteError(error);
        setIsDeletingAccount(false);
        return;
      }

      // Sign out and redirect to auth page
      await signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("Si è verificato un errore durante l'eliminazione dell'account.");
      setIsDeletingAccount(false);
    }
  }, [currentUser.id, currentUser.clerk_id, signOut, router]);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeletingAccount) return; // Don't close while deleting
    setShowDeleteModal(false);
    setDeleteError(null);
  }, [isDeletingAccount]);

  // Handle notification toggle
  const handleNotificationToggle = useCallback(async (
    key: 'notifications_push' | 'notifications_email' | 'notifications_budget_alerts',
    currentValue: boolean
  ) => {
    // Optimistic update using functional update to avoid stale state
    setPreferences((prev: UserPreferences | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: !currentValue,
      };
    });

    try {
      const { error } = await updateUserPreferencesAction(currentUser.id, {
        [key]: !currentValue,
      });

      if (error) {
        // Revert on error using functional update
        setPreferences((prev: UserPreferences | null) => {
          if (!prev) return prev;
          return {
            ...prev,
            [key]: currentValue,
          };
        });
        toast({
          title: "Errore",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Preferenza aggiornata",
        description: "Le notifiche sono state aggiornate",
        variant: "success",
      });
    } catch (error) {
      // Revert on error using functional update
      setPreferences((prev: UserPreferences | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: currentValue,
        };
      });
      console.error('Error updating notification:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
        variant: "destructive",
      });
    }
  }, [currentUser.id]);

  // Handle preference updates (callback for modal success)
  const handlePreferenceUpdate = useCallback((key: keyof UserPreferences, value: string) => {
    setPreferences((prev: UserPreferences | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
  }, []);

  // Get user initials for avatar (memoized)
  const userInitials = useMemo(() =>
    currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase(),
    [currentUser.name]
  );

  // Get actual counts (memoized)
  const accountCount = useMemo(() => accounts.length, [accounts.length]);
  const transactionCount = useMemo(() => transactions.length, [transactions.length]);

  return (
    <PageContainer className={settingsStyles.page.container}>
      <div>
        {/* Header */}
        <Header
          title="Impostazioni"
          showBack={true}
          onBack={() => router.push("/dashboard")}
          currentUser={{ name: currentUser.name, role: (currentUser.role || 'member') as any }}
          showActions={true}
        />

        <main className={settingsStyles.main.container}>
          {/* Profile Section */}
          <PageSection>
            <SectionHeader title="Profilo" icon={User} iconClassName="text-primary" />

            <PageSection variant="card" padding="sm">
              {/* User Info Header */}
              <div className={settingsStyles.profile.header}>
                <div className={settingsStyles.profile.container}>
                  <div className="settings-profile-avatar" style={{ backgroundColor: (currentUser.theme_color || '#000000') as string }}>
                    {userInitials}
                  </div>
                  <div className={settingsStyles.profile.info}>
                    <h3 className={settingsStyles.profile.name}>{currentUser.name}</h3>
                    <div className={settingsStyles.profile.badges}>
                      <div className={settingsStyles.profile.badge}>{accountCount} Account</div>
                      <div className={settingsStyles.profile.badge}>{transactionCount} Transazioni</div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={settingsStyles.profile.editButton}
                  onClick={() => setShowEditProfileModal(true)}
                >
                  Modifica
                </Button>
              </div>

              {/* Profile Details */}
              <ListContainer divided className={`${settingsStyles.profileDetails.container} space-y-0`}>
                <SettingsItem
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  label="Email"
                  value={currentUser.email}
                />

                <SettingsItem
                  icon={<Phone className="h-4 w-4 text-primary" />}
                  label="Telefono"
                  value="Non specificato"
                />

                <SettingsItem
                  icon={<User className="h-4 w-4 text-primary" />}
                  label="Ruolo"
                  value={currentUser.role || 'Membro'}
                />
              </ListContainer>
            </PageSection>
          </PageSection>

          {/* Group Management Section - Only visible to admins */}
          {isAdmin && (
            <PageSection>
              <SectionHeader title="Gestione Gruppo" icon={Users} iconClassName="text-primary" />

              {/* Group Members List */}
              <PageSection variant="card" padding="sm">
                <SectionHeader
                  title="Membri del Gruppo"
                  subtitle={`${groupUsers.length} ${groupUsers.length === 1 ? "membro visibile" : "membri visibili"}`}
                  titleClassName="text-sm font-semibold text-primary"
                  subtitleClassName="text-xs text-primary/70"
                />
                <ListContainer divided className="divide-primary/20 space-y-0">
                  {groupUsers.map((member) => {
                    const memberInitials = member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <RowCard
                        key={member.id}
                        title={member.name}
                        subtitle={member.email}
                        icon={
                          <div
                            className="size-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-md"
                            style={{ backgroundColor: (member.theme_color || '#000000') as string }}
                          >
                            {memberInitials}
                          </div>
                        }
                        actions={(
                          <div className="text-right">
                            <RoleBadge role={(member.role || 'member') as any} size="sm" variant="subtle" />
                            <p className="text-xs text-primary/50 mt-0.5">
                              {member.created_at ? new Date(member.created_at).toLocaleDateString("it-IT") : '-'}
                            </p>
                          </div>
                        )}
                      />
                    );
                  })}
                </ListContainer>
              </PageSection>

              {/* Group Actions */}
              <PageSection variant="card" padding="sm">
                <ListContainer divided className="divide-primary/20 space-y-0">
                  <RowCard
                    title="Invita Membro"
                    subtitle="Invia invito per unirsi al gruppo"
                    icon={(
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                        <Plus className="h-4 w-4" />
                      </div>
                    )}
                    onClick={() => setShowInviteMemberModal(true)}
                    actions={<ChevronRight className="h-4 w-4 text-primary/50" />}
                    variant="interactive"
                  />
                  <RowCard
                    title="Impostazioni Abbonamento"
                    subtitle="Gestisci fatturazione e abbonamento gruppo"
                    icon={(
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                        <CreditCard className="h-4 w-4" />
                      </div>
                    )}
                    onClick={() => setShowSubscriptionModal(true)}
                    actions={<ChevronRight className="h-4 w-4 text-primary/50" />}
                    variant="interactive"
                  />
                </ListContainer>
              </PageSection>
            </PageSection>
          )}

          {/* Preferences */}
          <PageSection>
            <SectionHeader title="Preferenze" icon={Settings} iconClassName="text-primary" />
            <PageSection variant="card" padding="sm">
              <ListContainer divided className="divide-primary/20 space-y-0">
                <SettingsItem
                  icon={<CreditCard className="h-4 w-4 text-primary" />}
                  label="Valuta"
                  value={preferences?.currency ?
                    CURRENCY_OPTIONS.find(opt => opt.value === preferences.currency)?.label || preferences.currency
                    : 'EUR - Euro'}
                  actionType="button"
                  buttonLabel="Cambia"
                  onPress={() => setShowCurrencyModal(true)}
                  disabled={isLoadingPreferences}
                />

                <SettingsItem
                  icon={<Globe className="h-4 w-4 text-primary" />}
                  label="Lingua"
                  value={preferences?.language ?
                    LANGUAGE_OPTIONS.find(opt => opt.value === preferences.language)?.label || preferences.language
                    : 'Italiano'}
                  actionType="button"
                  buttonLabel="Cambia"
                  onPress={() => setShowLanguageModal(true)}
                  disabled={isLoadingPreferences}
                />

                <SettingsItem
                  icon={<Globe className="h-4 w-4 text-primary" />}
                  label="Fuso Orario"
                  value={preferences?.timezone ?
                    TIMEZONE_OPTIONS.find(opt => opt.value === preferences.timezone)?.label || preferences.timezone
                    : 'Roma (GMT+1)'}
                  actionType="button"
                  buttonLabel="Cambia"
                  onPress={() => setShowTimezoneModal(true)}
                  disabled={isLoadingPreferences}
                />
              </ListContainer>
            </PageSection>
          </PageSection>

          {/* Notifications */}
          <PageSection>
            <SectionHeader title="Notifiche" icon={Bell} iconClassName="text-primary" />
            <PageSection variant="card" padding="sm">
              <ListContainer divided className="divide-primary/20 space-y-0">
                <SettingsItem
                  icon={<Bell className="h-4 w-4 text-primary" />}
                  label="Notifiche Push"
                  description="Ricevi notifiche sulle transazioni"
                  actionType="toggle"
                  checked={preferences?.notifications_push ?? true}
                  onToggle={(checked) => handleNotificationToggle('notifications_push', !checked)}
                  disabled={isLoadingPreferences}
                />

                <SettingsItem
                  icon={<Mail className="h-4 w-4 text-primary" />}
                  label="Notifiche Email"
                  description="Ricevi rapporti settimanali"
                  actionType="toggle"
                  checked={preferences?.notifications_email ?? false}
                  onToggle={(checked) => handleNotificationToggle('notifications_email', !checked)}
                  disabled={isLoadingPreferences}
                />

                <SettingsItem
                  icon={<Bell className="h-4 w-4 text-primary" />}
                  label="Avvisi Budget"
                  description="Avvisa quando superi il budget"
                  actionType="toggle"
                  checked={preferences?.notifications_budget_alerts ?? true}
                  onToggle={(checked) => handleNotificationToggle('notifications_budget_alerts', !checked)}
                  disabled={isLoadingPreferences}
                />
              </ListContainer>
            </PageSection>
          </PageSection>

          {/* Security */}
          <PageSection>
            <SectionHeader title="Sicurezza" icon={Shield} iconClassName="text-primary" />
            <PageSection variant="card" padding="sm">
              <ListContainer divided className="space-y-0">
                <SettingsItem
                  icon={<Shield className="h-4 w-4 text-primary" />}
                  label="Autenticazione a Due Fattori"
                  description="Aggiungi sicurezza extra"
                  actionType="navigation"
                  onPress={() => {/* TODO: Navigate to 2FA settings */ }}
                />

                <SettingsItem
                  icon={isSigningOut ? <Loader2 className="h-4 w-4 text-primary animate-spin" /> : <LogOut className="h-4 w-4 text-primary" />}
                  label={isSigningOut ? "Disconnessione in corso..." : "Esci dall'Account"}
                  description={isSigningOut ? "Attendere prego" : "Disconnetti dal tuo account"}
                  actionType={isSigningOut ? "custom" : "navigation"}
                  onPress={handleSignOut}
                  disabled={isSigningOut}
                />
              </ListContainer>
            </PageSection>
          </PageSection>

          {/* Account Actions */}
          <PageSection>
            <SectionHeader title="Account" icon={User} iconClassName="text-destructive" />
            <PageSection variant="card" padding="sm">
              <SettingsItem
                icon={<Trash2 className="h-4 w-4 text-destructive" />}
                label="Elimina Account"
                description="Elimina permanentemente il tuo account"
                actionType="navigation"
                onPress={handleDeleteAccountClick}
                variant="destructive"
              />
            </PageSection>
          </PageSection>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        isDeleting={isDeletingAccount}
        error={deleteError}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteAccountConfirm}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onOpenChange={setShowEditProfileModal}
        userId={currentUser.id}
        currentName={currentUser.name}
        currentEmail={currentUser.email}
      />

      {/* Currency Selection Modal */}
      {preferences && (
        <PreferenceSelectModal
          isOpen={showCurrencyModal}
          onOpenChange={setShowCurrencyModal}
          userId={currentUser.id}
          title="Seleziona Valuta"
          description="Scegli la valuta predefinita per le tue transazioni"
          currentValue={preferences.currency}
          options={CURRENCY_OPTIONS}
          preferenceKey="currency"
          onSuccess={(value) => handlePreferenceUpdate('currency', value)}
        />
      )}

      {/* Language Selection Modal */}
      {preferences && (
        <PreferenceSelectModal
          isOpen={showLanguageModal}
          onOpenChange={setShowLanguageModal}
          userId={currentUser.id}
          title="Seleziona Lingua"
          description="Scegli la lingua dell'interfaccia"
          currentValue={preferences.language}
          options={LANGUAGE_OPTIONS}
          preferenceKey="language"
          onSuccess={(value) => handlePreferenceUpdate('language', value)}
        />
      )}

      {/* Timezone Selection Modal */}
      {preferences && (
        <PreferenceSelectModal
          isOpen={showTimezoneModal}
          onOpenChange={setShowTimezoneModal}
          userId={currentUser.id}
          title="Seleziona Fuso Orario"
          description="Scegli il fuso orario per le date e gli orari"
          currentValue={preferences.timezone}
          options={TIMEZONE_OPTIONS}
          preferenceKey="timezone"
          onSuccess={(value) => handlePreferenceUpdate('timezone', value)}
        />
      )}

      {/* Invite Member Modal */}
      {isAdmin && (
        <InviteMemberModal
          isOpen={showInviteMemberModal}
          onOpenChange={setShowInviteMemberModal}
          groupId={currentUser.group_id || ''}
          currentUserId={currentUser.id}
        />
      )}

      {/* Subscription Modal */}
      {isAdmin && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          groupId={currentUser.group_id || ''}
          currentPlan="free"
        />
      )}
    </PageContainer>
  );
}
