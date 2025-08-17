import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, TransactionIcon, InvestmentIcon, SettingsIcon, ChartBarIcon } from "./Icons";

interface BottomNavbarProps {
  className?: string;
}

export const BottomNavbar: React.FC<BottomNavbarProps> = ({ className = "" }) => {
  const navItems = [
    { to: "/", icon: HomeIcon, label: "Home" },
    { to: "/transactions", icon: TransactionIcon, label: "Transazioni" },
    { to: "/investments", icon: InvestmentIcon, label: "Investimenti" },
    { to: "/reports", icon: ChartBarIcon, label: "Report" },
    { to: "/settings", icon: SettingsIcon, label: "Impostazioni" },
  ];

  return (
    <nav className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-2 py-2 ${className}`}>
      <div className="flex justify-around">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`
            }
          >
            <Icon className="w-4 h-4 mb-1" />
            <span className="text-xs font-light text-center truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
