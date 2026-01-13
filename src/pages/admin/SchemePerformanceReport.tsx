import React from 'react';
import { useSchemePerformanceReport } from '@/hooks/useAdminData';
import { Gem, Users, IndianRupee, TrendingUp, Award } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const COLORS = ['hsl(45, 93%, 58%)', 'hsl(220, 9%, 70%)', 'hsl(222, 47%, 45%)', 'hsl(142, 71%, 45%)'];

const SchemePerformanceReport: React.FC = () => {
  const { data: report, isLoading } = useSchemePerformanceReport();

  const columns = [
    {
      key: 'schemeName',
      header: 'Scheme',
      render: (row: any) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            row.assetType === 'gold' ? 'gradient-gold' : 'bg-silver'
          }`}>
            <Gem className={`w-5 h-5 ${row.assetType === 'gold' ? 'text-primary' : 'text-gray-700'}`} />
          </div>
          <div>
            <p className="font-medium">{row.schemeName}</p>
            <p className={`text-xs capitalize ${row.assetType === 'gold' ? 'text-gold' : 'text-silver'}`}>
              {row.assetType}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'totalEnrollments',
      header: 'Total Enrollments',
      render: (row: any) => <span className="font-medium">{row.totalEnrollments}</span>,
    },
    {
      key: 'activeEnrollments',
      header: 'Active',
      render: (row: any) => <span className="text-success font-medium">{row.activeEnrollments}</span>,
    },
    {
      key: 'completedEnrollments',
      header: 'Completed',
      render: (row: any) => <span className="text-muted-foreground">{row.completedEnrollments}</span>,
    },
    {
      key: 'totalCollected',
      header: 'Total Collected',
      render: (row: any) => <span className="font-medium text-gold">{formatCurrency(row.totalCollected)}</span>,
    },
    {
      key: 'totalMetalGrams',
      header: 'Metal (g)',
      render: (row: any) => <span className="font-mono">{row.totalMetalGrams?.toLocaleString()}g</span>,
    },
    {
      key: 'avgPerEnrollment',
      header: 'Avg/Enrollment',
      render: (row: any) => formatCurrency(row.avgPerEnrollment),
    },
  ];

  // Calculate totals
  const totalEnrollments = report?.reduce((sum: number, s: any) => sum + s.totalEnrollments, 0) || 0;
  const totalCollected = report?.reduce((sum: number, s: any) => sum + s.totalCollected, 0) || 0;
  const topScheme = report?.sort((a: any, b: any) => b.totalCollected - a.totalCollected)[0];

  // Prepare chart data
  const enrollmentData = report?.map((s: any) => ({
    name: s.schemeName,
    active: s.activeEnrollments,
    completed: s.completedEnrollments,
  })) || [];

  const collectionData = report?.map((s: any) => ({
    name: s.schemeName,
    value: s.totalCollected,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Scheme Card */}
      {topScheme && (
        <div className={`rounded-xl p-6 ${topScheme.assetType === 'gold' ? 'gradient-gold text-primary' : 'bg-gradient-to-r from-silver to-silver-light text-gray-800'}`}>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${topScheme.assetType === 'gold' ? 'bg-primary/20' : 'bg-white/20'}`}>
              <Award className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm opacity-80">Top Performing Scheme</p>
              <p className="text-2xl font-display font-bold">{topScheme.schemeName}</p>
              <p className="text-sm opacity-80">
                {formatCurrency(topScheme.totalCollected)} collected • {topScheme.activeEnrollments} active enrollments
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Gem className="w-4 h-4" />
            <span className="text-sm">Total Schemes</span>
          </div>
          <p className="text-2xl font-bold">{report?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Enrollments</span>
          </div>
          <p className="text-2xl font-bold">{totalEnrollments}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <IndianRupee className="w-4 h-4" />
            <span className="text-sm">Total Collections</span>
          </div>
          <p className="text-2xl font-bold text-gold">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Avg per Scheme</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalCollected / (report?.length || 1))}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Distribution */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Enrollment Distribution</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={enrollmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="active" name="Active" fill="hsl(142, 71%, 45%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="completed" name="Completed" fill="hsl(222, 47%, 45%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Collection Distribution */}
        <div className="bg-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Collection Distribution</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={collectionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {collectionData.map((_: any, index: number) => (
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
      </div>

      {/* Data Table */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Scheme Details</h3>
        <DataTable
          columns={columns}
          data={report || []}
          isLoading={isLoading}
          emptyMessage="No scheme performance data available"
        />
      </div>
    </div>
  );
};

export default SchemePerformanceReport;
