import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Users, Search, Loader2, Edit, RefreshCw, Lock, Trash2, User, MoreHorizontal, Unlock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SkeletonTable } from "@/components/ui/skeleton-card";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  matricula: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  cpf: string;
  user_id: string | null;
  status: string | null;
  plan: string | null;
  is_active: boolean | null;
  created_at: string | null;
  expiration_date: string | null;
  observations: string | null;
  segmento: string | null;
}

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const { user } = useAuth();
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company_name: "",
    plan: "",
    observations: "",
    segmento: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => 
        statusFilter === 'active' 
          ? c.status === 'active' || c.is_active === true
          : c.status === 'suspended' || c.is_active === false
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.full_name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.matricula?.includes(term) ||
        c.cpf?.includes(term) ||
        c.company_name?.toLowerCase().includes(term)
      );
    }

    setFilteredClients(filtered);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditForm({
      full_name: client.full_name || "",
      email: client.email || "",
      phone: client.phone || "",
      company_name: client.company_name || "",
      plan: client.plan || "basic",
      observations: client.observations || "",
      segmento: client.segmento || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClient || !user) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone || null,
          company_name: editForm.company_name || null,
          plan: editForm.plan,
          observations: editForm.observations || null,
          segmento: editForm.segmento || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedClient.id);

      if (error) throw error;

      // Log action
      await supabase.from('system_logs').insert({
        action: `Cliente ${editForm.full_name} editado`,
        user_id: user.id,
        details: { client_id: selectedClient.id, matricula: selectedClient.matricula },
      });

      toast.success('Cliente atualizado com sucesso!');
      setEditDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenewPlan = async (client: Client) => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          status: 'active',
          is_active: true,
          data_ultima_renovacao: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (error) throw error;

      await supabase.from('system_logs').insert({
        action: `Plano do cliente ${client.full_name} renovado`,
        user_id: user.id,
        details: { client_id: client.id, matricula: client.matricula },
      });

      toast.success('Plano renovado com sucesso!');
      fetchClients();
    } catch (error) {
      console.error('Error renewing plan:', error);
      toast.error('Erro ao renovar plano');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleBlock = async (client: Client) => {
    if (!user) return;
    
    const newStatus = client.status === 'suspended' ? 'active' : 'suspended';
    const newIsActive = client.status === 'suspended';
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          status: newStatus,
          is_active: newIsActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', client.id);

      if (error) throw error;

      await supabase.from('system_logs').insert({
        action: newStatus === 'suspended' 
          ? `Cliente ${client.full_name} bloqueado`
          : `Cliente ${client.full_name} desbloqueado`,
        user_id: user.id,
        details: { client_id: client.id, matricula: client.matricula },
      });

      toast.success(newStatus === 'suspended' ? 'Cliente bloqueado' : 'Cliente desbloqueado');
      fetchClients();
    } catch (error) {
      console.error('Error toggling block:', error);
      toast.error('Erro ao alterar status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedClient || !user) return;
    
    setIsProcessing(true);
    try {
      // Delete related data first
      if (selectedClient.user_id) {
        await supabase.from('tickets').delete().eq('user_id', selectedClient.user_id);
        await supabase.from('whatsapp_instances').delete().eq('user_id', selectedClient.user_id);
      }

      // Delete the client
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', selectedClient.id);

      if (error) throw error;

      await supabase.from('system_logs').insert({
        action: `Cliente ${selectedClient.full_name} removido permanentemente`,
        user_id: user.id,
        details: { matricula: selectedClient.matricula },
      });

      toast.success('Cliente removido permanentemente');
      setDeleteDialogOpen(false);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao remover cliente');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const formatCPF = (cpf: string | null) => {
    if (!cpf) return '—';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const activeCount = clients.filter(c => c.status === 'active' || c.is_active).length;
  const suspendedCount = clients.filter(c => c.status === 'suspended' || !c.is_active).length;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Clientes</h1>
            <p className="text-muted-foreground">Gerencie todos os clientes da plataforma</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-base px-3 py-1.5">
              <User className="w-4 h-4 mr-2 text-accent" />
              {activeCount} ativos
            </Badge>
            <Badge variant="outline" className="text-base px-3 py-1.5">
              <Lock className="w-4 h-4 mr-2 text-destructive" />
              {suspendedCount} bloqueados
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, matrícula, CPF ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'suspended'] as const).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all' && 'Todos'}
                {status === 'active' && 'Ativos'}
                {status === 'suspended' && 'Bloqueados'}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card variant="gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Lista de Clientes
            </CardTitle>
            <CardDescription>
              Visualize, edite, renove, bloqueie ou remova clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonTable />
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum cliente encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.map((client) => (
                      <TableRow key={client.id} className="transition-colors hover:bg-muted/30">
                        <TableCell className="font-mono font-bold text-primary">
                          {client.matricula}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium block">{client.full_name}</span>
                              <span className="text-xs text-muted-foreground">{client.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{client.company_name || "—"}</TableCell>
                        <TableCell className="font-mono text-sm">{client.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={client.status === "active" || client.is_active ? "default" : "destructive"}
                            className={client.status === "active" || client.is_active ? "bg-accent text-accent-foreground" : ""}
                          >
                            {client.status === "active" || client.is_active ? "Ativo" : "Bloqueado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(client.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(client)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRenewPlan(client)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Renovar Plano
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleBlock(client)}>
                                {client.status === 'suspended' || !client.is_active ? (
                                  <>
                                    <Unlock className="w-4 h-4 mr-2" />
                                    Desbloquear
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Bloquear
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Apagar Conta
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="glass max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Matrícula: {selectedClient?.matricula}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input
                    value={editForm.company_name}
                    onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={editForm.plan} onValueChange={(v) => setEditForm({ ...editForm, plan: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="pro">Profissional</SelectItem>
                      <SelectItem value="enterprise">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Segmento</Label>
                  <Select value={editForm.segmento} onValueChange={(v) => setEditForm({ ...editForm, segmento: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="varejo">Varejo</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="industria">Indústria</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="educacao">Educação</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={editForm.observations}
                  onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                  placeholder="Anotações internas sobre o cliente..."
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle className="text-destructive">⚠️ Apagar Conta</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja apagar permanentemente a conta de <strong>{selectedClient?.full_name}</strong>?
                <br /><br />
                Esta ação é <strong>irreversível</strong> e irá remover:
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Todos os dados do cliente</li>
                  <li>Conversas e mensagens</li>
                  <li>Tickets de suporte</li>
                  <li>Instâncias WhatsApp</li>
                </ul>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Apagar Permanentemente
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Clients;
