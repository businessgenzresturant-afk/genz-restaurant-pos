'use client';

import { useState, useEffect } from 'react';
import { X, Save, Percent } from 'lucide-react';

interface TaxPricingSettings {
  cgst: number;
  sgst: number;
  serviceCharge: number;
  maxDiscountPercent: number;
  packagingCharges: number;
}

interface TaxPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaxPricingModal({ isOpen, onClose }: TaxPricingModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TaxPricingSettings>({
    cgst: 2.5,
    sgst: 2.5,
    serviceCharge: 10,
    maxDiscountPercent: 20,
    packagingCharges: 20,
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/tax-pricing');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch tax & pricing settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/tax-pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('Tax & Pricing settings saved successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Failed to save tax & pricing settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalGST = settings.cgst + settings.sgst;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-background border-2 border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Percent className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Tax & Pricing Settings</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Configure tax rates and pricing rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 hover:rotate-90"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background to-muted/20 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Tax Settings */}
              <div>
                <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  GST Configuration
                </h3>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">
                        CGST (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.cgst}
                        onChange={(e) => setSettings({ ...settings, cgst: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">
                        SGST (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={settings.sgst}
                        onChange={(e) => setSettings({ ...settings, sgst: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <p className="text-xs text-foreground">
                      <strong>Total GST:</strong> {totalGST.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Service Charge */}
              <div>
                <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  Service Charges
                </h3>
                <div className="bg-muted/50 rounded-xl p-4">
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Service Charge (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.serviceCharge}
                    onChange={(e) => setSettings({ ...settings, serviceCharge: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Service charge applied on subtotal before taxes
                  </p>
                </div>
              </div>

              {/* Discount Settings */}
              <div>
                <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  Discount Settings
                </h3>
                <div className="bg-muted/50 rounded-xl p-4">
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Maximum Discount (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={settings.maxDiscountPercent}
                    onChange={(e) => setSettings({ ...settings, maxDiscountPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum discount percentage that can be applied on bills
                  </p>
                </div>
              </div>

              {/* Additional Charges */}
              <div>
                <h3 className="text-sm font-black text-foreground mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  Additional Charges
                </h3>
                <div className="bg-muted/50 rounded-xl p-4">
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Packaging Charges (₹)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={settings.packagingCharges}
                    onChange={(e) => setSettings({ ...settings, packagingCharges: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Fixed packaging charge for takeaway/delivery orders
                  </p>
                </div>
              </div>

              {/* Preview Calculation */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-sm font-bold text-foreground mb-3">Bill Preview (Example: ₹1000 order)</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span>₹1000.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Service Charge ({settings.serviceCharge}%):</span>
                    <span>₹{(1000 * settings.serviceCharge / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST ({settings.cgst}%):</span>
                    <span>₹{(1000 * settings.cgst / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST ({settings.sgst}%):</span>
                    <span>₹{(1000 * settings.sgst / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border/50 pt-1.5 mt-1.5">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Total:</span>
                      <span>₹{(1000 + (1000 * settings.serviceCharge / 100) + (1000 * totalGST / 100)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
