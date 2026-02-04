'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { authStyles } from '../theme';

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backButton?: ReactNode;
};

export function AuthCard({ title, subtitle, children, backButton }: Readonly<AuthCardProps>) {
  return (
    <div className={authStyles.card.container}>
      <motion.div
        className={authStyles.card.surface}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, mass: 0.7 }}
      >
        <div className={authStyles.card.header}>
          <div className={authStyles.card.headerRow}>
            <div className={authStyles.card.headerSlot}>{backButton}</div>
            <div className={authStyles.card.headerCenter}>
              <div className={authStyles.card.brand}>Wealth Pillar</div>
              <h2 className={authStyles.card.title}>{title}</h2>
            </div>
            <div className={authStyles.card.headerSlotSpacer} />
          </div>
          {subtitle && <p className={authStyles.card.subtitle}>{subtitle}</p>}
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export default AuthCard;
