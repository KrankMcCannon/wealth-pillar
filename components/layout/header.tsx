"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="liquid-glass border-b border-border px-6 py-4 backdrop-blur-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-primary-glass h-12 w-12 rounded-2xl flex items-center justify-center shadow-2xl liquid-pulse">
            <span className="text-lg font-bold text-white">💎</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gradient tracking-tight">
              Wealth Pillar
            </h2>
            <p className="text-xs text-muted-foreground -mt-1">
              Financial Intelligence Platform
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <Badge variant="outline" className="bg-accent-glass border-finance-positive text-finance-positive liquid-shimmer">
              ↗ +2.5%
            </Badge>
            <span className="text-sm text-muted-foreground">Portfolio</span>
          </div>
          
          <ThemeToggle />
          
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <Button variant="ghost" size="sm" className="hover-glass rounded-2xl p-3 morph-card">
              <div className="h-10 w-10 bg-primary-glass rounded-2xl flex items-center justify-center liquid-pulse">
                <span className="text-sm font-medium text-white">MR</span>
              </div>
            </Button>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground">Marco Rossi</p>
              <p className="text-xs text-muted-foreground">Premium Account</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}