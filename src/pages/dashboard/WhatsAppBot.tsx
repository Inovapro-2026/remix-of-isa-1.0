import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, QrCode, Wifi, WifiOff, RefreshCw, Pause, Play, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

const WhatsAppBot = () => {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [cpf, setCpf] = useState("");
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleConnect = () => {
    if (!cpf) {
      setShowCpfModal(true);
      return;
    }
    setStatus("connecting");
    // Simula conexão
    setTimeout(() => setStatus("connected"), 3000);
  };

  const handleCpfSubmit = () => {
    setShowCpfModal(false);
    setStatus("connecting");
    setTimeout(() => setStatus("connected"), 3000);
  };

  const handleDisconnect = () => {
    setStatus("disconnected");
  };

  const handleRestart = () => {
    setStatus("connecting");
    setTimeout(() => setStatus("connected"), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">WhatsApp Bot</h1>
          <p className="text-muted-foreground">Gerencie a conexão da IA com o WhatsApp</p>
        </div>

        {/* Status Card */}
        <Card variant="gradient" className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Bot className="w-6 h-6 text-primary" />
              Status da Conexão
            </CardTitle>
            <CardDescription>
              {status === "disconnected" && "WhatsApp não está conectado"}
              {status === "connecting" && "Aguardando leitura do QR Code..."}
              {status === "connected" && "WhatsApp conectado e funcionando"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status indicator */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${status === "connected"
              ? "bg-accent/10 border-accent/30"
              : status === "connecting"
                ? "bg-primary/10 border-primary/30"
                : "bg-destructive/10 border-destructive/30"
              }`}>
              {status === "connected" ? (
                <Wifi className="w-8 h-8 text-accent" />
              ) : status === "connecting" ? (
                <RefreshCw className="w-8 h-8 text-primary animate-spin" />
              ) : (
                <WifiOff className="w-8 h-8 text-destructive" />
              )}
              <div>
                <p className="font-semibold text-lg">
                  {status === "connected" && "Conectado"}
                  {status === "connecting" && "Conectando..."}
                  {status === "disconnected" && "Desconectado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {status === "connected" && (isPaused ? "IA pausada" : "IA respondendo automaticamente")}
                  {status === "connecting" && "Escaneie o QR Code no seu celular"}
                  {status === "disconnected" && "Clique em conectar para iniciar"}
                </p>
              </div>
            </div>

            {/* QR Code area */}
            {status === "connecting" && (
              <div className="flex flex-col items-center gap-4 p-8 border border-dashed border-border rounded-xl">
                <QrCode className="w-32 h-32 text-primary animate-pulse-glow" />
                <p className="text-sm text-muted-foreground text-center">
                  Abra o WhatsApp no seu celular, vá em Dispositivos Conectados e escaneie o código
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {status === "disconnected" && (
                <Dialog open={showCpfModal} onOpenChange={setShowCpfModal}>
                  <DialogTrigger asChild>
                    <Button variant="hero" onClick={handleConnect}>
                      <Wifi className="w-4 h-4" />
                      Conectar WhatsApp
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass">
                    <DialogHeader>
                      <DialogTitle>Identificação</DialogTitle>
                      <DialogDescription>
                        Informe seu telefone para criar sua instância do WhatsApp
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Digite seu telefone (DDD + número)"
                        value={cpf}
                        onChange={(e) => setCpf(e.target.value)}
                      />
                      <Button variant="hero" className="w-full" onClick={handleCpfSubmit}>
                        Continuar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {status === "connected" && (
                <>
                  <Button
                    variant={isPaused ? "accent" : "outline"}
                    onClick={() => setIsPaused(!isPaused)}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? "Retomar IA" : "Pausar IA"}
                  </Button>
                  <Button variant="outline" onClick={handleRestart}>
                    <RefreshCw className="w-4 h-4" />
                    Reiniciar Instância
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect}>
                    <Trash2 className="w-4 h-4" />
                    Limpar Sessão
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default WhatsAppBot;
