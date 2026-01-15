import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  Loader2,
  Ban,
  Trash2,
  Edit,
  RefreshCw,
  Calendar,
  Eye,
  Check,
  X,
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  user_id: string | null;
  full_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  cpf: string;
  matricula: string;
  plan: string | null;
  start_date: string | null;
  expiration_date: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface EditFormData {
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  plan: string;
}

const AdminAssinantes = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    plan: "",
  });
  const [renewDays, setRenewDays] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = clients.filter(
        (client) =>
          client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar assinantes");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDaysRemaining = (expirationDate: string | null): number => {
    if (!expirationDate) return 0;
    const today = new Date();
    const expDate = parseISO(expirationDate);
    return differenceInDays(expDate, today);
  };

  const getDaysRemainingBadge = (days: number) => {
    if (days <= 0) {
      return <Badge variant="destructive">Expirado</Badge>;
    } else if (days <= 7) {
      return <Badge variant="destructive">{days} dias</Badge>;
    } else if (days <= 15) {
      return <Badge className="bg-yellow-500">{days} dias</Badge>;
    } else {
      return <Badge className="bg-green-500">{days} dias</Badge>;
    }
  };

  const handleToggleActive = async (client: Client) => {
    setIsProcessing(true);
    try {
      const newStatus = !client.is_active;
      const { error } = await supabase
        .from("clients")
        .update({ is_active: newStatus })
        .eq("id", client.id);

      if (error) throw error;

      toast.success(newStatus ? "Cliente desbloqueado" : "Cliente bloqueado");
      fetchClients();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status do cliente");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setIsProcessing(true);

    try {
      // Delete related records first
      if (selectedClient.user_id) {
        await supabase.from("products").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("categories").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("client_ai_memory").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("ai_behavior_rules").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("company_knowledge").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("seller_balances").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("seller_pix_info").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("user_roles").delete().eq("user_id", selectedClient.user_id);
        await supabase.from("profiles").delete().eq("id", selectedClient.user_id);
      }

      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", selectedClient.id);

      if (error) throw error;

      toast.success("Cliente excluído com sucesso");
      setDeleteDialogOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setEditFormData({
      full_name: client.full_name,
      company_name: client.company_name || "",
      email: client.email,
      phone: client.phone || "",
      plan: client.plan || "",
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedClient) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          full_name: editFormData.full_name,
          company_name: editFormData.company_name,
          email: editFormData.email,
          phone: editFormData.phone,
          plan: editFormData.plan,
        })
        .eq("id", selectedClient.id);

      if (error) throw error;

      toast.success("Dados atualizados com sucesso");
      setEditDialogOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      toast.error("Erro ao atualizar dados");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenew = (client: Client) => {
    setSelectedClient(client);
    setRenewDays(30);
    setRenewDialogOpen(true);
  };

  const handleConfirmRenew = async () => {
    if (!selectedClient) return;
    setIsProcessing(true);

    try {
      const currentExpiration = selectedClient.expiration_date
        ? parseISO(selectedClient.expiration_date)
        : new Date();
      
      const baseDate = currentExpiration > new Date() ? currentExpiration : new Date();
      const newExpiration = new Date(baseDate);
      newExpiration.setDate(newExpiration.getDate() + renewDays);

      const { error } = await supabase
        .from("clients")
        .update({
          expiration_date: newExpiration.toISOString().split("T")[0],
          data_ultima_renovacao: new Date().toISOString().split("T")[0],
          is_active: true,
        })
        .eq("id", selectedClient.id);

      if (error) throw error;

      toast.success(`Plano renovado por ${renewDays} dias`);
      setRenewDialogOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error("Erro ao renovar plano:", error);
      toast.error("Erro ao renovar plano");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyMatricula = (matricula: string) => {
    navigator.clipboard.writeText(matricula);
    toast.success("Matrícula copiada!");
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Assinantes
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredClients.length} assinantes encontrados
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, matrícula..."
              className="pl-9 w-full sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assinante</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const daysRemaining = calculateDaysRemaining(client.expiration_date);
                    return (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.full_name}</p>
                            <p className="text-xs text-muted-foreground">{client.email}</p>
                            {client.company_name && (
                              <p className="text-xs text-muted-foreground">{client.company_name}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {client.matricula}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyMatricula(client.matricula)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{client.plan || "Básico"}</Badge>
                        </TableCell>
                        <TableCell>{getDaysRemainingBadge(daysRemaining)}</TableCell>
                        <TableCell>
                          {client.is_active ? (
                            <Badge className="bg-green-500">Ativo</Badge>
                          ) : (
                            <Badge variant="destructive">Bloqueado</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(client)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleRenew(client)}
                              title="Renovar plano"
                            >
                              <RefreshCw className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleToggleActive(client)}
                              disabled={isProcessing}
                              title={client.is_active ? "Bloquear" : "Desbloquear"}
                            >
                              {client.is_active ? (
                                <Ban className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedClient(client);
                                setDeleteDialogOpen(true);
                              }}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">Nenhum assinante encontrado</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Assinante</DialogTitle>
            <DialogDescription>
              Atualize os dados do assinante
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editFormData.full_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, full_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Input
                value={editFormData.company_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, company_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Plano</Label>
              <Input
                value={editFormData.plan}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, plan: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Plano</DialogTitle>
            <DialogDescription>
              Renovar plano de {selectedClient?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Adicionar quantos dias?</Label>
              <Input
                type="number"
                value={renewDays}
                onChange={(e) => setRenewDays(Number(e.target.value))}
                min={1}
              />
            </div>
            {selectedClient?.expiration_date && (
              <p className="text-sm text-muted-foreground">
                Expiração atual:{" "}
                {format(parseISO(selectedClient.expiration_date), "dd/MM/yyyy", {
                  locale: ptBR,
                })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmRenew} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Renovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Assinante</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedClient?.full_name}? Esta ação
              irá remover todos os dados relacionados e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminAssinantes;
