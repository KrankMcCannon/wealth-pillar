"use client";

import { SectionHeader } from "@/src/components/layout";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import { PageLoader } from "@/src/components/shared";
import { settingsStyles } from "@/src/features/settings/theme";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
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
import { PermissionGuard, RoleBadge } from "@/features/permissions";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

export default function SettingsContent() {
  const router = useRouter();

  if (false) {
    return <PageLoader message="Caricamento impostazioni..." />;
  }

  if (!true) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Nessun utente trovato</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex size-full min-h-dvh flex-col bg-card"
      style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
    >
      <div>
        {/* Header */}
        <header className={settingsStyles.header.container}>
          <div className={settingsStyles.header.inner}>
            <Button variant="ghost" size="sm" className={settingsStyles.header.button} onClick={() => {}}>
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <h1 className={settingsStyles.header.title}>Impostazioni</h1>
            <div className={settingsStyles.header.spacer}></div>
          </div>
        </header>

        <main className={settingsStyles.main.container}>
          {/* Profile Section */}
          <section>
            <SectionHeader title="Profilo" icon={User} iconClassName="text-primary" className="mb-4" />

            <Card className={settingsStyles.card.container}>
              {/* User Info Header */}
              <div className={settingsStyles.profile.header}>
                <div className={settingsStyles.profile.container}>
                  <div className={settingsStyles.profile.avatar}>
                    {""
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className={settingsStyles.profile.info}>
                    <h3 className={settingsStyles.profile.name}>{""}</h3>
                    <div className={settingsStyles.profile.badges}>
                      <div className={settingsStyles.profile.badge}>{""}</div>
                      <RoleBadge size="sm" variant="subtle" />
                      <div className={settingsStyles.profile.badge}>{0} Account</div>
                      <div className={settingsStyles.profile.badge}>{0} Transazioni</div>
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
                    <p className={settingsStyles.profileDetails.value}>{""}</p>
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
                    <p className={settingsStyles.profileDetails.value}>{""}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Group Management Section - Permission-based visibility */}
          <PermissionGuard requireFeature="user_management">
            <section>
              <SectionHeader title="Gestione Gruppo" icon={Users} iconClassName="text-primary">
                <div className={settingsStyles.sectionHeader.badge}>
                  <Users className={settingsStyles.sectionHeader.badgeIcon} />
                  <span className={settingsStyles.sectionHeader.badgeText}>{0} membri</span>
                </div>
              </SectionHeader>

              {/* Group Members List */}
              <Card className={settingsStyles.card.container + " pt-3 pb-0 mb-4"}>
                <div className={settingsStyles.groupManagement.header}>
                  <h3 className={settingsStyles.groupManagement.title}>Membri del Gruppo</h3>
                  <p className={settingsStyles.groupManagement.subtitle}>
                    {0} {1 === 1 ? "membro visibile" : "membri visibili"}
                  </p>
                </div>
                <div className={settingsStyles.groupManagement.list}>
                  {[].map(() => (
                    <div key={""} className={settingsStyles.groupManagement.item}>
                      <div className={settingsStyles.groupManagement.memberLeft}>
                        <div className={settingsStyles.groupManagement.memberAvatar}>
                          <User className={settingsStyles.profileDetails.icon} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={settingsStyles.groupManagement.memberName}>{""}</h4>
                          <p className={settingsStyles.groupManagement.memberEmail}>{""}</p>
                        </div>
                      </div>
                      <div className={settingsStyles.groupManagement.memberRight}>
                        <RoleBadge role={"superadmin"} size="sm" variant="subtle" />
                        <p className={settingsStyles.groupManagement.memberDate}>{0}</p>
                      </div>
                    </div>
                  ))}
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
          </PermissionGuard>

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

              <button onClick={() => {}} disabled={false} className={settingsStyles.security.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.security.iconContainer}>
                    <LogOut className={settingsStyles.security.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.security.title}>{"Esci dall'Account"}</span>
                    <p className={settingsStyles.security.subtitle}>Disconnetti dal tuo account</p>
                  </div>
                </div>
                <ChevronRight className={settingsStyles.security.chevron} />
              </button>
            </Card>
          </section>

          {/* Account Actions */}
          <section>
            <SectionHeader title="Account" icon={User} iconClassName="text-red-600" className="mb-4" />
            <Card className={settingsStyles.accountActions.container}>
              <button className={settingsStyles.accountActions.button}>
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
    </div>
  );
}
