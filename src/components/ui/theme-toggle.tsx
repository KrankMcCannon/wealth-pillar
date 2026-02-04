'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { themeToggleStyles } from './theme/theme-toggle-styles';
import { useMounted } from '@/hooks';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={themeToggleStyles.button} disabled>
        <span className="w-5 h-5" />
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={themeToggleStyles.button}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className={themeToggleStyles.icon} />
      ) : (
        <Moon className={themeToggleStyles.icon} />
      )}
    </Button>
  );
}
