import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffList } from '@/hooks/useAdminData';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, Search, Filter, Eye, Edit, UserCheck } from 'lucide-react';

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const StaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const { data: staffList } = useStaffList();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = staffList?.filter((staff: any) =>
    staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.staffCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.phone?.includes(searchTerm)
  ) || [];

  const columns = [
    {
      key: 'staffCode',
      header: 'Staff Code',
      render: (row: any) => (
        <span className="font-mono text-sm font-medium text-gold">{row.staffCode}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: any) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'staffType',
      header: 'Type',
      render: (row: any) => (
        <span className="capitalize">{row.staffType}</span>
      ),
    },
    {
      key: 'assignedCustomers',
      header: 'Customers',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-muted-foreground" />
          <span>{row.assignedCustomers}</span>
        </div>
      ),
    },
    {
      key: 'dailyTarget',
      header: 'Daily Target',
      render: (row: any) => formatCurrency(row.dailyTarget),
    },
    {
      key: 'todayCollections',
      header: "Today's Collection",
      render: (row: any) => (
        <div>
          <p className="font-medium">{formatCurrency(row.todayCollections)}</p>
          <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
            <div 
              className="h-full bg-gold rounded-full transition-all"
              style={{ width: `${Math.min((row.todayCollections / row.dailyTarget) * 100, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row: any) => (
        <StatusBadge status={row.isActive ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/staff/${row.id}`);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, code, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Staff</p>
          <p className="text-2xl font-bold mt-1">{staffList?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold mt-1 text-success">
            {staffList?.filter((s: any) => s.isActive).length || 0}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Customers</p>
          <p className="text-2xl font-bold mt-1">
            {staffList?.reduce((sum: number, s: any) => sum + (s.assignedCustomers || 0), 0) || 0}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Today's Total</p>
          <p className="text-2xl font-bold mt-1 text-gold">
            {formatCurrency(staffList?.reduce((sum: number, s: any) => sum + (s.todayCollections || 0), 0) || 0)}
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredStaff}
        emptyMessage="No staff members found"
        onRowClick={(row) => navigate(`/admin/staff/${row.id}`)}
      />
    </div>
  );
};

export default StaffManagement;
