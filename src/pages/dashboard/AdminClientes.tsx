import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, Clock, TrendingUp, Store, UserCheck, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TopSeller {
  id: string;
  name: string;
  company: string;
  matricula: string;
  vitrine_id: string;
  salesCount: number;
  totalRevenue: number;
}

const AdminClientes = () => {
  const [metrics, setMetrics] = useState({
    totalClients: 0,
    activeClients: 0,
    pendingRequests: 0,
    withVitrine: 0
  });
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, user_id, full_name, company_name, matricula, vitrine_id, is_active, expiration_date');

      const { count: pendingCount } = await supabase
        .from('account_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending');

      const { data: salesData } = await supabase
        .from('sales')
        .select('seller_id, total');

      // Calculate seller stats
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
        .slice(0, 15);

      setTopSellers(topSellersData);

      setMetrics({
        totalClients: clientsData?.length || 0,
        activeClients: clientsData?.filter(c => c.is_active)?.length || 0,
        pendingRequests: pendingCount || 0,
        withVitrine: clientsData?.filter(c => c.vitrine_id)?.length || 0
      });
    } catch (error) {
      console.error('Error fetching clients data:', error);
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
          <h1 className="text-xl sm:text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos clientes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3 text-center">
              <Users className="h-6 w-6 mx-auto text-blue-400 mb-1" />
              <p className="text-xl font-bold">{metrics.totalClients}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3 text-center">
              <UserCheck className="h-6 w-6 mx-auto text-green-400 mb-1" />
              <p className="text-xl font-bold">{metrics.activeClients}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <CardContent className="p-3 text-center">
              <Clock className="h-6 w-6 mx-auto text-yellow-400 mb-1" />
              <p className="text-xl font-bold">{metrics.pendingRequests}</p>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-3 text-center">
              <Store className="h-6 w-6 mx-auto text-purple-400 mb-1" />
              <p className="text-xl font-bold">{metrics.withVitrine}</p>
              <p className="text-xs text-muted-foreground">Com Vitrine</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Sellers */}
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Ranking de Vendedores
            </CardTitle>
            <CardDescription className="text-xs">Top vendedores por receita</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topSellers.map((seller, index) => (
                <div key={seller.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      index === 1 ? 'bg-gray-400/20 text-gray-300' :
                      index === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{seller.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{seller.company}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-bold text-primary">{formatCurrency(seller.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground">{seller.salesCount} vendas</p>
                  </div>
                </div>
              ))}
              {topSellers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma venda registrada</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminClientes;
