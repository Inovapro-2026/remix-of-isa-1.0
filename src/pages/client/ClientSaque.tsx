import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Wallet,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  History,
  DollarSign,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SellerBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

interface PixInfo {
  id: string;
  pix_key: string;
  pix_key_type: string;
  holder_name: string;
  holder_document: string | null;
  is_verified: boolean;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  status: string;
  pix_key: string;
  pix_key_type: string;
  created_at: string;
  processed_at: string | null;
  admin_notes: string | null;
}

const PIX_KEY_TYPES = [
  { value: 'cpf', label: 'CPF' },
  { value: 'cnpj', label: 'CNPJ' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'random', label: 'Chave Aleatória' },
];

const MIN_WITHDRAWAL = 20;

export default function ClientSaque() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  const [pixInfo, setPixInfo] = useState<PixInfo | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  
  // Form states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // PIX form
  const [pixKeyType, setPixKeyType] = useState("cpf");
  const [pixKey, setPixKey] = useState("");
  const [holderName, setHolderName] = useState("");
  const [holderDocument, setHolderDocument] = useState("");

  const fetchData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch balance
      const { data: balanceData } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setBalance(balanceData || {
        available_balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      });

      // Fetch PIX info
      const { data: pixData } = await supabase
        .from('seller_pix_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setPixInfo(pixData);

      // Fetch withdrawal history
      const { data: withdrawalData } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      setWithdrawals(withdrawalData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSavePixInfo = async () => {
    if (!user) return;
    if (!pixKey.trim() || !holderName.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    try {
      const pixData = {
        user_id: user.id,
        pix_key_type: pixKeyType,
        pix_key: pixKey.trim(),
        holder_name: holderName.trim(),
        holder_document: holderDocument.trim() || null,
      };

      if (pixInfo) {
        const { error } = await supabase
          .from('seller_pix_info')
          .update(pixData)
          .eq('id', pixInfo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('seller_pix_info')
          .insert(pixData);

        if (error) throw error;
      }

      toast.success('Dados PIX salvos com sucesso!');
      setShowPixModal(false);
      fetchData();
    } catch (error) {
      console.error('Error saving PIX info:', error);
      toast.error('Erro ao salvar dados PIX');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !pixInfo) return;

    const amount = parseFloat(withdrawAmount.replace(',', '.'));
    
    if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
      toast.error(`Valor mínimo para saque: ${formatCurrency(MIN_WITHDRAWAL)}`);
      return;
    }

    if (amount > (balance?.available_balance || 0)) {
      toast.error('Saldo insuficiente');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          seller_id: user.id,
          amount,
          pix_key: pixInfo.pix_key,
          pix_key_type: pixInfo.pix_key_type,
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Solicitação de saque enviada!');
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      fetchData();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error('Erro ao solicitar saque');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openPixModal = () => {
    if (pixInfo) {
      setPixKeyType(pixInfo.pix_key_type);
      setPixKey(pixInfo.pix_key);
      setHolderName(pixInfo.holder_name);
      setHolderDocument(pixInfo.holder_document || "");
    }
    setShowPixModal(true);
  };

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending' || w.status === 'processing');

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] text-white">
        <div className="p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Saques</h1>
            <p className="text-zinc-400">Gerencie seu saldo e solicite saques para sua conta PIX</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-[#1E1E1E] border-[#27272a]">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-green-600/20">
                    <Wallet className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <h3 className="text-zinc-400 text-xs mb-1">Saldo Disponível</h3>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(balance?.available_balance || 0)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Disponível para saque</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#27272a]">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-amber-600/20">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-zinc-400 text-xs mb-1">Saldo Pendente</h3>
                <p className="text-2xl font-bold text-amber-500">
                  {formatCurrency(balance?.pending_balance || 0)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Aguardando liberação</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#27272a]">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-600/20">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-zinc-400 text-xs mb-1">Total Ganho</h3>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(balance?.total_earned || 0)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Desde o início</p>
              </CardContent>
            </Card>

            <Card className="bg-[#1E1E1E] border-[#27272a]">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-600/20">
                    <ArrowDownCircle className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-zinc-400 text-xs mb-1">Total Sacado</h3>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(balance?.total_withdrawn || 0)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Valor total retirado</p>
              </CardContent>
            </Card>
          </div>

          {/* PIX Info and Withdraw Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PIX Configuration */}
            <Card className="bg-[#1E1E1E] border-[#27272a]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-5 w-5 text-green-500" />
                  Dados PIX
                </CardTitle>
                <CardDescription>Configure sua chave PIX para receber saques</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pixInfo ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-[#27272a] rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Tipo de Chave:</span>
                        <span className="text-white font-medium">
                          {PIX_KEY_TYPES.find(t => t.value === pixInfo.pix_key_type)?.label}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Chave PIX:</span>
                        <span className="text-white font-medium">{pixInfo.pix_key}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 text-sm">Titular:</span>
                        <span className="text-white font-medium">{pixInfo.holder_name}</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-zinc-700"
                      onClick={openPixModal}
                    >
                      Editar Dados PIX
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CreditCard className="h-12 w-12 mx-auto mb-3 text-zinc-500" />
                    <p className="text-zinc-400 mb-4">Nenhuma chave PIX cadastrada</p>
                    <Button 
                      className="bg-green-600 hover:bg-green-700"
                      onClick={openPixModal}
                    >
                      Cadastrar Chave PIX
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Withdraw Section */}
            <Card className="bg-[#1E1E1E] border-[#27272a]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ArrowDownCircle className="h-5 w-5 text-green-500" />
                  Solicitar Saque
                </CardTitle>
                <CardDescription>
                  Mínimo: {formatCurrency(MIN_WITHDRAWAL)} | Taxa: 0%
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!pixInfo ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-500 font-medium">Configure sua chave PIX</p>
                        <p className="text-zinc-400 text-sm mt-1">
                          Você precisa cadastrar uma chave PIX antes de solicitar saques.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : hasPendingWithdrawal ? (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-blue-500 font-medium">Saque em processamento</p>
                        <p className="text-zinc-400 text-sm mt-1">
                          Aguarde a conclusão do saque anterior para solicitar um novo.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (balance?.available_balance || 0) < MIN_WITHDRAWAL ? (
                  <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-zinc-400 font-medium">Saldo insuficiente</p>
                        <p className="text-zinc-500 text-sm mt-1">
                          Você precisa de pelo menos {formatCurrency(MIN_WITHDRAWAL)} para solicitar um saque.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
                      <p className="text-zinc-400 text-sm mb-1">Disponível para saque</p>
                      <p className="text-3xl font-bold text-green-500">
                        {formatCurrency(balance?.available_balance || 0)}
                      </p>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => setShowWithdrawModal(true)}
                    >
                      <ArrowDownCircle className="h-4 w-4 mr-2" />
                      Solicitar Saque
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Withdrawal History */}
          <Card className="bg-[#1E1E1E] border-[#27272a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <History className="h-5 w-5 text-purple-500" />
                Histórico de Saques
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 mx-auto mb-3 text-zinc-500 opacity-50" />
                  <p className="text-zinc-500">Nenhum saque realizado ainda</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Data</TableHead>
                      <TableHead className="text-zinc-400">Valor</TableHead>
                      <TableHead className="text-zinc-400">Chave PIX</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400">Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.map((withdrawal) => (
                      <TableRow key={withdrawal.id} className="border-zinc-800">
                        <TableCell className="text-white">
                          {format(new Date(withdrawal.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {formatCurrency(withdrawal.amount)}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {withdrawal.pix_key}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(withdrawal.status)}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-sm">
                          {withdrawal.admin_notes || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PIX Modal */}
      <Dialog open={showPixModal} onOpenChange={setShowPixModal}>
        <DialogContent className="bg-[#1E1E1E] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Dados PIX</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Configure sua chave PIX para receber os saques
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Chave</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {PIX_KEY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chave PIX *</Label>
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Digite sua chave PIX"
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do Titular *</Label>
              <Input
                value={holderName}
                onChange={(e) => setHolderName(e.target.value)}
                placeholder="Nome completo do titular"
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ do Titular</Label>
              <Input
                value={holderDocument}
                onChange={(e) => setHolderDocument(e.target.value)}
                placeholder="Documento do titular (opcional)"
                className="bg-zinc-900 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPixModal(false)} className="border-zinc-700">
              Cancelar
            </Button>
            <Button 
              onClick={handleSavePixInfo} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="bg-[#1E1E1E] border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Informe o valor que deseja sacar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-zinc-900 rounded-lg">
              <p className="text-zinc-400 text-sm">Saldo disponível</p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(balance?.available_balance || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Valor do Saque (R$)</Label>
              <Input
                type="text"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`Mínimo: ${MIN_WITHDRAWAL},00`}
                className="bg-zinc-900 border-zinc-700 text-xl"
              />
              <p className="text-xs text-zinc-500">
                Mínimo: {formatCurrency(MIN_WITHDRAWAL)}
              </p>
            </div>
            <div className="p-3 bg-zinc-900 rounded-lg text-sm">
              <p className="text-zinc-400">PIX de destino:</p>
              <p className="text-white font-medium">{pixInfo?.pix_key}</p>
              <p className="text-zinc-500">{pixInfo?.holder_name}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="border-zinc-700">
              Cancelar
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
