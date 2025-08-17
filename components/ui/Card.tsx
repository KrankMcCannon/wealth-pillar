import React, { memo } from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = memo<CardProps>(({ children, className = "" }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg lg:rounded-xl shadow-sm lg:shadow-md p-3 sm:p-4 lg:p-6 transition-all duration-300 hover:shadow-lg hover:transform hover:-translate-y-1 overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
});
