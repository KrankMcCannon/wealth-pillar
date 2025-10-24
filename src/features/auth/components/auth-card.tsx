'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md mx-auto px-4">
      <motion.div
        className="rounded-2xl bg-white p-5 shadow-xl border border-primary/20"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.7 }}
      >
        <div className="text-center mb-3">
          <div className="text-primary text-xl font-bold tracking-tight">Wealth Pillar</div>
          <h2 className="text-xl font-bold text-primary tracking-tight mt-0.5">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-foreground/60">{subtitle}</p>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export default AuthCard;

