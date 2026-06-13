'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Set default dates to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/reports?start=${startDate}&end=${endDate}`);
      if (!res.ok) throw new Error('Failed to generate report');
      
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError('Failed to load report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="pb-4">
        <h1 className="text-2xl font-bold">Sales & Reports</h1>
        <p className="text-sm text-gray-500">
          Analyze your restaurant&apos;s performance
        </p>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button 
            onClick={generateReport}
            className="w-full bg-primary text-white"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </Card>

      {reportData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Sales</h3>
              <p className="text-3xl font-bold text-primary">₹{reportData.totals.sales.toFixed(2)}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Bills</h3>
              <p className="text-3xl font-bold">{reportData.totals.bills}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Total Tax Collected</h3>
              <p className="text-3xl font-bold">₹{reportData.totals.tax.toFixed(2)}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Avg Order Value</h3>
              <p className="text-3xl font-bold">
                ₹{reportData.totals.bills > 0 ? (reportData.totals.sales / reportData.totals.bills).toFixed(2) : '0.00'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
              <div className="space-y-4">
                {Object.entries(reportData.paymentMethods || {}).map(([method, count]: [string, any]) => (
                  <div key={method} className="flex justify-between items-center">
                    <span className="capitalize text-lg font-medium">{method}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{count} transactions</span>
                  </div>
                ))}
                {Object.keys(reportData.paymentMethods || {}).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No payment data</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Top Selling Items</h2>
              <div className="space-y-3">
                {reportData.topItems && reportData.topItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <p className="text-xs text-gray-500">Sold: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-green-600">₹{item.revenue.toFixed(2)}</span>
                  </div>
                ))}
                {(!reportData.topItems || reportData.topItems.length === 0) && (
                  <p className="text-gray-500 text-center py-4">No item sales data</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
