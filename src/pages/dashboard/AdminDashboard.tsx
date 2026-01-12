import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, MessageSquare, DollarSign, Clock, CheckCircle, TrendingUp, Wallet,
  ShoppingCart, Store, Eye, CreditCard, AlertCircle, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Package, UserCheck, Loader2, ExternalLink,
  Calendar, Activity, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SkeletonCard, SkeletonList } from "@/components/ui/skeleton-card";
import { useAuth } from "@/hooks/useAuth";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart as RechartsPie, Pie, Cell, Legend,
  LineChart, Line
} from "recharts";

interface DashboardMetrics {
  totalClients: number;
  activeClients: number;
  pendingRequests: number;
  monthlyRevenue: number;
  totalRevenue: number;
  clientGrowth: string;
}

interface SalesMetrics {
  totalSales: number;
  pendingSales: number;
  completedSales: number;
  failedSales: number;
  totalValue: number;
  platformEarnings: number;
  sellerEarnings: number;
}

interface TopSeller {
  id: string;
  name: string;
  company: string;
  matricula: string;
  vitrine_id: string;
  salesCount: number;
  totalRevenue: number;
}

interface VitrineStats {
  vitrine_id: string;
  name: string;
  company: string;
  totalVisits: number;
  todayVisits: number;
  weekVisits: number;
  uniqueVisitors: number;
  salesCount: number;
}

interface SystemLog {
  id: string;
  action: string;
  created_at: string;
  details: unknown;
}

interface MonthlyRevenueData {
  month: string;
  value: number;
  sales?: number;
}

interface RecentSale {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_phone?: string;
}

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [vitrineStats, setVitrineStats] = useState<VitrineStats[]>([]);
  const [totalVitrineVisits, setTotalVitrineVisits] = useState({ total: 0, today: 0, week: 0 });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [recentActivity, setRecentActivity] = useState<SystemLog[]>([]);
  const [chartData, setChartData] = useState<MonthlyRevenueData[]>([]);
  const [salesByStatus, setSalesByStatus] = useState<any[]>([]);
  const [visitsByDay, setVisitsByDay] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch clients count with expiration date
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, user_id, full_name, company_name, matricula, vitrine_id, is_active, expiration_date');

      // Fetch pending requests count
      const { count: pendingCount } = await supabase
        .from('account_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      // Fetch approved requests this month for MRR calculation
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: approvedThisMonth } = await supabase
        .from('account_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'approved')
        .gte('reviewed_at', startOfMonth.toISOString());

      // Fetch approved renewals for total revenue
      const { data: renewalsData } = await supabase
        .from('plan_renewals')
        .select('amount, created_at, reviewed_at')
        .eq('status', 'approved');

      const totalRenewalRevenue = renewalsData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      // Calculate monthly revenue data for chart
      const monthlyData = calculateMonthlyRevenue(renewalsData || []);
      setChartData(monthlyData);

      // Fetch recent activity from system_logs
      const { data: logsData } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch all sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch vitrine visits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: visitsData } = await supabase
        .from('vitrine_visits')
        .select('*')
        .order('visited_at', { ascending: false });

      // Process vitrine visit stats
      if (visitsData && clientsData) {
        const todayStr = today.toISOString();
        const weekStr = weekAgo.toISOString();
        
        const todayVisits = visitsData.filter(v => v.visited_at >= todayStr).length;
        const weekVisits = visitsData.filter(v => v.visited_at >= weekStr).length;
        
        setTotalVitrineVisits({
          total: visitsData.length,
          today: todayVisits,
          week: weekVisits
        });

        // Group visits by vitrine
        const visitsByVitrine = new Map<string, { total: number; today: number; week: number; sessions: Set<string> }>();
        visitsData.forEach(visit => {
          const existing = visitsByVitrine.get(visit.vitrine_id) || { total: 0, today: 0, week: 0, sessions: new Set() };
          existing.total++;
          if (visit.visited_at >= todayStr) existing.today++;
          if (visit.visited_at >= weekStr) existing.week++;
          if (visit.session_id) existing.sessions.add(visit.session_id);
          visitsByVitrine.set(visit.vitrine_id, existing);
        });

        // Calculate sales per seller
        const salesByVitrine = new Map<string, number>();
        salesData?.forEach(sale => {
          const client = clientsData.find(c => c.user_id === sale.seller_id);
          if (client?.vitrine_id) {
            salesByVitrine.set(client.vitrine_id, (salesByVitrine.get(client.vitrine_id) || 0) + 1);
          }
        });

        // Build vitrine stats
        const statsArray: VitrineStats[] = clientsData
          .filter(c => c.vitrine_id)
          .map(client => {
            const visits = visitsByVitrine.get(client.vitrine_id!) || { total: 0, today: 0, week: 0, sessions: new Set() };
            return {
              vitrine_id: client.vitrine_id!,
              name: client.full_name,
              company: client.company_name || '',
              totalVisits: visits.total,
              todayVisits: visits.today,
              weekVisits: visits.week,
              uniqueVisitors: visits.sessions.size,
              salesCount: salesByVitrine.get(client.vitrine_id!) || 0
            };
          })
          .sort((a, b) => b.totalVisits - a.totalVisits);

        setVitrineStats(statsArray);

        // Calculate visits by day for chart
        const last7Days: { [key: string]: number } = {};
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split('T')[0];
          last7Days[key] = 0;
        }
        
        visitsData.forEach(v => {
          const dateKey = v.visited_at.split('T')[0];
          if (last7Days[dateKey] !== undefined) {
            last7Days[dateKey]++;
          }
        });

        setVisitsByDay(Object.entries(last7Days).map(([date, count]) => {
          const d = new Date(date);
          return { day: dayNames[d.getDay()], visits: count, date };
        }));
      }

      // Process sales metrics
      if (salesData) {
        const pending = salesData.filter(s => s.status === 'pending' && s.payment_status !== 'paid');
        const completed = salesData.filter(s => s.status === 'completed' || s.payment_status === 'paid');
        const failed = salesData.filter(s => s.status === 'failed' || s.payment_status === 'failed');

        const totalValue = salesData.reduce((sum, s) => sum + (s.total || 0), 0);
        const platformEarnings = salesData.reduce((sum, s) => sum + (s.platform_fee || 0), 0);
        const sellerEarnings = salesData.reduce((sum, s) => sum + (s.seller_amount || 0), 0);

        setSalesMetrics({
          totalSales: salesData.length,
          pendingSales: pending.length,
          completedSales: completed.length,
          failedSales: failed.length,
          totalValue,
          platformEarnings,
          sellerEarnings
        });

        // Sales by status for pie chart
        setSalesByStatus([
          { name: 'Pendentes', value: pending.length, color: '#F59E0B' },
          { name: 'Concluídas', value: completed.length, color: '#10B981' },
          { name: 'Falhas', value: failed.length, color: '#EF4444' }
        ]);

        setRecentSales(salesData.slice(0, 10));
      }

      // Calculate top sellers
      const sellerStats = new Map<string, { count: number; revenue: number }>();
      salesData?.forEach(sale => {
        const existing = sellerStats.get(sale.seller_id) || { count: 0, revenue: 0 };
        sellerStats.set(sale.seller_id, {
          count: existing.count + 1,
          revenue: existing.revenue + (sale.total || 0)
        });
      });

      const topSellersData: TopSeller[] = (clientsData || [])
        .map(client => {
          const stats = sellerStats.get(client.user_id || '') || { count: 0, revenue: 0 };
          return {
            id: client.id,
            name: client.full_name,
            company: client.company_name || '',
            matricula: client.matricula,
            vitrine_id: client.vitrine_id || '',
            salesCount: stats.count,
            totalRevenue: stats.revenue
          };
        })
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);

      setTopSellers(topSellersData);

      const totalClients = clientsData?.length || 0;
      const activeClients = clientsData?.filter(c => c.is_active)?.length || 0;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const clientsWithValidPlan = clientsData?.filter((c) =>
        Boolean(c.is_active) && (!c.expiration_date || c.expiration_date >= todayStr)
      )?.length || 0;
      const mrr = clientsWithValidPlan * 97;

      setMetrics({
        totalClients,
        activeClients,
        pendingRequests: pendingCount || 0,
        monthlyRevenue: mrr,
        totalRevenue: totalRenewalRevenue,
        clientGrowth: `+${approvedThisMonth || 0} este mês`,
      });

      setRecentActivity(logsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyRevenue = (renewals: { amount: number; created_at: string; reviewed_at: string | null }[]) => {
    const months: { [key: string]: number } = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    renewals.forEach(r => {
      const date = new Date(r.reviewed_at || r.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (months[key] !== undefined) {
        months[key] += r.amount || 0;
      }
    });

    return Object.entries(months).map(([key, value]) => {
      const [year, month] = key.split('-');
      return {
        month: monthNames[parseInt(month) - 1],
        value
      };
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffMins < 1440) return `há ${Math.floor(diffMins / 60)} horas`;
    return `há ${Math.floor(diffMins / 1440)} dias`;
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed':
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
      case 'awaiting_payment':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'failed':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout isAdmin>
        <div className="p-4 md:p-6 lg:p-8 flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Dashboard Administrativo</h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Bem-vindo de volta, {profile?.full_name?.split(' ')[0] || 'Admin'}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
              Online
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full overflow-x-auto flex justify-start md:justify-start gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Visão Geral</span>
              <span className="xs:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <ShoppingCart className="h-3 w-3 md:h-4 md:w-4" />
              <span>Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span>Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="vitrines" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-4">
              <Store className="h-3 w-3 md:h-4 md:w-4" />
              <span>Vitrines</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {/* Main Metrics - Scrollable on mobile */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-blue-500/20 shrink-0">
                      <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Clientes</p>
                      <p className="text-lg md:text-xl font-bold">{metrics?.totalClients || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-green-500/20 shrink-0">
                      <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Ativos</p>
                      <p className="text-lg md:text-xl font-bold">{metrics?.activeClients || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-yellow-500/20 shrink-0">
                      <Clock className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Pendentes</p>
                      <p className="text-lg md:text-xl font-bold">{metrics?.pendingRequests || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-purple-500/20 shrink-0">
                      <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">MRR</p>
                      <p className="text-lg md:text-xl font-bold">{formatCurrency(metrics?.monthlyRevenue || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 col-span-2 md:col-span-1">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-cyan-500/20 shrink-0">
                      <Eye className="h-4 w-4 md:h-5 md:w-5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">Acessos Hoje</p>
                      <p className="text-lg md:text-xl font-bold">{totalVitrineVisits.today}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Total Vendas</p>
                      <p className="text-xl md:text-2xl font-bold text-purple-400">{salesMetrics?.totalSales || 0}</p>
                    </div>
                    <ShoppingCart className="h-6 w-6 md:h-8 md:w-8 text-purple-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-lg md:text-2xl font-bold text-cyan-400">{formatCurrency(salesMetrics?.totalValue || 0)}</p>
                    </div>
                    <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-cyan-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Taxa Plataforma</p>
                      <p className="text-lg md:text-2xl font-bold text-green-400">{formatCurrency(salesMetrics?.platformEarnings || 0)}</p>
                    </div>
                    <CreditCard className="h-6 w-6 md:h-8 md:w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-muted-foreground">Vendedores</p>
                      <p className="text-lg md:text-2xl font-bold text-orange-400">{formatCurrency(salesMetrics?.sellerEarnings || 0)}</p>
                    </div>
                    <Wallet className="h-6 w-6 md:h-8 md:w-8 text-orange-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2 bg-card/50 backdrop-blur">
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    Receita por Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickFormatter={(value) => `R$${value}`} hide={window.innerWidth < 768} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Visits Chart */}
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader className="pb-2 md:pb-4">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Activity className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" />
                    Acessos (7 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={visitsByDay}>
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [value, 'Acessos']}
                        />
                        <Bar dataKey="visits" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-accent" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-2 md:space-y-3">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2 md:gap-3 pb-2 md:pb-3 border-b border-border last:border-0 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 md:py-8 text-muted-foreground">
                    <p className="text-sm">Nenhuma atividade recente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SALES TAB */}
          <TabsContent value="sales" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {/* Sales Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-blue-500/20 shrink-0">
                      <ShoppingCart className="h-4 w-4 md:h-6 md:w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg md:text-xl font-bold">{salesMetrics?.totalSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-yellow-500/20 shrink-0">
                      <Clock className="h-4 w-4 md:h-6 md:w-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                      <p className="text-lg md:text-xl font-bold">{salesMetrics?.pendingSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-green-500/20 shrink-0">
                      <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Concluídas</p>
                      <p className="text-lg md:text-xl font-bold">{salesMetrics?.completedSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="p-2 md:p-3 rounded-xl bg-red-500/20 shrink-0">
                      <AlertCircle className="h-4 w-4 md:h-6 md:w-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Falhas</p>
                      <p className="text-lg md:text-xl font-bold">{salesMetrics?.failedSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border-purple-500/30">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-purple-300">Valor Total em Vendas</p>
                      <p className="text-xl md:text-3xl font-bold text-white">{formatCurrency(salesMetrics?.totalValue || 0)}</p>
                      <p className="text-xs text-purple-400 mt-1">Todas as transações</p>
                    </div>
                    <div className="p-3 md:p-4 rounded-full bg-purple-500/20 hidden sm:block">
                      <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-600/20 to-green-800/10 border-green-500/30">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-green-300">Taxa Plataforma (10%)</p>
                      <p className="text-xl md:text-3xl font-bold text-white">{formatCurrency(salesMetrics?.platformEarnings || 0)}</p>
                      <p className="text-xs text-green-400 mt-1">Seu ganho</p>
                    </div>
                    <div className="p-3 md:p-4 rounded-full bg-green-500/20 hidden sm:block">
                      <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/10 border-cyan-500/30">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs md:text-sm text-cyan-300">Repasse Vendedores</p>
                      <p className="text-xl md:text-3xl font-bold text-white">{formatCurrency(salesMetrics?.sellerEarnings || 0)}</p>
                      <p className="text-xs text-cyan-400 mt-1">90% do valor</p>
                    </div>
                    <div className="p-3 md:p-4 rounded-full bg-cyan-500/20 hidden sm:block">
                      <Wallet className="h-6 w-6 md:h-8 md:w-8 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales Table */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Vendas Recentes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Últimas 10 transações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 shrink-0">
                          <Package className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs md:text-sm font-medium truncate">{sale.id.slice(0, 8)}...</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(sale.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <Badge className={`${getStatusColor(sale.payment_status)} text-xs`}>
                          {sale.payment_status}
                        </Badge>
                        <span className="text-sm md:text-base font-semibold">{formatCurrency(sale.total)}</span>
                      </div>
                    </div>
                  ))}
                  {recentSales.length === 0 && (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      <ShoppingCart className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma venda registrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLIENTS TAB */}
          <TabsContent value="clients" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {/* Client Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <Users className="h-6 w-6 md:h-8 md:w-8 mx-auto text-blue-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{metrics?.totalClients || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <UserCheck className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{metrics?.activeClients || 0}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <Clock className="h-6 w-6 md:h-8 md:w-8 mx-auto text-yellow-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{metrics?.pendingRequests || 0}</p>
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <Store className="h-6 w-6 md:h-8 md:w-8 mx-auto text-purple-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{topSellers.filter(s => s.vitrine_id).length}</p>
                  <p className="text-xs text-muted-foreground">Com Vitrine</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Sellers Ranking */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Ranking de Vendedores
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Top vendedores da plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {topSellers.map((seller, index) => (
                    <div key={seller.id} className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
                        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shrink-0 ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}º
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{seller.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {seller.company}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-primary text-sm md:text-base">{formatCurrency(seller.totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{seller.salesCount} vendas</p>
                      </div>
                    </div>
                  ))}
                  {topSellers.length === 0 && (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      <Users className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma venda registrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VITRINES TAB */}
          <TabsContent value="vitrines" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {/* Vitrine Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <Store className="h-6 w-6 md:h-8 md:w-8 mx-auto text-purple-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{vitrineStats.length}</p>
                  <p className="text-xs text-muted-foreground">Vitrines Ativas</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <Eye className="h-6 w-6 md:h-8 md:w-8 mx-auto text-cyan-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{totalVitrineVisits.today}</p>
                  <p className="text-xs text-muted-foreground">Acessos Hoje</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <Calendar className="h-6 w-6 md:h-8 md:w-8 mx-auto text-blue-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{totalVitrineVisits.week}</p>
                  <p className="text-xs text-muted-foreground">Acessos 7 dias</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-3 md:p-4 text-center">
                  <Globe className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-400 mb-1 md:mb-2" />
                  <p className="text-xl md:text-2xl font-bold">{totalVitrineVisits.total}</p>
                  <p className="text-xs text-muted-foreground">Total Acessos</p>
                </CardContent>
              </Card>
            </div>

            {/* Vitrines List */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Store className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  Vitrines dos Clientes
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Estatísticas de acesso por vitrine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {vitrineStats.map((vitrine, index) => (
                    <div key={vitrine.vitrine_id} className="p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <div className="p-2 md:p-3 rounded-xl bg-primary/10 shrink-0">
                            <Store className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm md:text-base truncate">{vitrine.company || vitrine.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              ID: {vitrine.vitrine_id}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-8 w-8 p-0"
                          onClick={() => window.open(`/vitrine/${vitrine.vitrine_id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-cyan-500/10">
                          <p className="text-lg md:text-xl font-bold text-cyan-400">{vitrine.todayVisits}</p>
                          <p className="text-xs text-muted-foreground">Hoje</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <p className="text-lg md:text-xl font-bold text-blue-400">{vitrine.weekVisits}</p>
                          <p className="text-xs text-muted-foreground">7 dias</p>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <p className="text-lg md:text-xl font-bold text-purple-400">{vitrine.totalVisits}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <p className="text-lg md:text-xl font-bold text-green-400">{vitrine.salesCount}</p>
                          <p className="text-xs text-muted-foreground">Vendas</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {vitrineStats.length === 0 && (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                      <Store className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma vitrine cadastrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
