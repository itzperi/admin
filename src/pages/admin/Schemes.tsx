import React, { useState } from 'react';
import { useSchemesList } from '@/hooks/useAdminData';
import { Plus, Search, Gem, CircleDollarSign, Users, TrendingUp } from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString()}`;
};

const Schemes: React.FC = () => {
  const { data: schemes } = useSchemesList();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gold' | 'silver'>('all');

  const filteredSchemes = schemes?.filter((scheme: any) => {
    const matchesSearch = scheme.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || scheme.assetType === filterType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search schemes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex rounded-lg border overflow-hidden">
            {['all', 'gold', 'silver'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  filterType === type 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-muted'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Scheme
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Schemes</p>
          <p className="text-2xl font-bold mt-1">{schemes?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Active Enrollments</p>
          <p className="text-2xl font-bold mt-1 text-success">
            {schemes?.reduce((sum: number, s: any) => sum + (s.activeEnrollments || 0), 0) || 0}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Total Collected</p>
          <p className="text-2xl font-bold mt-1 text-gold">
            {formatCurrency(schemes?.reduce((sum: number, s: any) => sum + (s.totalCollected || 0), 0) || 0)}
          </p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Completed</p>
          <p className="text-2xl font-bold mt-1">
            {schemes?.reduce((sum: number, s: any) => sum + (s.completedEnrollments || 0), 0) || 0}
          </p>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchemes.map((scheme: any) => (
          <div 
            key={scheme.id}
            className="bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
          >
            {/* Header */}
            <div className={`p-4 ${scheme.assetType === 'gold' ? 'gradient-gold' : 'bg-gradient-to-r from-silver to-silver-light'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    scheme.assetType === 'gold' ? 'bg-primary/20' : 'bg-white/20'
                  }`}>
                    <Gem className={`w-5 h-5 ${scheme.assetType === 'gold' ? 'text-primary' : 'text-gray-700'}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${scheme.assetType === 'gold' ? 'text-primary' : 'text-gray-800'}`}>
                      {scheme.name}
                    </h3>
                    <p className={`text-xs capitalize ${scheme.assetType === 'gold' ? 'text-primary/70' : 'text-gray-600'}`}>
                      {scheme.assetType} Scheme
                    </p>
                  </div>
                </div>
                <StatusBadge status={scheme.isActive ? 'active' : 'inactive'} />
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Min Amount</p>
                  <p className="font-semibold">₹{scheme.minAmount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Max Amount</p>
                  <p className="font-semibold">₹{scheme.maxAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold">{scheme.durationDays} days</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="font-semibold text-success">{scheme.activeEnrollments}</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="w-4 h-4 text-gold" />
                    <span className="text-sm font-medium">{formatCurrency(scheme.totalCollected)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{scheme.completedEnrollments} completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSchemes.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border">
          <Gem className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No schemes found</p>
        </div>
      )}
    </div>
  );
};

export default Schemes;
