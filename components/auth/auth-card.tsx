'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="mt-2 text-3xl font-extrabold text-gradient tracking-tight">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{subtitle}</p>
        )}
      </div>

      <motion.div
        className="rounded-2xl liquid-glass p-6 shadow-xl"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.7 }}
      >
        <AnimatePresence mode="wait">{children}</AnimatePresence>
      </motion.div>
    </div>
  );
}

export default AuthCard;

