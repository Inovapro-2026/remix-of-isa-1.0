import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, Search, Filter, Smartphone, Wifi, WifiOff, QrCode,
  Clock, Trash2, Play, Pause, RefreshCw, AlertCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface WhatsAppSession {
  client_id: string;
  client_name: string;
  status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting' | 'error';
  qr_code?: string;
  phone_info?: {
    phone: string;
    device_model: string;
    battery: number;
  };
  connection_time?: string;
  last_activity?: string;
  stats?: {
    messages_sent: number;
    messages_received: number;
    contacts: number;
    response_rate: number;
    last_24h: number;
  };
}

interface SessionManagerProps {
  sessions: WhatsAppSession[];
  onConnect: (clientId: string) => void;
  onDisconnect: (clientId: string) => void;
  onDelete: (clientId: string) => void;
  onRefresh: (clientId: string) => void;
  onCreateSession: (clientId: string, clientName: string) => void;
  isLoading: boolean;
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  sessions,
  onConnect,
  onDisconnect,
  onDelete,
  onRefresh,
  onCreateSession,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newClientId, setNewClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.client_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || session.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      case 'qr_ready': return 'bg-yellow-500';
      case 'connecting': return 'bg-blue-500';
      case 'error': return 'bg-red-700';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'disconnected': return 'destructive';
      case 'qr_ready': return 'secondary';
      case 'connecting': return 'outline';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return 'Nunca';
    
    const diff = new Date().getTime() - new Date(lastActivity).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}min atrás`;
    return 'Agora';
  };

  const handleCreateSession = () => {
    if (!newClientId.trim() || !newClientName.trim()) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    onCreateSession(newClientId.trim(), newClientName.trim());
    setNewClientId("");
    setNewClientName("");
    setIsCreateModalOpen(false);
  };

  const validateCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(numbers[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[9])) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(numbers[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(numbers[10])) return false;
    
    return true;
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciador de Sessões</h2>
          <p className="text-muted-foreground">
            Gerencie múltiplas sessões WhatsApp de forma centralizada
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Sessão
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por CPF ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "connected" ? "default" : "outline"}
                onClick={() => setStatusFilter("connected")}
                size="sm"
              >
                <Wifi className="w-3 h-3 mr-1" />
                Conectados
              </Button>
              <Button
                variant={statusFilter === "disconnected" ? "default" : "outline"}
                onClick={() => setStatusFilter("disconnected")}
                size="sm"
              >
                <WifiOff className="w-3 h-3 mr-1" />
                Desconectados
              </Button>
              <Button
                variant={statusFilter === "qr_ready" ? "default" : "outline"}
                onClick={() => setStatusFilter("qr_ready")}
                size="sm"
              >
                <QrCode className="w-3 h-3 mr-1" />
                QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredSessions.map((session) => (
          <Card key={session.client_id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className={`w-10 h-10 ${getStatusColor(session.status)} rounded-full flex items-center justify-center`}>
                      <Smartphone className="w-5 h-5 text-white" />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(session.status)} rounded-full border-2 border-white`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{session.client_name}</CardTitle>
                    <CardDescription className="text-xs">{session.client_id}</CardDescription>
                  </div>
                </div>
                <Badge variant={getStatusBadgeVariant(session.status)}>
                  {session.status === 'connected' && <Wifi className="w-3 h-3 mr-1" />}
                  {session.status === 'disconnected' && <WifiOff className="w-3 h-3 mr-1" />}
                  {session.status === 'qr_ready' && <QrCode className="w-3 h-3 mr-1" />}
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Última atividade</span>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{formatLastActivity(session.last_activity)}</span>
                </div>
              </div>
              
              {session.stats && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <div className="text-muted-foreground">Mensagens</div>
                    <div className="font-semibold">{session.stats.messages_sent}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                    <div className="text-muted-foreground">Contatos</div>
                    <div className="font-semibold">{session.stats.contacts}</div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-2 pt-2">
                {session.status === 'connected' ? (
                  <Button 
                    onClick={() => onDisconnect(session.client_id)}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <Pause className="w-3 h-3 mr-1" />
                    Desconectar
                  </Button>
                ) : (
                  <Button 
                    onClick={() => onConnect(session.client_id)}
                    disabled={isLoading}
                    size="sm"
                    className="flex-1"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Play className="w-3 h-3 mr-1" />
                    )}
                    Conectar
                  </Button>
                )}
                
                <Button 
                  onClick={() => onRefresh(session.client_id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                <Button 
                  onClick={() => onDelete(session.client_id)}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="w-16 h-16 text-gray-400" />
            <h3 className="text-lg font-semibold">Nenhuma sessão encontrada</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchTerm || statusFilter !== "all" 
                ? "Nenhuma sessão corresponde aos filtros aplicados."
                : "Crie sua primeira sessão WhatsApp para começar."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Create Session Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Sessão WhatsApp</DialogTitle>
            <DialogDescription>
              Insira os dados para criar uma nova sessão WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">CPF do Responsável</Label>
              <Input
                id="clientId"
                placeholder="Digite o CPF (apenas números)"
                value={newClientId}
                onChange={(e) => setNewClientId(formatCPF(e.target.value))}
                maxLength={14}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome do Cliente</Label>
              <Input
                id="clientName"
                placeholder="Digite o nome completo"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateSession}
              disabled={!validateCPF(newClientId) || !newClientName.trim()}
            >
              Criar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};