'use client';

import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useMounted } from '@/hooks';

export function ThemeToggle() {
  const t = useTranslations('ThemeToggle');
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="size-9 p-0" disabled>
        <span className="size-5" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="size-9 p-0"
      aria-label={t('aria')}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}
