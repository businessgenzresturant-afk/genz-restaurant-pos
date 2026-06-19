'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Bike, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderType: 'TAKEAWAY' | 'DELIVERY' | null;
  onContinue: (details: { customerName: string; customerPhone: string; address?: string }) => void;
}

export function CustomerDetailsModal({ isOpen, onClose, orderType, onContinue }: CustomerDetailsModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');

  // Reset fields when orderType changes
  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setCustomerPhone('');
      setAddress('');
    }
  }, [isOpen, orderType]);

  if (!isOpen || !orderType) return null;

  const handleContinue = () => {
    onContinue({
      customerName: customerName.trim() || `${orderType.charAt(0) + orderType.slice(1).toLowerCase()} Customer`,
      customerPhone: customerPhone.trim(),
      address: orderType === 'DELIVERY' ? address.trim() : undefined,
    });
  };

  const getHeaderInfo = () => {
    switch (orderType) {
      case 'TAKEAWAY':
        return {
          title: 'New Takeaway Order',
          desc: 'Setup takeaway customer information',
          icon: ShoppingBag,
          color: 'amber',
        };
      case 'DELIVERY':
        return {
          title: 'New Delivery Order',
          desc: 'Setup delivery details and address',
          icon: Bike,
          color: 'rose',
        };
      default:
        return {
          title: 'Customer Details',
          desc: 'Enter order information',
          icon: ShoppingBag,
          color: 'blue',
        };
    }
  };

  const info = getHeaderInfo();
  const Icon = info.icon;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 z-[150] backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-full sm:max-w-lg bg-background border border-border shadow-2xl rounded-3xl z-[160] overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={`p-2 rounded-lg bg-${info.color}-500/10 text-${info.color}-500`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">{info.title}</h2>
              <p className="text-xs text-muted-foreground">{info.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="customer-name">Customer Name (Optional)</label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
              className="h-12 rounded-xl border-2"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="customer-phone">Phone Number (Optional)</label>
            <Input
              id="customer-phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +91 9876543210"
              className="h-12 rounded-xl border-2"
            />
          </div>

          {orderType === 'DELIVERY' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="delivery-address">Delivery Address</label>
              <textarea
                id="delivery-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter complete delivery address..."
                className="w-full min-h-[80px] p-3 rounded-xl border-2 border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10">
          <Button 
            className="w-full h-14 text-lg font-bold shadow-lg"
            variant="gradient"
            onClick={handleContinue}
          >
            Continue to Menu
          </Button>
        </div>

      </div>
    </>
  );
}
