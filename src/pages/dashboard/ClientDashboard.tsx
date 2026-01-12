import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  Wallet,
  ShoppingCart,
  CheckCircle,
  Clock,
  TrendingUp,
  RefreshCw,
  Package,
  Calendar,
  ArrowUpRight,
  Wifi,
  WifiOff,
  Bot,
  Zap,
  MessageSquare,
  Bell,
  BellOff,
  ArrowDownRight,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { clientWhatsAppISA } from "@/services/clientWhatsAppISA";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { StatusIndicator } from "@/components/StatusIndicator";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

interface WhatsAppInstance {
  id: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  is_ai_active: boolean | null;
  instance_name: string;
  phone_number: string | null;
}

interface SellerBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface DashboardMetrics {
  totalRevenue: number;
  availableBalance: number;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  weeklyData: { day: string; revenue: number; orders: number }[];
  monthlyData: { month: string; revenue: number; orders: number }[];
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  monthGrowth: number;
}

const ClientDashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { isSupported: notificationsSupported, permission, requestPermission } = usePushNotifications();
  const [whatsappInstance, setWhatsappInstance] = useState<WhatsAppInstance | null>(null);
  const [connectedWhatsAppNumber, setConnectedWhatsAppNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    availableBalance: 0,
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    weeklyData: [],
    monthlyData: [],
    currentMonthRevenue: 0,
    lastMonthRevenue: 0,
    monthGrowth: 0,
  });
  const [clientData, setClientData] = useState<{ matricula: string; full_name: string } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const matricula = profile?.matricula || clientData?.matricula || "";
  const displayName = profile?.full_name || clientData?.full_name || "Cliente";

  const sessionKey = useMemo(() => {
    const cpfDigits = profile?.cpf?.replace(/\D/g, "");
    return cpfDigits || user?.id || "";
  }, [profile?.cpf, user?.id]);

  // Buscar dados do cliente
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!user || !profile?.email) return;
      if (profile?.matricula) return;
      
      const { data } = await supabase
        .from('clients')
        .select('matricula, full_name')
        .eq('email', profile.email)
        .maybeSingle();
      
      if (data) {
        setClientData(data);
      }
    };
    
    fetchClientInfo();
  }, [user, profile]);

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Buscar instância WhatsApp
      const { data: instanceData } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setWhatsappInstance(instanceData);

      // Buscar número real da instância
      if (sessionKey) {
        try {
          const statusRes = await clientWhatsAppISA.getSessionStatus(sessionKey);
          const raw = statusRes?.dbStatus?.phone_info?.id
            ? String(statusRes.dbStatus.phone_info.id).split(':')[0]
            : null;
          setConnectedWhatsAppNumber(raw);
        } catch {
          setConnectedWhatsAppNumber(null);
        }
      }

      // ========== DADOS REAIS DE VENDAS ==========
      
      // 1. Buscar saldo do vendedor
      const { data: balanceData } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const balance: SellerBalance = balanceData || {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      };

      // 2. Buscar todas as vendas do usuário
      const { data: salesData } = await supabase
        .from('sales')
        .select('id, status, total, seller_amount, created_at, payment_status, delivery_status')
        .eq('seller_id', user.id);

      const sales = salesData || [];

      // 3. Calcular métricas reais
      const completedSales = sales.filter(s => 
        s.status === 'completed' || 
        s.payment_status === 'approved' ||
        s.delivery_status === 'delivered'
      );
      
      const pendingSales = sales.filter(s => 
        s.status === 'pending' || 
        s.status === 'analyzing' ||
        s.status === 'delivering' ||
        (s.payment_status === 'pending' && s.status !== 'completed')
      );

      // Faturamento total (vendas aprovadas/concluídas)
      const totalRevenue = completedSales.reduce((sum, sale) => 
        sum + Number(sale.seller_amount || sale.total || 0), 0
      );

      // Vendas do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySales = completedSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= today;
      });
      
      const todayRevenue = todaySales.reduce((sum, sale) => 
        sum + Number(sale.seller_amount || sale.total || 0), 0
      );

      // 4. Dados dos últimos 7 dias para o gráfico
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const weeklyData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const daySales = sales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= date && saleDate < nextDate;
        });

        const dayCompletedSales = daySales.filter(s => 
          s.status === 'completed' || s.payment_status === 'approved'
        );

        weeklyData.push({
          day: dayNames[date.getDay()],
          revenue: dayCompletedSales.reduce((sum, sale) => 
            sum + Number(sale.seller_amount || sale.total || 0), 0
          ),
          orders: daySales.length,
        });
      }

      // 5. Dados mensais (últimos 6 meses)
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthlyData = [];
      const now = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthSales = completedSales.filter(sale => {
          const saleDate = new Date(sale.created_at);
          return saleDate >= monthDate && saleDate < nextMonthDate;
        });

        monthlyData.push({
          month: monthNames[monthDate.getMonth()],
          revenue: monthSales.reduce((sum, sale) => 
            sum + Number(sale.seller_amount || sale.total || 0), 0
          ),
          orders: monthSales.length,
        });
      }

      // Mês atual vs mês anterior
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

      const currentMonthSales = completedSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= currentMonthStart;
      });
      
      const lastMonthSales = completedSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= lastMonthStart && saleDate < lastMonthEnd;
      });

      const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => 
        sum + Number(sale.seller_amount || sale.total || 0), 0
      );
      
      const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => 
        sum + Number(sale.seller_amount || sale.total || 0), 0
      );

      const monthGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;

      setMetrics({
        totalRevenue,
        availableBalance: Number(balance.available_balance || 0),
        totalOrders: sales.length,
        completedOrders: completedSales.length,
        pendingOrders: pendingSales.length,
        todayRevenue,
        weeklyData,
        monthlyData,
        currentMonthRevenue,
        lastMonthRevenue,
        monthGrowth,
      });

      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, sessionKey]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchDashboardData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, fetchDashboardData]);

  // Real-time subscription para vendas
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `seller_id=eq.${user.id}`,
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchDashboardData]);

  const getWhatsAppStatus = () => {
    if (!whatsappInstance) return { label: 'Não configurado', status: 'offline' as const };
    switch (whatsappInstance.status) {
      case 'connected': return { label: 'Conectado', status: 'online' as const };
      case 'connecting': return { label: 'Conectando...', status: 'connecting' as const };
      default: return { label: 'Desconectado', status: 'offline' as const };
    }
  };

  const whatsappStatus = getWhatsAppStatus();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatWhatsAppNumber = (raw: string | null | undefined) => {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 13) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
    }
    if (digits.length === 12) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
    }
    return `+${digits}`;
  };

  const hasNoSales = metrics.totalOrders === 0;

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] text-white">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">Meu Painel</h1>
              <p className="text-zinc-400">
                Bem-vindo de volta, <span className="text-white font-semibold">{displayName.split(' ')[0]}</span>!
                {matricula && <span className="ml-2 text-zinc-500">(Matrícula: {matricula})</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Toggle */}
              {notificationsSupported && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={requestPermission}
                  className={`border-zinc-700 hover:bg-zinc-800 ${permission === 'granted' ? 'text-green-500' : ''}`}
                  title={permission === 'granted' ? 'Notificações ativas' : 'Ativar notificações'}
                >
                  {permission === 'granted' ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                </Button>
              )}
              <span className="text-xs text-zinc-500">
                Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchDashboardData}
                disabled={isLoading}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Métricas Principais - DADOS REAIS */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Card 1 - Faturamento Total */}
              <Card className="bg-[#1E1E1E] border-[#27272a]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-green-600/20">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <h3 className="text-zinc-400 text-xs mb-1">Faturamento Total</h3>
                  <p className="text-2xl font-bold text-white">
                    {hasNoSales ? '—' : formatCurrency(metrics.totalRevenue)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Vendas aprovadas</p>
                </CardContent>
              </Card>

              {/* Card 2 - Saldo Disponível */}
              <Card className="bg-[#1E1E1E] border-[#27272a]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-600/20">
                      <Wallet className="h-5 w-5 text-emerald-500" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h3 className="text-zinc-400 text-xs mb-1">Saldo Disponível</h3>
                  <p className="text-2xl font-bold text-white">
                    {hasNoSales ? '—' : formatCurrency(metrics.availableBalance)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Disponível para saque</p>
                </CardContent>
              </Card>

              {/* Card 3 - Pedidos Totais */}
              <Card className="bg-[#1E1E1E] border-[#27272a]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-blue-600/20">
                      <ShoppingCart className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <h3 className="text-zinc-400 text-xs mb-1">Pedidos Totais</h3>
                  <p className="text-2xl font-bold text-white">
                    {hasNoSales ? '—' : metrics.totalOrders}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Todos os pedidos</p>
                </CardContent>
              </Card>

              {/* Card 4 - Pedidos Concluídos */}
              <Card className="bg-[#1E1E1E] border-[#27272a]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-green-600/20">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                  <h3 className="text-zinc-400 text-xs mb-1">Concluídos</h3>
                  <p className="text-2xl font-bold text-white">
                    {hasNoSales ? '—' : metrics.completedOrders}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Entregues com sucesso</p>
                </CardContent>
              </Card>

              {/* Card 5 - Pedidos em Andamento */}
              <Card className="bg-[#1E1E1E] border-[#27272a]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-600/20">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                  <h3 className="text-zinc-400 text-xs mb-1">Em Andamento</h3>
                  <p className="text-2xl font-bold text-white">
                    {hasNoSales ? '—' : metrics.pendingOrders}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Aguardando ação</p>
                </CardContent>
              </Card>

              {/* Card 6 - Vendas do Dia */}
              <Card className="bg-[#1E1E1E] border-[#27272a]">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-purple-600/20">
                      <Calendar className="h-5 w-5 text-purple-500" />
                    </div>
                    <span className="text-xs px-2 py-0.5 bg-purple-600/20 text-purple-400 rounded-full">Hoje</span>
                  </div>
                  <h3 className="text-zinc-400 text-xs mb-1">Vendas do Dia</h3>
                  <p className="text-2xl font-bold text-white">
                    {hasNoSales ? '—' : formatCurrency(metrics.todayRevenue)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Faturado hoje</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Segunda linha - Gráfico e Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Vendas - 7 dias */}
            <Card className="bg-[#1E1E1E] border-[#27272a] lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Vendas - Últimos 7 dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasNoSales ? (
                  <div className="h-[200px] flex items-center justify-center text-zinc-500">
                    <div className="text-center">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma venda registrada ainda</p>
                      <p className="text-xs mt-1">Suas vendas aparecerão aqui</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={metrics.weeklyData}>
                      <XAxis 
                        dataKey="day" 
                        stroke="#71717a" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#27272a', 
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#22c55e" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Gráfico Mensal Comparativo */}
            <Card className="bg-[#1E1E1E] border-[#27272a] lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Calendar className="w-5 h-5 text-purple-500" />
                    Evolução Mensal
                  </CardTitle>
                  {!hasNoSales && metrics.monthGrowth !== 0 && (
                    <div className={`flex items-center gap-1 text-sm ${metrics.monthGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {metrics.monthGrowth > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {metrics.monthGrowth > 0 ? '+' : ''}{metrics.monthGrowth.toFixed(1)}% vs mês anterior
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {hasNoSales ? (
                  <div className="h-[200px] flex items-center justify-center text-zinc-500">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Dados mensais aparecerão aqui</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-[#27272a] rounded-lg">
                        <p className="text-xs text-zinc-400">Este mês</p>
                        <p className="text-xl font-bold text-green-500">{formatCurrency(metrics.currentMonthRevenue)}</p>
                      </div>
                      <div className="p-3 bg-[#27272a] rounded-lg">
                        <p className="text-xs text-zinc-400">Mês anterior</p>
                        <p className="text-xl font-bold text-zinc-400">{formatCurrency(metrics.lastMonthRevenue)}</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={metrics.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} />
                        <YAxis stroke="#71717a" fontSize={12} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#27272a', border: 'none', borderRadius: '8px', color: '#fff' }}
                          formatter={(value: number) => [formatCurrency(value), 'Faturamento']}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status WhatsApp e IA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-[#1E1E1E] border-[#27272a]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-white text-lg">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  Status da ISA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  whatsappStatus.status === 'online' ? 'bg-green-600/10 border-green-600/30' : 'bg-zinc-800/50 border-zinc-700'
                }`}>
                  <div className="flex items-center gap-3">
                    {whatsappStatus.status === 'online' ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-zinc-500" />}
                    <div>
                      <p className="font-medium text-white text-sm">{whatsappStatus.label}</p>
                      <p className="text-xs text-zinc-400">{formatWhatsAppNumber(connectedWhatsAppNumber) || whatsappInstance?.phone_number || 'Aguardando'}</p>
                    </div>
                  </div>
                  <StatusIndicator status={whatsappStatus.status} size="sm" />
                </div>
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  whatsappInstance?.is_ai_active ? 'bg-green-600/10 border-green-600/30' : 'bg-zinc-800/50 border-zinc-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <Bot className={`h-5 w-5 ${whatsappInstance?.is_ai_active ? 'text-green-500' : 'text-zinc-500'}`} />
                    <div>
                      <p className="font-medium text-white text-sm">{whatsappInstance?.is_ai_active ? 'ISA Ativa' : 'ISA Pausada'}</p>
                      <p className="text-xs text-zinc-400">Assistente virtual</p>
                    </div>
                  </div>
                  <Zap className={`h-5 w-5 ${whatsappInstance?.is_ai_active ? 'text-green-500' : 'text-zinc-500'}`} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800 text-xs" onClick={() => navigate('/client/whatsapp')}>
                    <Wifi className="h-3 w-3 mr-1" />WhatsApp
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs" onClick={() => navigate('/client/vendas')}>
                    <ShoppingCart className="h-3 w-3 mr-1" />Vendas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mensagem quando não há vendas */}
          {hasNoSales && !isLoading && (
            <Card className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 border-green-600/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-600/20">
                    <Package className="h-8 w-8 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      Comece a vender com a ISA!
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Configure sua vitrine, adicione produtos e deixe a ISA cuidar das vendas para você.
                    </p>
                  </div>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => navigate('/client/produtos')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Adicionar Produtos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
