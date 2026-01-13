import React, { useState } from 'react';
import { useCustomerPaymentReport } from '@/hooks/useAdminData';
import { Calendar, Search, Download, Users, IndianRupee, Gem } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import MetricCard from '@/components/admin/MetricCard';

const formatCurrency = (value: number) => {
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value}`;
};

const CustomerPaymentReport: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: report, isLoading } = useCustomerPaymentReport(startDate, endDate);

  const filteredData = report?.filter((customer: any) =>
    customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  ) || [];

  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      render: (row: any) => (
        <div>
          <p className="font-medium">{row.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'schemeName',
      header: 'Scheme',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-gold" />
          <span>{row.schemeName}</span>
        </div>
      ),
    },
    {
      key: 'totalPayments',
      header: 'Payments',
      render: (row: any) => <span className="font-medium">{row.totalPayments}</span>,
    },
    {
      key: 'totalPaid',
      header: 'Total Paid',
      render: (row: any) => <span className="font-medium text-success">{formatCurrency(row.totalPaid)}</span>,
    },
    {
      key: 'metalGrams',
      header: 'Metal (g)',
      render: (row: any) => <span className="font-mono">{row.metalGrams?.toFixed(2)}g</span>,
    },
    {
      key: 'dueAmount',
      header: 'Due Amount',
      render: (row: any) => (
        <span className={`font-medium ${row.dueAmount > 0 ? 'text-destructive' : 'text-success'}`}>
          {formatCurrency(row.dueAmount)}
        </span>
      ),
    },
    {
      key: 'lastPaymentDate',
      header: 'Last Payment',
      render: (row: any) => new Date(row.lastPaymentDate).toLocaleDateString('en-IN'),
    },
  ];

  // Summary stats
  const totalCustomers = filteredData.length;
  const totalPaid = filteredData.reduce((sum: number, c: any) => sum + (c.totalPaid || 0), 0);
  const totalDue = filteredData.reduce((sum: number, c: any) => sum + (c.dueAmount || 0), 0);
  const totalMetal = filteredData.reduce((sum: number, c: any) => sum + (c.metalGrams || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
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
        <button className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Customers"
          value={totalCustomers.toString()}
          icon={Users}
          variant="default"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          icon={IndianRupee}
          variant="success"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Due"
          value={formatCurrency(totalDue)}
          icon={IndianRupee}
          variant="danger"
          isLoading={isLoading}
        />
        <MetricCard
          title="Total Metal"
          value={`${totalMetal.toFixed(2)}g`}
          icon={Gem}
          variant="gold"
          isLoading={isLoading}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        emptyMessage="No customer payment data found"
      />
    </div>
  );
};

export default CustomerPaymentReport;
