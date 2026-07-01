'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { 
  Settings, 
  LogOut,
  ChevronDown,
  Utensils,
  Store,
  Users,
  Receipt as ReceiptIcon,
  LayoutGrid,
  Menu,
  Plus,
  Search,
  ToggleLeft,
  ClipboardList,
  Clock,
  Lock
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Portal } from '@/components/ui/portal';
import ManageTablesModal from '@/components/modals/ManageTablesModal';
import ManageMenuModal from '@/components/modals/ManageMenuModal';
import RestaurantSettingsModal from '@/components/modals/RestaurantSettingsModal';
import ManageStaffModal from '@/components/modals/ManageStaffModal';
import TaxPricingModal from '@/components/modals/TaxPricingModal';
import { useRouter } from 'next/navigation';

const ActionButton = ({ icon, label, badge, onClick }: { icon: React.ReactNode, label: string, badge?: string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center w-[60px] h-[52px] rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative gap-1 flex-shrink-0"
  >
    <div className="w-5 h-5">{icon}</div>
    <span className="text-[9px] font-bold leading-none text-center whitespace-nowrap">{label}</span>
    {badge && (
      <span className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
        {badge}
      </span>
    )}
  </button>
);

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  
  // Search states
  const [billSearch, setBillSearch] = useState('');
  const [kotSearch, setKotSearch] = useState('');
  
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
  const isAdmin = userRole === 'ADMIN' || userEmail === 'business.genzresturant@gmail.com';

  const handleRestrictedAction = (action: () => void) => {
    if (!isAdmin) {
      toast.error("Can't access, only admin access", {
        icon: <Lock className="w-4 h-4 text-red-500" />
      });
      setDropdownOpen(false);
      return;
    }
    action();
  };

  const handleBillSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && billSearch.trim()) {
      router.push(`/orders?search=${encodeURIComponent(billSearch.trim())}`);
    }
  };

  const handleKotSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && kotSearch.trim()) {
      router.push(`/orders?search=${encodeURIComponent(kotSearch.trim())}`);
    }
  };

  return (
    <header className="w-full bg-background/95 backdrop-blur-md border-b border-border/50 h-[72px] flex-shrink-0 flex flex-col justify-center z-30 sticky top-0 shadow-sm">
      <div className="w-full max-w-[1920px] mx-auto px-2 flex items-center justify-between">
        
        {/* Left Side: Brand & Quick Search */}
        <div className="flex items-center gap-2 flex-shrink-0 mr-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-md shadow-primary/5 flex-shrink-0">
              <Image src="/images/Gen-z-logo.jpg" alt="Gen-Z Logo" width={36} height={36} className="object-cover w-full h-full" />
            </div>
          </Link>

          <Link href="/dashboard" className="bg-red-500/90 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm shadow-red-500/20 mr-2">
            <Plus className="w-4 h-4" /> New Order
          </Link>
          
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Bill No" 
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              onKeyDown={handleBillSearch}
              className="pl-9 pr-3 py-2 h-10 bg-muted/40 border border-border/60 hover:border-border rounded-xl text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-muted-foreground/70" 
            />
          </div>
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="KOT No" 
              value={kotSearch}
              onChange={(e) => setKotSearch(e.target.value)}
              onKeyDown={handleKotSearch}
              className="pl-9 pr-3 py-2 h-10 bg-muted/40 border border-border/60 hover:border-border rounded-xl text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-muted-foreground/70" 
            />
          </div>
        </div>

        {/* Right Side: Action Icons & Profile */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {isAdmin && <ActionButton icon={<ToggleLeft className="w-5 h-5" />} label="Menu Item" onClick={() => setShowMenuModal(true)} />}
          <Link href="/orders">
            <ActionButton icon={<ClipboardList className="w-5 h-5" />} label="Orders" />
          </Link>
          <ActionButton icon={<Clock className="w-5 h-5" />} label="Recent" onClick={() => router.push('/orders')} />
          
          <div className="w-px h-8 bg-border/60 mx-2 hidden xl:block" />
          
          <ThemeToggle />
          
          {/* Profile Dropdown Toggle */}
          <div className="relative ml-2">
            <button 
              onClick={() => setDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-label="User menu"
              className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-border/60 bg-card hover:bg-muted/80 text-foreground transition-all duration-200 shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs overflow-hidden">
                {(session?.user as any)?.image ? (
                  <img src={(session?.user as any).image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
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
                  
                  {/* Management Options */}
                  <button 
                    onClick={() => handleRestrictedAction(() => {
                      setDropdownOpen(false);
                      setShowTablesModal(true);
                    })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left ${isAdmin ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/60 hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <LayoutGrid className="w-4 h-4" />
                      Manage Tables
                    </div>
                    {!isAdmin && <Lock className="w-3.5 h-3.5" />}
                  </button>
                  
                  <button 
                    onClick={() => handleRestrictedAction(() => {
                      setDropdownOpen(false);
                      setShowMenuModal(true);
                    })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left ${isAdmin ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/60 hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Utensils className="w-4 h-4" />
                      Manage Menu
                    </div>
                    {!isAdmin && <Lock className="w-3.5 h-3.5" />}
                  </button>
                  
                  <button 
                    onClick={() => handleRestrictedAction(() => {
                      setDropdownOpen(false);
                      setShowRestaurantSettingsModal(true);
                    })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left ${isAdmin ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/60 hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Store className="w-4 h-4" />
                      Restaurant Settings
                    </div>
                    {!isAdmin && <Lock className="w-3.5 h-3.5" />}
                  </button>
                  
                  <button 
                    onClick={() => handleRestrictedAction(() => {
                      setDropdownOpen(false);
                      setShowStaffModal(true);
                    })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left ${isAdmin ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/60 hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4" />
                      Manage Staff
                    </div>
                    {!isAdmin && <Lock className="w-3.5 h-3.5" />}
                  </button>

                  <button 
                    onClick={() => handleRestrictedAction(() => {
                      setDropdownOpen(false);
                      router.push('/customers');
                    })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left ${isAdmin ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/60 hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4" />
                      Customers
                    </div>
                    {!isAdmin && <Lock className="w-3.5 h-3.5" />}
                  </button>
                  
                  <button 
                    onClick={() => handleRestrictedAction(() => {
                      setDropdownOpen(false);
                      setShowTaxPricingModal(true);
                    })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left ${isAdmin ? 'hover:bg-muted text-foreground' : 'text-muted-foreground/60 hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ReceiptIcon className="w-4 h-4" />
                      Tax & Pricing
                    </div>
                    {!isAdmin && <Lock className="w-3.5 h-3.5" />}
                  </button>
                  
                  {isAdmin ? (
                    <Link 
                      href="/settings" 
                      onClick={() => setDropdownOpen(false)} 
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left ${
                        pathname === '/settings' ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      System Settings
                    </Link>
                  ) : (
                    <button 
                      onClick={() => handleRestrictedAction(() => {})}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors w-full text-left text-muted-foreground/60 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4" />
                        System Settings
                      </div>
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
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
        </div>
      </div>

      <Portal>
        <ManageTablesModal isOpen={showTablesModal} onClose={() => setShowTablesModal(false)} />
        <ManageMenuModal isOpen={showMenuModal} onClose={() => setShowMenuModal(false)} />
        <RestaurantSettingsModal isOpen={showRestaurantSettingsModal} onClose={() => setShowRestaurantSettingsModal(false)} />
        <ManageStaffModal isOpen={showStaffModal} onClose={() => setShowStaffModal(false)} />
        <TaxPricingModal isOpen={showTaxPricingModal} onClose={() => setShowTaxPricingModal(false)} />
      </Portal>
    </header>
  );
}
