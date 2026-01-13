import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStaffDetail } from '@/hooks/useAdminData';
import { ArrowLeft, Phone, Mail, MapPin, TrendingUp, Users, IndianRupee, Calendar } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import DataTable from '@/components/admin/DataTable';

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const StaffDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: staff } = useStaffDetail(id || '');

  if (!staff) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Staff member not found</p>
      </div>
    );
  }

  const customerColumns = [
    { key: 'name', header: 'Customer Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'route', header: 'Route' },
    { 
      key: 'assignedDate', 
      header: 'Assigned Date',
      render: (row: any) => new Date(row.assignedDate).toLocaleDateString('en-IN'),
    },
  ];

  const paymentColumns = [
    { key: 'customerName', header: 'Customer' },
    { key: 'schemeName', header: 'Scheme' },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (row: any) => <span className="font-medium text-gold">{formatCurrency(row.amount)}</span>,
    },
    { 
      key: 'date', 
      header: 'Date',
      render: (row: any) => new Date(row.date).toLocaleDateString('en-IN'),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/staff')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Staff List
      </button>

      {/* Staff Profile Card */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 gradient-gold rounded-2xl flex items-center justify-center shadow-gold">
            <span className="text-3xl font-bold text-primary">
              {staff.name?.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-display font-bold">{staff.name}</h2>
                <p className="text-gold font-mono text-sm mt-1">{staff.staffCode}</p>
              </div>
              <span className={`status-badge ${staff.isActive ? 'status-active' : 'bg-gray-100 text-gray-800'}`}>
                {staff.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{staff.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{staff.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="capitalize">{staff.staffType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Today's Collections"
          value={formatCurrency(staff.todayCollections)}
          icon={IndianRupee}
          variant="gold"
        />
        <MetricCard
          title="Total Collections"
          value={formatCurrency(staff.totalCollections)}
          icon={TrendingUp}
          variant="success"
        />
        <MetricCard
          title="Assigned Customers"
          value={staff.assignedCustomers}
          icon={Users}
          variant="default"
        />
        <MetricCard
          title="Visited Today"
          value={staff.customersVisitedToday}
          icon={Calendar}
          variant="default"
        />
      </div>

      {/* Target Progress */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Target Progress</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full gradient-gold rounded-full transition-all duration-500"
                style={{ width: `${Math.min((staff.todayCollections / staff.dailyTarget) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {Math.round((staff.todayCollections / staff.dailyTarget) * 100)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(staff.todayCollections)} / {formatCurrency(staff.dailyTarget)}
            </p>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Customers */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Assigned Customers</h3>
          <DataTable
            columns={customerColumns}
            data={staff.assignedCustomersList || []}
            emptyMessage="No customers assigned"
          />
        </div>

        {/* Recent Payments */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
          <DataTable
            columns={paymentColumns}
            data={staff.recentPayments || []}
            emptyMessage="No recent payments"
          />
        </div>
      </div>
    </div>
  );
};

export default StaffDetail;
