import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Store, Eye, Calendar, Globe, ExternalLink, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

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

const AdminVitrines = () => {
  const [vitrineStats, setVitrineStats] = useState<VitrineStats[]>([]);
  const [totalVisits, setTotalVisits] = useState({ total: 0, today: 0, week: 0 });
  const [visitsByDay, setVisitsByDay] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: clientsData } = await supabase
        .from('clients')
        .select('id, user_id, full_name, company_name, vitrine_id');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: visitsData } = await supabase
        .from('vitrine_visits')
        .select('*')
        .order('visited_at', { ascending: false });

      const { data: salesData } = await supabase
        .from('sales')
        .select('seller_id');

      if (visitsData && clientsData) {
        const todayStr = today.toISOString();
        const weekStr = weekAgo.toISOString();
        
        const todayVisits = visitsData.filter(v => v.visited_at >= todayStr).length;
        const weekVisits = visitsData.filter(v => v.visited_at >= weekStr).length;
        
        setTotalVisits({
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

        // Calculate sales per vitrine
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
          return { day: dayNames[d.getDay()], visits: count };
        }));
      }
    } catch (error) {
      console.error('Error fetching vitrines data:', error);
    } finally {
      setIsLoading(false);
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
          <h1 className="text-xl sm:text-2xl font-bold">Vitrines</h1>
          <p className="text-sm text-muted-foreground">Estatísticas de acessos</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-3 text-center">
              <Store className="h-6 w-6 mx-auto text-purple-400 mb-1" />
              <p className="text-xl font-bold">{vitrineStats.length}</p>
              <p className="text-xs text-muted-foreground">Vitrines</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-3 text-center">
              <Eye className="h-6 w-6 mx-auto text-cyan-400 mb-1" />
              <p className="text-xl font-bold">{totalVisits.today}</p>
              <p className="text-xs text-muted-foreground">Hoje</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-3 text-center">
              <Calendar className="h-6 w-6 mx-auto text-blue-400 mb-1" />
              <p className="text-xl font-bold">{totalVisits.week}</p>
              <p className="text-xs text-muted-foreground">7 dias</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-3 text-center">
              <Globe className="h-6 w-6 mx-auto text-green-400 mb-1" />
              <p className="text-xl font-bold">{totalVisits.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
        </div>

        {/* Visits Chart */}
        {visitsByDay.length > 0 && (
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Acessos (7 dias)</CardTitle>
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
        )}

        {/* Vitrines List */}
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Vitrines
            </CardTitle>
            <CardDescription className="text-xs">Ordenado por acessos</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {vitrineStats.map((vitrine) => (
                <div key={vitrine.vitrine_id} className="p-3 hover:bg-muted/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{vitrine.company || vitrine.name}</p>
                        <p className="text-xs text-muted-foreground truncate">ID: {vitrine.vitrine_id}</p>
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
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10">
                      <p className="text-sm font-bold text-cyan-400">{vitrine.todayVisits}</p>
                      <p className="text-xs text-muted-foreground">Hoje</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-blue-500/10">
                      <p className="text-sm font-bold text-blue-400">{vitrine.weekVisits}</p>
                      <p className="text-xs text-muted-foreground">7d</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <p className="text-sm font-bold text-purple-400">{vitrine.totalVisits}</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="p-1.5 rounded-lg bg-green-500/10">
                      <p className="text-sm font-bold text-green-400">{vitrine.salesCount}</p>
                      <p className="text-xs text-muted-foreground">Vendas</p>
                    </div>
                  </div>
                </div>
              ))}
              {vitrineStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma vitrine</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminVitrines;
