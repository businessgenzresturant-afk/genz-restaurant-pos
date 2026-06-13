'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '🏠' },
    { href: '/tables', label: 'Tables', icon: '🪑' },
    { href: '/menu', label: 'Menu', icon: '🍽️' },
    { href: '/orders', label: 'Orders', icon: '📋' },
    { href: '/kot', label: 'KOT', icon: '👨‍🍳' },
    { href: '/bills', label: 'Bills', icon: '🧾' },
    { href: '/reports', label: 'Reports', icon: '📊' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className="w-72 h-screen flex-shrink-0 bg-white/70 backdrop-blur-2xl border-r border-white/40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] flex flex-col z-20 sticky top-0">
      <div className="p-6 border-b border-gray-200/50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white font-black text-xl">Z</span>
          </div>
          <div>
            <h1 className="font-black text-xl text-gray-900 leading-tight tracking-tight">Gen-Z POS</h1>
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest">Premium</p>
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-xl shadow-violet-500/25 scale-[1.02]'
                  : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 hover:scale-[1.01]'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/20 blur-md translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
              )}
              <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-gray-200/50 bg-gray-50/50 mt-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Powered by</p>
            <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-600">RagsPro™</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
            v1
          </div>
        </div>
      </div>
    </aside>
  );
}

Sidebar.displayName = 'Sidebar';