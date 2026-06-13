'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DashboardStats {
  totalTables: number;
  occupiedTables: number;
  pendingOrders: number;
  totalRevenue: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [tablesRes, ordersRes, reportsRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/orders'),
        fetch('/api/reports'),
      ]);

      const tables = await tablesRes.json();
      const orders = await ordersRes.json();
      const reports = await reportsRes.json();

      const occupiedTables = tables.filter((t: any) => t.status === 'OCCUPIED').length;
      const pendingOrders = orders.filter((o: any) =>
        ['PENDING', 'PREPARING', 'READY'].includes(o.status)
      ).length;

      setStats({
        totalTables: tables.length,
        occupiedTables,
        pendingOrders,
        totalRevenue: reports.totalRevenue || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full border-4 border-orange-200 border-t-orange-600 h-16 w-16"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🍽️</span>
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtext, emoji, color }: any) => (
    <Card className="p-6 card-hover bg-white border-0 shadow-lg shadow-gray-200/50 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="text-4xl font-black mt-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {value}
          </p>
        </div>
        <div className="text-5xl animate-pulse-slow">{emoji}</div>
      </div>
      <p className="mt-4 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg p-2">
        {subtext}
      </p>
    </Card>
  );

  const QuickActionCard = ({ title, desc, href, icon }: any) => (
    <Link href={href}>
      <Card className="p-6 card-hover bg-white border-0 shadow-lg shadow-gray-200/50 cursor-pointer group animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </Card>
    </Link>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Gen-Z Restaurant Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-sm font-bold rounded-full shadow-lg">
            Live
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tables Occupied"
          value={`${stats?.occupiedTables ?? 0}/${stats?.totalTables ?? 0}`}
          subtext={`${(stats?.totalTables ?? 0) - (stats?.occupiedTables ?? 0)} tables available`}
          emoji="🪑"
          color="orange"
        />
        <StatCard
          title="Active Orders"
          value={stats?.pendingOrders ?? 0}
          subtext="Orders in progress"
          emoji="📋"
          color="amber"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${(stats?.totalRevenue ?? 0).toLocaleString('en-IN')}`}
          subtext="Total sales today"
          emoji="💰"
          color="green"
        />
        <StatCard
          title="Kitchen Status"
          value={stats?.pendingOrders && stats.pendingOrders > 5 ? 'Busy' : 'Normal'}
          subtext="Kitchen workload"
          emoji="👨‍🍳"
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Table Management"
            desc="View and manage restaurant tables"
            href="/tables"
            icon="🪑"
          />
          <QuickActionCard
            title="Create Order"
            desc="Take new customer orders"
            href="/orders"
            icon="📝"
          />
          <QuickActionCard
            title="Kitchen Queue"
            desc="View pending orders in kitchen"
            href="/kot"
            icon="🔥"
          />
          <QuickActionCard
            title="Menu Items"
            desc="Manage menu and prices"
            href="/menu"
            icon="🍽️"
          />
          <QuickActionCard
            title="Billing"
            desc="Generate and view bills"
            href="/bills"
            icon="🧾"
          />
          <QuickActionCard
            title="Reports"
            desc="Sales and analytics"
            href="/reports"
            icon="📊"
          />
        </div>
      </div>
    </div>
  );
}