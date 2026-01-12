import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { FileText, CheckCircle, XCircle, Clock, User, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkeletonTable } from "@/components/ui/skeleton-card";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccountRequest {
  id: string;
  full_name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  company_name: string | null;
  matricula: string | null;
  created_at: string | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  rejection_reason: string | null;
  segmento: string | null;
  birth_date: string | null;
}

const Requests = () => {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AccountRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'pending'>('pending');
  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('account_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRequests = () => {
    // Always filter to pending only (approved/rejected are deleted)
    let filtered = requests.filter(r => r.status === 'pending');

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.full_name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.matricula?.includes(term) ||
        r.cpf?.includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleAction = (request: AccountRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setRejectionReason("");
    setDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !user) return;
    
    setIsProcessing(true);

    try {
      if (actionType === 'approve') {
        // Validate required fields
        if (!selectedRequest.matricula) {
          toast.error('Matrícula não encontrada na solicitação');
          setIsProcessing(false);
          return;
        }

        // If client already exists (same email), update it instead of inserting
        const { data: existingClient, error: existingError } = await supabase
          .from('clients')
          .select('id, matricula')
          .eq('email', selectedRequest.email)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existingClient) {
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              full_name: selectedRequest.full_name,
              phone: selectedRequest.phone,
              company_name: selectedRequest.company_name,
              segmento: selectedRequest.segmento,
              birth_date: selectedRequest.birth_date,
              status: 'active',
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingClient.id);

          if (updateError) throw updateError;
        } else {
          // Check if a client with same CPF exists
          if (selectedRequest.cpf) {
            const { data: existingByCpf } = await supabase
              .from('clients')
              .select('id')
              .eq('cpf', selectedRequest.cpf)
              .maybeSingle();

            if (existingByCpf) {
              toast.error('Já existe um cliente cadastrado com este CPF');
              setIsProcessing(false);
              return;
            }
          }

          // Generate a unique CPF placeholder if not provided
          const cpfValue = selectedRequest.cpf || `TEMP_${Date.now()}`;

          // Copy data to clients table
          const { error: insertError } = await supabase
            .from('clients')
            .insert({
              matricula: selectedRequest.matricula,
              full_name: selectedRequest.full_name,
              email: selectedRequest.email,
              cpf: cpfValue,
              phone: selectedRequest.phone,
              company_name: selectedRequest.company_name,
              segmento: selectedRequest.segmento,
              birth_date: selectedRequest.birth_date,
              status: 'active',
              is_active: true,
              start_date: new Date().toISOString().split('T')[0],
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            throw insertError;
          }
        }

        // Delete from account_requests
        const { error: deleteError } = await supabase
          .from('account_requests')
          .delete()
          .eq('id', selectedRequest.id);

        if (deleteError) throw deleteError;

        // Log the action
        await supabase.from('system_logs').insert({
          action: existingClient
            ? `Solicitação aprovada: cliente ${selectedRequest.full_name} atualizado (já existia)`
            : `Cliente ${selectedRequest.full_name} aprovado e movido para clientes`,
          user_id: user.id,
          details: { request_id: selectedRequest.id, matricula: selectedRequest.matricula },
        });

        toast.success(
          existingClient
            ? `Cliente ${selectedRequest.full_name} já existia — dados atualizados e solicitação removida.`
            : `Cliente ${selectedRequest.full_name} aprovado com sucesso!`
        );

        // Remove from local state
        setRequests(requests.filter(r => r.id !== selectedRequest.id));
      } else {
        // Reject: just delete from account_requests
        const { error: deleteError } = await supabase
          .from('account_requests')
          .delete()
          .eq('id', selectedRequest.id);

        if (deleteError) throw deleteError;

        // Log the action
        await supabase.from('system_logs').insert({
          action: `Solicitação de ${selectedRequest.full_name} reprovada e removida`,
          user_id: user.id,
          details: { 
            request_id: selectedRequest.id, 
            matricula: selectedRequest.matricula,
            rejection_reason: rejectionReason 
          },
        });

        toast.success(`Solicitação de ${selectedRequest.full_name} reprovada.`);
        
        // Remove from local state
        setRequests(requests.filter(r => r.id !== selectedRequest.id));
      }

      setDialogOpen(false);
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('Erro ao processar solicitação');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '—';
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Solicitações</h1>
            <p className="text-muted-foreground">Gerencie as solicitações de acesso à plataforma</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2 w-fit">
            <Clock className="w-4 h-4 mr-2" />
            {pendingCount} pendentes
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <Card variant="gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Lista de Solicitações
            </CardTitle>
            <CardDescription>
              Aprove ou reprove solicitações de novos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonTable />
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Segmento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} className="transition-colors hover:bg-muted/30">
                        <TableCell className="font-mono font-bold text-primary">
                          {request.matricula || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{request.full_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{request.email}</TableCell>
                        <TableCell className="font-mono text-sm">{request.phone || "—"}</TableCell>
                        <TableCell>{request.company_name || "—"}</TableCell>
                        <TableCell>{request.segmento || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {request.status === "pending" && (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="accent" 
                                size="sm"
                                onClick={() => handleAction(request, "approve")}
                                className="transition-all duration-200 hover:scale-105"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Aprovar
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleAction(request, "reject")}
                                className="transition-all duration-200 hover:scale-105"
                              >
                                <XCircle className="w-4 h-4" />
                                Reprovar
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Aprovar Solicitação" : "Reprovar Solicitação"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" 
                  ? `Tem certeza que deseja aprovar a solicitação de ${selectedRequest?.full_name}? 
                     Uma conta será criada e a matrícula ${selectedRequest?.matricula} será ativada.`
                  : `Tem certeza que deseja reprovar a solicitação de ${selectedRequest?.full_name}?`
                }
              </DialogDescription>
            </DialogHeader>
            
            {actionType === "reject" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo da reprovação (opcional)</label>
                <Textarea
                  placeholder="Descreva o motivo da reprovação..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button 
                variant={actionType === "approve" ? "accent" : "destructive"}
                onClick={confirmAction}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : actionType === "approve" ? (
                  "Confirmar Aprovação"
                ) : (
                  "Confirmar Reprovação"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Requests;
