import React, { useState } from 'react';
import { useOutflowData } from '@/hooks/useAdminData';
import { ArrowUpCircle, TrendingDown, Wallet, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '@/components/admin/MetricCard';
import DataTable from '@/components/admin/DataTable';

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const OutflowReport: React.FC = () => {
  const { data, isLoading } = useOutflowData();
  const [dateRange, setDateRange] = useState('30');

  const dailyData = data?.daily || [];

  // Calculate totals
  const totalAmount = dailyData.reduce((sum: number, d: any) => sum + (d.totalAmount || 0), 0);
  const totalWithdrawals = dailyData.reduce((sum: number, d: any) => sum + (d.withdrawalCount || 0), 0);
  const avgPerDay = totalAmount / (dailyData.length || 1);

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: any) => new Date(row.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    },
    {
      key: 'withdrawalCount',
      header: 'Withdrawals',
      render: (row: any) => <span className="font-medium">{row.withdrawalCount}</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (row: any) => <span className="font-medium text-destructive">{formatCurrency(row.totalAmount)}</span>,
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Outflow"
          value={formatCurrency(totalAmount)}
          icon={ArrowUpCircle}
          variant="danger"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Withdrawals"
          value={totalWithdrawals.toLocaleString()}
          icon={Wallet}
          variant="default"
          isLoading={isLoading}
        />
        <MetricCard
          title="Average per Day"
          value={formatCurrency(avgPerDay)}
          icon={Calendar}
          variant="default"
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg per Withdrawal"
          value={formatCurrency(totalAmount / (totalWithdrawals || 1))}
          icon={TrendingDown}
          variant="warning"
          isLoading={isLoading}
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Outflow Trend</h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dailyData.slice(-parseInt(dateRange))}>
              <defs>
                <linearGradient id="outflowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
                formatter={(value: number) => [formatCurrency(value), 'Outflow']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              />
              <Area 
                type="monotone" 
                dataKey="totalAmount" 
                stroke="hsl(0, 84%, 60%)" 
                strokeWidth={2}
                fill="url(#outflowGradient)"
              />
            </AreaChart>
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
          emptyMessage="No outflow data available"
        />
      </div>
    </div>
  );
};

export default OutflowReport;
