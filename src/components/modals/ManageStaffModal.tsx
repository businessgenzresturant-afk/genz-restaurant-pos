'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, UserCheck, UserX } from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'WAITER' | 'CHEF';
  active: boolean;
}

interface ManageStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageStaffModal({ isOpen, onClose }: ManageStaffModalProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'WAITER' as 'ADMIN' | 'MANAGER' | 'WAITER' | 'CHEF',
  });

  useEffect(() => {
    if (isOpen) {
      fetchStaff();
    }
  }, [isOpen]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff');
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      alert('Please fill all fields');
      return;
    }

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      });

      if (response.ok) {
        setNewStaff({ name: '', email: '', password: '', role: 'WAITER' });
        setShowAddForm(false);
        fetchStaff();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Failed to add staff:', error);
      alert('Failed to add staff member');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus }),
      });
      fetchStaff();
    } catch (error) {
      console.error('Failed to update staff status:', error);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      fetchStaff();
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-600';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-600';
      case 'CHEF':
        return 'bg-orange-500/20 text-orange-600';
      case 'WAITER':
        return 'bg-green-500/20 text-green-600';
      default:
        return 'bg-gray-500/20 text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-black text-foreground">Manage Staff</h2>
            <p className="text-xs text-muted-foreground mt-1">Add, edit, or remove staff accounts</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-6 px-4 py-3 bg-primary/10 border-2 border-dashed border-primary/30 rounded-xl font-bold text-sm text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Staff Member
            </button>
          )}

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6 animate-fade-in">
              <h3 className="text-sm font-bold text-foreground mb-3">Add New Staff Member</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="WAITER">Waiter</option>
                  <option value="CHEF">Chef</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddStaff}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-opacity active:scale-[0.97]"
                >
                  Add Staff
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Staff List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff members found</div>
          ) : (
            <div className="space-y-2">
              {staff.map((member) => (
                <div
                  key={member.id}
                  className={`bg-card border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow ${
                    !member.active ? 'opacity-60 border-red-500/30' : 'border-border'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{member.name}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                      {!member.active && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-600 text-[10px] font-bold rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(member.id, member.active)}
                      className={`p-2 rounded-lg transition-colors ${
                        member.active
                          ? 'text-red-500 hover:bg-red-500/10'
                          : 'text-green-500 hover:bg-green-500/10'
                      }`}
                      title={member.active ? 'Deactivate' : 'Activate'}
                    >
                      {member.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(member.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-lg font-bold text-sm hover:bg-muted/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
