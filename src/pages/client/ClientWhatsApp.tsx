import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { clientWhatsAppISA, PublicStatusResponse } from "@/services/clientWhatsAppISA";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  QrCode,
  Power,
  Trash2,
  RefreshCw,
  MessageSquare,
  Users,
  Activity,
  Clock,
  Loader2
} from "lucide-react";
import { QRCodeModal } from "@/components/whatsapp/QRCodeModal";
import { LogsCard, LogEntry } from "@/components/whatsapp/LogsCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ClientWhatsApp = () => {
  const { profile, isLoading: authLoading } = useAuth();

  // State
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'qr_ready' | 'connecting' | 'authenticated' | 'auth_failure'>('disconnected');
  const [qrImageUrl, setQrImageUrl] = useState<string | undefined>(undefined);
  const [stats, setStats] = useState({
    messagesToday: 0,
    activeContacts: 0,
    responseRate: "0%",
    lastMessage: null as string | null
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [phoneInfo, setPhoneInfo] = useState<string>("");
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [manualCpf, setManualCpf] = useState("");
  const [confirmedCpf, setConfirmedCpf] = useState("");
  const [isCpfModalOpen, setIsCpfModalOpen] = useState(false);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved CPF on mount/profile load
  useEffect(() => {
    if (profile?.id) {
      const saved = localStorage.getItem(`isa_whatsapp_cpf_${profile.id}`);
      if (saved) setConfirmedCpf(saved);
    }
  }, [profile?.id]);

  // Helper to get ID
  const getClientId = useCallback(() => {
    if (confirmedCpf) return confirmedCpf;
    if (profile?.cpf) {
      const clean = profile.cpf.replace(/\D/g, '');
      if (clean.length === 11) return clean;
    }
    if (profile?.matricula) return profile.matricula;
    if (profile?.id) return profile.id;
    return null;
  }, [confirmedCpf, profile?.cpf, profile?.matricula, profile?.id]);

  const rawId = getClientId();
  const formattedCpfOnProfile = profile?.cpf;
  const initialClientId = formattedCpfOnProfile ? formattedCpfOnProfile.replace(/\D/g, '') : rawId;
  const clientId = confirmedCpf || initialClientId;

  // Fetch status from WhatsApp ISA API (port 3333)
  const fetchStatus = useCallback(async (id: string) => {
    try {
      const data = await clientWhatsAppISA.getPublicStatus(id);

      let mappedStatus = data.status;
      // Map API states to UI states
      if (mappedStatus === 'open') {
        mappedStatus = 'connected';
      } else if (mappedStatus === 'close') {
        mappedStatus = 'disconnected';
      } else if (mappedStatus === 'authenticating' || mappedStatus === 'initializing') {
        mappedStatus = 'connecting';
      } else if (mappedStatus === 'authenticated') {
        mappedStatus = 'connected';
      }

      setStatus(mappedStatus as any);

      if (mappedStatus === 'connected') {
        setQrImageUrl(undefined);
        if (data.user?.id) {
          setPhoneInfo(data.user.id.split(':')[0]);
        }
      } else if (mappedStatus === 'qr_ready') {
        // Use base64 QR from API response
        if (data.qrCode) {
          setQrImageUrl(data.qrCode);
        }
      }

      if (data.messagesToday !== undefined) {
        setStats(prev => ({
          ...prev,
          messagesToday: data.messagesToday || 0,
          activeContacts: data.activeContacts || 0,
        }));
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  }, []);

  // Start polling when component mounts or clientId changes
  useEffect(() => {
    if (authLoading || !clientId) return;

    console.log("Starting status polling for:", clientId);

    // Fetch initial status
    fetchStatus(clientId);

    // Start polling every 5 seconds
    pollingRef.current = setInterval(() => {
      fetchStatus(clientId);
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [authLoading, clientId, fetchStatus]);

  // Actions
  const handleGenerateQR = async (cpfToUse?: string) => {
    const targetCpf = cpfToUse || clientId;
    if (!targetCpf) {
      setIsCpfModalOpen(true);
      return;
    }

    if (cpfToUse) {
      setConfirmedCpf(cpfToUse);
      if (profile?.id) {
        localStorage.setItem(`isa_whatsapp_cpf_${profile.id}`, cpfToUse);
        supabase.from('profiles').update({ cpf: cpfToUse }).eq('id', profile.id)
          .then(({ error }) => {
            if (error) console.error("Failed to update persistent profile CPF:", error);
          });
      }
    }

    setStatus('connecting');
    setIsQRModalOpen(true);
    
    // Try to fetch QR code with retries
    const maxRetries = 5;
    const retryDelay = 1500;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const data = await clientWhatsAppISA.getPublicStatus(targetCpf);
        
        if (data.status === 'connected' || data.status === 'open') {
          setStatus('connected');
          toast.success("WhatsApp já está conectado!");
          return;
        } else if (data.qrCode) {
          setQrImageUrl(data.qrCode);
          setStatus('qr_ready');
          toast.info("Escaneie o QR Code com seu WhatsApp");
          return;
        }
        
        // Wait and retry if no QR code yet
        if (i < maxRetries - 1) {
          console.log(`QR not ready, retrying... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (e) {
        console.error(`Error fetching QR (attempt ${i + 1}):`, e);
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    // If still no QR after retries, show waiting message
    toast.info("Aguardando QR Code... Continue aguardando ou tente novamente.");
    setStatus('connecting');
  };

  const handleOpenQRModal = () => {
    if (!clientId) {
      setIsCpfModalOpen(true);
      return;
    }

    if (status === 'disconnected') {
      if (initialClientId) {
        setManualCpf(initialClientId);
      }
      setIsCpfModalOpen(true);
    } else {
      setIsQRModalOpen(true);
    }
  };

  const handleManualRefresh = async () => {
    if (!clientId) return;
    toast.info("Verificando conexão...");
    await fetchStatus(clientId);
  };

  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleDisconnect = async () => {
    if (!clientId || isDisconnecting) return;
    setIsDisconnecting(true);
    try {
      await clientWhatsAppISA.disconnectSession(clientId);
      setStatus('disconnected');
      setQrImageUrl(undefined);
      toast.success("Desconectado");
    } catch (e: any) {
      toast.error(`Erro ao desconectar: ${e.message || 'Erro desconhecido'}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleResetSession = async () => {
    if (!clientId || isDisconnecting) return;
    setIsDisconnecting(true);
    try {
      await clientWhatsAppISA.deleteSession(clientId);
      toast.success("Sessão limpa com sucesso");
      setStatus('disconnected');
      setQrImageUrl(undefined);
      setLogs([]);
      setConfirmedCpf("");
      if (profile?.id) {
        localStorage.removeItem(`isa_whatsapp_cpf_${profile.id}`);
      }
    } catch (e: any) {
      toast.error(`Erro ao resetar: ${e.message || 'Erro desconhecido'}`);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (authLoading || !clientId) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="p-6 flex justify-center text-muted-foreground">Carregando...</div>
      </DashboardLayout>
    );
  }

  const statusConfig = {
    connected: {
      color: "bg-emerald-500",
      text: "Conectado",
      icon: Wifi,
      gradient: "from-emerald-500/20 to-emerald-600/10",
      border: "border-emerald-500/30"
    },
    disconnected: {
      color: "bg-zinc-500",
      text: "Desconectado",
      icon: WifiOff,
      gradient: "from-zinc-500/20 to-zinc-600/10",
      border: "border-zinc-500/30"
    },
    qr_ready: {
      color: "bg-amber-500",
      text: "Aguardando Leitura",
      icon: QrCode,
      gradient: "from-amber-500/20 to-amber-600/10",
      border: "border-amber-500/30"
    },
    connecting: {
      color: "bg-blue-500",
      text: "Conectando...",
      icon: RefreshCw,
      gradient: "from-blue-500/20 to-blue-600/10",
      border: "border-blue-500/30"
    },
    authenticated: {
      color: "bg-emerald-500",
      text: "Autenticado",
      icon: Wifi,
      gradient: "from-emerald-500/20 to-emerald-600/10",
      border: "border-emerald-500/30"
    },
    auth_failure: {
      color: "bg-red-500",
      text: "Falha na Autenticação",
      icon: WifiOff,
      gradient: "from-red-500/20 to-red-600/10",
      border: "border-red-500/30"
    }
  };

  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  return (
    <DashboardLayout isAdmin={false}>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Meu WhatsApp
            </h1>
            <p className="text-muted-foreground">Central de controle da sua conexão WhatsApp</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleManualRefresh}
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>

            {/* CPF Input Modal */}
            <AlertDialog open={isCpfModalOpen} onOpenChange={setIsCpfModalOpen}>
              <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle>Informe seu Telefone</AlertDialogTitle>
                  <AlertDialogDescription>
                    Para criar uma sessão persistente, precisamos vincular ao seu número de telefone.
                    Digite com DDD (apenas números).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <input
                    type="text"
                    placeholder="11999999999"
                    maxLength={13}
                    className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                    value={manualCpf}
                    onChange={(e) => setManualCpf(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setIsCpfModalOpen(false)} className="border-zinc-700">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (manualCpf.length >= 10 && manualCpf.length <= 13) {
                        handleGenerateQR(manualCpf);
                        setIsCpfModalOpen(false);
                      } else {
                        toast.error("Telefone inválido. Digite 10-13 números.");
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={manualCpf.length < 10 || manualCpf.length > 13}
                  >
                    Continuar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700" disabled={isDisconnecting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover Sessão
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-900 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá desconectar o WhatsApp, apagar as credenciais salvas e limpar o histórico local.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-zinc-700">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSession} className="bg-red-600 hover:bg-red-700" disabled={isDisconnecting}>
                    {isDisconnecting ? "Limpando..." : "Sim, remover tudo"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Main Status Card */}
        <Card className={`bg-gradient-to-br ${currentStatus.gradient} border ${currentStatus.border} backdrop-blur-sm`}>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              {/* Left: Status Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${currentStatus.color}/20 border border-white/10`}>
                    <StatusIcon className={`h-6 w-6 ${status === 'connecting' ? 'animate-spin' : ''}`} style={{ color: currentStatus.color.replace('bg-', '') }} />
                  </div>
                  <div>
                    <Badge className={`${currentStatus.color} text-white border-0 px-3 py-1`}>
                      {currentStatus.text}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">Status da conexão</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    <span className="text-xs text-muted-foreground">Matrícula</span>
                    <p className="font-mono text-sm font-medium truncate mt-1">{profile?.matricula || "Não informada"}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                    <span className="text-xs text-muted-foreground">Número WhatsApp</span>
                    <p className="font-medium text-sm mt-1">
                      {phoneInfo ? (() => {
                        const digits = phoneInfo.replace(/\D/g, '');
                        // Formato: 5511963445751 (13 dígitos) -> +55 (11) 96344-5751
                        if (digits.length === 13) {
                          return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`;
                        } else if (digits.length === 12) {
                          return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`;
                        }
                        return `+${digits}`;
                      })() : "Não conectado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Quick Actions */}
              <div className="flex flex-col gap-3 lg:w-64">
                {status === 'connected' ? (
                  <Button
                    onClick={handleDisconnect}
                    variant="outline"
                    disabled={isDisconnecting}
                    className="h-14 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Power className="mr-2 h-5 w-5" />
                    )}
                    {isDisconnecting ? 'Desconectando...' : 'Desconectar'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleOpenQRModal}
                    disabled={isDisconnecting}
                    className="h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/25"
                  >
                    <QrCode className="mr-2 h-5 w-5" />
                    Gerar QR Code
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.messagesToday}</p>
                  <p className="text-xs text-muted-foreground">Mensagens Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Users className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeContacts}</p>
                  <p className="text-xs text-muted-foreground">Contatos Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.responseRate}</p>
                  <p className="text-xs text-muted-foreground">Taxa de Resposta</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold truncate">
                    {stats.lastMessage ? new Date(stats.lastMessage).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                  </p>
                  <p className="text-xs text-muted-foreground">Última Mensagem</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <div className="grid grid-cols-1 gap-6">
          {/* Connection Info */}
          {status === 'connected' && (
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Wifi className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="font-medium text-emerald-400">Conexão Ativa</span>
                </div>
                <p className="text-sm text-zinc-400">
                  Seu WhatsApp está conectado e a ISA está respondendo automaticamente às mensagens dos seus clientes.
                </p>
              </CardContent>
            </Card>
          )}

          <LogsCard logs={logs} />
        </div>

        {/* QR Code Modal */}
        <QRCodeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          qrCode={qrImageUrl}
          status={status}
          onGenerateQR={handleGenerateQR}
          onConfirmConnection={handleManualRefresh}
        />
      </div>
    </DashboardLayout>
  );
};

export default ClientWhatsApp;
