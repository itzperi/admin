import { useQuery } from '@tanstack/react-query';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useEffect } from 'react';

// Dashboard Metrics - EXACT SQL QUERIES
export const useDashboardMetrics = () => {
  const query = useQuery({
    queryKey: ['dashboardMetrics'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return {
          totalCustomers: 0,
          activeSchemes: 0,
          todayCollections: 0,
          todayWithdrawals: 0,
          totalCollections: 0,
          totalWithdrawals: 0,
        };
      }

      const today = new Date().toISOString().split('T')[0];

      // 1. Total Customers: SELECT COUNT(*) FROM customers WHERE active = true
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      // 2. Active Schemes: SELECT COUNT(*) FROM user_schemes WHERE status = 'active'
      const { count: activeSchemes } = await supabase
        .from('user_schemes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 3. Today's Collections: SELECT SUM(amount) FROM payments WHERE payment_date = CURRENT_DATE AND status = 'completed'
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_date', today)
        .eq('status', 'completed');

      // 4. Today's Withdrawals: SELECT COUNT(*) FROM withdrawals WHERE created_at::date = CURRENT_DATE AND status = 'pending'
      const { count: todayWithdrawals } = await supabase
        .from('withdrawals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      // 5. Total Collections: SELECT SUM(amount) FROM payments WHERE status = 'completed'
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      // 6. Total Withdrawals: SELECT SUM(final_amount) FROM withdrawals WHERE status = 'processed'
      const { data: allWithdrawals } = await supabase
        .from('withdrawals')
        .select('final_amount')
        .eq('status', 'processed');

      return {
        totalCustomers: totalCustomers || 0,
        activeSchemes: activeSchemes || 0,
        todayCollections: todayPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0,
        todayWithdrawals: todayWithdrawals || 0,
        totalCollections: allPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0,
        totalWithdrawals: allWithdrawals?.reduce((sum, w) => sum + Number(w.final_amount || 0), 0) || 0,
      };
    },
    refetchInterval: 30000,
  });

  // Real-time subscription
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('dashboard-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_schemes' }, () => {
        query.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return query;
};

// Collection Trend (Last 30 days) - EXACT SQL: SELECT payment_date, SUM(amount) FROM payments WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days' AND status = 'completed' GROUP BY payment_date
export const useCollectionTrend = () => {
  const query = useQuery({
    queryKey: ['collectionTrend'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { data } = await supabase
        .from('payments')
        .select('payment_date, amount')
        .eq('status', 'completed')
        .gte('payment_date', startDate);

      // Group by date and sum amounts
      const grouped = (data || []).reduce((acc: Record<string, number>, payment) => {
        const date = payment.payment_date;
        acc[date] = (acc[date] || 0) + Number(payment.amount || 0);
        return acc;
      }, {});

      return Object.entries(grouped)
        .map(([date, total]) => ({ date, total }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('collection-trend')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Payment Method Distribution - EXACT SQL: SELECT payment_method, COUNT(*), SUM(amount) FROM payments WHERE status = 'completed' GROUP BY payment_method
export const usePaymentMethodDistribution = () => {
  const query = useQuery({
    queryKey: ['paymentMethodDistribution'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const { data } = await supabase
        .from('payments')
        .select('payment_method, amount')
        .eq('status', 'completed');

      const grouped = (data || []).reduce((acc: Record<string, { count: number; total: number }>, payment) => {
        const method = payment.payment_method || 'Unknown';
        if (!acc[method]) acc[method] = { count: 0, total: 0 };
        acc[method].count++;
        acc[method].total += Number(payment.amount || 0);
        return acc;
      }, {});

      return Object.entries(grouped).map(([method, stats]) => ({
        method: method === 'cash' ? 'Cash' : method === 'upi' ? 'UPI' : method === 'bank_transfer' ? 'Bank Transfer' : method,
        count: stats.count,
        total: stats.total,
      }));
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('payment-method-dist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Staff List - EXACT SQL: SELECT profiles.*, staff_metadata.*, assigned_customers_count, today_collections FROM profiles JOIN staff_metadata WHERE role = 'staff'
export const useStaffList = () => {
  const query = useQuery({
    queryKey: ['staffList'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const today = new Date().toISOString().split('T')[0];

      // Get all staff profiles with metadata
      const { data: staffProfiles } = await supabase
        .from('profiles')
        .select(`
          id, name, phone, email, active,
          staff_metadata(staff_code, staff_type, daily_target_amount, is_active)
        `)
        .eq('role', 'staff');

      if (!staffProfiles) return [];

      // For each staff, get assigned customers count and today's collections
      const staffWithStats = await Promise.all(
        staffProfiles.map(async (staff) => {
          const staffId = staff.id;
          const metadata = Array.isArray(staff.staff_metadata) ? staff.staff_metadata[0] : staff.staff_metadata;

          // Count assigned customers
          const { count: assignedCustomers } = await supabase
            .from('staff_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('staff_id', staffId)
            .eq('is_active', true);

          // Today's collections
          const { data: todayPayments } = await supabase
            .from('payments')
            .select('amount')
            .eq('staff_id', staffId)
            .eq('payment_date', today)
            .eq('status', 'completed');

          return {
            id: staff.id,
            name: staff.name,
            phone: staff.phone,
            email: staff.email,
            active: staff.active,
            staffCode: metadata?.staff_code || '',
            staffType: metadata?.staff_type || 'collection',
            dailyTarget: Number(metadata?.daily_target_amount || 0),
            isActive: metadata?.is_active !== false,
            assignedCustomers: assignedCustomers || 0,
            todayCollections: todayPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0,
          };
        })
      );

      return staffWithStats;
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('staff-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_metadata' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_assignments' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Staff Detail - Individual Staff: Staff performance, assigned customers, recent payments
export const useStaffDetail = (staffId: string) => {
  const query = useQuery({
    queryKey: ['staffDetail', staffId],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase || !staffId) {
        return null;
      }

      const today = new Date().toISOString().split('T')[0];

      // Get staff profile with metadata
      const { data: staff } = await supabase
        .from('profiles')
        .select(`
          *,
          staff_metadata(*)
        `)
        .eq('id', staffId)
        .single();

      if (!staff) return null;

      const metadata = Array.isArray(staff.staff_metadata) ? staff.staff_metadata[0] : staff.staff_metadata;

      // Today's collections
      const { data: todayPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('staff_id', staffId)
        .eq('payment_date', today)
        .eq('status', 'completed');

      // Total collections
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('staff_id', staffId)
        .eq('status', 'completed');

      // Assigned customers
      const { data: assignments } = await supabase
        .from('staff_assignments')
        .select(`
          *,
          customers!inner(
            id,
            profiles(name, phone)
          )
        `)
        .eq('staff_id', staffId)
        .eq('is_active', true);

      // Customers visited today
      const { data: todayVisits } = await supabase
        .from('payments')
        .select('customer_id')
        .eq('staff_id', staffId)
        .eq('payment_date', today)
        .eq('status', 'completed');

      // Recent payments (last 10)
      const { data: recentPayments } = await supabase
        .from('payments')
        .select(`
          id, amount, payment_date,
          customers!inner(profiles(name, phone)),
          user_schemes!inner(schemes(name))
        `)
        .eq('staff_id', staffId)
        .eq('status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(10);

      return {
        id: staff.id,
        name: staff.name,
        phone: staff.phone,
        email: staff.email,
        active: staff.active,
        staffCode: metadata?.staff_code || '',
        staffType: metadata?.staff_type || 'collection',
        dailyTarget: Number(metadata?.daily_target_amount || 0),
        isActive: metadata?.is_active !== false,
        todayCollections: todayPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0,
        totalCollections: allPayments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0,
        assignedCustomers: assignments?.length || 0,
        customersVisitedToday: new Set(todayVisits?.map(p => p.customer_id)).size || 0,
        assignedCustomersList: assignments?.map((a: any) => ({
          id: a.customers?.id,
          name: a.customers?.profiles?.name,
          phone: a.customers?.profiles?.phone,
          route: 'N/A',
          assignedDate: a.assigned_date,
        })) || [],
        recentPayments: recentPayments?.map((p: any) => ({
          id: p.id,
          customerName: p.customers?.profiles?.name,
          schemeName: p.user_schemes?.schemes?.name,
          amount: Number(p.amount || 0),
          date: p.payment_date,
        })) || [],
      };
    },
    enabled: !!staffId,
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase || !staffId) return;
    const channel = supabase
      .channel(`staff-detail-${staffId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `staff_id=eq.${staffId}` }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_assignments', filter: `staff_id=eq.${staffId}` }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [staffId]);

  return query;
};

// Schemes List - EXACT SQL: SELECT schemes.*, active_enrollments, total_collected, completed_enrollments FROM schemes
export const useSchemesList = () => {
  const query = useQuery({
    queryKey: ['schemesList'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const { data: schemes } = await supabase.from('schemes').select('*').order('created_at', { ascending: false });

      if (!schemes) return [];

      // For each scheme, calculate stats
      const schemesWithStats = await Promise.all(
        schemes.map(async (scheme) => {
          const schemeId = scheme.id;

          // Active enrollments
          const { count: activeEnrollments } = await supabase
            .from('user_schemes')
            .select('*', { count: 'exact', head: true })
            .eq('scheme_id', schemeId)
            .eq('status', 'active');

          // Total collected
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .in('user_scheme_id', 
              (await supabase.from('user_schemes').select('id').eq('scheme_id', schemeId)).data?.map(us => us.id) || []
            );

          // Completed enrollments
          const { count: completedEnrollments } = await supabase
            .from('user_schemes')
            .select('*', { count: 'exact', head: true })
            .eq('scheme_id', schemeId)
            .eq('status', 'completed');

          return {
            ...scheme,
            assetType: scheme.asset_type,
            minAmount: Number(scheme.min_daily_amount || 0),
            maxAmount: Number(scheme.max_daily_amount || 0),
            durationDays: (scheme.duration_months || 0) * 30,
            isActive: scheme.active,
            activeEnrollments: activeEnrollments || 0,
            totalCollected: payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0,
            completedEnrollments: completedEnrollments || 0,
          };
        })
      );

      return schemesWithStats;
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('schemes-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schemes' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_schemes' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Market Rates - EXACT SQL: Current: SELECT * FROM market_rates ORDER BY rate_date DESC LIMIT 1, History: SELECT * FROM market_rates WHERE rate_date >= CURRENT_DATE - INTERVAL '30 days'
export const useMarketRates = () => {
  const query = useQuery({
    queryKey: ['marketRates'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return { current: null, history: [] };
      }

      // Get latest rates for both gold and silver (separate records)
      const { data: latestRates } = await supabase
        .from('market_rates')
        .select('*')
        .order('rate_date', { ascending: false })
        .limit(10);

      // Find latest gold and silver rates
      const latestGold = latestRates?.find(r => r.asset_type === 'gold');
      const latestSilver = latestRates?.find(r => r.asset_type === 'silver');
      const latestDate = latestGold?.rate_date || latestSilver?.rate_date;

      // Current rate (combine latest gold and silver)
      const current = latestDate ? {
        goldRate: latestGold ? Number(latestGold.price_per_gram) : null,
        silverRate: latestSilver ? Number(latestSilver.price_per_gram) : null,
        rateDate: latestDate,
        source: latestGold?.source || latestSilver?.source || 'manual',
      } : null;

      // History (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: historyData } = await supabase
        .from('market_rates')
        .select('*')
        .gte('rate_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('rate_date', { ascending: false });

      // Group by date and combine gold/silver
      const groupedByDate: Record<string, { goldRate?: number; silverRate?: number; rateDate: string; source: string }> = {};
      
      historyData?.forEach((rate) => {
        const date = rate.rate_date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = { rateDate: date, source: rate.source };
        }
        if (rate.asset_type === 'gold') {
          groupedByDate[date].goldRate = Number(rate.price_per_gram);
        } else if (rate.asset_type === 'silver') {
          groupedByDate[date].silverRate = Number(rate.price_per_gram);
        }
      });

      const history = Object.values(groupedByDate).sort((a, b) => 
        new Date(b.rateDate).getTime() - new Date(a.rateDate).getTime()
      );

      return { current, history };
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('market-rates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_rates' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Withdrawals List - EXACT SQL: SELECT withdrawals.*, customer_name, scheme_name FROM withdrawals JOIN customers JOIN profiles JOIN user_schemes JOIN schemes
export const useWithdrawalsList = () => {
  const query = useQuery({
    queryKey: ['withdrawalsList'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select(`
          *,
          customers!inner(
            id,
            profiles(name, phone)
          ),
          user_schemes!inner(
            accumulated_metal_grams,
            schemes(name, asset_type)
          )
        `)
        .order('created_at', { ascending: false });

      if (!withdrawals) return [];

      return withdrawals.map((w: any) => ({
        id: w.id,
        customerName: w.customers?.profiles?.name || 'N/A',
        customerPhone: w.customers?.profiles?.phone || 'N/A',
        schemeName: w.user_schemes?.schemes?.name || 'N/A',
        assetType: w.user_schemes?.schemes?.asset_type || 'gold',
        metalGrams: Number(w.requested_grams || w.final_grams || 0),
        status: w.status,
        createdAt: w.created_at,
        requestedAmount: Number(w.requested_amount || 0),
        finalAmount: Number(w.final_amount || 0),
      }));
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('withdrawals-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Inflow Data - Daily collections by payment method, staff breakdown
export const useInflowData = (dateRange?: { start: string; end: string }) => {
  const query = useQuery({
    queryKey: ['inflowData', dateRange],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return { daily: [] };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = dateRange?.start || thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

      const { data: payments } = await supabase
        .from('payments')
        .select('payment_date, amount, payment_method, staff_id')
        .eq('status', 'completed')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (!payments) return { daily: [] };

      // Group by date
      const groupedByDate: Record<string, {
        date: string;
        paymentCount: number;
        totalAmount: number;
        cashTotal: number;
        upiTotal: number;
        bankTotal: number;
      }> = {};

      payments.forEach((p) => {
        const date = p.payment_date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date,
            paymentCount: 0,
            totalAmount: 0,
            cashTotal: 0,
            upiTotal: 0,
            bankTotal: 0,
          };
        }
        groupedByDate[date].paymentCount++;
        const amount = Number(p.amount || 0);
        groupedByDate[date].totalAmount += amount;
        if (p.payment_method === 'cash') groupedByDate[date].cashTotal += amount;
        else if (p.payment_method === 'upi') groupedByDate[date].upiTotal += amount;
        else if (p.payment_method === 'bank_transfer') groupedByDate[date].bankTotal += amount;
      });

      return { daily: Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date)) };
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('inflow-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Outflow Data - Daily withdrawals summary
export const useOutflowData = () => {
  const query = useQuery({
    queryKey: ['outflowData'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return { daily: [] };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('processed_at, final_amount')
        .eq('status', 'processed')
        .gte('processed_at', thirtyDaysAgo.toISOString())
        .order('processed_at', { ascending: false });

      if (!withdrawals) return { daily: [] };

      // Group by date
      const groupedByDate: Record<string, {
        date: string;
        withdrawalCount: number;
        totalAmount: number;
      }> = {};

      withdrawals.forEach((w) => {
        if (!w.processed_at) return;
        const date = new Date(w.processed_at).toISOString().split('T')[0];
        if (!groupedByDate[date]) {
          groupedByDate[date] = {
            date,
            withdrawalCount: 0,
            totalAmount: 0,
          };
        }
        groupedByDate[date].withdrawalCount++;
        groupedByDate[date].totalAmount += Number(w.final_amount || 0);
      });

      return { daily: Object.values(groupedByDate).sort((a, b) => a.date.localeCompare(b.date)) };
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('outflow-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Cash Flow Data - Net daily cash flow (inflow - outflow)
export const useCashFlowData = () => {
  const query = useQuery({
    queryKey: ['cashFlowData'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      // Get inflow (payments)
      const { data: payments } = await supabase
        .from('payments')
        .select('payment_date, amount')
        .eq('status', 'completed')
        .gte('payment_date', startDate);

      // Get outflow (withdrawals)
      const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('processed_at, final_amount')
        .eq('status', 'processed')
        .gte('processed_at', `${startDate}T00:00:00`);

      // Group by date
      const cashFlow: Record<string, { date: string; inflow: number; outflow: number; netCashFlow: number }> = {};

      // Process inflows
      payments?.forEach((p) => {
        const date = p.payment_date;
        if (!cashFlow[date]) {
          cashFlow[date] = { date, inflow: 0, outflow: 0, netCashFlow: 0 };
        }
        cashFlow[date].inflow += Number(p.amount || 0);
      });

      // Process outflows
      withdrawals?.forEach((w) => {
        if (!w.processed_at) return;
        const date = new Date(w.processed_at).toISOString().split('T')[0];
        if (!cashFlow[date]) {
          cashFlow[date] = { date, inflow: 0, outflow: 0, netCashFlow: 0 };
        }
        cashFlow[date].outflow += Number(w.final_amount || 0);
      });

      // Calculate net cash flow
      return Object.values(cashFlow)
        .map((cf) => ({
          ...cf,
          netCashFlow: cf.inflow - cf.outflow,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('cash-flow-data')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Access Control - Phone Numbers - Uses phone_whitelist table
export const useAccessControl = () => {
  const query = useQuery({
    queryKey: ['accessControl'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const { data } = await supabase
        .from('phone_whitelist')
        .select('*')
        .order('created_at', { ascending: false });

      if (!data) return [];

      // Enrich with profile data if available
      const enriched = await Promise.all(
        data.map(async (item) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, role')
            .eq('phone', item.phone)
            .single();

          return {
            id: item.phone,
            phone: item.phone,
            name: profile?.name || 'N/A',
            role: profile?.role || 'customer',
            isActive: item.active,
            createdAt: item.created_at,
            addedBy: item.added_by,
          };
        })
      );

      return enriched;
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('access-control')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'phone_whitelist' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Daily Report - Daily Collection Report
export const useDailyReport = (date?: string) => {
  const query = useQuery({
    queryKey: ['dailyReport', date],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return {
          totalPayments: 0,
          totalAmount: 0,
          uniqueCustomers: 0,
          activeStaff: 0,
          averagePayment: 0,
          byMethod: [],
          byStaff: [],
          payments: [],
        };
      }

      const targetDate = date || new Date().toISOString().split('T')[0];
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          *,
          customers!inner(profiles(name, phone)),
          profiles!payments_staff_id_fkey(name, staff_metadata(staff_code))
        `)
        .eq('status', 'completed')
        .eq('payment_date', targetDate);

      if (!payments || payments.length === 0) {
        return {
          totalPayments: 0,
          totalAmount: 0,
          uniqueCustomers: 0,
          activeStaff: 0,
          averagePayment: 0,
          byMethod: [],
          byStaff: [],
          payments: [],
        };
      }

      const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const uniqueCustomers = new Set(payments.map(p => p.customer_id)).size;
      const uniqueStaff = new Set(payments.filter(p => p.staff_id).map(p => p.staff_id)).size;

      // By method
      const byMethod: Record<string, { method: string; count: number; total: number }> = {};
      payments.forEach((p) => {
        const method = p.payment_method === 'cash' ? 'Cash' : p.payment_method === 'upi' ? 'UPI' : p.payment_method === 'bank_transfer' ? 'Bank Transfer' : 'Other';
        if (!byMethod[method]) byMethod[method] = { method, count: 0, total: 0 };
        byMethod[method].count++;
        byMethod[method].total += Number(p.amount || 0);
      });

      // By staff
      const byStaff: Record<string, { staffName: string; staffCode: string; paymentCount: number; totalCollected: number; customersVisited: Set<string> }> = {};
      payments.forEach((p) => {
        if (!p.staff_id) return;
        const staff = p.profiles as any;
        const staffName = staff?.name || 'Unknown';
        const staffCode = staff?.staff_metadata?.[0]?.staff_code || 'N/A';
        if (!byStaff[p.staff_id]) {
          byStaff[p.staff_id] = {
            staffName,
            staffCode,
            paymentCount: 0,
            totalCollected: 0,
            customersVisited: new Set(),
          };
        }
        byStaff[p.staff_id].paymentCount++;
        byStaff[p.staff_id].totalCollected += Number(p.amount || 0);
        byStaff[p.staff_id].customersVisited.add(p.customer_id);
      });

      return {
        totalPayments: payments.length,
        totalAmount,
        uniqueCustomers,
        activeStaff: uniqueStaff,
        averagePayment: totalAmount / payments.length,
        byMethod: Object.values(byMethod),
        byStaff: Object.values(byStaff).map(s => ({
          ...s,
          customersVisited: s.customersVisited.size,
        })),
        payments,
      };
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('daily-report')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Staff Performance Report
export const useStaffPerformanceReport = (startDate?: string, endDate?: string) => {
  const query = useQuery({
    queryKey: ['staffPerformanceReport', startDate, endDate],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      // Get all staff
      const { data: staffList } = await supabase
        .from('profiles')
        .select(`
          id, name,
          staff_metadata(staff_code, daily_target_amount)
        `)
        .eq('role', 'staff');

      if (!staffList) return [];

      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const performance = await Promise.all(
        staffList.map(async (staff) => {
          const staffId = staff.id;
          const metadata = Array.isArray(staff.staff_metadata) ? staff.staff_metadata[0] : staff.staff_metadata;
          const dailyTarget = Number(metadata?.daily_target_amount || 0);

          // Get payments in date range
          const { data: payments } = await supabase
            .from('payments')
            .select('amount, customer_id')
            .eq('staff_id', staffId)
            .eq('status', 'completed')
            .gte('payment_date', start)
            .lte('payment_date', end);

          // Get assigned customers
          const { count: assignedCustomers } = await supabase
            .from('staff_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('staff_id', staffId)
            .eq('is_active', true);

          const totalCollected = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
          const customersVisited = new Set(payments?.map(p => p.customer_id)).size || 0;
          const days = Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000)));
          const avgDailyCollection = totalCollected / days;
          const targetAchievement = dailyTarget > 0 ? (avgDailyCollection / dailyTarget) * 100 : 0;

          return {
            staffName: staff.name,
            staffCode: metadata?.staff_code || 'N/A',
            dailyTarget,
            totalPayments: payments?.length || 0,
            totalCollected,
            customersVisited,
            assignedCustomers: assignedCustomers || 0,
            targetAchievement: Math.round(targetAchievement),
          };
        })
      );

      return performance;
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('staff-performance-report')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_assignments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Customer Payment Report
export const useCustomerPaymentReport = (startDate?: string, endDate?: string) => {
  const query = useQuery({
    queryKey: ['customerPaymentReport', startDate, endDate],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      // Get all payments in date range with customer and scheme info
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          id, amount, payment_date,
          customers!inner(
            id,
            profiles(name, phone)
          ),
          user_schemes!inner(
            id,
            accumulated_metal_grams,
            total_amount_paid,
            schemes(name, min_daily_amount, max_daily_amount)
          )
        `)
        .eq('status', 'completed')
        .gte('payment_date', start)
        .lte('payment_date', end);

      if (!payments) return [];

      // Group by customer and scheme
      const grouped: Record<string, {
        customerName: string;
        phone: string;
        schemeName: string;
        totalPayments: number;
        totalPaid: number;
        metalGrams: number;
        dueAmount: number;
        lastPaymentDate: string;
      }> = {};

      payments.forEach((p: any) => {
        const key = `${p.customer_id}-${p.user_scheme_id}`;
        const customer = p.customers?.profiles;
        const scheme = p.user_schemes?.schemes;
        const userScheme = p.user_schemes;

        if (!grouped[key]) {
          grouped[key] = {
            customerName: customer?.name || 'Unknown',
            phone: customer?.phone || 'N/A',
            schemeName: scheme?.name || 'Unknown',
            totalPayments: 0,
            totalPaid: 0,
            metalGrams: Number(userScheme?.accumulated_metal_grams || 0),
            dueAmount: 0,
            lastPaymentDate: '',
          };
        }

        grouped[key].totalPayments++;
        grouped[key].totalPaid += Number(p.amount || 0);
        if (p.payment_date > grouped[key].lastPaymentDate) {
          grouped[key].lastPaymentDate = p.payment_date;
        }
      });

      // Calculate due amounts (simplified - would need scheme details)
      return Object.values(grouped).map((item) => ({
        ...item,
        dueAmount: 0, // Would need to calculate based on scheme requirements
      }));
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('customer-payment-report')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};

// Scheme Performance Report
export const useSchemePerformanceReport = () => {
  const query = useQuery({
    queryKey: ['schemePerformanceReport'],
    queryFn: async () => {
      if (!isSupabaseConfigured() || !supabase) {
        return [];
      }

      const { data: schemes } = await supabase.from('schemes').select('*');

      if (!schemes) return [];

      const performance = await Promise.all(
        schemes.map(async (scheme) => {
          const schemeId = scheme.id;

          // Get all enrollments
          const { data: enrollments } = await supabase
            .from('user_schemes')
            .select('id, status, accumulated_metal_grams, total_amount_paid')
            .eq('scheme_id', schemeId);

          // Get all payments for this scheme
          const userSchemeIds = enrollments?.map(e => e.id) || [];
          const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'completed')
            .in('user_scheme_id', userSchemeIds);

          const totalEnrollments = enrollments?.length || 0;
          const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
          const completedEnrollments = enrollments?.filter(e => e.status === 'completed').length || 0;
          const totalCollected = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
          const totalMetalGrams = enrollments?.reduce((sum, e) => sum + Number(e.accumulated_metal_grams || 0), 0) || 0;
          const avgPerEnrollment = totalEnrollments > 0 ? totalCollected / totalEnrollments : 0;

          return {
            schemeName: scheme.name,
            assetType: scheme.asset_type,
            totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            totalCollected,
            totalMetalGrams,
            avgPerEnrollment: Math.round(avgPerEnrollment),
          };
        })
      );

      return performance;
    },
  });

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;
    const channel = supabase
      .channel('scheme-performance-report')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_schemes' }, () => {
        query.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => {
        query.refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return query;
};
