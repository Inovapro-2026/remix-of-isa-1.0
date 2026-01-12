import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Activity, Clock } from "lucide-react";

interface StatusCardProps {
    cpf: string;
    phone: string;
    status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting';
    stats: {
        messagesToday: number;
        activeContacts: number;
        responseRate: string;
        lastMessage: string | null;
    };
}

export function StatusCard({ cpf, phone, status, stats }: StatusCardProps) {
    const statusColor = {
        connected: "bg-emerald-500",
        disconnected: "bg-red-500",
        qr_ready: "bg-amber-500",
        connecting: "bg-blue-500"
    };

    const statusText = {
        connected: "Conectado",
        disconnected: "Desconectado",
        qr_ready: "Aguardando Leitura",
        connecting: "Conectando..."
    };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status da Sessão</CardTitle>
                <Badge variant="outline" className={`${statusColor[status] || "bg-gray-500"} text-white border-0`}>
                    {statusText[status] || status}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs text-muted-foreground">CPF Vinculado</span>
                        <span className="font-bold">{cpf}</span>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <span className="text-xs text-muted-foreground">Número WhatsApp</span>
                        <span className="font-bold">{phone || "--"}</span>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{stats.messagesToday}</span>
                            <span className="text-xs text-muted-foreground">Msgs Hoje</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{stats.activeContacts}</span>
                            <span className="text-xs text-muted-foreground">Contatos</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{stats.responseRate}</span>
                            <span className="text-xs text-muted-foreground">Taxa Resp.</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold truncate">{stats.lastMessage ? new Date(stats.lastMessage).toLocaleTimeString() : "--"}</span>
                            <span className="text-xs text-muted-foreground">Última Msg</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
