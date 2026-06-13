'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  
  // Restaurant settings
  const [restaurantName, setRestaurantName] = useState('GenZ Restaurant');
  const [restaurantAddress, setRestaurantAddress] = useState('L-97, Gali No 7, Near Labour Chowk, Mahipalpur, 110037');
  const [gstNumber, setGstNumber] = useState('07AABCG1234A1Z5');
  const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
  
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

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate save - In real app, this would call API
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully! ✅');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
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

      {/* User Info */}
      <Card className="p-6 border-border/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">User Information</h2>
            <p className="text-sm text-muted-foreground">Current logged in user details</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-muted-foreground">Name:</span>
            <span className="text-sm font-bold text-foreground">Admin User</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-muted-foreground">Email:</span>
            <span className="text-sm font-bold text-foreground">admin@genz.com</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-muted-foreground">Role:</span>
            <span className="text-sm font-bold text-primary">ADMIN</span>
          </div>
        </div>
      </Card>

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
