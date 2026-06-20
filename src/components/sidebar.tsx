'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  MenuSquare, 
  ClipboardList, 
  ChefHat, 
  Receipt, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/tables', label: 'Tables', icon: <UtensilsCrossed size={20} /> },
    { href: '/menu', label: 'Menu', icon: <MenuSquare size={20} /> },
    { href: '/orders', label: 'Orders', icon: <ClipboardList size={20} /> },
    { href: '/kot', label: 'KOT', icon: <ChefHat size={20} /> },
    { href: '/bills', label: 'Bills', icon: <Receipt size={20} /> },
    { href: '/reports', label: 'Reports', icon: <BarChart3 size={20} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="w-72 h-screen flex-shrink-0 bg-background/80 backdrop-blur-2xl border-r border-border shadow-sm flex flex-col z-20 sticky top-0">
      <div className="p-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-lg shadow-primary/5 flex-shrink-0">
            <Image src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div>
            <h1 className="font-black text-xl text-foreground leading-tight tracking-tight">Gen-Z POS</h1>
            <p className="text-xs font-bold text-primary uppercase tracking-widest">Premium</p>
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
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group relative overflow-hidden will-change-transform ${
                isActive
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:scale-[1.01]'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-white/20 blur-md translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out dark:bg-black/20" />
              )}
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <span className="ml-auto w-2 h-2 bg-primary-foreground rounded-full animate-pulse-glow shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-border/50 bg-muted/30 mt-auto">
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Powered by</p>
            <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">Gen-Z™</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-black text-muted-foreground">
              v1
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

Sidebar.displayName = 'Sidebar';