import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Users, MessageSquare, DollarSign, Clock, CheckCircle, TrendingUp, Wallet,
  ShoppingCart, Store, Eye, CreditCard, AlertCircle, BarChart3, PieChart,
  ArrowUpRight, ArrowDownRight, Package, UserCheck, Loader2
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

interface VitrineAccess {
  vitrine_id: string;
  name: string;
  accessCount: number;
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
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [recentActivity, setRecentActivity] = useState<SystemLog[]>([]);
  const [chartData, setChartData] = useState<MonthlyRevenueData[]>([]);
  const [salesByStatus, setSalesByStatus] = useState<any[]>([]);
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
      
      const today = new Date().toISOString().split('T')[0];
      const clientsWithValidPlan = clientsData?.filter((c) =>
        Boolean(c.is_active) && (!c.expiration_date || c.expiration_date >= today)
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
        <div className="p-6 lg:p-8 flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Administrativo</h1>
            <p className="text-muted-foreground">
              Bem-vindo de volta, {profile?.full_name?.split(' ')[0] || 'Admin'}!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
              Sistema Online
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Vendas</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="vitrines" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="hidden sm:inline">Vitrines</span>
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <MetricCard
                title="Total de Clientes"
                value={metrics?.totalClients?.toString() || '0'}
                change={metrics?.clientGrowth || '+0 este mês'}
                changeType="positive"
                icon={Users}
                iconColor="text-blue-500"
              />
              <MetricCard
                title="Clientes Ativos"
                value={metrics?.activeClients?.toString() || '0'}
                change={`${metrics?.totalClients ? Math.round((metrics.activeClients / metrics.totalClients) * 100) : 0}% ativos`}
                changeType="neutral"
                icon={UserCheck}
                iconColor="text-green-500"
              />
              <MetricCard
                title="Solicitações"
                value={metrics?.pendingRequests?.toString() || '0'}
                change="Aguardando aprovação"
                changeType={metrics?.pendingRequests ? "neutral" : "positive"}
                icon={Clock}
                iconColor="text-yellow-500"
              />
              <MetricCard
                title="MRR"
                value={formatCurrency(metrics?.monthlyRevenue || 0)}
                change="R$ 97/plano ativo"
                changeType="positive"
                icon={TrendingUp}
                iconColor="text-purple-500"
              />
              <MetricCard
                title="Faturamento Total"
                value={formatCurrency(metrics?.totalRevenue || 0)}
                change="Renovações aprovadas"
                changeType="positive"
                icon={Wallet}
                iconColor="text-emerald-500"
              />
            </div>

            {/* Sales Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Vendas</p>
                      <p className="text-2xl font-bold text-purple-400">{salesMetrics?.totalSales || 0}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-purple-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                      <p className="text-2xl font-bold text-cyan-400">{formatCurrency(salesMetrics?.totalValue || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-cyan-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa Plataforma</p>
                      <p className="text-2xl font-bold text-green-400">{formatCurrency(salesMetrics?.platformEarnings || 0)}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ganho Vendedores</p>
                      <p className="text-2xl font-bold text-orange-400">{formatCurrency(salesMetrics?.sellerEarnings || 0)}</p>
                    </div>
                    <Wallet className="h-8 w-8 text-orange-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2 bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Receita por Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'Receita']}
                        />
                        <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#colorValue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Sales Status Pie */}
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Status das Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={salesByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {salesByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma atividade recente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SALES TAB */}
          <TabsContent value="sales" className="space-y-6 mt-6">
            {/* Sales Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <ShoppingCart className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{salesMetrics?.totalSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-yellow-500/20">
                      <Clock className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                      <p className="text-xl font-bold">{salesMetrics?.pendingSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-500/20">
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Concluídas</p>
                      <p className="text-xl font-bold">{salesMetrics?.completedSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-red-500/20">
                      <AlertCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Falhas</p>
                      <p className="text-xl font-bold">{salesMetrics?.failedSales || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border-purple-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-300">Valor Total em Vendas</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(salesMetrics?.totalValue || 0)}</p>
                      <p className="text-xs text-purple-400 mt-1">Todas as transações</p>
                    </div>
                    <div className="p-4 rounded-full bg-purple-500/20">
                      <DollarSign className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-600/20 to-green-800/10 border-green-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-300">Taxa da Plataforma (10%)</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(salesMetrics?.platformEarnings || 0)}</p>
                      <p className="text-xs text-green-400 mt-1">Seu ganho</p>
                    </div>
                    <div className="p-4 rounded-full bg-green-500/20">
                      <TrendingUp className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/10 border-cyan-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-300">Repasse aos Vendedores</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(salesMetrics?.sellerEarnings || 0)}</p>
                      <p className="text-xs text-cyan-400 mt-1">90% do valor</p>
                    </div>
                    <div className="p-4 rounded-full bg-cyan-500/20">
                      <Wallet className="h-8 w-8 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Sales Table */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Vendas Recentes
                </CardTitle>
                <CardDescription>Últimas 10 transações na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{sale.id.slice(0, 8)}...</p>
                          <p className="text-xs text-muted-foreground">{formatTimeAgo(sale.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(sale.payment_status)}>
                          {sale.payment_status}
                        </Badge>
                        <span className="font-semibold">{formatCurrency(sale.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CLIENTS TAB */}
          <TabsContent value="clients" className="space-y-6 mt-6">
            {/* Client Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto text-blue-400 mb-2" />
                  <p className="text-2xl font-bold">{metrics?.totalClients || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Clientes</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <UserCheck className="h-8 w-8 mx-auto text-green-400 mb-2" />
                  <p className="text-2xl font-bold">{metrics?.activeClients || 0}</p>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto text-yellow-400 mb-2" />
                  <p className="text-2xl font-bold">{metrics?.pendingRequests || 0}</p>
                  <p className="text-xs text-muted-foreground">Aguardando</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <Store className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                  <p className="text-2xl font-bold">{topSellers.filter(s => s.vitrine_id).length}</p>
                  <p className="text-xs text-muted-foreground">Com Vitrine</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Sellers Ranking */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Ranking de Vendedores
                </CardTitle>
                <CardDescription>Clientes que mais vendem na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSellers.map((seller, index) => (
                    <div key={seller.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                          index === 1 ? 'bg-gray-400/20 text-gray-300' :
                          index === 2 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}º
                        </div>
                        <div>
                          <p className="font-medium">{seller.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {seller.company} • Matrícula: {seller.matricula}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatCurrency(seller.totalRevenue)}</p>
                        <p className="text-xs text-muted-foreground">{seller.salesCount} vendas</p>
                      </div>
                    </div>
                  ))}
                  {topSellers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma venda registrada ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VITRINES TAB */}
          <TabsContent value="vitrines" className="space-y-6 mt-6">
            {/* Vitrine Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-4 text-center">
                  <Store className="h-8 w-8 mx-auto text-purple-400 mb-2" />
                  <p className="text-2xl font-bold">{topSellers.filter(s => s.vitrine_id).length}</p>
                  <p className="text-xs text-muted-foreground">Vitrines Ativas</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
                <CardContent className="p-4 text-center">
                  <Eye className="h-8 w-8 mx-auto text-cyan-400 mb-2" />
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-xs text-muted-foreground">Acessos Hoje</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-4 text-center">
                  <ShoppingCart className="h-8 w-8 mx-auto text-green-400 mb-2" />
                  <p className="text-2xl font-bold">{salesMetrics?.totalSales || 0}</p>
                  <p className="text-xs text-muted-foreground">Vendas via Vitrine</p>
                </CardContent>
              </Card>
            </div>

            {/* Vitrines List */}
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Vitrines dos Clientes
                </CardTitle>
                <CardDescription>Lista de todas as vitrines cadastradas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSellers.filter(s => s.vitrine_id).map((seller, index) => (
                    <div key={seller.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{seller.company || seller.name}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {seller.vitrine_id} • {seller.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-semibold">{seller.salesCount} vendas</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(seller.totalRevenue)}</p>
                        </div>
                        <a 
                          href={`/vitrine/${seller.vitrine_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </a>
                      </div>
                    </div>
                  ))}
                  {topSellers.filter(s => s.vitrine_id).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma vitrine cadastrada ainda</p>
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
