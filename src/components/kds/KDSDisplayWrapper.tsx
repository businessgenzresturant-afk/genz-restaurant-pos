'use client';

import { useEffect, useState } from 'react';
import KDSDisplay from './KDSDisplay';

interface Props {
  restaurantId: string;
  readOnly?: boolean;
  enableReconnect?: boolean;
  autoStart?: boolean;
}

/**
 * Client-side wrapper for KDSDisplay
 * Prevents hydration mismatch by mounting only on client
 * 
 * 🔍 DIAGNOSTIC MODE: Shows visible steps for TV debugging
 */
export default function KDSDisplayWrapper(props: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    console.log('🔍 [KDS Wrapper] useEffect fired - starting mount sequence');
    
    // Step 1: useEffect executed
    setDebugInfo(prev => [...prev, `✅ Step 1: useEffect executed at ${new Date().toLocaleTimeString()}`]);
    setStep(2);
    
    // Step 2: Setting mounted state
    setTimeout(() => {
      setDebugInfo(prev => [...prev, `✅ Step 2: Setting mounted=true`]);
      setStep(3);
      setMounted(true);
      setDebugInfo(prev => [...prev, `✅ Step 3: Rendering KDSDisplay component`]);
      console.log('🔍 [KDS Wrapper] Mount complete, rendering KDSDisplay');
    }, 100);

    // 🔥 FALLBACK: If useEffect fires but mounted never becomes true after 5s, force it
    const fallbackTimer = setTimeout(() => {
      if (!mounted) {
        console.error('⚠️ [KDS Wrapper] FALLBACK: Forcing mounted=true after 5s timeout');
        setDebugInfo(prev => [...prev, `⚠️ FALLBACK: Forcing mount after timeout`]);
        setMounted(true);
      }
    }, 5000);

    return () => clearTimeout(fallbackTimer);
  }, []); // Empty deps - should fire once on mount

  // 🔍 DIAGNOSTIC: Show visible progress on screen (no dev tools needed)
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-4xl">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
          
          <h1 className="text-4xl font-black mb-6 text-foreground">
            Kitchen Display Loading...
          </h1>
          
          {/* 🔍 VISIBLE DIAGNOSTIC INFO */}
          <div className="bg-card border-2 border-border rounded-2xl p-6 text-left">
            <p className="text-2xl font-bold text-primary mb-4">
              🔍 Diagnostic Information:
            </p>
            <div className="space-y-2 font-mono text-lg">
              <p className={`${step >= 1 ? 'text-green-500' : 'text-muted-foreground'}`}>
                Step 1: Component rendered {step >= 1 ? '✅' : '⏳'}
              </p>
              <p className={`${step >= 2 ? 'text-green-500' : 'text-muted-foreground'}`}>
                Step 2: useEffect fired {step >= 2 ? '✅' : '⏳'}
              </p>
              <p className={`${step >= 3 ? 'text-green-500' : 'text-muted-foreground'}`}>
                Step 3: Mounted state set {step >= 3 ? '✅' : '⏳'}
              </p>
              <p className={`${mounted ? 'text-green-500' : 'text-amber-500 animate-pulse'}`}>
                Status: {mounted ? 'Ready to load KDS ✅' : 'Waiting for mount...'}
              </p>
            </div>
            
            {/* Debug log */}
            {debugInfo.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-bold text-muted-foreground mb-2">Debug Log:</p>
                <div className="space-y-1 text-xs text-muted-foreground font-mono max-h-40 overflow-y-auto">
                  {debugInfo.map((info, i) => (
                    <p key={i}>{info}</p>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-border text-sm text-muted-foreground">
              <p>Restaurant ID: {props.restaurantId}</p>
              <p>Auto-start: {props.autoStart ? 'Yes' : 'No'}</p>
              <p>Time: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          
          <p className="text-muted-foreground mt-6 text-lg">
            If stuck on Step 1 for more than 10 seconds, browser may not support React hydration.
          </p>
        </div>
      </div>
    );
  }

  return <KDSDisplay {...props} />;
}
