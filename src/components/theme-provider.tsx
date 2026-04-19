'use client';

/**
 * Theme switching via `next-themes`. In development, React may log:
 * "Encountered a script tag while rendering React component".
 *
 * That comes from this library: it renders a small inline `<script>` (with
 * `dangerouslySetInnerHTML`) before paint to avoid theme flash (FOUC). React 19
 * warns because `<script>` nodes in the client tree are not executed as
 * classic scripts when created by React. The snippet still runs as intended in
 * the browser; it is not app code you need to "fix" unless you replace
 * `next-themes` with another strategy (e.g. theme cookie + server layout).
 */
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider({
  children,
  ...props
}: Readonly<ComponentProps<typeof NextThemesProvider>>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
