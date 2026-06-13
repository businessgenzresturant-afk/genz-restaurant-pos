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
  title: "Gen-Z Restaurant POS",
  description: "Modern POS system for Gen-Z Restaurant",
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
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}