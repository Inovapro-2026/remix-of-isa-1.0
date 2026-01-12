import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, DollarSign, Clock, CheckCircle, TrendingUp, Wallet,
  AlertCircle, Package, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip
} from "recharts";

interface SalesMetrics {
  totalSales: number;
  pendingSales: number;
  completedSales: number;
  failedSales: number;
  totalValue: number;
  platformEarnings: number;
  sellerEarnings: number;
}

interface RecentSale {
  id: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  customer_phone?: string;
}

const COLORS = ['#F59E0B', '#10B981', '#EF4444'];

const AdminVendas = () => {
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [salesByStatus, setSalesByStatus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

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

        setSalesByStatus([
          { name: 'Pendentes', value: pending.length, color: '#F59E0B' },
          { name: 'Concluídas', value: completed.length, color: '#10B981' },
          { name: 'Falhas', value: failed.length, color: '#EF4444' }
        ]);

        setRecentSales(salesData.slice(0, 20));
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setIsLoading(false);
    }
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
    if (diffMins < 1440) return `há ${Math.floor(diffMins / 60)}h`;
    return `há ${Math.floor(diffMins / 1440)}d`;
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
        return 'bg-muted text-muted-foreground';
    }
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
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Vendas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe todas as transações</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <ShoppingCart className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{salesMetrics?.totalSales || 0}</p>
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
                  <p className="text-lg font-bold">{salesMetrics?.pendingSales || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                  <p className="text-lg font-bold">{salesMetrics?.completedSales || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Falhas</p>
                  <p className="text-lg font-bold">{salesMetrics?.failedSales || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border-purple-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300">Valor Total</p>
                  <p className="text-xl font-bold">{formatCurrency(salesMetrics?.totalValue || 0)}</p>
                </div>
                <DollarSign className="h-6 w-6 text-purple-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-600/20 to-green-800/10 border-green-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-300">Taxa (10%)</p>
                  <p className="text-xl font-bold">{formatCurrency(salesMetrics?.platformEarnings || 0)}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-400/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/10 border-cyan-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyan-300">Vendedores</p>
                  <p className="text-xl font-bold">{formatCurrency(salesMetrics?.sellerEarnings || 0)}</p>
                </div>
                <Wallet className="h-6 w-6 text-cyan-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart */}
        {salesByStatus.some(s => s.value > 0) && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status das Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={salesByStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {salesByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sales */}
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              Vendas Recentes
            </CardTitle>
            <CardDescription className="text-xs">Últimas 20 transações</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                      <Package className="h-3 w-3 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{sale.id.slice(0, 8)}...</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(sale.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`${getStatusColor(sale.payment_status)} text-xs px-1.5 py-0.5`}>
                      {sale.payment_status === 'paid' ? '✓' : sale.payment_status === 'awaiting_payment' ? '⏳' : '✗'}
                    </Badge>
                    <span className="text-sm font-semibold">{formatCurrency(sale.total)}</span>
                  </div>
                </div>
              ))}
              {recentSales.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma venda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminVendas;
