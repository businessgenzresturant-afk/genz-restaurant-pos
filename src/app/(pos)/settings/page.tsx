'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [kdsToken, setKdsToken] = useState<string | null>(null);
  const [showKdsToken, setShowKdsToken] = useState(false);
  const [regeneratingToken, setRegeneratingToken] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [savingCustomToken, setSavingCustomToken] = useState(false);
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false);
  
  // Restaurant settings
  const [restaurantName, setRestaurantName] = useState('Gen-Z Restaurant');
  const [restaurantAddress, setRestaurantAddress] = useState('Gali No 7, L-97, near Labour Chowk, K-Block, Mahipalpur Village, New Delhi - 110037');
  const [gstNumber, setGstNumber] = useState('07AABCG1234A1Z5');
  const [phoneNumber, setPhoneNumber] = useState('+91 8800480778');
  
  // System settings
  const [taxRate, setTaxRate] = useState('18');
  const [currency, setCurrency] = useState('INR');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  
  // Delivery settings
  const [enableDelivery, setEnableDelivery] = useState(true);
  const [minOrderAmount, setMinOrderAmount] = useState('300');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  
  // Print settings
  const [showLogo, setShowLogo] = useState(true);
  const [showGST, setShowGST] = useState(true);
  const [printKOTAuto, setPrintKOTAuto] = useState(false);

  // User Profile settings
  const [userName, setUserName] = useState('');
  const [userImage, setUserImage] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Set user profile state when session loads
  useEffect(() => {
    if (session?.user) {
      setUserName(session.user.name || '');
      setUserImage((session.user as any).image || '');
    }
  }, [session]);

  // Fetch restaurant settings and KDS token on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const [settingsRes, kdsRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/settings/kds-token'),
        ]);

        if (settingsRes.ok) {
          const s = await settingsRes.json();
          if (s.name) setRestaurantName(s.name);
          if (s.address) setRestaurantAddress(s.address);
          if (s.phone) setPhoneNumber(s.phone);
          if (s.gstNumber) setGstNumber(s.gstNumber);
          if (s.taxRate !== undefined) setTaxRate(String(s.taxRate));
          if (s.currency) setCurrency(s.currency);
          if (s.timeZone) setTimeZone(s.timeZone);
          if (s.minOrderAmount !== undefined) setMinOrderAmount(String(s.minOrderAmount));
          if (s.deliveryCharge !== undefined) setDeliveryCharge(String(s.deliveryCharge));
          if (s.enableDelivery !== undefined) setEnableDelivery(s.enableDelivery);
        }

        if (kdsRes.ok) {
          const data = await kdsRes.json();
          setKdsToken(data.token);
        } else {
          console.error('Failed to load KDS token');
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      }
    }

    // Only fetch if user is ADMIN
    if (session?.user && (session.user as any).role === 'ADMIN') {
      fetchSettings();
    }
  }, [session]);

  const handleCopyKDSURL = () => {
    if (!kdsToken) return;
    const url = `https://pos.gen-z.online/kds-display/${kdsToken}`;
    navigator.clipboard.writeText(url);
    toast.success('KDS Display URL copied to clipboard! 📋');
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Regenerating the token will invalidate the old TV display URL. Continue?')) {
      return;
    }

    setRegeneratingToken(true);
    try {
      const response = await fetch('/api/settings/kds-token/regenerate', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setKdsToken(data.token);
        toast.success('KDS Display Token regenerated successfully! 🔄');
      } else {
        toast.error('Failed to regenerate token');
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      toast.error('Failed to regenerate token');
    } finally {
      setRegeneratingToken(false);
    }
  };

  const handleSaveCustomToken = async () => {
    if (!customToken.trim()) {
      toast.error('Please enter a custom token');
      return;
    }

    // Validate token format
    if (!/^[a-zA-Z0-9_-]{6,64}$/.test(customToken)) {
      toast.error('Token must be 6-64 characters (letters, numbers, _, - only)');
      return;
    }

    if (!confirm(`Set custom token to "${customToken}"? This will change your TV display URL.`)) {
      return;
    }

    setSavingCustomToken(true);
    try {
      const response = await fetch('/api/settings/kds-token', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        setKdsToken(data.token);
        setCustomToken('');
        setShowCustomTokenInput(false);
        toast.success(`✅ Custom token "${customToken}" set successfully! This token is now permanent.`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to set custom token');
      }
    } catch (error) {
      console.error('Failed to set custom token:', error);
      toast.error('Failed to set custom token');
    } finally {
      setSavingCustomToken(false);
    }
  };

  const maskedToken = kdsToken ? `${kdsToken.substring(0, 12)}...${kdsToken.substring(kdsToken.length - 12)}` : 'Loading...';
  const kdsURL = kdsToken ? `https://pos.gen-z.online/kds-display/${kdsToken}` : '';
  const isAdmin = session?.user ? (session.user as any).role === 'ADMIN' : false;

  // ADMIN-ONLY ROUTE GUARD: redirect non-admins back to dashboard
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated' && (session?.user as any)?.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [status, session, router]);

  // Show loading state while session is being fetched or during SSR
  if (typeof window === 'undefined' || status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-xl font-bold">Loading...</p>
      </div>
    );
  }

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: restaurantName,
          address: restaurantAddress,
          phone: phoneNumber,
          gstNumber,
          taxRate,
          currency,
          timeZone,
          enableDelivery,
          minOrderAmount,
          deliveryCharge,
        }),
      });
      if (response.ok) {
        toast.success('Settings saved successfully! ✅');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          image: userImage
        }),
      });
      if (response.ok) {
        toast.success('Profile updated successfully! ✅');
        await update({
          user: {
            ...session?.user,
            name: userName,
            image: userImage
          }
        });
      } else {
        const err = await response.json();
        toast.error(err.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleResetSettings = () => {
    setRestaurantName('GenZ Restaurant');
    setRestaurantAddress('L-97, Gali No 7, Near Labour Chowk, Mahipalpur, 110037');
    setGstNumber('07AABCG1234A1Z5');
    setPhoneNumber('+91 98765 43210');
    setTaxRate('18');
    setCurrency('INR');
    setTimeZone('Asia/Kolkata');
    setMinOrderAmount('300');
    setDeliveryCharge('0');
    toast.info('Settings reset to defaults');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-3xl font-black text-foreground">⚙️ Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your restaurant and system preferences</p>
      </div>

      {/* Restaurant Information */}
      <Card className="p-6 border-border/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            🏪
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Restaurant Information</h2>
            <p className="text-sm text-muted-foreground">Basic details about your restaurant</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Restaurant Name</label>
            <Input
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Enter restaurant name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Phone Number</label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-foreground mb-2">Address</label>
            <Input
              value={restaurantAddress}
              onChange={(e) => setRestaurantAddress(e.target.value)}
              placeholder="Enter full address"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">GST Number</label>
            <Input
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              placeholder="07AABCG1234A1Z5"
            />
          </div>
        </div>
      </Card>

      {/* Tax & Currency Settings */}
      <Card className="p-6 border-border/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            💰
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Tax & Currency</h2>
            <p className="text-sm text-muted-foreground">Configure billing and pricing settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Tax Rate (%)</label>
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="18"
            />
            <p className="text-xs text-muted-foreground mt-1">GST rate applied to bills</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Time Zone</label>
            <select
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="Asia/Kolkata">India (IST)</option>
              <option value="America/New_York">New York (EST)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Delivery Settings */}
      <Card className="p-6 border-border/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            🛵
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Delivery Settings</h2>
            <p className="text-sm text-muted-foreground">Configure home delivery options</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enableDelivery"
              checked={enableDelivery}
              onChange={(e) => setEnableDelivery(e.target.checked)}
              className="h-5 w-5 text-primary rounded border-input bg-background focus:ring-primary"
            />
            <label htmlFor="enableDelivery" className="text-sm font-medium text-foreground">
              Enable Delivery
            </label>
          </div>
        </div>

        {enableDelivery && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Minimum Order Amount (₹)</label>
              <Input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="300"
              />
              <p className="text-xs text-muted-foreground mt-1">Free delivery above this amount</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Delivery Charge (₹)</label>
              <Input
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">Fixed delivery charge</p>
            </div>
          </div>
        )}
      </Card>

      {/* Print Settings */}
      <Card className="p-6 border-border/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            🖨️
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Print Settings</h2>
            <p className="text-sm text-muted-foreground">Configure receipt and KOT printing</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            <input
              type="checkbox"
              id="showLogo"
              checked={showLogo}
              onChange={(e) => setShowLogo(e.target.checked)}
              className="h-5 w-5 text-primary rounded border-input bg-background focus:ring-primary"
            />
            <label htmlFor="showLogo" className="text-sm font-medium text-foreground">
              Show restaurant logo on bills
            </label>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            <input
              type="checkbox"
              id="showGST"
              checked={showGST}
              onChange={(e) => setShowGST(e.target.checked)}
              className="h-5 w-5 text-primary rounded border-input bg-background focus:ring-primary"
            />
            <label htmlFor="showGST" className="text-sm font-medium text-foreground">
              Show GST number on bills
            </label>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
            <input
              type="checkbox"
              id="printKOTAuto"
              checked={printKOTAuto}
              onChange={(e) => setPrintKOTAuto(e.target.checked)}
              className="h-5 w-5 text-primary rounded border-input bg-background focus:ring-primary"
            />
            <label htmlFor="printKOTAuto" className="text-sm font-medium text-foreground">
              Auto-print KOT when order placed
            </label>
          </div>
        </div>
      </Card>

      {/* KDS Display Link - ADMIN ONLY */}
      {isAdmin && (
        <Card className="p-6 border-border/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
              📺
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Kitchen Display Link</h2>
              <p className="text-sm text-muted-foreground">Permanent URL for TV displays (no login required)</p>
            </div>
          </div>

          <div className="space-y-4">
            {!kdsToken ? (
              <div className="bg-muted/50 rounded-lg p-6 border border-border text-center">
                <p className="text-muted-foreground mb-4">🔐 Loading KDS Display Token...</p>
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <label className="block text-sm font-semibold text-foreground mb-2">Current Display URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={showKdsToken ? kdsURL : `https://pos.gen-z.online/kds-display/${maskedToken}`}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      onClick={() => setShowKdsToken(!showKdsToken)}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      title={showKdsToken ? 'Hide token' : 'Show token'}
                    >
                      {showKdsToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={handleCopyKDSURL}
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={!kdsToken}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    📱 Open this URL on your kitchen TV - it will work permanently without regenerating
                  </p>
                </div>

                {/* Custom Token Input */}
                {showCustomTokenInput ? (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-400">🎯 Set Custom Token</p>
                      <Button
                        onClick={() => {
                          setShowCustomTokenInput(false);
                          setCustomToken('');
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                    <Input
                      value={customToken}
                      onChange={(e) => setCustomToken(e.target.value)}
                      placeholder="e.g., mykds2024 or kitchen123"
                      className="font-mono"
                      maxLength={64}
                    />
                    <p className="text-xs text-blue-300/90">
                      • 6-64 characters • Letters, numbers, _, - only • Easy to remember
                    </p>
                    <p className="text-xs text-blue-300/70">
                      Example: https://pos.gen-z.online/kds-display/<span className="font-bold">{customToken || 'yourtoken'}</span>
                    </p>
                    <Button
                      onClick={handleSaveCustomToken}
                      disabled={savingCustomToken || !customToken.trim()}
                      className="w-full"
                    >
                      {savingCustomToken ? 'Saving...' : 'Set Custom Token'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowCustomTokenInput(true)}
                    variant="outline"
                    className="w-full"
                  >
                    🎯 Set Custom Token (Easy to Remember)
                  </Button>
                )}

                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-400 mb-2">✅ Permanent Token</p>
                  <ul className="text-xs text-green-300/90 space-y-1 list-disc list-inside">
                    <li>This token is <strong>permanent</strong> - won&apos;t change automatically</li>
                    <li>Set it once, use forever on your TV</li>
                    <li>You can set a custom easy-to-remember token</li>
                    <li>Change it only when you want to</li>
                  </ul>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-400 mb-2">🔒 Security Notice</p>
                  <ul className="text-xs text-amber-300/90 space-y-1 list-disc list-inside">
                    <li>This URL provides READ-ONLY access to kitchen orders</li>
                    <li>Keep this URL secure - anyone with it can view your orders</li>
                    <li>Regenerate token only if you suspect unauthorized access</li>
                    <li>The TV display automatically reconnects if network drops</li>
                  </ul>
                </div>

                <Button
                  onClick={handleRegenerateToken}
                  variant="outline"
                  disabled={regeneratingToken || !kdsToken}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${regeneratingToken ? 'animate-spin' : ''}`} />
                  {regeneratingToken ? 'Regenerating...' : 'Regenerate Random Token (Emergency Only)'}
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* User Info / Profile Settings */}
      <Card className="p-6 border-border/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Personal Profile</h2>
            <p className="text-sm text-muted-foreground">Manage your personal account settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Email (Read-only)</label>
            <Input
              value={session?.user?.email || ''}
              disabled
              className="opacity-70 bg-muted/50"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Role</label>
            <Input
              value={(session?.user as any)?.role || ''}
              disabled
              className="opacity-70 bg-muted/50 text-primary font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Full Name</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Profile Image URL</label>
            <Input
              value={userImage}
              onChange={(e) => setUserImage(e.target.value)}
              placeholder="https://example.com/my-photo.jpg"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleUpdateProfile}
            variant="default"
            disabled={updatingProfile}
          >
            {updatingProfile ? 'Updating...' : 'Save Profile'}
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      {session?.user && (session.user as any).role === 'ADMIN' && (
        <Card className="p-6 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">Irreversible actions for database management</p>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-border">
              <div>
                <h3 className="font-semibold text-foreground">Wipe All Test Data</h3>
                <p className="text-sm text-muted-foreground">Deletes all orders, bills, and resets tables. Menu items are preserved.</p>
              </div>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (confirm('Are you ABSOLUTELY sure? This will delete all orders and bills permanently.')) {
                    try {
                      const res = await fetch('/api/admin/production-cleanup', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok) {
                        toast.success('Database cleaned successfully!');
                        setTimeout(() => window.location.reload(), 2000);
                      } else {
                        toast.error(data.error || 'Failed to clean database');
                      }
                    } catch (e) {
                      toast.error('Network error occurred');
                    }
                  }
                }}
              >
                Reset Database
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          onClick={handleResetSettings}
          variant="outline"
          className="flex-1"
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSaveSettings}
          variant="gradient"
          className="flex-1"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

SettingsPage.displayName = 'SettingsPage';
