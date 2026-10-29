'use client';

import type { ReactNode } from 'react';
import { authStyles } from '../theme';

type AuthCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, children }: Readonly<AuthCardProps>) {
  return (
    <div className={authStyles.card.container}>
      <div className={authStyles.card.surface}>
        <header className={authStyles.card.header}>
          <div className={authStyles.card.brand}>Wealth Pillar</div>
          <h2 className={authStyles.card.title}>{title}</h2>
          {subtitle && <p className={authStyles.card.subtitle}>{subtitle}</p>}
        </header>
        {children}
      </div>
    </div>
  );
}
