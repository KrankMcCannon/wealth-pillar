import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh w-screen bg-[hsl(var(--color-background))] flex items-center justify-center relative overflow-hidden">
      <main className="w-full h-full flex items-center justify-center">{children}</main>
      <footer className="absolute bottom-2 left-0 right-0">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-[hsl(var(--color-primary))]/60">
          © {new Date().getFullYear()} Wealth Pillar
        </div>
      </footer>
    </div>
  );
}

