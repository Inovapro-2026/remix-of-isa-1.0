import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, DollarSign, Clock, CheckCircle, TrendingUp, Wallet,
  ShoppingCart, Store, Eye, CreditCard, UserCheck, Loader2, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar
} from "recharts";

interface DashboardMetrics {
  totalClients: number;
  activeClients: number;
  pendingRequests: number;
  monthlyRevenue: number;
}

interface SalesMetrics {
  totalSales: number;
  totalValue: number;
  platformEarnings: number;
  sellerEarnings: number;
}

interface MonthlyRevenueData {
  month: string;
  value: number;
}

interface SystemLog {
  id: string;
  action: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [totalVitrineVisits, setTotalVitrineVisits] = useState({ total: 0, today: 0, week: 0 });
  const [recentActivity, setRecentActivity] = useState<SystemLog[]>([]);
  const [chartData, setChartData] = useState<MonthlyRevenueData[]>([]);
  const [visitsByDay, setVisitsByDay] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, is_active, expiration_date');

      const { count: pendingCount } = await supabase
        .from('account_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      const { data: renewalsData } = await supabase
        .from('plan_renewals')
        .select('amount, created_at, reviewed_at')
        .eq('status', 'approved');

      const monthlyData = calculateMonthlyRevenue(renewalsData || []);
      setChartData(monthlyData);

      const { data: logsData } = await supabase
        .from('system_logs')
        .select('id, action, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: salesData } = await supabase
        .from('sales')
        .select('total, platform_fee, seller_amount');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: visitsData } = await supabase
        .from('vitrine_visits')
        .select('visited_at')
        .order('visited_at', { ascending: false });

      if (visitsData) {
        const todayStr = today.toISOString();
        const weekStr = weekAgo.toISOString();
        
        const todayVisits = visitsData.filter(v => v.visited_at >= todayStr).length;
        const weekVisits = visitsData.filter(v => v.visited_at >= weekStr).length;
        
        setTotalVitrineVisits({
          total: visitsData.length,
          today: todayVisits,
          week: weekVisits
        });

        // Calculate visits by day
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
          return { day: dayNames[d.getDay()], visits: count };
        }));
      }

      if (salesData) {
        const totalValue = salesData.reduce((sum, s) => sum + (s.total || 0), 0);
        const platformEarnings = salesData.reduce((sum, s) => sum + (s.platform_fee || 0), 0);
        const sellerEarnings = salesData.reduce((sum, s) => sum + (s.seller_amount || 0), 0);

        setSalesMetrics({
          totalSales: salesData.length,
          totalValue,
          platformEarnings,
          sellerEarnings
        });
      }

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
      const [, month] = key.split('-');
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
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins}min`;
    if (diffMins < 1440) return `há ${Math.floor(diffMins / 60)}h`;
    return `há ${Math.floor(diffMins / 1440)}d`;
  };

  if (isLoading) {
    return (
      <DashboardLayout isAdmin>
        <div className="p-4 flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin>
      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Olá, {profile?.full_name?.split(' ')[0] || 'Admin'}!
            </p>
          </div>
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
            Online
          </Badge>
        </div>

        {/* Main Metrics - 2 columns on mobile */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clientes</p>
                  <p className="text-lg font-bold">{metrics?.totalClients || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <UserCheck className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ativos</p>
                  <p className="text-lg font-bold">{metrics?.activeClients || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Clock className="h-4 w-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-lg font-bold">{metrics?.pendingRequests || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">MRR</p>
                  <p className="text-lg font-bold">{formatCurrency(metrics?.monthlyRevenue || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Vendas</p>
                  <p className="text-xl font-bold text-purple-400">{salesMetrics?.totalSales || 0}</p>
                </div>
                <ShoppingCart className="h-5 w-5 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-cyan-400">{formatCurrency(salesMetrics?.totalValue || 0)}</p>
                </div>
                <DollarSign className="h-5 w-5 text-cyan-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Taxa</p>
                  <p className="text-lg font-bold text-green-400">{formatCurrency(salesMetrics?.platformEarnings || 0)}</p>
                </div>
                <CreditCard className="h-5 w-5 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Vendedores</p>
                  <p className="text-lg font-bold text-orange-400">{formatCurrency(salesMetrics?.sellerEarnings || 0)}</p>
                </div>
                <Wallet className="h-5 w-5 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vitrine Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-3 text-center">
              <Eye className="h-5 w-5 mx-auto text-cyan-400 mb-1" />
              <p className="text-lg font-bold">{totalVitrineVisits.today}</p>
              <p className="text-xs text-muted-foreground">Acessos Hoje</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3 text-center">
              <Store className="h-5 w-5 mx-auto text-blue-400 mb-1" />
              <p className="text-lg font-bold">{totalVitrineVisits.week}</p>
              <p className="text-xs text-muted-foreground">7 dias</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-3 text-center">
              <Activity className="h-5 w-5 mx-auto text-purple-400 mb-1" />
              <p className="text-lg font-bold">{totalVitrineVisits.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Chart */}
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Receita Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} hide />
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
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Acessos (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40">
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
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-border">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2 p-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nenhuma atividade</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
