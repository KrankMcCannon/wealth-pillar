import type { Metadata } from "next";
import { Spline_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { QueryClientProvider } from '@/components/providers/query-client-provider';

const splineSans = Spline_Sans({
  variable: "--font-spline-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Wealth Pillar - Gestione Finanziaria Intelligente",
  description: "Piattaforma completa per la gestione delle finanze personali e familiari",
};

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
          formFieldInput__captcha: 'hidden',
          captcha: 'hidden',
        },
      }}
    >
      <html lang="en" className="light">
        <body
          className={`${splineSans.variable} antialiased min-h-screen`}
          style={{
            fontFamily: '"Spline Sans", "Noto Sans", sans-serif',
            backgroundColor: '#F8FAFC',
            color: '#1F2937'
          }}
          suppressHydrationWarning={true}
        >
          <QueryClientProvider>
            {children}
          </QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
