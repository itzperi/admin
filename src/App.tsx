import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import StaffManagement from "./pages/admin/StaffManagement";
import StaffDetail from "./pages/admin/StaffDetail";
import Schemes from "./pages/admin/Schemes";
import MarketRates from "./pages/admin/MarketRates";
import Withdrawals from "./pages/admin/Withdrawals";
import InflowReport from "./pages/admin/InflowReport";
import OutflowReport from "./pages/admin/OutflowReport";
import CashFlowReport from "./pages/admin/CashFlowReport";
import DailyReport from "./pages/admin/DailyReport";
import StaffPerformanceReport from "./pages/admin/StaffPerformanceReport";
import CustomerPaymentReport from "./pages/admin/CustomerPaymentReport";
import SchemePerformanceReport from "./pages/admin/SchemePerformanceReport";
import AccessControl from "./pages/admin/AccessControl";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminAuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/admin/login" replace />} />
            
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="staff/:id" element={<StaffDetail />} />
              <Route path="schemes" element={<Schemes />} />
              <Route path="market-rates" element={<MarketRates />} />
              <Route path="withdrawals" element={<Withdrawals />} />
              <Route path="financials/inflow" element={<InflowReport />} />
              <Route path="financials/outflow" element={<OutflowReport />} />
              <Route path="financials/cash-flow" element={<CashFlowReport />} />
              <Route path="reports/daily" element={<DailyReport />} />
              <Route path="reports/staff-performance" element={<StaffPerformanceReport />} />
              <Route path="reports/customer-payment" element={<CustomerPaymentReport />} />
              <Route path="reports/scheme-performance" element={<SchemePerformanceReport />} />
              <Route path="access-control" element={<AccessControl />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
