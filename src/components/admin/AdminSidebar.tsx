import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  LayoutDashboard,
  Users,
  Gem,
  TrendingUp,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  FileText,
  Phone,
  LogOut,
  Shield,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Staff Management', path: '/admin/staff' },
  { icon: Gem, label: 'Schemes', path: '/admin/schemes' },
  { icon: TrendingUp, label: 'Market Rates', path: '/admin/market-rates' },
  { icon: Wallet, label: 'Withdrawals', path: '/admin/withdrawals' },
];

const financialNavItems: NavItem[] = [
  { icon: ArrowDownCircle, label: 'Inflow', path: '/admin/financials/inflow' },
  { icon: ArrowUpCircle, label: 'Outflow', path: '/admin/financials/outflow' },
  { icon: BarChart3, label: 'Cash Flow', path: '/admin/financials/cash-flow' },
];

const reportNavItems: NavItem[] = [
  { icon: FileText, label: 'Daily Collection', path: '/admin/reports/daily' },
  { icon: Users, label: 'Staff Performance', path: '/admin/reports/staff-performance' },
  { icon: FileText, label: 'Customer Payment', path: '/admin/reports/customer-payment' },
  { icon: Gem, label: 'Scheme Performance', path: '/admin/reports/scheme-performance' },
];

const systemNavItems: NavItem[] = [
  { icon: Phone, label: 'Access Control', path: '/admin/access-control' },
];

const AdminSidebar: React.FC = () => {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const NavSection: React.FC<{ title: string; items: NavItem[] }> = ({ title, items }) => (
    <div className="mb-6">
      <h3 className="px-4 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link group ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-sidebar-primary text-sidebar-primary-foreground rounded-full">
                {item.badge}
              </span>
            )}
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 gradient-gold rounded-xl flex items-center justify-center shadow-gold">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sidebar-foreground">Admin Panel</h1>
            <p className="text-xs text-sidebar-foreground/50">Gold & Silver Schemes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 scrollbar-thin">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Financials" items={financialNavItems} />
        <NavSection title="Reports" items={reportNavItems} />
        <NavSection title="System" items={systemNavItems} />
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
