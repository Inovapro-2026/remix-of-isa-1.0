import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, MessageSquare, Users } from "lucide-react";

const Reports = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Relatórios</h1>
          <p className="text-muted-foreground">Análises e métricas da plataforma</p>
        </div>

        {/* Charts placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Crescimento de Clientes
              </CardTitle>
              <CardDescription>Evolução mensal do número de clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Aguardando conexão com o serviço de dados</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Volume de Mensagens
              </CardTitle>
              <CardDescription>Mensagens processadas por dia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Aguardando conexão com o serviço de dados</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Taxa de Conversão
              </CardTitle>
              <CardDescription>Leads convertidos em clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Aguardando conexão com o serviço de dados</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Satisfação do Cliente
              </CardTitle>
              <CardDescription>NPS e avaliações de atendimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Aguardando conexão com o serviço de dados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
