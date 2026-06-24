'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import KDSDisplay from '@/components/kds/KDSDisplay';

export default function PublicKDSDisplay() {
  const params = useParams();
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        const token = params.token as string;
        console.log('🔍 Client: Validating KDS token:', token ? `${token.substring(0, 10)}...` : 'NONE');
        
        const url = `/api/kds-display/${token}/validate`;
        console.log('📡 Client: Calling API:', url);
        
        const response = await fetch(url);
        console.log('📥 Client: Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Client: Validation failed:', errorData);
          
          if (response.status === 404) {
            setError('Invalid KDS Display Token');
          } else {
            setError('Failed to validate token');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log('✅ Client: Validation successful:', data);
        setRestaurantId(data.restaurantId);
        setLoading(false);
      } catch (err) {
        console.error('❌ Client: Token validation error:', err);
        setError('Failed to connect to server');
        setLoading(false);
      }
    }

    validateToken();
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-xl font-bold">Validating access...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurantId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-12 bg-card rounded-3xl border-4 border-destructive">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-black text-destructive mb-4">Access Denied</h1>
          <p className="text-xl text-muted-foreground font-bold mb-6">
            {error || 'Invalid or expired KDS display token'}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your restaurant administrator for the correct display URL
          </p>
        </div>
      </div>
    );
  }

  return <KDSDisplay restaurantId={restaurantId} readOnly={true} enableReconnect={true} />;
}
