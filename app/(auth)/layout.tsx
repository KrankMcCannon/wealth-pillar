import type { ReactNode } from 'react';
import { authStyles } from '@/features/auth';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={authStyles.layout.container}>
      <main className={authStyles.layout.main}>{children}</main>
      <footer className={authStyles.layout.footer}>
        <div className={authStyles.layout.footerText}>
          © {new Date().getFullYear()} Wealth Pillar
        </div>
      </footer>
    </div>
  );
}
