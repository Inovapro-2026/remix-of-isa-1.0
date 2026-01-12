import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, AlertCircle, CheckCircle2, RefreshCw, RotateCcw } from "lucide-react";

interface ConnectionCardProps {
    status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting';
    qrCode?: string;
    onGenerateQR: () => void;
    onManualRefresh?: () => void; // New prop for manual check
}

export function ConnectionCard({ status, qrCode, onGenerateQR, onManualRefresh }: ConnectionCardProps) {
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (status === 'qr_ready' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && status === 'qr_ready') {
            onGenerateQR();
            setTimeLeft(60);
        }
    }, [status, timeLeft, onGenerateQR]);

    useEffect(() => {
        if (qrCode) setTimeLeft(60);
    }, [qrCode]);

    if (status === 'connected') {
        // ... existing connected view ...
        return (
            <Card className="w-full text-center border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="rounded-full bg-emerald-100 p-6 mb-4">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-700">WhatsApp Conectado</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                        Seu assistente ISA está ativo e pronto para responder mensagens automaticamente.
                    </p>
                    <Button variant="outline" className="mt-6 border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                        Configurar IA
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="text-center">
                <CardTitle>Conectar WhatsApp</CardTitle>
                <CardDescription>Escaneie o QR Code para vincular seu dispositivo</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pb-8">
                <div className="relative group">
                    <div className="w-[260px] h-[260px] border-2 border-dashed rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden">
                        {status === 'connecting' ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground animate-pulse">Iniciando sessão...</span>
                            </div>
                        ) : qrCode ? (
                            // Using standard img tag if QRCodeSVG fails, or ensure QRCodeSVG is imported correctly
                            // If qrCode is base64 string, QRCodeSVG might expect value. If it's a URL, use img.
                            // Usually Baileys returns a string content for QR.
                            <QRCodeSVG value={qrCode} size={240} level="H" />
                        ) : (
                            <div className="text-center p-4">
                                <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">QR Code indisponível.</p>
                                <Button size="sm" variant="link" onClick={onGenerateQR}>Tentar novamente</Button>
                            </div>
                        )}
                    </div>
                    {/* Timer Overlay */}
                    {status === 'qr_ready' && (
                        <div className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow-lg text-sm animate-in zoom-in">
                            {timeLeft}s
                        </div>
                    )}
                </div>

                <div className="mt-6 space-y-2 text-center max-w-xs">
                    <div className="text-sm font-medium text-muted-foreground">Instruções:</div>
                    <ol className="text-sm text-left list-decimal list-inside space-y-1 text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                        <li>Abra o WhatsApp e vá em <strong>Aparelhos Conectados</strong></li>
                        <li>Toque em <strong>Conectar um aparelho</strong></li>
                        <li>Escaneie o QR Code acima</li>
                    </ol>
                </div>

                {/* Manual Confirm Button */}
                {status === 'qr_ready' && (
                    <div className="mt-6 w-full px-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Ou</span>
                            </div>
                        </div>
                        {status === 'qr_ready' && qrCode && (
                            <div className="mt-4 space-y-3">
                                <Button
                                    onClick={onManualRefresh}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                                >
                                    <CheckCircle2 className="mr-2 h-5 w-5" />
                                    Já escaneei, validar conexão
                                </Button>
                                <Button
                                    onClick={onGenerateQR}
                                    variant="outline"
                                    className="w-full border-zinc-700 hover:bg-zinc-800"
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Gerar novo QR Code
                                </Button>
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            Clique acima se o status não atualizar automaticamente após o escaneamento.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
