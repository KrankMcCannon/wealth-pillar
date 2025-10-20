"use client";

import { ArrowLeft, User, UserCircle, Mail, Phone, Globe, Bell, Shield, Trash2, Users, Plus, BarChart3, CreditCard, ChevronRight, Settings, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "../../../components/bottom-navigation";
import { SectionHeader } from "@/components/section-header";
import { User as UserType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { PermissionGuard } from "@/components/permissions/permission-guard";
import { RoleBadge } from "@/components/permissions/role-badge";
import { PageLoader } from "@/components/page-loader";
import { useSettingsController } from "@/hooks/controllers/useSettingsController";

const renderAvatarIcon = (iconName: string) => {
  const iconProps = { className: "h-5 w-5" };

  switch (iconName) {
    case 'User':
      return <User {...iconProps} />;
    case 'UserCircle':
      return <UserCircle {...iconProps} />;
    default:
      return <User {...iconProps} />;
  }
};

export default function SettingsPage() {
  // Controller orchestrates all business logic
  const {
    currentUser,
    users,
    userStats,
    activityStats,
    planInfo,
    isSigningOut,
    isLoading,
    handleBackClick,
    handleSignOut,
  } = useSettingsController();

  if (isLoading) {
    return <PageLoader message="Caricamento impostazioni..." />;
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Nessun utente trovato</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-card" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 shadow-sm px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={handleBackClick}
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black">Impostazioni</h1>
            <div className="min-w-[44px] min-h-[44px]"></div>
          </div>
        </header>

        <main className="px-3 sm:px-4 py-4 pb-20 space-y-6">
          {/* Profile Section */}
          <section>
            <SectionHeader
              title="Profilo"
              icon={User}
              iconClassName="text-[#7678e4]"
              className="mb-4"
            />
            
            <Card className="gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
              {/* User Info Header */}
              <div className="flex items-center justify-between px-2 py-4 bg-card">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-[#7678e4]/30 shrink-0">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-[#7678e4] mb-1 truncate">{currentUser.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#7678e4]/15 text-[#7678e4] whitespace-nowrap">
                        {planInfo.name}
                      </div>
                      <RoleBadge size="sm" variant="subtle" />
                      <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap">
                        {activityStats.accountCount} Account
                      </div>
                      <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap">
                        {activityStats.transactionCount} Transazioni
                      </div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-[#7678e4] hover:text-white transition-all duration-200 border-0 bg-[#7678e4]/10 text-[#7678e4] rounded-xl px-4 py-2 font-medium shadow-sm hover:shadow-lg hover:shadow-[#7678e4]/25 whitespace-nowrap"
                  >
                    Modifica
                  </Button>
                </div>
              </div>

              {/* Profile Details */}
              <div className="divide-y divide-[#7678e4]/8">
                <div className="flex items-center gap-3 p-3 hover:bg-[#7678e4]/8 transition-colors duration-200 group">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] shadow-sm group-hover:scale-[1.02] transition-transform duration-200">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#7678e4] block mb-0.5">Email</span>
                    <p className="text-sm">{currentUser.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 hover:bg-[#7678e4]/8 transition-colors duration-200 group">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] shadow-sm group-hover:scale-[1.02] transition-transform duration-200">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#7678e4] block mb-0.5">Telefono</span>
                    <p className="text-sm">Non specificato</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 hover:bg-[#7678e4]/8 transition-colors duration-200 group">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] shadow-sm group-hover:scale-[1.02] transition-transform duration-200">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-[#7678e4] block mb-0.5">Ruolo</span>
                    <p className="text-sm capitalize">{currentUser.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Group Management Section - Permission-based visibility */}
          <PermissionGuard requireFeature="user_management">
            <section>
              <SectionHeader
                title="Gestione Gruppo"
                icon={Users}
                iconClassName="text-[#7678e4]"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7678e4]/10 rounded-full">
                  <Users className="h-4 w-4 text-[#7678e4]" />
                  <span className="text-sm font-semibold text-[#7678e4]">{userStats.totalUsers} membri</span>
                </div>
              </SectionHeader>

              {/* Group Members List */}
              <Card className="gap-0 pt-3 pb-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden mb-4">
                <div className="px-4 py-3 bg-card">
                  <h3 className="text-sm font-semibold text-[#7678e4]">Membri del Gruppo</h3>
                  <p className="text-xs mt-0.5">{userStats.viewableUsers} {userStats.viewableUsers === 1 ? 'membro visibile' : 'membri visibili'}</p>
                </div>
                <div className="divide-y divide-[#7678e4]/8">
                  {users.map((member: UserType) => (
                    <div key={member.id} className="p-3 flex items-center justify-between hover:bg-[#7678e4]/8 transition-all duration-200">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm shrink-0">
                          {renderAvatarIcon(member.avatar)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#7678e4] truncate">{member.name}</h4>
                          <p className="text-xs truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <RoleBadge role={member.role} size="sm" variant="subtle" />
                        <p className="text-xs mt-1 truncate">
                          {(() => {
                            try {
                              const dateStr = typeof member.created_at === 'string' ? member.created_at : member.created_at?.toISOString?.() || '';
                              return formatDate(dateStr);
                            } catch {
                              return 'Data non disponibile';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Group Actions */}
              <Card className="gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
                <button className="flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-[#7678e4]">Invita Membro</span>
                      <p className="text-xs truncate">Invia invito per unirsi al gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>

                <div className="h-px bg-[#7678e4]/10"></div>

                <button className="flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-[#7678e4]">Analisi Gruppo</span>
                      <p className="text-xs truncate">Visualizza analisi spese combinate</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>

                <div className="h-px bg-[#7678e4]/10"></div>

                <button className="flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-[#7678e4]">Impostazioni Abbonamento</span>
                      <p className="text-xs truncate">Gestisci fatturazione e abbonamento gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
              </Card>
            </section>
          </PermissionGuard>

          {/* Preferences */}
          <section>
            <SectionHeader
              title="Preferenze"
              icon={Settings}
              iconClassName="text-[#7678e4]"
              className="mb-4"
            />
            <Card className="gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Valuta</span>
                    <p className="text-xs">EUR - Euro</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#7678e4] hover:bg-primary/8 transition-all duration-200 shrink-0">Cambia</Button>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Lingua</span>
                    <p className="text-xs">Italiano</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#7678e4] hover:bg-primary/8 transition-all duration-200 shrink-0">Cambia</Button>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Fuso Orario</span>
                    <p className="text-xs truncate">UTC+1 (Ora Italiana)</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#7678e4] hover:bg-primary/8 transition-all duration-200 shrink-0">Cambia</Button>
              </div>
            </Card>
          </section>

          {/* Notifications */}
          <section>
            <SectionHeader
              title="Notifiche"
              icon={Bell}
              iconClassName="text-[#7678e4]"
              className="mb-4"
            />
            <Card className="gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] shadow-sm">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Notifiche Push</span>
                    <p className="text-xs truncate">Ricevi notifiche sulle transazioni</p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" className="sr-only peer" id="push-notifications" defaultChecked />
                  <label htmlFor="push-notifications" className="flex items-center cursor-pointer">
                    <div className="relative w-12 h-6 bg-muted peer-checked:bg-[#7678e4] rounded-full transition-colors duration-200 shadow-inner">
                      <div className="absolute left-1 top-1 bg-card w-4 h-4 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-md"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Notifiche Email</span>
                    <p className="text-xs truncate">Ricevi rapporti settimanali</p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" className="sr-only peer" id="email-notifications" />
                  <label htmlFor="email-notifications" className="flex items-center cursor-pointer">
                    <div className="relative w-12 h-6 bg-muted peer-checked:bg-[#7678e4] rounded-full transition-colors duration-200 shadow-inner">
                      <div className="absolute left-1 top-1 bg-card w-4 h-4 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-md"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-[#7678e4]/8 transition-all duration-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] shadow-sm">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Avvisi Budget</span>
                    <p className="text-xs truncate">Avvisa quando superi il budget</p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" className="sr-only peer" id="budget-alerts" defaultChecked />
                  <label htmlFor="budget-alerts" className="flex items-center cursor-pointer">
                    <div className="relative w-12 h-6 bg-muted peer-checked:bg-[#7678e4] rounded-full transition-colors duration-200 shadow-inner">
                      <div className="absolute left-1 top-1 bg-card w-4 h-4 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-md"></div>
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          </section>

          {/* Security */}
          <section>
            <SectionHeader
              title="Sicurezza"
              icon={Shield}
              iconClassName="text-[#7678e4]"
              className="mb-4"
            />
            <Card className="gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-[#7678e4]/15 border-0 rounded-2xl overflow-hidden">
              <button className="flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Cambia Password</span>
                    <p className="text-xs truncate">Aggiorna la tua password</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </button>

              <div className="h-px bg-[#7678e4]/10"></div>

              <button className="flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">Autenticazione a Due Fattori</span>
                    <p className="text-xs truncate">Aggiungi sicurezza extra</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </button>

              <div className="h-px bg-[#7678e4]/10"></div>

              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center justify-between p-3 w-full text-left hover:bg-[#7678e4]/8 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-[#7678e4]/15 text-[#7678e4] group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-[#7678e4]">{isSigningOut ? 'Disconnessione...' : 'Esci dall\'Account'}</span>
                    <p className="text-xs truncate">Disconnetti dal tuo account</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </button>
            </Card>
          </section>

          {/* Account Actions */}
          <section>
            <SectionHeader
              title="Account"
              icon={User}
              iconClassName="text-red-600"
              className="mb-4"
            />
            <Card className="gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-red-500/15 border-0 rounded-2xl overflow-hidden">
              <button className="flex items-center justify-between p-3 w-full text-left hover:bg-red-50/50 transition-all duration-200 text-red-600 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 group-hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-red-700">Elimina Account</span>
                    <p className="text-xs text-red-500 truncate">Elimina permanentemente il tuo account</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
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
