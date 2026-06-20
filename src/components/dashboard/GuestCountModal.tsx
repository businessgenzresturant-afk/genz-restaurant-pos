'use client';

import React, { useState } from 'react';
import { X, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GuestCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  tableNumber: number | null;
  onContinue: (details: { guests: number }) => void;
}

export function GuestCountModal({ isOpen, onClose, onBack, tableNumber, onContinue }: GuestCountModalProps) {
  const [guests, setGuests] = useState<string>('2');

  if (!isOpen) return null;

  const quickGuestOptions = [1, 2, 3, 4, 5, 6, 8, 10];

  const handleContinue = () => {
    const guestCount = parseInt(guests) || 1;
    onContinue({
      guests: guestCount,
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in" 
        onClick={onClose} 
      />
      <div className="relative w-full sm:max-w-lg bg-background border-2 border-border shadow-2xl rounded-3xl z-[160] overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-border flex justify-between items-center bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="p-3 bg-primary/20 rounded-xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Table T{tableNumber} Details</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Setup customer info for this table</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 hover:rotate-90">
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Guest Count Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Number of Guests</label>
            <div className="grid grid-cols-4 gap-2">
              {quickGuestOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setGuests(opt.toString())}
                  className={`py-3 rounded-xl border-2 font-black text-center transition-all ${
                    guests === opt.toString()
                      ? 'border-primary bg-primary/10 text-primary scale-[1.03]'
                      : 'border-border hover:border-primary/40 text-foreground hover:bg-muted/50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Guest Count Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="custom-guests">Or Enter Custom Guest Count</label>
            <Input
              id="custom-guests"
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Enter number of guests"
              className="h-12 rounded-xl border-2"
            />
          </div>
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
    </div>
  );
}
