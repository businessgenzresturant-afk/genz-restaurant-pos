import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ReactLenis from 'lenis/react';
import { GrainOverlay } from '@/app/_components/scroll/grain-overlay';
import { CustomCursor } from '@/app/_components/scroll/custom-cursor';

const inter = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gen-Z Restaurant POS",
  description: "Modern POS system for Gen-Z Restaurant",
};

import Sidebar from '@/components/sidebar';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex bg-gray-50 font-sans">
        <ReactLenis
          root
          options={{
            duration: 1.2,
            orientation: 'vertical' as const,
            gestureOrientation: 'vertical' as const,
            smoothWheel: true,
          }}
        >
          <GrainOverlay />
          <CustomCursor />
          <main className="flex-1 flex flex-col overflow-y-auto p-6">
            {children}
          </main>
          <Toaster richColors position="top-right" />
        </ReactLenis>
      </body>
    </html>
  );
}