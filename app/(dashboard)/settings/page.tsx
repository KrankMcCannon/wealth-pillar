"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { ArrowLeft, User, Mail, Phone, Globe, Bell, Shield, Trash2, Users, Plus, BarChart3, CreditCard, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "../../../components/bottom-navigation";
import { userService } from "@/lib/api";
import { User as UserType } from "@/lib/types";
import {
  formatDate
} from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const usersData = await userService.getAll();
        setUsers(usersData);
        
        // Set current user as first user for demo purposes
        if (usersData.length > 0) {
          setCurrentUser(usersData[0]);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const planInfo = useMemo(() => {
    return {
      name: 'Premium Plan',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7578EC]"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Nessun utente trovato</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Impostazioni</h1>
            <div className="min-w-[44px] min-h-[44px]"></div>
          </div>
        </header>

        <main className="px-3 sm:px-4 py-4 pb-20 space-y-6">
          {/* Profile Section */}
          <section>
            <Card className="gap-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 border border-white/50 rounded-2xl sm:rounded-3xl p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <div className="size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-[#7578EC] to-blue-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shrink-0 shadow-lg">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{currentUser.name}</h3>
                  <p className="text-sm text-slate-600 truncate">{currentUser.email}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`p-2 rounded-full ${planInfo.bgColor} flex items-center justify-center shadow-sm`}>
                      <span className={`text-xs font-semibold ${planInfo.color}`}>{planInfo.name}</span>
                    </div>
                    {currentUser.role === "superadmin" && (
                      <div className="p-2 rounded-full bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center shadow-sm">
                        <span className="text-xs font-semibold text-orange-700">Sviluppatore</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="shrink-0 hover:bg-[#7578EC] hover:text-white transition-all duration-200 border-[#7578EC] text-[#7578EC] rounded-xl"
                >
                  Modifica
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500">Nome Completo</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-green-100">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500">Email</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">{currentUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100">
                    <Phone className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500">Telefono</p>
                    <p className="text-sm font-semibold text-slate-900">+39 123 456 789</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-orange-100">
                    <CreditCard className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500">Piano</p>
                    <p className={`text-sm font-semibold ${planInfo.color}`}>{planInfo.name}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Group Management Section - Only for superadmin and admin */}
          {(currentUser.role === "superadmin" || currentUser.role === "admin") && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Gestione Gruppo</h2>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#7578EC]/10 rounded-full">
                  <Users className="h-4 w-4 text-[#7578EC]" />
                  <span className="text-sm font-semibold text-[#7578EC]">{users.length} membri</span>
                </div>
              </div>

              {/* Group Members List */}
              <Card className="gap-0 pt-3 pb-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 rounded-2xl overflow-hidden mb-4">
                <div className="px-4 py-3 border-b border-slate-100/50 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="text-sm font-semibold text-slate-900">Membri del Gruppo</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Famiglia Rossi</p>
                </div>
                <div className="divide-y divide-slate-100/50">
                  {users.map((member: UserType) => (
                    <div key={member.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-all duration-200">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7578EC] to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-md shrink-0">
                          {member.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-slate-900 truncate">{member.name}</h4>
                          <p className="text-xs text-slate-500 truncate">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center justify-center shadow-sm border ${
                          member.role === "admin"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                          <span className="capitalize whitespace-nowrap">
                            {member.role === 'admin' ? 'Admin' : 'Membro'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {formatDate(member.created_at.toISOString())}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Group Actions */}
              <Card className="gap-0 p-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 rounded-2xl overflow-hidden">
                <button className="flex items-center justify-between p-3 w-full text-left hover:bg-slate-50/50 transition-all duration-200 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-900">Invita Membro</span>
                      <p className="text-xs text-slate-500 truncate">Invia invito per unirsi al gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
                
                <div className="h-px bg-slate-100"></div>
                
                <button className="flex items-center justify-between p-3 w-full text-left hover:bg-slate-50/50 transition-all duration-200 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-900">Analisi Gruppo</span>
                      <p className="text-xs text-slate-500 truncate">Visualizza analisi spese combinate</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
                
                <div className="h-px bg-slate-100"></div>
                
                <button className="flex items-center justify-between p-3 w-full text-left hover:bg-slate-50/50 transition-all duration-200 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-900">Impostazioni Abbonamento</span>
                      <p className="text-xs text-slate-500 truncate">Gestisci fatturazione e abbonamento gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
              </Card>
            </section>
          )}

          {/* Preferences */}
          <section>
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">Preferenze</h2>
            <Card className="gap-0 p-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-slate-100/50 hover:bg-slate-50/30 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Valuta</span>
                    <p className="text-xs text-slate-500">EUR - Euro</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#7578EC] hover:bg-[#7578EC]/10 transition-all duration-200 shrink-0">Cambia</Button>
              </div>

              <div className="flex items-center justify-between p-3 border-b border-slate-100/50 hover:bg-slate-50/30 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Lingua</span>
                    <p className="text-xs text-slate-500">Italiano</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#7578EC] hover:bg-[#7578EC]/10 transition-all duration-200 shrink-0">Cambia</Button>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-slate-50/30 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Fuso Orario</span>
                    <p className="text-xs text-slate-500 truncate">UTC+1 (Ora Italiana)</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-[#7578EC] hover:bg-[#7578EC]/10 transition-all duration-200 shrink-0">Cambia</Button>
              </div>
            </Card>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">Notifiche</h2>
            <Card className="gap-0 p-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-slate-100/50 hover:bg-slate-50/30 transition-all duration-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-sm">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Notifiche Push</span>
                    <p className="text-xs text-slate-500 truncate">Ricevi notifiche sulle transazioni</p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" className="sr-only peer" id="push-notifications" defaultChecked />
                  <label htmlFor="push-notifications" className="flex items-center cursor-pointer">
                    <div className="relative w-12 h-6 bg-slate-200 peer-checked:bg-[#7578EC] rounded-full transition-colors duration-200 shadow-inner">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-md"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border-b border-slate-100/50 hover:bg-slate-50/30 transition-all duration-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Notifiche Email</span>
                    <p className="text-xs text-slate-500 truncate">Ricevi rapporti settimanali</p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" className="sr-only peer" id="email-notifications" />
                  <label htmlFor="email-notifications" className="flex items-center cursor-pointer">
                    <div className="relative w-12 h-6 bg-slate-200 peer-checked:bg-[#7578EC] rounded-full transition-colors duration-200 shadow-inner">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-md"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 hover:bg-slate-50/30 transition-all duration-200">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Avvisi Budget</span>
                    <p className="text-xs text-slate-500 truncate">Avvisa quando superi il budget</p>
                  </div>
                </div>
                <div className="relative shrink-0">
                  <input type="checkbox" className="sr-only peer" id="budget-alerts" defaultChecked />
                  <label htmlFor="budget-alerts" className="flex items-center cursor-pointer">
                    <div className="relative w-12 h-6 bg-slate-200 peer-checked:bg-[#7578EC] rounded-full transition-colors duration-200 shadow-inner">
                      <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-6 shadow-md"></div>
                    </div>
                  </label>
                </div>
              </div>
            </Card>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">Sicurezza</h2>
            <Card className="gap-0 p-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 rounded-2xl overflow-hidden">
              <button className="flex items-center justify-between p-3 w-full text-left hover:bg-slate-50/50 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Cambia Password</span>
                    <p className="text-xs text-slate-500 truncate">Aggiorna la tua password</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </button>
              
              <div className="h-px bg-slate-100"></div>
              
              <button className="flex items-center justify-between p-3 w-full text-left hover:bg-slate-50/50 transition-all duration-200 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">Autenticazione a Due Fattori</span>
                    <p className="text-xs text-slate-500 truncate">Aggiungi sicurezza extra</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
              </button>
            </Card>
          </section>

          {/* Account Actions */}
          <section>
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-4">Account</h2>
            <Card className="gap-0 p-0 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 rounded-2xl overflow-hidden">
              <button className="flex items-center justify-between p-3 w-full text-left hover:bg-red-50/50 transition-all duration-200 text-red-600 group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 group-hover:scale-105 transition-transform duration-200 shadow-sm">
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