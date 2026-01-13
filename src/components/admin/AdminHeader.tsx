import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Search, User } from 'lucide-react';

const pathTitles: Record<string, { title: string; description: string }> = {
  '/admin/dashboard': { title: 'Dashboard', description: 'Overview of your business metrics' },
  '/admin/staff': { title: 'Staff Management', description: 'Manage your collection staff' },
  '/admin/schemes': { title: 'Schemes', description: 'Gold & Silver savings schemes' },
  '/admin/market-rates': { title: 'Market Rates', description: 'Current gold and silver prices' },
  '/admin/withdrawals': { title: 'Withdrawals', description: 'Customer withdrawal requests' },
  '/admin/financials/inflow': { title: 'Inflow', description: 'Track incoming payments' },
  '/admin/financials/outflow': { title: 'Outflow', description: 'Track outgoing payments' },
  '/admin/financials/cash-flow': { title: 'Cash Flow', description: 'Net cash flow analysis' },
  '/admin/reports/daily': { title: 'Daily Collection Report', description: "Today's collection summary" },
  '/admin/reports/staff-performance': { title: 'Staff Performance', description: 'Staff collection metrics' },
  '/admin/reports/customer-payment': { title: 'Customer Payment Report', description: 'Customer payment history' },
  '/admin/reports/scheme-performance': { title: 'Scheme Performance', description: 'Scheme-wise analytics' },
  '/admin/access-control': { title: 'Access Control', description: 'Manage phone number access' },
};

const AdminHeader: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const pageInfo = pathTitles[currentPath] || { title: 'Admin', description: '' };

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">{pageInfo.title}</h1>
          <p className="text-sm text-muted-foreground">{pageInfo.description}</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              className="w-64 pl-10 pr-4 py-2 text-sm rounded-lg bg-muted/50 border-0 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l">
            <div className="w-9 h-9 gradient-gold rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">Admin</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
