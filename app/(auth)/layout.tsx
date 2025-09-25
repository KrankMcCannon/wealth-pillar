import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--color-background))]">
      <header className="py-6">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-center">
          <div className="text-gradient text-xl font-extrabold tracking-tight">Wealth Pillar</div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-[color:var(--text-secondary)]">
          © {new Date().getFullYear()} Wealth Pillar
        </div>
      </footer>
    </div>
  );
}

