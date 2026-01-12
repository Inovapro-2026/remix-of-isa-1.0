import { Button } from "@/components/ui/button";
import { RefreshCw, Power, Trash2 } from "lucide-react";
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

interface ActionButtonsProps {
    status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting';
    onGenerateQR: () => void;
    onDisconnect: () => void;
    onResetSession: () => void;
}

export function ActionButtons({ status, onGenerateQR, onDisconnect, onResetSession }: ActionButtonsProps) {
    const isQrStatus = status === 'disconnected' || status === 'qr_ready';
    const isConnecting = status === 'connecting';
    
    return (
        <div className="flex flex-wrap gap-3 justify-end">
            {isQrStatus && (
                <Button variant="outline" onClick={onGenerateQR} disabled={isConnecting}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {status === 'qr_ready' ? 'Regerar QR' : 'Gerar QR Code'}
                </Button>
            )}

            {status === 'connected' && (
                <Button variant="outline" onClick={onDisconnect}>
                    <Power className="mr-2 h-4 w-4" />
                    Desconectar
                </Button>
            )}

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover Sessão
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Isso irá desconectar o WhatsApp, apagar as credenciais salvas e limpar o histórico local.
                            Você precisará escanear o QR Code novamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onResetSession} className="bg-red-600 hover:bg-red-700">
                            Sim, remover tudo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
