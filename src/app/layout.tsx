import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { GrainOverlay } from '@/app/_components/scroll/grain-overlay';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Gen-Z Restaurant POS",
    template: "%s | Gen-Z POS"
  },
  description: "Modern Point of Sale system for Gen-Z Restaurant - Manage orders, billing, kitchen display, and customer loyalty with ease.",
  keywords: ["restaurant", "POS", "point of sale", "Gen-Z", "food ordering", "kitchen display", "billing system"],
  authors: [{ name: "Gen-Z Restaurant" }],
  creator: "Gen-Z Restaurant",
  publisher: "Gen-Z Restaurant",
  metadataBase: new URL('https://pos.gen-z.online'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Gen-Z Restaurant POS",
    description: "Modern Point of Sale system for efficient restaurant management",
    url: "https://pos.gen-z.online",
    siteName: "Gen-Z POS",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gen-Z Restaurant POS",
    description: "Modern Point of Sale system for efficient restaurant management",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GrainOverlay />
          <main className="flex-1 flex flex-col p-0 m-0 w-full">
            {children}
          </main>
          <Toaster 
            richColors 
            position="top-center" 
            expand={true}
            duration={2000}
            toastOptions={{
              style: {
                fontSize: '16px',
                fontWeight: '600',
                padding: '16px 20px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}