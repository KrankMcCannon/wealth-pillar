import type { Metadata } from "next";
import { Spline_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/src/components/ui/toast";
import { isDevelopment } from "@/src/lib/utils";
import "./globals.css";

const splineSans = Spline_Sans({
  variable: "--font-spline-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  fallback: ["system-ui", "arial"],
});

export const metadata: Metadata = {
  title: "Wealth Pillar - Gestione Finanziaria Intelligente",
  description: "Piattaforma completa per la gestione delle finanze personali e familiari",
};

/**
 * Root Layout
 *
 * Provides authentication context via Clerk and TanStack Query provider for the entire app.
 * SSR hydration with server-scoped QueryClient is implemented in dashboard layouts
 * to avoid issues with static prerendering.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      telemetry={false}
      appearance={{
        elements: {
          // Hide CAPTCHA only in development to avoid protocol mismatch errors
          // In production, CAPTCHA is enabled for security (bot sign-up protection)
          ...(isDevelopment() && {
            formFieldInput__captcha: "hidden",
            captcha: "hidden",
          }),
        },
      }}
    >
      <html lang="en" className="light" data-scroll-behavior="smooth">
        <body
          className={`${splineSans.variable} antialiased min-h-screen`}
          style={{
            fontFamily: '"Spline Sans", "Noto Sans", sans-serif',
            backgroundColor: "#F8FAFC",
            color: "#1F2937",
          }}
          suppressHydrationWarning
        >
          {/* CAPTCHA container for Clerk - hidden in dev, visible in prod */}
          <div id="clerk-captcha" style={isDevelopment() ? { display: 'none' } : undefined} aria-hidden={isDevelopment()} />
          <ToastProvider>
            {children}
          </ToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
