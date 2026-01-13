import React from 'react';
import { Users, Gem, IndianRupee, ArrowDownCircle, TrendingUp, Wallet } from 'lucide-react';
import MetricCard from '@/components/admin/MetricCard';
import { useDashboardMetrics, useCollectionTrend, usePaymentMethodDistribution } from '@/hooks/useAdminData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const COLORS = ['hsl(45, 93%, 58%)', 'hsl(222, 47%, 45%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)'];

const Dashboard: React.FC = () => {
  const { data: metrics } = useDashboardMetrics();
  const { data: trendData } = useCollectionTrend();
  const { data: methodData } = usePaymentMethodDistribution();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Customers"
          value={metrics?.totalCustomers?.toLocaleString() || '0'}
          icon={Users}
          variant="gold"
        />
        <MetricCard
          title="Active Schemes"
          value={metrics?.activeSchemes?.toLocaleString() || '0'}
          icon={Gem}
          variant="default"
        />
        <MetricCard
          title="Today's Collections"
          value={formatCurrency(metrics?.todayCollections || 0)}
          icon={IndianRupee}
          variant="success"
        />
        <MetricCard
          title="Pending Withdrawals"
          value={metrics?.todayWithdrawals?.toString() || '0'}
          icon={ArrowDownCircle}
          variant="warning"
        />
        <MetricCard
          title="Total Collections"
          value={formatCurrency(metrics?.totalCollections || 0)}
          icon={TrendingUp}
          variant="gold"
        />
        <MetricCard
          title="Total Withdrawals"
          value={formatCurrency(metrics?.totalWithdrawals || 0)}
          icon={Wallet}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Trend */}
        <div className="lg:col-span-2 bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Collection Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData || []}>
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
                formatter={(value: number) => [formatCurrency(value), 'Collections']}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(45, 93%, 58%)" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: 'hsl(45, 93%, 58%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Distribution */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={methodData || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="total"
                nameKey="method"
              >
                {methodData?.map((_, index) => (
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
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-gold to-gold-dark rounded-xl p-6 text-primary">
          <h4 className="text-sm font-medium opacity-80">Average Daily Collection</h4>
          <p className="text-2xl font-display font-bold mt-2">
            {formatCurrency((metrics?.totalCollections || 0) / 30)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-6 text-primary-foreground">
          <h4 className="text-sm font-medium opacity-80">Collection Rate</h4>
          <p className="text-2xl font-display font-bold mt-2">94.5%</p>
        </div>
        <div className="bg-gradient-to-br from-success to-success/80 rounded-xl p-6 text-success-foreground">
          <h4 className="text-sm font-medium opacity-80">Active Customers</h4>
          <p className="text-2xl font-display font-bold mt-2">
            {Math.floor((metrics?.activeSchemes || 0) * 0.85).toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-warning to-warning/80 rounded-xl p-6 text-warning-foreground">
          <h4 className="text-sm font-medium opacity-80">Overdue Accounts</h4>
          <p className="text-2xl font-display font-bold mt-2">23</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
