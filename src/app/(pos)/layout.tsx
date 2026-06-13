import type { Metadata } from "next";
import { IconMarquee } from '@/app/_components/scroll/icon-marquee';
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
  const restaurantIcons = [
    '🍽️', '🍴', '🥘', '🍲', '🍕', '🍔', '🌮', '🌯', '🥗', '🍰',
    '☕', '🍵', '🍶', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃',
    '🥤', '🧃', '🧋', '🧉', '🧊', '🍞', '🥐', '🥖', '🥨', '🥯',
    '🥞', '🧇', '🥚', '🍳', '🥓', '🥩', '🍗', '🍖', '🦞', '🦐'
  ];

  return (
    <div className="flex h-full w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden bg-gray-50/50">
        <div className="w-full bg-white/40 backdrop-blur-md border-b border-gray-200/50">
          <IconMarquee items={restaurantIcons} speed={40} reverse={false} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}