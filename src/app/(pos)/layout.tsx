import type { Metadata } from "next";
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: "Gen-Z POS",
  description: "Restaurant Point of Sale System",
};

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth custom-scrollbar">
        <div className="max-w-7xl mx-auto min-h-full w-full pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}