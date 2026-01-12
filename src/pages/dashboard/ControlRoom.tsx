import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Terminal, Play, Pause, RefreshCw, Server, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ClientBotStatus {
    cpf: string;
    name: string;
    isPaused: boolean;
    status: string;
}

interface LogData {
    service: string;
    content: string;
    type: 'out' | 'error';
}

const ControlRoom = () => {
    const [clients, setClients] = useState<ClientBotStatus[]>([]);
    const [logs, setLogs] = useState<LogData[]>([
        { service: 'isa-whatsapp', content: 'Carregando...', type: 'out' },
        { service: 'isa-frontend', content: 'Carregando...', type: 'out' }
    ]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchClients();
        fetchLogs();
        const interval = setInterval(() => {
            fetchLogs();
            fetchClientsStatusOnly();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchClients = async () => {
        try {
            const { data: clientsData, error } = await supabase
                .from('clients')
                .select('id, full_name, cpf, is_active')
                .eq('is_active', true);

            if (error) throw error;

            // For each client, fetch their bot status from our backend
            const clientsWithStatus = await Promise.all(clientsData.map(async (c) => {
                try {
                    const response = await fetch(`http://148.230.76.60:8081/api/session/status/${c.cpf}`);
                    const data = await response.json();
                    return {
                        cpf: c.cpf,
                        name: c.full_name,
                        isPaused: data.isPaused || false,
                        status: data.status || 'disconnected'
                    };
                } catch (e) {
                    return {
                        cpf: c.cpf,
                        name: c.full_name,
                        isPaused: false,
                        status: 'error'
                    };
                }
            }));

            setClients(clientsWithStatus);
        } catch (error) {
            console.error("Error fetching clients:", error);
            toast.error("Erro ao carregar clientes");
        }
    };

    const fetchClientsStatusOnly = async () => {
        // Light update for status
        if (clients.length === 0) return;

        const updated = await Promise.all(clients.map(async (c) => {
            try {
                const response = await fetch(`http://148.230.76.60:8081/api/session/status/${c.cpf}`);
                const data = await response.json();
                return { ...c, isPaused: data.isPaused || false, status: data.status };
            } catch (e) {
                return c;
            }
        }));
        setClients(updated);
    };

    const fetchLogs = async () => {
        try {
            const [whatsappLogs, frontendLogs] = await Promise.all([
                fetch('http://148.230.76.60:8081/api/admin/logs/isa-whatsapp?type=out').then(r => r.json()),
                fetch('http://148.230.76.60:8081/api/admin/logs/isa-frontend?type=out').then(r => r.json()) // Frontend might be different service name? Assuming 'isa-frontend' from user prompt pm2 list
            ]);

            setLogs([
                { service: 'isa-whatsapp', content: whatsappLogs.logs || 'Sem logs ou erro ao ler.', type: 'out' },
                { service: 'isa-frontend', content: frontendLogs.logs || 'Sem logs ou erro ao ler.', type: 'out' }
            ]);
        } catch (e) {
            console.error("Error fetching logs", e);
        }
    };

    const togglePause = async (cpf: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`http://148.230.76.60:8081/api/admin/bot/${cpf}/toggle`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                setClients(prev => prev.map(c => c.cpf === cpf ? { ...c, isPaused: data.isPaused } : c));
                toast.success(data.isPaused ? "Bot Pausado" : "Bot Resumido");
            } else {
                toast.error("Erro ao alterar status");
            }
        } catch (e) {
            toast.error("Erro de conexão");
        }
    };

    return (
        <DashboardLayout isAdmin>
            <div className="p-6 lg:p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                            <Server className="w-8 h-8 text-primary" />
                            Sala de Controle
                        </h1>
                        <p className="text-muted-foreground">Gerencie os bots dos clientes e monitore o sistema.</p>
                    </div>
                    <Button onClick={() => { fetchClients(); fetchLogs(); }} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </Button>
                </div>

                {/* Gerenciamento de Bots */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-500" />
                            Status dos Bots de Clientes
                        </CardTitle>
                        <CardDescription>Pause ou ative a IA para cada cliente individualmente.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {clients.map(client => (
                                <div key={client.cpf} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${client.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <p className="font-medium">{client.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{client.cpf}</p>
                                        </div>
                                        <Badge variant={client.status === 'connected' ? 'default' : 'secondary'}>
                                            {client.status === 'connected' ? 'Online' : 'Offline'}
                                        </Badge>
                                        {client.isPaused && <Badge variant="destructive">PAUSADO</Badge>}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">Status IA:</span>
                                        <Switch
                                            checked={!client.isPaused}
                                            onCheckedChange={() => togglePause(client.cpf, client.isPaused)}
                                        />
                                        <span className="text-sm font-medium w-16">
                                            {!client.isPaused ? "Ativa" : "Pausada"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {clients.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenhum cliente ativo encontrado.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Logs do Sistema */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {logs.map((log) => (
                        <Card key={log.service} className="bg-black border-slate-800 text-green-400 font-mono text-sm overflow-hidden flex flex-col h-[500px]">
                            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between sticky top-0">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4" />
                                    <span className="font-bold">{log.service}</span>
                                </div>
                                <Badge variant="outline" className="text-[10px] border-green-900 text-green-600">PM2 LOG</Badge>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                <pre className="whitespace-pre-wrap break-all leading-tight">
                                    {log.content}
                                </pre>
                            </ScrollArea>
                        </Card>
                    ))}
                </div>

            </div>
        </DashboardLayout>
    );
};

export default ControlRoom;
