import React, { useState } from 'react';
import { useDailyReport } from '@/hooks/useAdminData';
import { Calendar, IndianRupee, Users, TrendingUp, Banknote, Smartphone, CreditCard } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import DataTable from '@/components/admin/DataTable';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(222, 47%, 45%)', 'hsl(45, 93%, 58%)'];

const DailyReport: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: report, isLoading } = useDailyReport(selectedDate);

  const staffColumns = [
    {
      key: 'staffName',
      header: 'Staff Name',
      render: (row: any) => (
        <div>
          <p className="font-medium">{row.staffName}</p>
          <p className="text-xs text-muted-foreground">{row.staffCode}</p>
        </div>
      ),
    },
    {
      key: 'paymentCount',
      header: 'Payments',
      render: (row: any) => <span className="font-medium">{row.paymentCount}</span>,
    },
    {
      key: 'customersVisited',
      header: 'Customers Visited',
    },
    {
      key: 'totalCollected',
      header: 'Total Collected',
      render: (row: any) => <span className="font-medium text-gold">{formatCurrency(row.totalCollected)}</span>,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Picker */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Collections"
          value={formatCurrency(report?.totalAmount || 0)}
          icon={IndianRupee}
          variant="gold"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Payments"
          value={report?.totalPayments?.toString() || '0'}
          icon={TrendingUp}
          variant="default"
          isLoading={isLoading}
        />
        <MetricCard
          title="Unique Customers"
          value={report?.uniqueCustomers?.toString() || '0'}
          icon={Users}
          variant="default"
          isLoading={isLoading}
        />
        <MetricCard
          title="Active Staff"
          value={report?.activeStaff?.toString() || '0'}
          icon={Users}
          variant="success"
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg Payment"
          value={formatCurrency(report?.averagePayment || 0)}
          icon={TrendingUp}
          variant="default"
          isLoading={isLoading}
        />
      </div>

      {/* Charts and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Method Distribution */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={report?.byMethod || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="total"
                  nameKey="method"
                >
                  {report?.byMethod?.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Payment Method Cards */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {report?.byMethod?.map((method: any, index: number) => {
            const icons = [Banknote, Smartphone, CreditCard];
            const Icon = icons[index] || Banknote;
            return (
              <div key={method.method} className="bg-card rounded-xl border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${COLORS[index]}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: COLORS[index] }} />
                  </div>
                  <span className="font-medium">{method.method}</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(method.total)}</p>
                <p className="text-sm text-muted-foreground mt-1">{method.count} payments</p>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${(method.total / (report?.totalAmount || 1)) * 100}%`,
                      backgroundColor: COLORS[index]
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Staff Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Staff Collection Breakdown</h3>
        <DataTable
          columns={staffColumns}
          data={report?.byStaff || []}
          isLoading={isLoading}
          emptyMessage="No staff data available for this date"
        />
      </div>
    </div>
  );
};

export default DailyReport;
