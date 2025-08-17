import React from "react";

interface HamburgerMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onToggle, className = "" }) => {
  return (
    <button
      onClick={onToggle}
      className={`p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${className}`}
      aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
    >
      <div className="w-6 h-6 flex flex-col justify-center items-center">
        <span
          className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? "rotate-45 translate-y-1" : "-translate-y-1"
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-current transition-all duration-300 ${isOpen ? "opacity-0" : "opacity-100"}`}
        />
        <span
          className={`block w-5 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? "-rotate-45 -translate-y-1" : "translate-y-1"
          }`}
        />
      </div>
    </button>
  );
};
