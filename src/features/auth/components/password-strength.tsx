"use client";

import { cn } from '@/src/lib';

export type PasswordStrengthProps = {
  password: string;
};

export function scorePassword(pw: string) {
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  return Math.min(score, 4);
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = scorePassword(password);
  const labels = ['Molto debole', 'Debole', 'Discreta', 'Forte', 'Molto forte'];
  const colors = [
    'bg-[hsl(var(--color-destructive))]',
    'bg-[hsl(var(--color-warning))]',
    'bg-[hsl(var(--color-secondary))]',
    'bg-[hsl(var(--color-primary))]',
    'bg-[hsl(var(--color-accent))]',
  ];

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn('h-1 rounded-full bg-[hsl(var(--color-border))]', i < score ? colors[Math.max(0, score - 1)] : undefined)} />
        ))}
      </div>
      <div className="text-xs text-primary/70">Sicurezza: <span className="font-semibold text-primary">{labels[score]}</span></div>
    </div>
  );
}

export default PasswordStrength;
