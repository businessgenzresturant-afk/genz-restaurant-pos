'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function TablesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const router = useRouter();

  // Form state for adding table
  const [number, setNumber] = useState('');
  const [capacity, setCapacity] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tables');
      if (!response.ok) {
        throw new Error('Failed to fetch tables');
      }
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError('Failed to load tables. Please try again.');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number || !capacity) return;

    setLoading(true);
    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(number),
          capacity: parseInt(capacity),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create table');
      }

      // Reset form
      setNumber('');
      setCapacity('');
      setShowAddModal(false);
      
      // Refresh tables
      await fetchTables();
    } catch (err) {
      setError('Failed to create table. Please try again.');
      console.error('Error creating table:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tables/${tableToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete table');
      }

      setShowDeleteModal(false);
      setTableToDelete(null);
      await fetchTables();
    } catch (err) {
      setError('Failed to delete table. Please try again.');
      console.error('Error deleting table:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full border-4 border-primary border-t-transparent h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading seating arrangements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p className="text-red-500">{error}</p>
        <Button onClick={() => { setError(null); fetchTables(); }} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground">Tables Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage seating capacity and table statuses</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="gradient"
            size="lg"
          >
            ➕ Add New Table
          </Button>
        </div>
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                🪑
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">Add New Table</h2>
                <p className="text-sm text-muted-foreground">Add seating for your guests</p>
              </div>
            </div>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label htmlFor="tableNumber" className="block text-sm font-semibold text-foreground mb-2">
                  Table Number
                </label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full"
                  placeholder="e.g., 1"
                />
              </div>
              <div>
                <label htmlFor="tableCapacity" className="block text-sm font-semibold text-foreground mb-2">
                  Capacity (Seats)
                </label>
                <Input
                  id="tableCapacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full"
                  placeholder="e.g., 4"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" className="flex-1">
                  Add Table
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tableToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-2xl">
                ⚠️
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">Delete Table</h2>
                <p className="text-sm text-muted-foreground">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this table? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTableToDelete(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteTable}
                variant="destructive"
                className="flex-1"
              >
                Delete Table
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.length === 0 ? (
          <Card className="p-12 text-center col-span-full border-dashed bg-muted/50 border-border">
            <div className="text-6xl mb-4">🪑</div>
            <p className="text-muted-foreground mb-4">No tables found</p>
            <p className="text-sm text-muted-foreground/80">
              Add your first table to get started with seating arrangements
            </p>
          </Card>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className={`border-2 rounded-xl p-5 transition-all card-hover bg-card ${
                table.status === 'AVAILABLE'
                  ? 'border-green-500/20 shadow-sm shadow-green-500/10'
                  : table.status === 'OCCUPIED'
                    ? 'border-red-500/20 shadow-sm shadow-red-500/10'
                    : 'border-yellow-500/20 shadow-sm shadow-yellow-500/10'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                    table.status === 'AVAILABLE'
                      ? 'bg-green-500/10 text-green-500'
                      : table.status === 'OCCUPIED'
                        ? 'bg-red-500/10 text-red-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    T{table.number}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacity</p>
                    <p className="font-bold text-foreground">{table.capacity} Seats</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setTableToDelete(table.id);
                    setShowDeleteModal(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs text-destructive hover:bg-destructive/10 border-transparent shadow-none"
                >
                  🗑️
                </Button>
              </div>

              <div className="flex items-center justify-between mt-6">
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                  table.status === 'AVAILABLE'
                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                    : table.status === 'OCCUPIED'
                      ? 'bg-red-500/10 text-red-500 border-red-500/20'
                      : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                }`}>
                  {table.status === 'AVAILABLE' ? '🟢 AVAILABLE' : table.status === 'OCCUPIED' ? '🔴 OCCUPIED' : '🟡 RESERVED'}
                </span>
                
                <p className="text-xs text-muted-foreground/50">
                  Res ID: {table.restaurant?.id || table.restaurantId || 'N/A'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

TablesPage.displayName = 'TablesPage';