import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Wallet, DollarSign, TrendingUp, CheckCircle, XCircle, 
  Loader2, RefreshCw, AlertCircle, Clock, Users, CreditCard,
  ArrowDownCircle, Eye, Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface WithdrawalRequest {
  id: string;
  seller_id: string;
  amount: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  seller_name?: string;
  seller_email?: string;
}

interface Sale {
  id: string;
  seller_id: string;
  customer_phone: string;
  customer_name: string | null;
  total: number;
  platform_fee: number;
  seller_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  seller_name?: string;
}

interface PlatformStats {
  totalSales: number;
  totalCommissions: number;
  pendingWithdrawals: number;
  pendingWithdrawalsAmount: number;
  totalWithdrawn: number;
}

const AdminSaques = () => {
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<PlatformStats>({
    totalSales: 0,
    totalCommissions: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    totalWithdrawn: 0
  });

  // Action dialog
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load withdrawal requests with seller info
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Get seller info for each withdrawal
      if (withdrawalsData) {
        const enrichedWithdrawals = await Promise.all(
          withdrawalsData.map(async (w) => {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name, email')
              .eq('user_id', w.seller_id)
              .maybeSingle();
            
            return {
              ...w,
              seller_name: client?.full_name || 'Desconhecido',
              seller_email: client?.email || ''
            };
          })
        );
        setWithdrawals(enrichedWithdrawals);
      }

      // Load recent sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (salesData) {
        const enrichedSales = await Promise.all(
          salesData.map(async (s) => {
            const { data: client } = await supabase
              .from('clients')
              .select('full_name')
              .eq('user_id', s.seller_id)
              .maybeSingle();
            
            return {
              ...s,
              seller_name: client?.full_name || 'Desconhecido'
            };
          })
        );
        setSales(enrichedSales);
      }

      // Calculate stats
      const { data: commissions } = await supabase
        .from('platform_commissions')
        .select('amount');

      const totalCommissions = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      const pendingWithdrawals = withdrawalsData?.filter(w => w.status === 'pending') || [];
      const pendingAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

      const approvedWithdrawals = withdrawalsData?.filter(w => w.status === 'paid') || [];
      const totalWithdrawn = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);

      setStats({
        totalSales: salesData?.filter(s => s.payment_status === 'approved').length || 0,
        totalCommissions,
        pendingWithdrawals: pendingWithdrawals.length,
        pendingWithdrawalsAmount: pendingAmount,
        totalWithdrawn
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'paid',
          admin_notes: adminNotes || null,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', selectedWithdrawal.id);

      if (withdrawalError) throw withdrawalError;

      // Update seller balance
      const { data: balance } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('user_id', selectedWithdrawal.seller_id)
        .single();

      if (balance) {
        await supabase
          .from('seller_balances')
          .update({
            pending_balance: Math.max(0, balance.pending_balance - selectedWithdrawal.amount),
            total_withdrawn: balance.total_withdrawn + selectedWithdrawal.amount
          })
          .eq('user_id', selectedWithdrawal.seller_id);
      }

      toast.success('Saque aprovado com sucesso!');
      setSelectedWithdrawal(null);
      setActionType(null);
      setAdminNotes("");
      loadData();

    } catch (error) {
      console.error('Error approving withdrawal:', error);
      toast.error('Erro ao aprovar saque');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !adminNotes) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update withdrawal status
      const { error: withdrawalError } = await supabase
        .from('withdrawal_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes,
          processed_at: new Date().toISOString(),
          processed_by: user?.id
        })
        .eq('id', selectedWithdrawal.id);

      if (withdrawalError) throw withdrawalError;

      // Return amount to available balance
      const { data: balance } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('user_id', selectedWithdrawal.seller_id)
        .single();

      if (balance) {
        await supabase
          .from('seller_balances')
          .update({
            available_balance: balance.available_balance + selectedWithdrawal.amount,
            pending_balance: Math.max(0, balance.pending_balance - selectedWithdrawal.amount)
          })
          .eq('user_id', selectedWithdrawal.seller_id);
      }

      toast.success('Saque rejeitado');
      setSelectedWithdrawal(null);
      setActionType(null);
      setAdminNotes("");
      loadData();

    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      toast.error('Erro ao rejeitar saque');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'approved':
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Aprovado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pendente</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout isAdmin={true}>
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0D0D0D]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin={true}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Wallet className="h-8 w-8 text-purple-500" />
                Gestão Financeira
              </h1>
              <p className="text-gray-400 mt-1">Gerencie saques, vendas e comissões da plataforma</p>
            </div>
            <Button
              variant="outline"
              onClick={loadData}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-green-600/20 to-green-900/20 border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Vendas Aprovadas</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalSales}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border-purple-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Comissões</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalCommissions)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border-yellow-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Saques Pendentes</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.pendingWithdrawals}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-400 text-sm font-medium">Valor Pendente</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.pendingWithdrawalsAmount)}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Total Pago</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalWithdrawn)}</p>
                  </div>
                  <ArrowDownCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="withdrawals" className="w-full">
            <TabsList className="bg-[#1A1A1A] border border-gray-800">
              <TabsTrigger value="withdrawals" className="data-[state=active]:bg-purple-600">
                <ArrowDownCircle className="h-4 w-4 mr-2" />
                Solicitações de Saque
              </TabsTrigger>
              <TabsTrigger value="sales" className="data-[state=active]:bg-purple-600">
                <CreditCard className="h-4 w-4 mr-2" />
                Vendas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="withdrawals" className="mt-4">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Solicitações de Saque</CardTitle>
                  <CardDescription className="text-gray-400">
                    Aprove ou rejeite as solicitações de saque dos vendedores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma solicitação de saque</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Data</TableHead>
                          <TableHead className="text-gray-400">Vendedor</TableHead>
                          <TableHead className="text-gray-400">Valor</TableHead>
                          <TableHead className="text-gray-400">PIX</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawals.map((w) => (
                          <TableRow key={w.id} className="border-gray-800">
                            <TableCell className="text-white">{formatDate(w.created_at)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-white font-medium">{w.seller_name}</p>
                                <p className="text-gray-400 text-sm">{w.seller_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-green-400 font-bold">{formatCurrency(w.amount)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-white">{w.pix_key_type?.toUpperCase()}</p>
                                <p className="text-gray-400 text-sm font-mono">{w.pix_key}</p>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(w.status)}</TableCell>
                            <TableCell>
                              {w.status === 'pending' ? (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedWithdrawal(w);
                                      setActionType('approve');
                                    }}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedWithdrawal(w);
                                      setActionType('reject');
                                    }}
                                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-gray-500 text-sm">
                                  {w.processed_at ? formatDate(w.processed_at) : '-'}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sales" className="mt-4">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Vendas Recentes</CardTitle>
                  <CardDescription className="text-gray-400">
                    Últimas 50 vendas realizadas na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sales.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nenhuma venda realizada</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Data</TableHead>
                          <TableHead className="text-gray-400">Vendedor</TableHead>
                          <TableHead className="text-gray-400">Cliente</TableHead>
                          <TableHead className="text-gray-400">Total</TableHead>
                          <TableHead className="text-gray-400">Comissão</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sales.map((sale) => (
                          <TableRow key={sale.id} className="border-gray-800">
                            <TableCell className="text-white">{formatDate(sale.created_at)}</TableCell>
                            <TableCell className="text-white">{sale.seller_name}</TableCell>
                            <TableCell className="text-gray-400">
                              {sale.customer_name || sale.customer_phone}
                            </TableCell>
                            <TableCell className="text-white">{formatCurrency(sale.total)}</TableCell>
                            <TableCell className="text-purple-400 font-semibold">
                              {formatCurrency(sale.platform_fee)}
                            </TableCell>
                            <TableCell>{getStatusBadge(sale.payment_status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!selectedWithdrawal && !!actionType} onOpenChange={() => {
        setSelectedWithdrawal(null);
        setActionType(null);
        setAdminNotes("");
      }}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Aprovar Saque
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Rejeitar Saque
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionType === 'approve' 
                ? 'Confirme a aprovação do saque. Você deverá realizar o PIX manualmente.'
                : 'Informe o motivo da rejeição. O valor será devolvido ao saldo do vendedor.'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-[#0D0D0D] rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Vendedor:</span>
                  <span className="text-white font-medium">{selectedWithdrawal.seller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Valor:</span>
                  <span className="text-green-400 font-bold">{formatCurrency(selectedWithdrawal.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Chave PIX:</span>
                  <span className="text-white font-mono">{selectedWithdrawal.pix_key}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo:</span>
                  <span className="text-white">{selectedWithdrawal.pix_key_type?.toUpperCase()}</span>
                </div>
              </div>

              <div>
                <Label className="text-gray-300">
                  {actionType === 'approve' ? 'Observações (opcional)' : 'Motivo da Rejeição *'}
                </Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'approve' 
                    ? 'Ex: PIX realizado às 14:30' 
                    : 'Ex: Dados do PIX incorretos'}
                  className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedWithdrawal(null);
                setActionType(null);
                setAdminNotes("");
              }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={actionType === 'approve' ? handleApprove : handleReject}
              disabled={processing}
              className={actionType === 'approve' 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : actionType === 'approve' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Aprovação
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Confirmar Rejeição
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSaques;
