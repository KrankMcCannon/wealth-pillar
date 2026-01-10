"use client";

import { SectionHeader, BottomNavigation, PageContainer, Header } from "@/components/layout";
import { SettingsItem } from "@/components/ui/layout";
import { settingsStyles } from "@/features/settings/theme";
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
import { Button, Card } from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import type { Account, Transaction } from "@/lib/types";
import type { UserPreferences } from "@/lib/services/user-preferences.service";

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
    setPreferences(prev => {
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
        setPreferences(prev => {
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
      setPreferences(prev => {
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
    setPreferences(prev => {
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
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
        />

        <main className={settingsStyles.main.container}>
          {/* Profile Section */}
          <section>
            <SectionHeader
              title="Profilo"
              icon={User}
              iconClassName={settingsStyles.sectionHeader.iconPrimary}
              className={settingsStyles.sectionHeader.spacing}
            />

            <Card className={settingsStyles.card.container}>
              {/* User Info Header */}
              <div className={settingsStyles.profile.header}>
                <div className={settingsStyles.profile.container}>
                  <div className={settingsStyles.profile.avatar} style={{ backgroundColor: currentUser.theme_color }}>
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
              <div className={settingsStyles.profileDetails.container}>
                <SettingsItem
                  icon={<Mail className={settingsStyles.sectionHeader.badgeIcon} />}
                  label="Email"
                  value={currentUser.email}
                  showDivider
                />

                <SettingsItem
                  icon={<Phone className={settingsStyles.sectionHeader.badgeIcon} />}
                  label="Telefono"
                  value="Non specificato"
                  showDivider
                />

                <SettingsItem
                  icon={<User className={settingsStyles.sectionHeader.badgeIcon} />}
                  label="Ruolo"
                  value={currentUser.role}
                />
              </div>
            </Card>
          </section>

          {/* Group Management Section - Only visible to admins */}
          {isAdmin && (
            <section>
              <SectionHeader title="Gestione Gruppo" icon={Users} iconClassName={settingsStyles.sectionHeader.iconPrimary} />

              {/* Group Members List */}
              <Card className={settingsStyles.card.containerTight}>
                <div className={settingsStyles.groupManagement.header}>
                  <h3 className={settingsStyles.groupManagement.title}>Membri del Gruppo</h3>
                  <p className={settingsStyles.groupManagement.subtitle}>
                    {groupUsers.length} {groupUsers.length === 1 ? "membro visibile" : "membri visibili"}
                  </p>
                </div>
                <div className={settingsStyles.groupManagement.list}>
                  {groupUsers.map((member) => {
                    const memberInitials = member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <div key={member.id} className={settingsStyles.groupManagement.item}>
                        <div className={settingsStyles.groupManagement.memberLeft}>
                          <div
                            className={settingsStyles.groupManagement.memberAvatar}
                            style={{ backgroundColor: member.theme_color }}
                          >
                            {memberInitials}
                          </div>
                          <div className={settingsStyles.layout.column}>
                            <h4 className={settingsStyles.groupManagement.memberName}>{member.name}</h4>
                            <p className={settingsStyles.groupManagement.memberEmail}>{member.email}</p>
                          </div>
                        </div>
                        <div className={settingsStyles.groupManagement.memberRight}>
                          <RoleBadge role={member.role} size="sm" variant="subtle" />
                          <p className={settingsStyles.groupManagement.memberDate}>
                            {new Date(member.created_at).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Group Actions */}
              <Card className={settingsStyles.card.container}>
                <button
                  className={settingsStyles.actionButton.container}
                  onClick={() => setShowInviteMemberModal(true)}
                >
                  <div className={settingsStyles.actionButton.content}>
                    <div className={settingsStyles.actionButton.iconContainer}>
                      <Plus className={settingsStyles.actionButton.icon} />
                    </div>
                    <div className={settingsStyles.layout.rowOffset}>
                      <span className={settingsStyles.actionButton.title}>Invita Membro</span>
                      <p className={settingsStyles.actionButton.subtitle}>Invia invito per unirsi al gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className={settingsStyles.actionButton.chevron} />
                </button>

                <div className={settingsStyles.card.dividerLine}></div>

                <button
                  className={settingsStyles.actionButton.container}
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  <div className={settingsStyles.actionButton.content}>
                    <div className={settingsStyles.actionButton.iconContainer}>
                      <CreditCard className={settingsStyles.actionButton.icon} />
                    </div>
                    <div className={settingsStyles.layout.rowOffset}>
                      <span className={settingsStyles.actionButton.title}>Impostazioni Abbonamento</span>
                      <p className={settingsStyles.actionButton.subtitle}>Gestisci fatturazione e abbonamento gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className={settingsStyles.actionButton.chevron} />
                </button>
              </Card>
            </section>
          )}

          {/* Preferences */}
          <section>
            <SectionHeader
              title="Preferenze"
              icon={Settings}
              iconClassName={settingsStyles.sectionHeader.iconPrimary}
              className={settingsStyles.sectionHeader.spacing}
            />
            <Card className={settingsStyles.card.container}>
              <SettingsItem
                icon={<CreditCard className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Valuta"
                value={preferences?.currency ?
                  CURRENCY_OPTIONS.find(opt => opt.value === preferences.currency)?.label || preferences.currency
                  : 'EUR - Euro'}
                actionType="button"
                buttonLabel="Cambia"
                onPress={() => setShowCurrencyModal(true)}
                disabled={isLoadingPreferences}
                showDivider
              />

              <SettingsItem
                icon={<Globe className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Lingua"
                value={preferences?.language ?
                  LANGUAGE_OPTIONS.find(opt => opt.value === preferences.language)?.label || preferences.language
                  : 'Italiano'}
                actionType="button"
                buttonLabel="Cambia"
                onPress={() => setShowLanguageModal(true)}
                disabled={isLoadingPreferences}
                showDivider
              />

              <SettingsItem
                icon={<Globe className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Fuso Orario"
                value={preferences?.timezone ?
                  TIMEZONE_OPTIONS.find(opt => opt.value === preferences.timezone)?.label || preferences.timezone
                  : 'Roma (GMT+1)'}
                actionType="button"
                buttonLabel="Cambia"
                onPress={() => setShowTimezoneModal(true)}
                disabled={isLoadingPreferences}
              />
            </Card>
          </section>

          {/* Notifications */}
          <section>
            <SectionHeader
              title="Notifiche"
              icon={Bell}
              iconClassName={settingsStyles.sectionHeader.iconPrimary}
              className={settingsStyles.sectionHeader.spacing}
            />
            <Card className={settingsStyles.card.container}>
              <SettingsItem
                icon={<Bell className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Notifiche Push"
                description="Ricevi notifiche sulle transazioni"
                actionType="toggle"
                checked={preferences?.notifications_push ?? true}
                onToggle={(checked) => handleNotificationToggle('notifications_push', !checked)}
                disabled={isLoadingPreferences}
                showDivider
              />

              <SettingsItem
                icon={<Mail className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Notifiche Email"
                description="Ricevi rapporti settimanali"
                actionType="toggle"
                checked={preferences?.notifications_email ?? false}
                onToggle={(checked) => handleNotificationToggle('notifications_email', !checked)}
                disabled={isLoadingPreferences}
                showDivider
              />

              <SettingsItem
                icon={<Bell className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Avvisi Budget"
                description="Avvisa quando superi il budget"
                actionType="toggle"
                checked={preferences?.notifications_budget_alerts ?? true}
                onToggle={(checked) => handleNotificationToggle('notifications_budget_alerts', !checked)}
                disabled={isLoadingPreferences}
              />
            </Card>
          </section>

          {/* Security */}
          <section>
            <SectionHeader
              title="Sicurezza"
              icon={Shield}
              iconClassName={settingsStyles.sectionHeader.iconPrimary}
              className={settingsStyles.sectionHeader.spacing}
            />
            <Card className={settingsStyles.card.container}>
              <SettingsItem
                icon={<Shield className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Autenticazione a Due Fattori"
                description="Aggiungi sicurezza extra"
                actionType="navigation"
                onPress={() => {/* TODO: Navigate to 2FA settings */ }}
                showDivider
              />

              <SettingsItem
                icon={isSigningOut ? <Loader2 className={`${settingsStyles.sectionHeader.badgeIcon} animate-spin`} /> : <LogOut className={settingsStyles.sectionHeader.badgeIcon} />}
                label={isSigningOut ? "Disconnessione in corso..." : "Esci dall'Account"}
                description={isSigningOut ? "Attendere prego" : "Disconnetti dal tuo account"}
                actionType={isSigningOut ? "custom" : "navigation"}
                onPress={handleSignOut}
                disabled={isSigningOut}
              />
            </Card>
          </section>

          {/* Account Actions */}
          <section>
            <SectionHeader
              title="Account"
              icon={User}
              iconClassName={settingsStyles.sectionHeader.iconDestructive}
              className={settingsStyles.sectionHeader.spacing}
            />
            <Card className={settingsStyles.accountActions.container}>
              <SettingsItem
                icon={<Trash2 className={settingsStyles.sectionHeader.badgeIcon} />}
                label="Elimina Account"
                description="Elimina permanentemente il tuo account"
                actionType="navigation"
                onPress={handleDeleteAccountClick}
                variant="destructive"
              />
            </Card>
          </section>
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
          groupId={currentUser.group_id}
          currentUserId={currentUser.id}
        />
      )}

      {/* Subscription Modal */}
      {isAdmin && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          groupId={currentUser.group_id}
          currentPlan="free"
        />
      )}
    </PageContainer>
  );
}
