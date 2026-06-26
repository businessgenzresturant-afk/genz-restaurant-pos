import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import KDSDisplayWrapper from '@/components/kds/KDSDisplayWrapper';

// Force dynamic route handling
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PublicKDSDisplay({ params }: Props) {
  const { token } = await params;
  
  // 🔍 DIAGNOSTIC: Log every request to verify TV is reaching server
  console.log(`[KDS] 🔍 Request received - Token: ${token}, Time: ${new Date().toISOString()}`);
  
  // Validate token server-side
  const restaurant = await prisma.restaurant.findUnique({
    where: { kdsDisplayToken: token },
    select: { id: true, name: true }
  });

  console.log(`[KDS] Restaurant lookup result: ${restaurant ? `✅ Found: ${restaurant.name} (ID: ${restaurant.id})` : '❌ Not found'}`);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-12 bg-card rounded-3xl border-4 border-destructive">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-black text-destructive mb-4">Access Denied</h1>
          <p className="text-xl text-muted-foreground font-bold mb-6">
            Invalid or expired KDS display token
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your restaurant administrator for the correct display URL
          </p>
        </div>
      </div>
    );
  }

  // Server-side validation successful - render KDS with client-side wrapper
  // Wrapper prevents hydration mismatch on old TV browsers
  return <KDSDisplayWrapper restaurantId={restaurant.id} readOnly={true} enableReconnect={true} autoStart={true} />;
}
