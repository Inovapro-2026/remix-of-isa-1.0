import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Clock, CheckCircle, XCircle, Eye, Search, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PlanRenewal {
  id: string;
  user_id: string;
  client_id: string | null;
  matricula: string;
  full_name: string;
  email: string | null;
  receipt_url: string | null;
  status: string;
  amount: number;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const AdminPlanos = () => {
  const { user } = useAuth();
  const [renewals, setRenewals] = useState<PlanRenewal[]>([]);
  const [filteredRenewals, setFilteredRenewals] = useState<PlanRenewal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  
  // Modal states
  const [selectedRenewal, setSelectedRenewal] = useState<PlanRenewal | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchRenewals();
  }, []);

  useEffect(() => {
    filterRenewals();
  }, [renewals, searchTerm, activeTab]);

  const fetchRenewals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('plan_renewals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRenewals(data || []);

      // Calculate stats
      const pending = data?.filter(r => r.status === 'pending').length || 0;
      const approved = data?.filter(r => r.status === 'approved').length || 0;
      const rejected = data?.filter(r => r.status === 'rejected').length || 0;
      const totalRevenue = data?.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      setStats({ pending, approved, rejected, totalRevenue });
    } catch (error) {
      console.error('Error fetching renewals:', error);
      toast.error("Erro ao carregar renovações");
    } finally {
      setIsLoading(false);
    }
  };

  const filterRenewals = () => {
    let filtered = renewals;

    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => r.status === activeTab);
    }

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.full_name.toLowerCase().includes(term) ||
        r.matricula.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term)
      );
    }

    setFilteredRenewals(filtered);
  };

  const handleApprove = async (renewal: PlanRenewal) => {
    setIsProcessing(true);
    try {
      // Update renewal status
      const { error: renewalError } = await supabase
        .from('plan_renewals')
        .update({
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', renewal.id);

      if (renewalError) throw renewalError;

      // Update client expiration date (add 30 days)
      if (renewal.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('expiration_date')
          .eq('id', renewal.client_id)
          .maybeSingle();

        const currentExpiration = clientData?.expiration_date 
          ? new Date(clientData.expiration_date) 
          : new Date();
        
        // If expired, start from today
        const baseDate = currentExpiration < new Date() ? new Date() : currentExpiration;
        const newExpiration = new Date(baseDate);
        newExpiration.setDate(newExpiration.getDate() + 30);

        await supabase
          .from('clients')
          .update({
            expiration_date: newExpiration.toISOString().split('T')[0],
            data_ultima_renovacao: new Date().toISOString(),
            is_active: true
          })
          .eq('id', renewal.client_id);
      } else {
        // Try to find client by matricula
        const { data: clientByMatricula } = await supabase
          .from('clients')
          .select('id, expiration_date')
          .eq('matricula', renewal.matricula)
          .maybeSingle();

        if (clientByMatricula) {
          const currentExpiration = clientByMatricula.expiration_date 
            ? new Date(clientByMatricula.expiration_date) 
            : new Date();
          
          const baseDate = currentExpiration < new Date() ? new Date() : currentExpiration;
          const newExpiration = new Date(baseDate);
          newExpiration.setDate(newExpiration.getDate() + 30);

          await supabase
            .from('clients')
            .update({
              expiration_date: newExpiration.toISOString().split('T')[0],
              data_ultima_renovacao: new Date().toISOString(),
              is_active: true
            })
            .eq('id', clientByMatricula.id);
        }
      }

      toast.success("Renovação aprovada com sucesso!");
      fetchRenewals();
    } catch (error: any) {
      console.error('Error approving renewal:', error);
      toast.error("Erro ao aprovar renovação: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRenewal || !rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('plan_renewals')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedRenewal.id);

      if (error) throw error;

      toast.success("Renovação rejeitada");
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedRenewal(null);
      fetchRenewals();
    } catch (error: any) {
      console.error('Error rejecting renewal:', error);
      toast.error("Erro ao rejeitar renovação: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  return (
    <DashboardLayout isAdmin>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Planos e Renovações</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de renovação de planos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento Total</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Solicitações de Renovação
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pendentes ({stats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Aprovadas ({stats.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejeitadas ({stats.rejected})
                </TabsTrigger>
                <TabsTrigger value="all">
                  Todas
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredRenewals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRenewals.map((renewal) => (
                      <div 
                        key={renewal.id} 
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-muted/50 gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{renewal.full_name}</p>
                            {getStatusBadge(renewal.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Matrícula: {renewal.matricula} • {renewal.email || 'Sem email'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enviado em {formatDate(renewal.created_at)}
                          </p>
                          {renewal.rejection_reason && (
                            <p className="text-xs text-destructive mt-1">
                              Motivo: {renewal.rejection_reason}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="font-bold text-primary mr-4">
                            {formatCurrency(renewal.amount)}
                          </p>
                          
                          {renewal.receipt_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRenewal(renewal);
                                setShowReceiptModal(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Comprovante
                            </Button>
                          )}

                          {renewal.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(renewal)}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedRenewal(renewal);
                                  setShowRejectModal(true);
                                }}
                                disabled={isProcessing}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comprovante de Pagamento</DialogTitle>
            <DialogDescription>
              {selectedRenewal?.full_name} - Matrícula: {selectedRenewal?.matricula}
            </DialogDescription>
          </DialogHeader>
          {selectedRenewal?.receipt_url && (
            <div className="max-h-[60vh] overflow-auto">
              <img 
                src={selectedRenewal.receipt_url} 
                alt="Comprovante de pagamento"
                className="w-full rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
              Fechar
            </Button>
            {selectedRenewal?.receipt_url && (
              <Button asChild>
                <a href={selectedRenewal.receipt_url} target="_blank" rel="noopener noreferrer">
                  Abrir em nova aba
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Renovação</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição para {selectedRenewal?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectModal(false);
              setRejectionReason("");
            }}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminPlanos;
