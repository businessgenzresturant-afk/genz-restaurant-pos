import type { Metadata } from "next";
import Sidebar from '@/components/sidebar';

export const metadata: Metadata = {
  title: "Gen-Z Restaurant POS",
  description: "Restaurant Point of Sale System",
};

export default function POSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      {/* We use h-screen on the wrapper and overflow-y-auto on the main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Optional Top Header can go here if needed, keeping it clean for now */}
        <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-14 flex-shrink-0 flex items-center px-6">
          <div className="text-sm font-semibold text-slate-500">Workspace</div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full w-full pb-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}