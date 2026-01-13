import React, { useState } from 'react';
import { useAccessControl } from '@/hooks/useAdminData';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Plus, Search, Phone, Trash2, Edit, Check, X, RefreshCw, Shield } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AccessControl: React.FC = () => {
  const { data: phoneList, refetch } = useAccessControl();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'staff' | 'customer'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'staff' | 'customer'>('customer');

  const filteredList = phoneList?.filter((item: any) => {
    const matchesSearch = 
      item.phone?.includes(searchTerm) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || item.role === filterRole;
    return matchesSearch && matchesRole;
  }) || [];

  const handleAddPhone = async () => {
    if (!newPhone || newPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (!isSupabaseConfigured() || !supabase) {
      toast.error('Database not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('phone_whitelist')
        .insert({
          phone: newPhone,
          active: true,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Phone number already exists in whitelist');
        } else {
          toast.error(`Failed to add phone: ${error.message}`);
        }
        return;
      }

      toast.success(`Phone number ${newPhone} added successfully`);
      setIsAddModalOpen(false);
      setNewPhone('');
      setNewName('');
      refetch();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, phone: string) => {
    if (!isSupabaseConfigured() || !supabase) {
      toast.error('Database not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('phone_whitelist')
        .delete()
        .eq('phone', phone);

      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
        return;
      }

      toast.success(`Phone number ${phone} removed from access list`);
      refetch();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isSupabaseConfigured() || !supabase) {
      toast.error('Database not configured');
      return;
    }

    try {
      const { error } = await supabase
        .from('phone_whitelist')
        .update({ active: !currentStatus })
        .eq('phone', id);

      if (error) {
        toast.error(`Failed to update: ${error.message}`);
        return;
      }

      toast.success(currentStatus ? 'Access disabled' : 'Access enabled');
      refetch();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
  };

  const columns = [
    {
      key: 'phone',
      header: 'Phone Number',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-mono font-medium">+91 {row.phone}</p>
            <p className="text-xs text-muted-foreground">{row.name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row: any) => (
        <span className={`capitalize font-medium ${row.role === 'staff' ? 'text-gold' : 'text-muted-foreground'}`}>
          {row.role}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'createdAt',
      header: 'Added On',
      render: (row: any) => new Date(row.createdAt).toLocaleDateString('en-IN'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleToggleStatus(row.id, row.isActive)}
            className={`p-2 rounded-lg transition-colors ${
              row.isActive 
                ? 'hover:bg-destructive/10 text-destructive' 
                : 'hover:bg-success/10 text-success'
            }`}
            title={row.isActive ? 'Disable Access' : 'Enable Access'}
          >
            {row.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => handleDelete(row.id, row.phone)}
            className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const staffCount = phoneList?.filter((p: any) => p.role === 'staff').length || 0;
  const customerCount = phoneList?.filter((p: any) => p.role === 'customer').length || 0;
  const activeCount = phoneList?.filter((p: any) => p.isActive).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Info Card */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Phone Access Control</h3>
            <p className="text-sm opacity-80">
              Only phone numbers listed here can register and access the app. 
              Add staff and customer phone numbers to grant app access.
            </p>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by phone number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg border overflow-hidden">
            {[
              { value: 'all', label: 'All' },
              { value: 'staff', label: 'Staff' },
              { value: 'customer', label: 'Customers' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterRole(option.value as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filterRole === option.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => refetch()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Phone
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Phone className="w-4 h-4" />
            <span className="text-sm">Total Numbers</span>
          </div>
          <p className="text-2xl font-bold">{phoneList?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-gold mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Staff</span>
          </div>
          <p className="text-2xl font-bold text-gold">{staffCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Phone className="w-4 h-4" />
            <span className="text-sm">Customers</span>
          </div>
          <p className="text-2xl font-bold">{customerCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-success mb-2">
            <Check className="w-4 h-4" />
            <span className="text-sm">Active</span>
          </div>
          <p className="text-2xl font-bold text-success">{activeCount}</p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredList}
        emptyMessage="No phone numbers in access list"
      />

      {/* Add Phone Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Phone Number</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Phone Number</label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">+91</span>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  className="input-field flex-1"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <div className="flex gap-2">
                {['staff', 'customer'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setNewRole(role as 'staff' | 'customer')}
                    className={`flex-1 py-3 rounded-lg font-medium capitalize transition-colors ${
                      newRole === role
                        ? 'gradient-gold text-primary'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPhone}
                className="flex-1 btn-primary"
              >
                Add Phone
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessControl;
