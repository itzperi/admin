import React, { useState } from 'react';
import { useMarketRates } from '@/hooks/useAdminData';
import { TrendingUp, TrendingDown, RefreshCw, Plus, Gem } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const MarketRates: React.FC = () => {
  const { data, refetch } = useMarketRates();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const currentRates = data?.current;
  const history = data?.history || [];

  // Calculate change
  const previousGold = history[1]?.goldRate || currentRates?.goldRate;
  const previousSilver = history[1]?.silverRate || currentRates?.silverRate;
  const goldChange = ((currentRates?.goldRate - previousGold) / previousGold * 100).toFixed(2);
  const silverChange = ((currentRates?.silverRate - previousSilver) / previousSilver * 100).toFixed(2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Last updated: {currentRates?.rateDate ? new Date(currentRates.rateDate).toLocaleDateString('en-IN', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }) : 'N/A'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Source: {currentRates?.source || 'N/A'}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleRefresh}
            className="btn-secondary flex items-center gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Update Rates
          </button>
        </div>
      </div>

      {/* Current Rates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gold Rate */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="gradient-gold p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Gem className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">Gold Rate</h3>
                <p className="text-xs text-primary/70">Per gram (24K)</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-display font-bold">₹{currentRates?.goldRate?.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">per gram</p>
              </div>
              <div className={`flex items-center gap-1 ${parseFloat(goldChange) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {parseFloat(goldChange) >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="font-semibold">{goldChange}%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">22K</p>
                <p className="font-semibold">₹{Math.round((currentRates?.goldRate || 0) * 0.916).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">18K</p>
                <p className="font-semibold">₹{Math.round((currentRates?.goldRate || 0) * 0.75).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">10g (24K)</p>
                <p className="font-semibold">₹{((currentRates?.goldRate || 0) * 10).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Silver Rate */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="bg-gradient-to-r from-silver to-silver-light p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Gem className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Silver Rate</h3>
                <p className="text-xs text-gray-600">Per gram (999)</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-4xl font-display font-bold">₹{currentRates?.silverRate?.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground mt-1">per gram</p>
              </div>
              <div className={`flex items-center gap-1 ${parseFloat(silverChange) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {parseFloat(silverChange) >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="font-semibold">{silverChange}%</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">925</p>
                <p className="font-semibold">₹{((currentRates?.silverRate || 0) * 0.925).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">100g</p>
                <p className="font-semibold">₹{((currentRates?.silverRate || 0) * 100).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">1 Kg</p>
                <p className="font-semibold">₹{((currentRates?.silverRate || 0) * 1000).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate History Chart */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Rate History (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={history.slice().reverse()}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="rateDate" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            />
            <YAxis 
              yAxisId="gold"
              orientation="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <YAxis 
              yAxisId="silver"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line 
              yAxisId="gold"
              type="monotone" 
              dataKey="goldRate" 
              name="Gold (₹/g)"
              stroke="hsl(45, 93%, 58%)" 
              strokeWidth={2}
              dot={false}
            />
            <Line 
              yAxisId="silver"
              type="monotone" 
              dataKey="silverRate" 
              name="Silver (₹/g)"
              stroke="hsl(220, 9%, 70%)" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Rate History Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Rate History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Gold (₹/g)</th>
                <th>Silver (₹/g)</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 10).map((rate: any, index: number) => (
                <tr key={index}>
                  <td>{new Date(rate.rateDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="font-medium text-gold">₹{rate.goldRate?.toLocaleString()}</td>
                  <td className="font-medium">₹{rate.silverRate?.toFixed(2)}</td>
                  <td className="text-muted-foreground">{rate.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketRates;
