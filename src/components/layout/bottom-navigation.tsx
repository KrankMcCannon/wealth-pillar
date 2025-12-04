"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, TrendingUp, BarChart3 } from "lucide-react";

export function BottomNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      icon: Home,
      label: "Home"
    },
    {
      href: "/transactions",
      icon: CreditCard,
      label: "Transactions"
    },
    {
      href: "/investments",
      icon: TrendingUp,
      label: "Investments"
    },
    {
      href: "/reports",
      icon: BarChart3,
      label: "Reports"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-primary/20 px-4 py-2 safe-area-pb">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-primary/70 hover:text-primary"
              }`}
            >
              <IconComponent className="h-5 w-5" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
