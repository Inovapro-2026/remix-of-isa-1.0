import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wallet, DollarSign, TrendingUp, ArrowDownCircle, Clock, 
  CheckCircle, XCircle, Loader2, RefreshCw, AlertCircle,
  CreditCard, History, Send
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

interface SellerBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface Sale {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  total: number;
  seller_amount: number;
  platform_fee: number;
  status: string;
  payment_status: string;
  created_at: string;
  paid_at: string | null;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
}

interface PixInfo {
  pix_key: string;
  pix_key_type: string;
  holder_name: string;
}

const ClientSaldo = () => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [pixInfo, setPixInfo] = useState<PixInfo | null>(null);
  const [minWithdrawal, setMinWithdrawal] = useState(50);
  
  // Withdrawal dialog
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load balance
      const { data: balanceData } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setBalance(balanceData || {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0
      });

      // Load recent sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setSales(salesData || []);

      // Load withdrawal requests
      const { data: withdrawalsData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setWithdrawals(withdrawalsData || []);

      // Load PIX info
      const { data: pixData } = await supabase
        .from('seller_pix_info')
        .select('pix_key, pix_key_type, holder_name')
        .eq('user_id', user.id)
        .maybeSingle();

      setPixInfo(pixData);

      // Load min withdrawal setting
      const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'min_withdrawal')
        .maybeSingle();

      const settingValue = settingsData?.setting_value as { amount?: number } | null;
      if (settingValue?.amount) {
        setMinWithdrawal(settingValue.amount);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount.replace(',', '.'));

    if (isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (amount < minWithdrawal) {
      toast.error(`Valor mínimo para saque é R$ ${minWithdrawal.toFixed(2)}`);
      return;
    }

    if (!balance || amount > balance.available_balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    if (!pixInfo?.pix_key) {
      toast.error('Configure seus dados PIX primeiro na Memória da IA');
      return;
    }

    setWithdrawing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Create withdrawal request
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          seller_id: user.id,
          amount: amount,
          pix_key: pixInfo.pix_key,
          pix_key_type: pixInfo.pix_key_type,
          status: 'pending'
        });

      if (error) throw error;

      // Update pending balance
      await supabase
        .from('seller_balances')
        .update({
          available_balance: balance.available_balance - amount,
          pending_balance: (balance.pending_balance || 0) + amount
        })
        .eq('user_id', user.id);

      toast.success('Solicitação de saque enviada! Aguarde aprovação do administrador.');
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
      loadData();

    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast.error('Erro ao solicitar saque');
    } finally {
      setWithdrawing(false);
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
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Cancelado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0D0D0D]">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Wallet className="h-8 w-8 text-green-500" />
                Meu Saldo
              </h1>
              <p className="text-gray-400 mt-1">Acompanhe suas vendas e gerencie seus saques</p>
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

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-600/20 to-green-900/20 border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Saldo Disponível</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {formatCurrency(balance?.available_balance || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-400 text-sm font-medium">Saldo Pendente</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatCurrency(balance?.pending_balance || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Total Faturado</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatCurrency(balance?.total_earned || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Total Sacado</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatCurrency(balance?.total_withdrawn || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <ArrowDownCircle className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Withdraw Button */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Send className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Solicitar Saque</h3>
                    <p className="text-gray-400 text-sm">
                      Valor mínimo: {formatCurrency(minWithdrawal)} • 
                      PIX: {pixInfo?.pix_key ? `${pixInfo.pix_key_type.toUpperCase()} - ${pixInfo.pix_key.slice(0, 6)}...` : 'Não configurado'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowWithdrawDialog(true)}
                  disabled={!balance || balance.available_balance < minWithdrawal || !pixInfo?.pix_key}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ArrowDownCircle className="h-4 w-4 mr-2" />
                  Sacar
                </Button>
              </div>
              {!pixInfo?.pix_key && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-400 text-sm">
                    Configure seus dados PIX na aba "Memória da IA" → "Pagamentos" para poder sacar.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Requests */}
          {withdrawals.length > 0 && (
            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-500" />
                  Solicitações de Saque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Data</TableHead>
                      <TableHead className="text-gray-400">Valor</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Processado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((w) => (
                      <TableRow key={w.id} className="border-gray-800">
                        <TableCell className="text-white">{formatDate(w.created_at)}</TableCell>
                        <TableCell className="text-green-400 font-semibold">{formatCurrency(w.amount)}</TableCell>
                        <TableCell>{getStatusBadge(w.status)}</TableCell>
                        <TableCell className="text-gray-400">
                          {w.processed_at ? formatDate(w.processed_at) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent Sales */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Vendas Recentes
              </CardTitle>
              <CardDescription className="text-gray-400">
                Últimas 20 vendas realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sales.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhuma venda realizada ainda</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Data</TableHead>
                      <TableHead className="text-gray-400">Cliente</TableHead>
                      <TableHead className="text-gray-400">Total</TableHead>
                      <TableHead className="text-gray-400">Você Recebe</TableHead>
                      <TableHead className="text-gray-400">Taxa</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id} className="border-gray-800">
                        <TableCell className="text-white">{formatDate(sale.created_at)}</TableCell>
                        <TableCell className="text-white">
                          {sale.customer_name || sale.customer_phone}
                        </TableCell>
                        <TableCell className="text-white">{formatCurrency(sale.total)}</TableCell>
                        <TableCell className="text-green-400 font-semibold">
                          {formatCurrency(sale.seller_amount)}
                        </TableCell>
                        <TableCell className="text-red-400">
                          -{formatCurrency(sale.platform_fee)}
                        </TableCell>
                        <TableCell>{getStatusBadge(sale.payment_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-green-500" />
              Solicitar Saque
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              O valor será enviado via PIX após aprovação do administrador.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">Saldo disponível</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(balance?.available_balance || 0)}</p>
            </div>

            <div>
              <Label className="text-gray-300">Valor do Saque (R$)</Label>
              <Input
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Mínimo ${formatCurrency(minWithdrawal)}`}
                className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
              />
            </div>

            <div className="p-4 bg-[#0D0D0D] rounded-lg">
              <p className="text-gray-400 text-sm">Será enviado para:</p>
              <p className="text-white font-medium">{pixInfo?.holder_name}</p>
              <p className="text-gray-400 text-sm">{pixInfo?.pix_key_type?.toUpperCase()}: {pixInfo?.pix_key}</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWithdrawDialog(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawing}
              className="bg-green-600 hover:bg-green-700"
            >
              {withdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Solicitar Saque
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientSaldo;
