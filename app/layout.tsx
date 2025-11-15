import type { Metadata } from "next";
import { Spline_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const splineSans = Spline_Sans({
  variable: "--font-spline-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
          // Completely hide CAPTCHA in development to avoid protocol mismatch errors
          formFieldInput__captcha: "hidden",
          captcha: "hidden",
        },
      }}
    >
      <html lang="en" className="light">
        <body
          className={`${splineSans.variable} antialiased min-h-screen`}
          style={{
            fontFamily: '"Spline Sans", "Noto Sans", sans-serif',
            backgroundColor: "#F8FAFC",
            color: "#1F2937",
          }}
          suppressHydrationWarning={true}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
