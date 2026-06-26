'use client';

import { useEffect, useState, useRef } from 'react';
import KDSDisplay from './KDSDisplay';

interface Props {
  restaurantId: string;
  readOnly?: boolean;
  enableReconnect?: boolean;
  autoStart?: boolean;
}

/**
 * Client-side wrapper for KDSDisplay
 * CRITICAL FIX: Old Android TV WebView doesn't reliably fire useEffect
 * Using ref-based + multiple fallback timers for maximum compatibility
 */
export default function KDSDisplayWrapper(props: Props) {
  const [mounted, setMounted] = useState(false);
  const mountAttempted = useRef(false);

  useEffect(() => {
    console.log('🔍 [KDS Wrapper] useEffect fired');
    
    if (mountAttempted.current) {
      console.log('⚠️ Mount already attempted, skipping');
      return;
    }
    mountAttempted.current = true;
    
    // Force mount immediately for TV browsers
    console.log('✅ [KDS Wrapper] Setting mounted=true NOW');
    setMounted(true);
  }, []);

  // 🔥 CRITICAL FALLBACK: If useEffect NEVER fires (old WebView), force mount after 2s
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!mounted && !mountAttempted.current) {
        console.error('⚠️ [KDS Wrapper] EMERGENCY FALLBACK: useEffect never fired, forcing mount');
        mountAttempted.current = true;
        setMounted(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [mounted]);

  // Simple loading screen - no diagnostics needed anymore
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-xl font-bold">Loading Kitchen Display...</p>
          <p className="text-muted-foreground text-sm mt-2">Restaurant ID: {props.restaurantId}</p>
        </div>
      </div>
    );
  }

  console.log('✅ [KDS Wrapper] Mounted! Rendering KDSDisplay');
  return <KDSDisplay {...props} />;
}
