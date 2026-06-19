'use client';

import { useEffect, useState } from 'react';

export default function TestDataPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testAPIs() {
      const tests: any = {};
      
      try {
        // Test session
        const sessionRes = await fetch('/api/debug/session');
        tests.session = {
          status: sessionRes.status,
          data: await sessionRes.json()
        };

        // Test tables
        const tablesRes = await fetch('/api/tables');
        tests.tables = {
          status: tablesRes.status,
          data: tablesRes.ok ? await tablesRes.json() : { error: await tablesRes.text() }
        };

        // Test menu
        const menuRes = await fetch('/api/menu');
        tests.menu = {
          status: menuRes.status,
          data: menuRes.ok ? await menuRes.json() : { error: await menuRes.text() }
        };

        // Test orders
        const ordersRes = await fetch('/api/orders');
        tests.orders = {
          status: ordersRes.status,
          data: ordersRes.ok ? await ordersRes.json() : { error: await ordersRes.text() }
        };

        // Test db status
        const dbRes = await fetch('/api/debug/db-status');
        tests.dbStatus = {
          status: dbRes.status,
          data: await dbRes.json()
        };

      } catch (error: any) {
        tests.error = error.message;
      }

      setResults(tests);
      setLoading(false);
    }

    testAPIs();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Testing APIs...</h1>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">API Test Results</h1>
      
      <div className="space-y-6">
        {Object.entries(results).map(([key, value]: [string, any]) => (
          <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2 text-orange-400">{key}</h2>
            <div className="bg-black p-4 rounded overflow-auto">
              <pre className="text-xs text-green-400">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <a 
          href="/dashboard" 
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
