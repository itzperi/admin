import React, { useState } from 'react';
import { useCashFlowData } from '@/hooks/useAdminData';
import { ArrowDownCircle, ArrowUpCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import MetricCard from '@/components/admin/MetricCard';
import DataTable from '@/components/admin/DataTable';

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const CashFlowReport: React.FC = () => {
  const { data, isLoading } = useCashFlowData();
  const [dateRange, setDateRange] = useState('30');

  const cashFlowData = data || [];

  // Calculate totals
  const totalInflow = cashFlowData.reduce((sum: number, d: any) => sum + (d.inflow || 0), 0);
  const totalOutflow = cashFlowData.reduce((sum: number, d: any) => sum + (d.outflow || 0), 0);
  const netCashFlow = totalInflow - totalOutflow;
  const avgDailyNet = netCashFlow / (cashFlowData.length || 1);

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row: any) => new Date(row.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
    },
    {
      key: 'inflow',
      header: 'Inflow',
      render: (row: any) => <span className="font-medium text-success">{formatCurrency(row.inflow)}</span>,
    },
    {
      key: 'outflow',
      header: 'Outflow',
      render: (row: any) => <span className="font-medium text-destructive">{formatCurrency(row.outflow)}</span>,
    },
    {
      key: 'netCashFlow',
      header: 'Net Cash Flow',
      render: (row: any) => (
        <span className={`font-medium ${row.netCashFlow >= 0 ? 'text-success' : 'text-destructive'}`}>
          {row.netCashFlow >= 0 ? '+' : ''}{formatCurrency(row.netCashFlow)}
        </span>
      ),
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
          title="Total Inflow"
          value={formatCurrency(totalInflow)}
          icon={ArrowDownCircle}
          variant="success"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Outflow"
          value={formatCurrency(totalOutflow)}
          icon={ArrowUpCircle}
          variant="danger"
          isLoading={isLoading}
        />
        <MetricCard
          title="Net Cash Flow"
          value={`${netCashFlow >= 0 ? '+' : ''}${formatCurrency(netCashFlow)}`}
          icon={TrendingUp}
          variant={netCashFlow >= 0 ? 'gold' : 'danger'}
          isLoading={isLoading}
        />
        <MetricCard
          title="Avg Daily Net"
          value={`${avgDailyNet >= 0 ? '+' : ''}${formatCurrency(avgDailyNet)}`}
          icon={BarChart3}
          variant="default"
          isLoading={isLoading}
        />
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Cash Flow Analysis</h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={cashFlowData.slice(-parseInt(dateRange))}>
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
                formatter={(value: number, name: string) => [
                  `${name === 'Net Cash Flow' && value >= 0 ? '+' : ''}${formatCurrency(value)}`,
                  name
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              />
              <Legend />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="inflow" name="Inflow" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outflow" name="Outflow" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              <Line 
                type="monotone" 
                dataKey="netCashFlow" 
                name="Net Cash Flow"
                stroke="hsl(45, 93%, 58%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(45, 93%, 58%)', r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-success to-success/80 rounded-xl p-6 text-success-foreground">
          <h4 className="text-sm font-medium opacity-80">Positive Days</h4>
          <p className="text-3xl font-display font-bold mt-2">
            {cashFlowData.filter((d: any) => d.netCashFlow > 0).length}
          </p>
          <p className="text-sm opacity-80 mt-1">out of {cashFlowData.length} days</p>
        </div>
        <div className="bg-gradient-to-br from-destructive to-destructive/80 rounded-xl p-6 text-destructive-foreground">
          <h4 className="text-sm font-medium opacity-80">Negative Days</h4>
          <p className="text-3xl font-display font-bold mt-2">
            {cashFlowData.filter((d: any) => d.netCashFlow < 0).length}
          </p>
          <p className="text-sm opacity-80 mt-1">out of {cashFlowData.length} days</p>
        </div>
        <div className="bg-gradient-to-br from-gold to-gold-dark rounded-xl p-6 text-primary">
          <h4 className="text-sm font-medium opacity-80">Cash Flow Ratio</h4>
          <p className="text-3xl font-display font-bold mt-2">
            {((totalInflow / (totalOutflow || 1)) * 100).toFixed(0)}%
          </p>
          <p className="text-sm opacity-80 mt-1">Inflow vs Outflow</p>
        </div>
      </div>

      {/* Data Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Daily Breakdown</h3>
        <DataTable
          columns={columns}
          data={cashFlowData.slice(-parseInt(dateRange)).reverse()}
          isLoading={isLoading}
          emptyMessage="No cash flow data available"
        />
      </div>
    </div>
  );
};

export default CashFlowReport;
