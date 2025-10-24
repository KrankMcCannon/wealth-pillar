"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "📊",
    description: "Panoramica generale"
  },
  {
    title: "Transazioni",
    href: "/transactions",
    icon: "💳",
    description: "Movimenti finanziari"
  },
  {
    title: "Budget",
    href: "/budgets",
    icon: "🎯",
    description: "Pianificazione spese"
  },
  {
    title: "Investimenti",
    href: "/investments",
    icon: "📈",
    description: "Portfolio e analisi"
  },
  {
    title: "Impostazioni",
    href: "/settings",
    icon: "⚙️",
    description: "Configurazione"
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-72 flex-col liquid-glass-strong border-r border-sidebar-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="gradient-primary h-12 w-12 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">💎</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient tracking-tight">
              Wealth Pillar
            </h1>
            <p className="text-xs text-primary/70 -mt-1">
              Financial Intelligence
            </p>
          </div>
        </div>
        
        <div className="bg-accent-glass p-4 rounded-2xl border border-finance-positive/20 liquid-shimmer morph-card">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-finance-positive">Saldo Totale</span>
            <span className="text-xs text-finance-positive">↗ +2.5%</span>
          </div>
          <p className="text-lg font-bold text-finance-positive">€42,351.80</p>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-4 rounded-2xl px-5 py-4 text-sm font-medium transition-all duration-300 hover-glass morph-card",
              pathname === item.href
                ? "bg-primary-glass text-white shadow-2xl liquid-float"
                : "text-sidebar-foreground hover:liquid-glass-subtle"
            )}
          >
            <div className={cn(
              "flex items-center justify-center h-10 w-10 rounded-xl transition-all duration-300 liquid-pulse",
              pathname === item.href 
                ? "bg-white/30 backdrop-blur-sm" 
                : "bg-sidebar-accent/20 group-hover:bg-primary-glass group-hover:backdrop-blur-md"
            )}>
              <span className="text-base">{item.icon}</span>
            </div>
            <div className="flex-1">
              <p className={cn(
                "font-medium",
                pathname === item.href ? "text-white" : "text-primary"
              )}>
                {item.title}
              </p>
              <p className={cn(
                "text-xs mt-0.5",
                pathname === item.href 
                  ? "text-white/70" 
                  : "text-primary/70"
              )}>
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="liquid-glass-subtle p-4 rounded-2xl text-center border border-sidebar-border/30 hover-glass">
          <p className="text-xs font-medium text-primary/70 mb-1">
            Wealth Pillar Pro
          </p>
          <p className="text-xs text-primary/70">
            v2.1.0 • Build 2024.1
          </p>
        </div>
      </div>
    </div>
  );
}
