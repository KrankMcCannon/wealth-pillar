"use client";

import { SectionHeader, BottomNavigation, PageContainer, Header } from "@/src/components/layout";
import { settingsStyles } from "@/src/features/settings/theme";
import { deleteUserAction } from "@/src/features/settings";
import { DeleteAccountModal } from "@/src/features/settings";
import { usePermissions } from "@/hooks";
import {
  BarChart3,
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
import { useState } from "react";
import { Button, Card } from "@/components/ui";
import type { User as UserType, Account, Transaction, Category } from "@/lib/types";

/**
 * Settings Content Props
 */
interface SettingsContentProps {
  currentUser: UserType;
  groupUsers: UserType[];
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

export default function SettingsContent({ currentUser, groupUsers, accounts, transactions, categories }: SettingsContentProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Permission checks
  const { isAdmin } = usePermissions({ currentUser });

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccountClick = () => {
    // Verify clerk_id exists
    if (!currentUser.clerk_id) {
      setDeleteError("Impossibile eliminare l'account: ID Clerk mancante.");
      setShowDeleteModal(true);
      return;
    }

    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDeleteAccountConfirm = async () => {
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

      // Sign out and redirect to sign-in page
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("Si è verificato un errore durante l'eliminazione dell'account.");
      setIsDeletingAccount(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeletingAccount) return; // Don't close while deleting
    setShowDeleteModal(false);
    setDeleteError(null);
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Nessun utente trovato</p>
        </div>
      </div>
    );
  }

  // Get user initials for avatar
  const userInitials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Get actual counts
  const accountCount = accounts.length;
  const transactionCount = transactions.length;

  return (
    <PageContainer>
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
            <SectionHeader title="Profilo" icon={User} iconClassName="text-primary" className="mb-4" />

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
                      <div className={settingsStyles.profile.badge}>{currentUser.email}</div>
                      <div className={settingsStyles.profile.badge}>{accountCount} Account</div>
                      <div className={settingsStyles.profile.badge}>{transactionCount} Transazioni</div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  <Button variant="outline" size="sm" className={settingsStyles.profile.editButton}>
                    Modifica
                  </Button>
                </div>
              </div>

              {/* Profile Details */}
              <div className={settingsStyles.profileDetails.container}>
                <div className={settingsStyles.profileDetails.item}>
                  <div className={settingsStyles.profileDetails.iconContainer}>
                    <Mail className={settingsStyles.profileDetails.icon} />
                  </div>
                  <div className={settingsStyles.profileDetails.content}>
                    <span className={settingsStyles.profileDetails.label}>Email</span>
                    <p className={settingsStyles.profileDetails.value}>{currentUser.email}</p>
                  </div>
                </div>

                <div className={settingsStyles.profileDetails.item}>
                  <div className={settingsStyles.profileDetails.iconContainer}>
                    <Phone className={settingsStyles.profileDetails.icon} />
                  </div>
                  <div className={settingsStyles.profileDetails.content}>
                    <span className={settingsStyles.profileDetails.label}>Telefono</span>
                    <p className={settingsStyles.profileDetails.value}>Non specificato</p>
                  </div>
                </div>

                <div className={settingsStyles.profileDetails.item}>
                  <div className={settingsStyles.profileDetails.iconContainer}>
                    <User className={settingsStyles.profileDetails.icon} />
                  </div>
                  <div className={settingsStyles.profileDetails.content}>
                    <span className={settingsStyles.profileDetails.label}>Ruolo</span>
                    <p className={settingsStyles.profileDetails.value}>{currentUser.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Group Management Section - Only visible to admins */}
          {isAdmin && (
            <section>
              <SectionHeader title="Gestione Gruppo" icon={Users} iconClassName="text-primary">
                <div className={settingsStyles.sectionHeader.badge}>
                  <Users className={settingsStyles.sectionHeader.badgeIcon} />
                  <span className={settingsStyles.sectionHeader.badgeText}>{groupUsers.length} membri</span>
                </div>
              </SectionHeader>

              {/* Group Members List */}
              <Card className={settingsStyles.card.container + " pt-3 pb-0 mb-4"}>
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
                          <div className="flex-1 min-w-0">
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
                <button className={settingsStyles.actionButton.container}>
                  <div className={settingsStyles.actionButton.content}>
                    <div className={settingsStyles.actionButton.iconContainer}>
                      <Plus className={settingsStyles.actionButton.icon} />
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <span className={settingsStyles.actionButton.title}>Invita Membro</span>
                      <p className={settingsStyles.actionButton.subtitle}>Invia invito per unirsi al gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className={settingsStyles.actionButton.chevron} />
                </button>

                <div className={settingsStyles.card.dividerLine}></div>

                <button className={settingsStyles.actionButton.container}>
                  <div className={settingsStyles.actionButton.content}>
                    <div className={settingsStyles.actionButton.iconContainer}>
                      <BarChart3 className={settingsStyles.actionButton.icon} />
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <span className={settingsStyles.actionButton.title}>Analisi Gruppo</span>
                      <p className={settingsStyles.actionButton.subtitle}>Visualizza analisi spese combinate</p>
                    </div>
                  </div>
                  <ChevronRight className={settingsStyles.actionButton.chevron} />
                </button>

                <div className={settingsStyles.card.dividerLine}></div>

                <button className={settingsStyles.actionButton.container}>
                  <div className={settingsStyles.actionButton.content}>
                    <div className={settingsStyles.actionButton.iconContainer}>
                      <CreditCard className={settingsStyles.actionButton.icon} />
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
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
            <SectionHeader title="Preferenze" icon={Settings} iconClassName="text-primary" className="mb-4" />
            <Card className={settingsStyles.card.container}>
              <div className={settingsStyles.preference.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <CreditCard className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Valuta</span>
                    <p className={settingsStyles.preference.value}>EUR - Euro</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className={settingsStyles.preference.button}>
                  Cambia
                </Button>
              </div>

              <div className={settingsStyles.preference.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Globe className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Lingua</span>
                    <p className={settingsStyles.preference.value}>Italiano</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className={settingsStyles.preference.button}>
                  Cambia
                </Button>
              </div>

              <div className={settingsStyles.preference.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Globe className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Fuso Orario</span>
                    <p className={settingsStyles.preference.value}>UTC+1 (Ora Italiana)</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className={settingsStyles.preference.button}>
                  Cambia
                </Button>
              </div>
            </Card>
          </section>

          {/* Notifications */}
          <section>
            <SectionHeader title="Notifiche" icon={Bell} iconClassName="text-primary" className="mb-4" />
            <Card className={settingsStyles.card.container}>
              <div className={settingsStyles.notification.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Bell className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Notifiche Push</span>
                    <p className={settingsStyles.preference.value}>Ricevi notifiche sulle transazioni</p>
                  </div>
                </div>
                <div className={settingsStyles.notification.toggle.wrapper}>
                  <input
                    type="checkbox"
                    className={settingsStyles.notification.toggle.input}
                    id="push-notifications"
                    defaultChecked
                  />
                  <label htmlFor="push-notifications" className={settingsStyles.notification.toggle.label}>
                    <span className="sr-only">Attiva notifiche push</span>
                    <div className={settingsStyles.notification.toggle.track}>
                      <div className={settingsStyles.notification.toggle.thumb}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className={settingsStyles.notification.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Mail className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Notifiche Email</span>
                    <p className={settingsStyles.preference.value}>Ricevi rapporti settimanali</p>
                  </div>
                </div>
                <div className={settingsStyles.notification.toggle.wrapper}>
                  <input
                    type="checkbox"
                    className={settingsStyles.notification.toggle.input}
                    id="email-notifications"
                  />
                  <label htmlFor="email-notifications" className={settingsStyles.notification.toggle.label}>
                    <span className="sr-only">Attiva notifiche email</span>
                    <div className={settingsStyles.notification.toggle.track}>
                      <div className={settingsStyles.notification.toggle.thumb}></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className={settingsStyles.notification.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Bell className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Avvisi Budget</span>
                    <p className={settingsStyles.preference.value}>Avvisa quando superi il budget</p>
                  </div>
                </div>
                <div className={settingsStyles.notification.toggle.wrapper}>
                  <input
                    type="checkbox"
                    className={settingsStyles.notification.toggle.input}
                    id="budget-alerts"
                    defaultChecked
                  />
                  <label htmlFor="budget-alerts" className={settingsStyles.notification.toggle.label}>
                    <span className="sr-only">Attiva avvisi budget</span>
                    <div className={settingsStyles.notification.toggle.track}>
                      <div className={settingsStyles.notification.toggle.thumb}></div>
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          </section>

          {/* Security */}
          <section>
            <SectionHeader title="Sicurezza" icon={Shield} iconClassName="text-primary" className="mb-4" />
            <Card className={settingsStyles.card.container}>
              <button onClick={() => router.push("/forgot-password")} className={settingsStyles.security.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.security.iconContainer}>
                    <Shield className={settingsStyles.security.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.security.title}>Cambia Password</span>
                    <p className={settingsStyles.security.subtitle}>Aggiorna la tua password</p>
                  </div>
                </div>
                <ChevronRight className={settingsStyles.security.chevron} />
              </button>

              <div className={settingsStyles.card.dividerLine}></div>

              <button className={settingsStyles.security.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.security.iconContainer}>
                    <Shield className={settingsStyles.security.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.security.title}>Autenticazione a Due Fattori</span>
                    <p className={settingsStyles.security.subtitle}>Aggiungi sicurezza extra</p>
                  </div>
                </div>
                <ChevronRight className={settingsStyles.security.chevron} />
              </button>

              <div className={settingsStyles.card.dividerLine}></div>

              <button onClick={handleSignOut} disabled={isSigningOut} className={settingsStyles.security.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.security.iconContainer}>
                    {isSigningOut ? (
                      <Loader2 className={`${settingsStyles.security.icon} animate-spin`} />
                    ) : (
                      <LogOut className={settingsStyles.security.icon} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.security.title}>
                      {isSigningOut ? "Disconnessione in corso..." : "Esci dall'Account"}
                    </span>
                    <p className={settingsStyles.security.subtitle}>
                      {isSigningOut ? "Attendere prego" : "Disconnetti dal tuo account"}
                    </p>
                  </div>
                </div>
                {!isSigningOut && <ChevronRight className={settingsStyles.security.chevron} />}
              </button>
            </Card>
          </section>

          {/* Account Actions */}
          <section>
            <SectionHeader title="Account" icon={User} iconClassName="text-red-600" className="mb-4" />
            <Card className={settingsStyles.accountActions.container}>
              <button onClick={handleDeleteAccountClick} className={settingsStyles.accountActions.button}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.accountActions.iconContainer}>
                    <Trash2 className={settingsStyles.accountActions.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.accountActions.title}>Elimina Account</span>
                    <p className={settingsStyles.accountActions.subtitle}>Elimina permanentemente il tuo account</p>
                  </div>
                </div>
                <ChevronRight className={settingsStyles.accountActions.chevron} />
              </button>
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
    </PageContainer>
  );
}
