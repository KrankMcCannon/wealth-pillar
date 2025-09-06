"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import BottomNavigation from "../../../components/bottom-navigation";
import {
  currentUser,
  dummyUsers
} from "@/lib/dummy-data";
import {
  formatDate
} from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();

  const planBadgeColor = useMemo(() => {
    return 'text-purple-600';
  }, []);

  const planInfo = useMemo(() => {
    return {
      name: 'Premium Plan',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    };
  }, []);

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col justify-between overflow-x-hidden" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC' }}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button
              className="text-[#1F2937] flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-[#EFF2FE] transition-colors"
              onClick={() => router.push('/dashboard')}
            >
              <svg fill="currentColor" height="24px" viewBox="0 0 256 256" width="24px" xmlns="http://www.w3.org/2000/svg">
                <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
              </svg>
            </button>
            <h1 className="text-[#1F2937] text-xl font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Impostazioni</h1>
            <div className="size-10"></div>
          </div>
        </header>

        <main className="p-4 pb-24">
          {/* Profile Section */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Profilo</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{currentUser.name}</h3>
                  <p className="text-sm text-gray-600">{currentUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`px-3 py-1 rounded-full ${planInfo.bgColor} flex items-center justify-center`}>
                      <span className={`text-xs font-medium ${planInfo.color}`}>{planInfo.name}</span>
                    </div>
                    {currentUser.role === "superadmin" && (
                      <div className="px-3 py-1 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-orange-600">Sviluppatore</span>
                      </div>
                    )}
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">Modifica</button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Nome Completo</span>
                  <span className="text-sm text-gray-900">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Email</span>
                  <span className="text-sm text-gray-900">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Telefono</span>
                  <span className="text-sm text-gray-900">+39 123 456 789</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Piano</span>
                  <span className={`text-sm font-medium ${planInfo.color}`}>{planInfo.name}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Ruolo</span>
                  <span className="text-sm text-gray-900 capitalize">
                    {currentUser.role === 'superadmin' ? 'Super Admin' : 
                     currentUser.role === 'admin' ? 'Admin' : 
                     currentUser.role === 'member' ? 'Membro' : currentUser.role}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-700">Gruppo</span>
                  <span className="text-sm text-gray-900">Famiglia Rossi</span>
                </div>
              </div>
            </div>
          </section>

          {/* Group Management Section - Only for superadmin and admin */}
          {(currentUser.role === "superadmin" || currentUser.role === "admin") && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Gestione Gruppo</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg">
                    <path d="M117.25,157.92a60,60,0,1,0-66.5,0A95.83,95.83,0,0,0,3.53,195.63a8,8,0,1,0,13.4,8.74,80,80,0,0,1,134.14,0,8,8,0,0,0,13.4-8.74A95.83,95.83,0,0,0,117.25,157.92ZM40,108a44,44,0,1,1,44,44A44.05,44.05,0,0,1,40,108Zm210.27,98.63a8,8,0,0,1-11.29-.89,64.05,64.05,0,0,0-85,0,8,8,0,0,1-10.4-12.18,80.08,80.08,0,0,1,112.76,0A8,8,0,0,1,250.27,206.63ZM172,120a44,44,0,1,1-16.34-33.89,8,8,0,0,1-11.32-11.32A60,60,0,1,0,172,120Z"></path>
                  </svg>
                  <span>{dummyUsers.length} membri</span>
                </div>
              </div>

              {/* Group Members List */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900">Membri del Gruppo</h3>
                  <p className="text-xs text-gray-500 mt-1">Famiglia Rossi</p>
                </div>
                <div className="divide-y divide-gray-100">
                  {dummyUsers.map((member) => (
                    <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {member.avatar}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{member.name}</h4>
                          <p className="text-xs text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center justify-center ${member.role === "admin"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                          }`}>
                          <span className="capitalize">
                            {member.role === 'admin' ? 'Admin' : 'Membro'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Iscritto il {formatDate(member.created_at.toISOString())}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group Actions */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path>
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Invita Membro</span>
                      <p className="text-xs text-gray-500">Invia invito per unirsi al gruppo</p>
                    </div>
                  </div>
                  <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                  </svg>
                </button>

                <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24,104H80a8,8,0,0,0,0-16H24a8,8,0,0,0,0,16Zm0,32H80a8,8,0,0,0,0-16H24a8,8,0,0,0,0,16Zm0,32H80a8,8,0,0,0,0-16H24a8,8,0,0,0,0,16ZM224,64H112a16,16,0,0,0-16,16V176a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V80A16,16,0,0,0,224,64Zm0,112H112V80H224V176Z"></path>
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Analisi Gruppo</span>
                      <p className="text-xs text-gray-500">Visualizza analisi spese combinate</p>
                    </div>
                  </div>
                  <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                  </svg>
                </button>

                <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                        <path d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,11.58,7.16L72,222.42l20.42,8.74a8,8,0,0,0,6.32,0L120,222.42l21.26,8.74a8,8,0,0,0,6.32,0L168,222.42l20.42,8.74A8,8,0,0,0,200,224V56A32,32,0,0,0,208,24ZM72,40H184V56a16,16,0,0,1-16,16H72A16,16,0,0,1,72,40ZM184,208.58l-12.42-5.16a8,8,0,0,0-6.32,0L144,212.16l-21.26-8.74a8,8,0,0,0-6.32,0L96,212.16l-21.26-8.74a8,8,0,0,0-6.32,0L56,208.58V88H168a32,32,0,0,0,16-4.29V208.58Z"></path>
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">Impostazioni Abbonamento</span>
                      <p className="text-xs text-gray-500">Gestisci fatturazione e abbonamento gruppo</p>
                    </div>
                  </div>
                  <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path>
                  </svg>
                </button>
              </div>
            </section>
          )}

          {/* Preferences */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Preferenze</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Valuta</span>
                    <p className="text-xs text-gray-500">EUR - Euro</p>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">Cambia</button>
              </div>

              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Lingua</span>
                    <p className="text-xs text-gray-500">Italiano</p>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">Cambia</button>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Fuso Orario</span>
                    <p className="text-xs text-gray-500">UTC+1 (Ora Italiana)</p>
                  </div>
                </div>
                <button className="text-blue-600 text-sm font-medium">Cambia</button>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Notifiche</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Notifiche Push</span>
                    <p className="text-xs text-gray-500">Ricevi notifiche sulle transazioni</p>
                  </div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="push-notifications" defaultChecked />
                  <label htmlFor="push-notifications" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="block bg-gray-300 w-12 h-6 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-6"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Notifiche Email</span>
                    <p className="text-xs text-gray-500">Ricevi rapporti settimanali</p>
                  </div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="email-notifications" />
                  <label htmlFor="email-notifications" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="block bg-gray-300 w-12 h-6 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out"></div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Avvisi Budget</span>
                    <p className="text-xs text-gray-500">Avvisa quando superi il budget</p>
                  </div>
                </div>
                <div className="relative">
                  <input type="checkbox" className="sr-only" id="budget-alerts" defaultChecked />
                  <label htmlFor="budget-alerts" className="flex items-center cursor-pointer">
                    <div className="relative">
                      <div className="block bg-gray-300 w-12 h-6 rounded-full"></div>
                      <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out transform translate-x-6"></div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sicurezza</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Cambia Password</span>
                    <p className="text-xs text-gray-500">Aggiorna la tua password</p>
                  </div>
                </div>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                  <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                </svg>
              </button>

              <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">Autenticazione a Due Fattori</span>
                    <p className="text-xs text-gray-500">Aggiungi sicurezza extra</p>
                  </div>
                </div>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                  <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                </svg>
              </button>
            </div>
          </section>

          {/* Account Actions */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Account</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button className="flex items-center justify-between p-4 w-full text-left hover:bg-gray-50 transition-colors text-red-600">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <svg fill="currentColor" height="20px" viewBox="0 0 256 256" width="20px" xmlns="http://www.w3.org/2000/svg">
                      <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Elimina Account</span>
                    <p className="text-xs text-red-500">Elimina permanentemente il tuo account</p>
                  </div>
                </div>
                <svg fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg" className="text-red-400">
                  <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"></path>
                </svg>
              </button>
            </div>
          </section>
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}