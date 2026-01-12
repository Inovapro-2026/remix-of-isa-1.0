import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, RefreshCw, Loader2, Wifi, Smartphone } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode?: string; // Can be QR string data, data:image URL, or http:// image URL
  status: 'connected' | 'disconnected' | 'qr_ready' | 'connecting' | 'authenticated' | 'auth_failure';
  onGenerateQR: () => void;
  onConfirmConnection: () => void;
}

// Check if the qrCode is an image URL (http or data:image)
const isImageUrl = (qr: string): boolean => {
  return qr.startsWith('data:image') || qr.startsWith('http://') || qr.startsWith('https://');
};

export function QRCodeModal({
  isOpen,
  onClose,
  qrCode,
  status,
  onGenerateQR,
  onConfirmConnection
}: QRCodeModalProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (status === 'qr_ready' && timeLeft > 0 && isOpen) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && status === 'qr_ready') {
      onGenerateQR();
      setTimeLeft(60);
    }
  }, [status, timeLeft, onGenerateQR, isOpen]);

  useEffect(() => {
    if (qrCode) setTimeLeft(60);
  }, [qrCode]);

  useEffect(() => {
    if (status === 'connected') {
      setTimeout(onClose, 1500);
    }
  }, [status, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <Smartphone className="h-5 w-5 text-emerald-500" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {status === 'connected' ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-emerald-500/20 p-6 animate-pulse">
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold text-emerald-400">Conectado com Sucesso!</h3>
              <p className="text-sm text-zinc-400 text-center">
                Seu WhatsApp está conectado e a ISA está pronta para atender.
              </p>
            </div>
          ) : (
            <>
              {/* QR Code Display */}
              <div className="relative">
                <div className="w-[280px] h-[280px] rounded-2xl bg-white p-4 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                  {status === 'connecting' ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                      <span className="text-sm text-zinc-600 animate-pulse">Gerando QR Code...</span>
                    </div>
                  ) : qrCode ? (
                    isImageUrl(qrCode) ? (
                      <img 
                        src={qrCode} 
                        alt="WhatsApp QR Code" 
                        className="w-[248px] h-[248px]"
                        onError={(e) => {
                          console.error('QR image failed to load');
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <QRCodeSVG
                        value={qrCode}
                        size={248}
                        level="H"
                        bgColor="transparent"
                        fgColor="#000000"
                      />
                    )
                  ) : (
                    <div className="text-center">
                      <Wifi className="h-12 w-12 text-zinc-400 mx-auto mb-2" />
                      <p className="text-sm text-zinc-600">Clique em gerar QR Code</p>
                    </div>
                  )}
                </div>

                {/* Timer Badge */}
                {status === 'qr_ready' && qrCode && (
                  <div className="absolute -top-3 -right-3 h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold shadow-lg text-lg animate-pulse">
                    {timeLeft}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 w-full space-y-3">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">📱 Como conectar:</h4>
                  <ol className="text-sm text-zinc-400 space-y-1 list-decimal list-inside">
                    <li>Abra o WhatsApp no celular</li>
                    <li>Vá em <span className="text-emerald-400">Configurações → Aparelhos Conectados</span></li>
                    <li>Toque em <span className="text-emerald-400">Conectar Aparelho</span></li>
                    <li>Escaneie este QR Code</li>
                  </ol>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 w-full space-y-3">
                <Button
                  onClick={onConfirmConnection}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold shadow-lg shadow-emerald-500/25"
                  disabled={!qrCode || status !== 'qr_ready'}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Confirmar Conexão
                </Button>

                <Button
                  onClick={onGenerateQR}
                  variant="outline"
                  className="w-full h-10 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                  disabled={status === 'connecting'}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${status === 'connecting' ? 'animate-spin' : ''}`} />
                  {status === 'qr_ready' ? 'Regenerar QR Code' : 'Gerar QR Code'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
