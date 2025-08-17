import React, { useState, useEffect, useMemo } from "react";
import { useBreakpoint } from "../../hooks/ui/useResponsive";
import { Sidebar, BottomNavbar, HamburgerMenu } from "./index";

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children, className = "" }) => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Chiudi la sidebar quando si passa a desktop
  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSidebarToggle = () => {
    // Su mobile, non permettere mai l'apertura della sidebar
    if (isMobile) {
      return;
    }
    setSidebarOpen(!sidebarOpen);
  };

  // Memoizza le condizioni per evitare re-rendering inutili
  const layoutConfig = useMemo(
    () => ({
      shouldShowSidebar: isDesktop,
      shouldShowBottomNav: isMobile || isTablet,
      shouldShowHamburger: false, // Rimuovo hamburger menu, tablet usa comportamento mobile
      shouldShowSidebarDesktop: isDesktop,
      shouldShowSidebarTablet: false, // Rimuovo sidebar su tablet
      mainMargin: "ml-0", // Rimuovo il margin-left su desktop
    }),
    [isMobile, isTablet, isDesktop, sidebarOpen]
  );

  return (
    <div className={`h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Header con hamburger menu solo su mobile/tablet */}
      {layoutConfig.shouldShowHamburger && (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Wealth Pillar</h1>
            <HamburgerMenu isOpen={sidebarOpen} onToggle={handleSidebarToggle} />
          </div>
        </header>
      )}

      <div className="flex h-full">
        {/* Sidebar - fissa su desktop, overlay su tablet, mai su mobile */}
        {layoutConfig.shouldShowSidebarDesktop && (
          <Sidebar isOpen={true} onClose={handleSidebarClose} className="z-40" />
        )}

        {layoutConfig.shouldShowSidebarTablet && (
          <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} className="z-40" />
        )}

        {/* Contenuto principale */}
        <main className={`flex-1 transition-all duration-300 ${layoutConfig.mainMargin} overflow-y-auto`}>
          {children}
        </main>
      </div>

      {/* Bottom navigation solo su mobile/tablet */}
      {layoutConfig.shouldShowBottomNav && <BottomNavbar className="fixed bottom-0 left-0 right-0 z-50" />}
    </div>
  );
};
