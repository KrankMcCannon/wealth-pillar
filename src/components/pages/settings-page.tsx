"use client";

import { SectionHeader } from "@/src/components/layout";
import BottomNavigation from "@/src/components/layout/bottom-navigation";
import { PageLoader } from "@/src/components/shared";
import { useSettingsController } from "@/src/features/dashboard/hooks/use-settings-controller";
import { ArrowLeft } from "lucide-react";

export function SettingsPage() {
  const {
    currentUser,
    isLoading,
    handleBackClick,
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
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-card">
      <div>
        <header className="sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 shadow-sm px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBackClick}
              className="text-primary hover:bg-primary hover:text-white rounded-xl transition-all p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-black">Impostazioni</h1>
            <div className="min-w-[44px]"></div>
          </div>
        </header>

        <main className="px-3 sm:px-4 py-4 pb-20 space-y-6">
          <section>
            <SectionHeader
              title="Profilo"
              className="mb-4"
            />
            
            <div className="gap-0 p-0 bg-card/95 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-2 py-4 bg-card">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
                    {currentUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-[#7678e4] mb-1 truncate">{currentUser.name}</h3>
                    <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <SectionHeader
              title="Preferenze"
              className="mb-4"
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-card/95 rounded-xl">
                <span className="text-sm font-medium">Notifiche</span>
                <input type="checkbox" className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between p-4 bg-card/95 rounded-xl">
                <span className="text-sm font-medium">Modalità Scura</span>
                <input type="checkbox" className="w-4 h-4" />
              </div>
            </div>
          </section>
        </main>
      </div>

      <BottomNavigation />
    </div>
  );
}
