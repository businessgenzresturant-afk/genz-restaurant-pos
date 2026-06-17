'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  ChefHat, 
  Receipt, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Header() {
  const pathname = usePathname();
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/kds':
        return 'Kitchen Display System (KDS)';
      case '/kot':
        return 'KOT Status';
      case '/bills':
        return 'Bills & Invoices';
      case '/orders':
        return 'Order History';
      case '/reports':
        return 'Reports & Analytics';
      case '/settings':
        return 'System Settings';
      case '/tables':
        return 'Tables Layout';
      case '/menu':
        return 'Menu Catalog';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="w-full bg-background/80 backdrop-blur-md border-b border-border/50 h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 z-30 sticky top-0">
      
      {/* Left side: Logo & Brand */}
      <div className="flex items-center gap-3 sm:gap-6">
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
            <span className="text-primary-foreground font-black text-md">Z</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="font-black text-md text-foreground leading-tight tracking-tight">Gen-Z POS</h1>
            <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none">Premium</p>
          </div>
        </Link>
        
        <div className="h-5 w-[1px] bg-border/80 hidden sm:block" />
        
        {/* Page Title */}
        <div className="text-sm font-bold text-foreground tracking-wide truncate max-w-[120px] xs:max-w-none">
          {getPageTitle()}
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-4 relative">
        <ThemeToggle />
        
        {/* Profile Dropdown Toggle */}
        <button 
          onClick={() => setDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted/80 text-foreground transition-all duration-200 shadow-sm"
        >
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            A
          </div>
          <span className="text-xs font-bold text-foreground">Admin</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>

        {/* Dropdown Popover */}
        {isDropdownOpen && (
          <>
            {/* Backdrop overlay to close when clicking outside */}
            <div 
              className="fixed inset-0 z-40 bg-transparent cursor-default" 
              onClick={() => setDropdownOpen(false)} 
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-11 w-60 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-2 z-50 flex flex-col gap-1 animate-scale-in">
              <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                <p className="text-xs font-black text-foreground">Admin User</p>
                <p className="text-[10px] text-muted-foreground truncate">admin@genz.com</p>
              </div>
              
              <Link 
                href="/dashboard" 
                onClick={() => setDropdownOpen(false)} 
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname === '/dashboard' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                Dashboard
              </Link>
              
              <Link 
                href="/kds" 
                onClick={() => setDropdownOpen(false)} 
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname === '/kds' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <ChefHat className="w-4 h-4 text-muted-foreground" />
                Kitchen Display (KDS)
              </Link>
              
              <Link 
                href="/bills" 
                onClick={() => setDropdownOpen(false)} 
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname === '/bills' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <Receipt className="w-4 h-4 text-muted-foreground" />
                Bills & Receipts
              </Link>
              
              <Link 
                href="/orders" 
                onClick={() => setDropdownOpen(false)} 
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname === '/orders' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
                Order History
              </Link>
              
              <Link 
                href="/reports" 
                onClick={() => setDropdownOpen(false)} 
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname === '/reports' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Reports & Analytics
              </Link>
              
              <Link 
                href="/settings" 
                onClick={() => setDropdownOpen(false)} 
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                  pathname === '/settings' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                }`}
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                System Settings
              </Link>
              
              <div className="border-t border-border/50 my-1" />
              
              <button 
                onClick={() => {
                  setDropdownOpen(false);
                  signOut({ callbackUrl: '/login' });
                }}
                className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-black text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>

    </header>
  );
}
