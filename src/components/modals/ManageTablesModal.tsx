'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, LayoutGrid } from 'lucide-react';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: string;
}

interface ManageTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageTablesModal({ isOpen, onClose }: ManageTablesModalProps) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTable, setNewTable] = useState({ number: '', capacity: '' });

  useEffect(() => {
    if (isOpen) {
      fetchTables();
    }
  }, [isOpen]);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tables');
      const data = await response.json();
      setTables(data);
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async () => {
    if (!newTable.number || !newTable.capacity) return;

    try {
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: parseInt(newTable.number),
          capacity: parseInt(newTable.capacity),
          status: 'AVAILABLE',
        }),
      });

      if (response.ok) {
        setNewTable({ number: '', capacity: '' });
        fetchTables();
      }
    } catch (error) {
      console.error('Failed to add table:', error);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      fetchTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-background border-2 border-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-border bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-xl">
              <LayoutGrid className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Manage Tables</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Add, edit, or delete restaurant tables</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-muted/80 rounded-xl transition-all duration-200 hover:rotate-90"
          >
            <X className="w-6 h-6 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background to-muted/20 custom-scrollbar">
          {/* Add New Table */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 mb-6 border-2 border-primary/20 shadow-lg">
            <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Add New Table
            </h3>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="Table Number"
                value={newTable.number}
                onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                className="flex-1 px-4 py-3 bg-background/80 border-2 border-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <input
                type="number"
                placeholder="Capacity"
                value={newTable.capacity}
                onChange={(e) => setNewTable({ ...newTable, capacity: e.target.value })}
                className="flex-1 px-4 py-3 bg-background/80 border-2 border-border rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              />
              <button
                onClick={handleAddTable}
                className="px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </div>

          {/* Tables List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground font-semibold">Loading tables...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
              <LayoutGrid className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-semibold">No tables found</p>
              <p className="text-xs text-muted-foreground mt-2">Add your first table above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-card border-2 border-border rounded-2xl p-5 flex items-center justify-between hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-black text-primary">{table.number}</span>
                    </div>
                    <div>
                      <p className="font-black text-foreground text-lg">Table {table.number}</p>
                      <p className="text-sm text-muted-foreground">👥 {table.capacity} people</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className={`font-bold ${table.status === 'AVAILABLE' ? 'text-green-600' : 'text-amber-600'}`}>
                          {table.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-muted text-foreground rounded-xl font-bold text-sm hover:bg-muted/80 transition-all duration-200 hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
