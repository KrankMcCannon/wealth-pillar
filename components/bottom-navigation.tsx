"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Bot, TrendingUp } from "lucide-react";

export default function BottomNavigation() {
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
      href: "/ai-assistant",
      icon: Bot,
      label: "AI Assistant"
    },
    {
      href: "/investments",
      icon: TrendingUp,
      label: "Investments"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
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
                  ? "bg-[#7578EC] text-white"
                  : "text-gray-500 hover:text-[#7578EC]"
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
