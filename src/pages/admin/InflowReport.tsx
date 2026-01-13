import React, { useState } from 'react';
import { useInflowData } from '@/hooks/useAdminData';
import { ArrowDownCircle, TrendingUp, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MetricCard from '@/components/admin/MetricCard';
import DataTable from '@/components/admin/DataTable';

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const InflowReport: React.FC = () => {
  const { data, isLoading } = useInflowData();
  const [dateRange, setDateRange] = useState('30');

  const dailyData = data?.daily || [];

  // Calculate totals
  const totalAmount = dailyData.reduce((sum: number, d: any) => sum + (d.totalAmount || 0), 0);
  const totalPayments = dailyData.reduce((sum: number, d: any) => sum + (d.paymentCount || 0), 0);
  const cashTotal = dailyData.reduce((sum: number, d: any) => sum + (d.cashTotal || 0), 0);
  const upiTotal = dailyData.reduce((sum: number, d: any) => sum + (d.upiTotal || 0), 0);
  const bankTotal = dailyData.reduce((sum: number, d: any) => sum + (d.bankTotal || 0), 0);

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: any) => new Date(row.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    },
    {
      key: 'paymentCount',
      header: 'Payments',
      render: (row: any) => <span className="font-medium">{row.paymentCount}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (row: any) => <span className="font-medium text-gold">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      key: 'cashTotal',
      header: 'Cash',
      render: (row: any) => formatCurrency(row.cashTotal),
    },
    {
      key: 'upiTotal',
      header: 'UPI',
      render: (row: any) => formatCurrency(row.upiTotal),
    },
    {
      key: 'bankTotal',
      header: 'Bank Transfer',
      render: (row: any) => formatCurrency(row.bankTotal),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Range Selector */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === days
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {days === '7' ? 'Last 7 Days' : days === '30' ? 'Last 30 Days' : 'Last 90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Inflow"
          value={formatCurrency(totalAmount)}
          icon={ArrowDownCircle}
          variant="gold"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Payments"
          value={totalPayments.toLocaleString()}
          icon={TrendingUp}
          variant="default"
          isLoading={isLoading}
        />
        <MetricCard
          title="Cash Collections"
          value={formatCurrency(cashTotal)}
          icon={Banknote}
          variant="success"
          isLoading={isLoading}
        />
        <MetricCard
          title="UPI Collections"
          value={formatCurrency(upiTotal)}
          icon={Smartphone}
          variant="default"
          isLoading={isLoading}
        />
        <MetricCard
          title="Bank Transfers"
          value={formatCurrency(bankTotal)}
          icon={CreditCard}
          variant="default"
          isLoading={isLoading}
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Collections</h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dailyData.slice(-parseInt(dateRange))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              />
              <Legend />
              <Bar dataKey="cashTotal" name="Cash" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="upiTotal" name="UPI" fill="hsl(222, 47%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bankTotal" name="Bank" fill="hsl(45, 93%, 58%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
        <DataTable
          columns={columns}
          data={dailyData.slice(-parseInt(dateRange)).reverse()}
          isLoading={isLoading}
          emptyMessage="No inflow data available"
        />
      </div>
    </div>
  );
};

export default InflowReport;
