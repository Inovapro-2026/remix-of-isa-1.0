import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, QrCode, Wifi, WifiOff, RefreshCw, Trash2, Smartphone, 
  MessageSquare, Users, Clock, CheckCircle, AlertCircle, 
  Settings, Activity, BarChart3, TrendingUp, Download,
  Play, Pause, Power, RotateCcw, Shield, Globe
} from "lucide-react";
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

interface WhatsAppDashboardProps {
  session: WhatsAppSession | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefresh: () => void;
  onDelete: () => void;
  isLoading: boolean;
}

export const WhatsAppDashboard: React.FC<WhatsAppDashboardProps> = ({
  session,
  onConnect,
  onDisconnect,
  onRefresh,
  onDelete,
  isLoading
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [connectionDuration, setConnectionDuration] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      
      if (session?.connection_time && session.status === 'connected') {
        const duration = new Date().getTime() - new Date(session.connection_time).getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((duration % (1000 * 60)) / 1000);
        
        setConnectionDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

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

  if (!session) {
    return (
      <Card className="border-dashed border-2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full flex items-center justify-center">
              <Smartphone className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <WifiOff className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              WhatsApp Desconectado
            </h3>
            <p className="text-muted-foreground max-w-sm">
              Conecte seu WhatsApp para começar a enviar mensagens e gerenciar seus contatos
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={onConnect} 
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              Conectar WhatsApp
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className={`w-16 h-16 ${getStatusColor(session.status)} rounded-full flex items-center justify-center shadow-lg`}>
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(session.status)} rounded-full border-4 border-white dark:border-gray-800`} />
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {session.client_name || session.client_id}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusBadgeVariant(session.status)}>
                    {session.status === 'connected' && <Wifi className="w-3 h-3 mr-1" />}
                    {session.status === 'disconnected' && <WifiOff className="w-3 h-3 mr-1" />}
                    {session.status === 'qr_ready' && <QrCode className="w-3 h-3 mr-1" />}
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                  </Badge>
                  {session.status === 'connected' && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {connectionDuration}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              {session.status === 'connected' ? (
                <Button 
                  onClick={onDisconnect} 
                  variant="destructive"
                  size="sm"
                >
                  <Power className="w-4 h-4 mr-2" />
                  Desconectar
                </Button>
              ) : (
                <Button 
                  onClick={onConnect} 
                  disabled={isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-green-600 to-blue-600"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  Conectar
                </Button>
              )}
              
              <Button 
                onClick={onRefresh} 
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button 
                onClick={onDelete} 
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="device">Dispositivo</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Última atividade: {formatLastActivity(session.last_activity)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mensagens</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {session.stats?.messages_sent || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Enviadas hoje
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {session.stats?.contacts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ativos no sistema
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa Resposta</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {session.stats?.response_rate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Taxa de resposta
                </p>
              </CardContent>
            </Card>
          </div>

          {session.qr_code && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="w-5 h-5 mr-2" />
                  QR Code de Conexão
                </CardTitle>
                <CardDescription>
                  Escaneie este código com seu WhatsApp para conectar
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <img 
                    src={session.qr_code} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    1. Abra o WhatsApp no seu celular
                  </p>
                  <p className="text-sm text-muted-foreground">
                    2. Toque em <strong>Configurações</strong> → <strong>Dispositivos Conectados</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    3. Toque em <strong>Conectar Dispositivo</strong> e escaneie o código
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Atividade de Mensagens</CardTitle>
                <CardDescription>Últimas 24 horas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Enviadas</span>
                    <span className="font-semibold">{session.stats?.messages_sent || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recebidas</span>
                    <span className="font-semibold">{session.stats?.messages_received || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-semibold">
                      {(session.stats?.messages_sent || 0) + (session.stats?.messages_received || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desempenho</CardTitle>
                <CardDescription>Métricas de resposta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Taxa de Resposta</span>
                      <span className="font-semibold">{session.stats?.response_rate || 0}%</span>
                    </div>
                    <Progress value={session.stats?.response_rate || 0} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Contatos Ativos</span>
                    <span className="font-semibold">{session.stats?.contacts || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="device" className="space-y-4">
          {session.phone_info ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Smartphone className="w-5 h-5 mr-2" />
                    Informações do Dispositivo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Número</p>
                    <p className="font-semibold">{session.phone_info.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-semibold">{session.phone_info.device_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bateria</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={session.phone_info.battery} className="w-20 h-2" />
                      <span className="text-sm font-semibold">{session.phone_info.battery}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Conexão segura estabelecida</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Criptografia de ponta a ponta</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Autenticação verificada</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                <Smartphone className="w-16 h-16 text-gray-400" />
                <h3 className="text-lg font-semibold">Dispositivo não conectado</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  Conecte seu WhatsApp para visualizar as informações do dispositivo
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configurações da Sessão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-reconexão</p>
                  <p className="text-sm text-muted-foreground">
                    Reconectar automaticamente em caso de desconexão
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Ativar
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações</p>
                  <p className="text-sm text-muted-foreground">
                    Receber alertas sobre status da conexão
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Configurar
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Backup de Sessão</p>
                  <p className="text-sm text-muted-foreground">
                    Fazer backup automático da sessão
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};