import React, { useState } from 'react';
import { useWithdrawalsList } from '@/hooks/useAdminData';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Search, Filter, Eye, Check, X, Gem, Clock, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Withdrawals: React.FC = () => {
  const { data: withdrawals } = useWithdrawalsList();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processed' | 'rejected'>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);

  const filteredWithdrawals = withdrawals?.filter((w: any) => {
    const matchesSearch = 
      w.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerPhone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleApprove = (id: string) => {
    toast.success('Withdrawal approved successfully');
    setSelectedWithdrawal(null);
  };

  const handleReject = (id: string) => {
    toast.error('Withdrawal rejected');
    setSelectedWithdrawal(null);
  };

  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      render: (row: any) => (
        <div>
          <p className="font-medium">{row.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.customerPhone}</p>
        </div>
      ),
    },
    {
      key: 'schemeName',
      header: 'Scheme',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Gem className={`w-4 h-4 ${row.assetType === 'gold' ? 'text-gold' : 'text-silver'}`} />
          <span>{row.schemeName}</span>
        </div>
      ),
    },
    {
      key: 'assetType',
      header: 'Type',
      render: (row: any) => (
        <span className={`capitalize font-medium ${row.assetType === 'gold' ? 'text-gold' : 'text-silver'}`}>
          {row.assetType}
        </span>
      ),
    },
    {
      key: 'metalGrams',
      header: 'Metal (g)',
      render: (row: any) => (
        <span className="font-mono font-medium">{row.metalGrams?.toFixed(2)}g</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (row: any) => (
        <div>
          <p className="text-sm">{new Date(row.createdAt).toLocaleDateString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(row.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
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
              setSelectedWithdrawal(row);
            }}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.status === 'pending' && (
            <>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(row.id);
                }}
                className="p-2 rounded-lg hover:bg-success/10 text-success transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(row.id);
                }}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const pendingCount = withdrawals?.filter((w: any) => w.status === 'pending').length || 0;
  const processedCount = withdrawals?.filter((w: any) => w.status === 'processed').length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
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
        <div className="flex gap-3">
          <div className="flex rounded-lg border overflow-hidden">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending' },
              { value: 'processed', label: 'Processed' },
              { value: 'rejected', label: 'Rejected' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  filterStatus === option.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-muted'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Gem className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold">{withdrawals?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processed</p>
              <p className="text-2xl font-bold text-success">{processedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <Gem className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Gold</p>
              <p className="text-2xl font-bold text-gold">
                {withdrawals?.filter((w: any) => w.assetType === 'gold' && w.status === 'pending')
                  .reduce((sum: number, w: any) => sum + (w.metalGrams || 0), 0).toFixed(1)}g
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredWithdrawals}
        emptyMessage="No withdrawal requests found"
        onRowClick={(row) => setSelectedWithdrawal(row)}
      />

      {/* Withdrawal Detail Modal */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={() => setSelectedWithdrawal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  selectedWithdrawal.assetType === 'gold' ? 'gradient-gold' : 'bg-silver'
                }`}>
                  <Gem className={`w-6 h-6 ${selectedWithdrawal.assetType === 'gold' ? 'text-primary' : 'text-gray-700'}`} />
                </div>
                <div>
                  <p className="font-semibold">{selectedWithdrawal.customerName}</p>
                  <p className="text-sm text-muted-foreground">{selectedWithdrawal.customerPhone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Scheme</p>
                  <p className="font-medium">{selectedWithdrawal.schemeName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Asset Type</p>
                  <p className={`font-medium capitalize ${
                    selectedWithdrawal.assetType === 'gold' ? 'text-gold' : 'text-silver'
                  }`}>
                    {selectedWithdrawal.assetType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Metal Weight</p>
                  <p className="font-medium font-mono">{selectedWithdrawal.metalGrams?.toFixed(2)}g</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={selectedWithdrawal.status} />
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Requested On</p>
                  <p className="font-medium">
                    {new Date(selectedWithdrawal.createdAt).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedWithdrawal.id)}
                    className="flex-1 py-3 rounded-lg bg-success text-success-foreground font-medium hover:bg-success/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedWithdrawal.id)}
                    className="flex-1 py-3 rounded-lg bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Withdrawals;
