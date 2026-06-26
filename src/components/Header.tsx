'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  Settings, 
  LogOut,
  ChevronDown,
  Utensils,
  Store,
  Users,
  Receipt as ReceiptIcon,
  LayoutGrid
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Portal } from '@/components/ui/portal';
import ManageTablesModal from '@/components/modals/ManageTablesModal';
import ManageMenuModal from '@/components/modals/ManageMenuModal';
import RestaurantSettingsModal from '@/components/modals/RestaurantSettingsModal';
import ManageStaffModal from '@/components/modals/ManageStaffModal';
import TaxPricingModal from '@/components/modals/TaxPricingModal';

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  
  // Modal states
  const [showTablesModal, setShowTablesModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showRestaurantSettingsModal, setShowRestaurantSettingsModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showTaxPricingModal, setShowTaxPricingModal] = useState(false);

  // Get user details from session
  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || 'user@example.com';
  const userRole = (session?.user as any)?.role || 'STAFF';
  const userInitial = userName.charAt(0).toUpperCase();
  const isAdmin = userRole === 'ADMIN';

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
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-md shadow-primary/5 flex-shrink-0">
            <Image src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" width={36} height={36} className="object-cover w-full h-full" />
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
          aria-expanded={isDropdownOpen}
          aria-label="User menu"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border/60 bg-card hover:bg-muted/80 text-foreground transition-all duration-200 shadow-sm"
        >
          <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            {userInitial}
          </div>
          <span className="text-xs font-bold text-foreground">{userName}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
            <div className="absolute right-0 top-full mt-2 w-56 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl p-2 z-50 flex flex-col gap-1 animate-scale-in origin-top-right">
              <div className="px-3 py-2.5 border-b border-border/50 mb-1">
                <p className="text-xs font-black text-foreground">{userName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                <p className="text-[9px] font-bold text-primary uppercase tracking-wider mt-0.5">{userRole}</p>
              </div>
              
              {/* Management Options - ADMIN ONLY */}
              {isAdmin && (
                <>
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowTablesModal(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-muted text-foreground"
                  >
                    <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                    Manage Tables
                  </button>
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowMenuModal(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-muted text-foreground"
                  >
                    <Utensils className="w-4 h-4 text-muted-foreground" />
                    Manage Menu
                  </button>
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowRestaurantSettingsModal(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-muted text-foreground"
                  >
                    <Store className="w-4 h-4 text-muted-foreground" />
                    Restaurant Settings
                  </button>
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowStaffModal(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-muted text-foreground"
                  >
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Manage Staff
                  </button>
                  
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowTaxPricingModal(true);
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-muted text-foreground"
                  >
                    <ReceiptIcon className="w-4 h-4 text-muted-foreground" />
                    Tax & Pricing
                  </button>
                  
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
                </>
              )}
              
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

      {/* Modals — rendered via Portal to escape header stacking context */}
      <Portal>
        <ManageTablesModal 
          isOpen={showTablesModal} 
          onClose={() => setShowTablesModal(false)} 
        />
        <ManageMenuModal 
          isOpen={showMenuModal} 
          onClose={() => setShowMenuModal(false)} 
        />
        <RestaurantSettingsModal 
          isOpen={showRestaurantSettingsModal} 
          onClose={() => setShowRestaurantSettingsModal(false)} 
        />
        <ManageStaffModal 
          isOpen={showStaffModal} 
          onClose={() => setShowStaffModal(false)} 
        />
        <TaxPricingModal 
          isOpen={showTaxPricingModal} 
          onClose={() => setShowTaxPricingModal(false)} 
        />
      </Portal>

    </header>
  );
}
