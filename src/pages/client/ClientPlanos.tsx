import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, CreditCard, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ClientData {
  expiration_date: string | null;
  start_date: string | null;
  plan: string | null;
  full_name: string;
  matricula: string;
}

interface RenewalRequest {
  id: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

const MERCADO_PAGO_LINK = "https://mpago.la/12hYK2o";

const ClientPlanos = () => {
  const { user, profile } = useAuth();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [renewalRequests, setRenewalRequests] = useState<RenewalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClientData();
      fetchRenewalRequests();
    }
  }, [user]);

  const fetchClientData = async () => {
    try {
      // Try to get from clients table first
      const { data: clientDataResult } = await supabase
        .from('clients')
        .select('expiration_date, start_date, plan, full_name, matricula')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (clientDataResult) {
        setClientData(clientDataResult);
      } else if (profile?.email) {
        // Fallback to email
        const { data: clientByEmail } = await supabase
          .from('clients')
          .select('expiration_date, start_date, plan, full_name, matricula')
          .eq('email', profile.email)
          .maybeSingle();

        if (clientByEmail) {
          setClientData(clientByEmail);
        }
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRenewalRequests = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('plan_renewals')
      .select('id, status, created_at, reviewed_at, rejection_reason')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setRenewalRequests(data);
    }
  };

  const calculateDaysRemaining = () => {
    if (!clientData?.expiration_date) {
      // If no expiration date, assume 30 days from start_date or today
      const startDate = clientData?.start_date ? new Date(clientData.start_date) : new Date();
      const expirationDate = new Date(startDate);
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      const today = new Date();
      const diffTime = expirationDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }

    const today = new Date();
    const expiration = new Date(clientData.expiration_date);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysRemaining = calculateDaysRemaining();
  const progressPercentage = Math.max(0, Math.min(100, (daysRemaining / 30) * 100));
  const showRenewButton = daysRemaining <= 15;
  const isExpired = daysRemaining === 0;

  const hasPendingRequest = renewalRequests.some(r => r.status === 'pending');

  const handleRenewClick = () => {
    if (hasPendingRequest) {
      toast.info("Você já tem uma solicitação de renovação pendente.");
      return;
    }
    window.open(MERCADO_PAGO_LINK, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejeitado</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin={false}>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Meu Plano</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e veja o status do seu plano
          </p>
        </div>

        {/* Plan Status Card */}
        <Card variant="gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Status do Plano
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plano Atual</p>
                <p className="text-2xl font-bold capitalize">{clientData?.plan || 'Basic'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="text-2xl font-bold text-primary">R$ 97,00</p>
              </div>
            </div>

            {/* Days Remaining Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Dias restantes</span>
                </div>
                <span className={`text-lg font-bold ${isExpired ? 'text-destructive' : daysRemaining <= 15 ? 'text-yellow-500' : 'text-primary'}`}>
                  {isExpired ? 'Expirado' : `${daysRemaining} dias`}
                </span>
              </div>
              <Progress 
                value={progressPercentage} 
                className={`h-3 ${isExpired ? '[&>div]:bg-destructive' : daysRemaining <= 15 ? '[&>div]:bg-yellow-500' : ''}`}
              />
              {daysRemaining <= 15 && !isExpired && (
                <p className="text-sm text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Seu plano vence em breve. Renove para continuar usando.
                </p>
              )}
              {isExpired && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  Seu plano expirou. Renove para reativar sua conta.
                </p>
              )}
            </div>

            {/* Renew Button */}
            {(showRenewButton || isExpired) && (
              <div className="pt-4 border-t border-border">
                <Button 
                  onClick={handleRenewClick} 
                  className="w-full gradient-button"
                  disabled={hasPendingRequest}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {hasPendingRequest ? 'Renovação Pendente' : 'Renovar Plano - R$ 97,00'}
                </Button>
                {!hasPendingRequest && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Após o pagamento, envie o comprovante na página que será aberta
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Post-Payment Instructions */}
        {(showRenewButton || isExpired) && !hasPendingRequest && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como renovar seu plano</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Clique no botão "Renovar Plano" acima</li>
                <li>Realize o pagamento no Mercado Pago</li>
                <li>Após o pagamento, acesse <a href="/renovar-plano" className="text-primary hover:underline">/renovar-plano</a></li>
                <li>Envie o comprovante de pagamento</li>
                <li>Aguarde a aprovação (em até 24h)</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Renewal History */}
        {renewalRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Histórico de Renovações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renewalRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Solicitação de Renovação</p>
                      <p className="text-sm text-muted-foreground">
                        Enviada em {formatDate(request.created_at)}
                      </p>
                      {request.rejection_reason && (
                        <p className="text-sm text-destructive mt-1">
                          Motivo: {request.rejection_reason}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {getStatusBadge(request.status)}
                      {request.reviewed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {request.status === 'approved' ? 'Aprovado' : 'Analisado'} em {formatDate(request.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClientPlanos;
