import React, { useState } from 'react';
import { useStaffPerformanceReport } from '@/hooks/useAdminData';
import { Calendar, TrendingUp, Users, Target, Award } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const StaffPerformanceReport: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const { data: report, isLoading } = useStaffPerformanceReport(startDate, endDate);

  const columns = [
    {
      key: 'staffName',
      header: 'Staff',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-gold flex items-center justify-center text-primary font-bold">
            {row.staffName?.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{row.staffName}</p>
            <p className="text-xs text-muted-foreground">{row.staffCode}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalPayments',
      header: 'Payments',
      render: (row: any) => <span className="font-medium">{row.totalPayments}</span>,
    },
    {
      key: 'totalCollected',
      header: 'Total Collected',
      render: (row: any) => <span className="font-medium text-gold">{formatCurrency(row.totalCollected)}</span>,
    },
    {
      key: 'customersVisited',
      header: 'Customers Visited',
    },
    {
      key: 'assignedCustomers',
      header: 'Assigned',
    },
    {
      key: 'targetAchievement',
      header: 'Target Achievement',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                row.targetAchievement >= 100 ? 'bg-success' : 
                row.targetAchievement >= 75 ? 'bg-gold' : 
                row.targetAchievement >= 50 ? 'bg-warning' : 'bg-destructive'
              }`}
              style={{ width: `${Math.min(row.targetAchievement, 100)}%` }}
            />
          </div>
          <span className={`text-sm font-medium ${
            row.targetAchievement >= 100 ? 'text-success' : 
            row.targetAchievement >= 75 ? 'text-gold' : 
            row.targetAchievement >= 50 ? 'text-warning' : 'text-destructive'
          }`}>
            {row.targetAchievement}%
          </span>
        </div>
      ),
    },
  ];

  const topPerformer = report?.sort((a: any, b: any) => b.totalCollected - a.totalCollected)[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field"
          />
        </div>
      </div>

      {/* Top Performer Card */}
      {topPerformer && (
        <div className="bg-gradient-to-r from-gold via-gold-light to-gold rounded-xl p-6 text-primary">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm opacity-80">Top Performer</p>
              <p className="text-2xl font-display font-bold">{topPerformer.staffName}</p>
              <p className="text-sm opacity-80">
                {formatCurrency(topPerformer.totalCollected)} collected • {topPerformer.targetAchievement}% target achieved
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Staff</span>
          </div>
          <p className="text-2xl font-bold">{report?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total Collections</span>
          </div>
          <p className="text-2xl font-bold text-gold">
            {formatCurrency(report?.reduce((sum: number, s: any) => sum + s.totalCollected, 0) || 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Target className="w-4 h-4" />
            <span className="text-sm">Avg Achievement</span>
          </div>
          <p className="text-2xl font-bold">
            {Math.round((report?.reduce((sum: number, s: any) => sum + s.targetAchievement, 0) || 0) / (report?.length || 1))}%
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Visits</span>
          </div>
          <p className="text-2xl font-bold">
            {report?.reduce((sum: number, s: any) => sum + s.customersVisited, 0) || 0}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Staff Collections Comparison</h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={report} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <YAxis 
                type="category"
                dataKey="staffName"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [formatCurrency(value), 'Collections']}
              />
              <Bar dataKey="totalCollected" radius={[0, 4, 4, 0]}>
                {report?.map((_: any, index: number) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? 'hsl(45, 93%, 58%)' : 'hsl(222, 47%, 45%)'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Data Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Detailed Performance</h3>
        <DataTable
          columns={columns}
          data={report || []}
          isLoading={isLoading}
          emptyMessage="No staff performance data available"
        />
      </div>
    </div>
  );
};

export default StaffPerformanceReport;
