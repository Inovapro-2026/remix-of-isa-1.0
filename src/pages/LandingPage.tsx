import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Copy, CheckCircle, AlertCircle, ShoppingCart } from "lucide-react";

interface LandingPageConfig {
  title: string;
  description: string;
  image: string;
  price: number;
  buttonText: string;
  whatsappNumber: string;
}

interface PaymentData {
  payment_id: string;
  qr_code: string;
  qr_code_base64: string;
  expires_at: string;
  total: number;
}

const LandingPage = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<LandingPageConfig | null>(null);
  const [sellerId, setSellerId] = useState<string>('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadLandingPage();
  }, [id]);

  // Poll for payment status
  useEffect(() => {
    if (!paymentData?.payment_id) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('sales')
        .select('payment_status')
        .eq('id', paymentData.payment_id)
        .single();

      if (data?.payment_status === 'approved') {
        setPaymentStatus('approved');
        clearInterval(interval);
        toast.success('Pagamento confirmado! 🎉');
      } else if (data?.payment_status === 'rejected') {
        setPaymentStatus('rejected');
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentData?.payment_id]);

  const loadLandingPage = async () => {
    if (!id) return;

    try {
      // Find client by vitrine_id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('user_id')
        .eq('vitrine_id', id)
        .maybeSingle();

      if (clientError || !client) {
        toast.error('Landing page não encontrada');
        setLoading(false);
        return;
      }

      setSellerId(client.user_id || '');

      // Get landing page config from ai_local_memory
      const { data: memoryData } = await supabase
        .from('ai_local_memory')
        .select('value')
        .eq('table_name', 'client_memory')
        .eq('key', 'landingPage')
        .eq('matricula', id)
        .maybeSingle();

      if (memoryData?.value && typeof memoryData.value === 'object') {
        const value = memoryData.value as { config?: LandingPageConfig };
        if (value.config) {
          setConfig(value.config);
        }
      }
    } catch (error) {
      console.error('Error loading landing page:', error);
      toast.error('Erro ao carregar landing page');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = () => {
    if (!config?.price || config.price <= 0) {
      toast.error('Produto sem preço definido');
      return;
    }
    setShowPaymentModal(true);
  };

  const handleCreatePayment = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      toast.error('Por favor, informe seu telefone');
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('mercadopago-create-payment', {
        body: {
          seller_id: sellerId,
          customer_phone: customerPhone.replace(/\D/g, ''),
          customer_name: customerName || 'Cliente',
          items: [{
            product_id: 'landing-page-product',
            name: config?.title || 'Produto',
            quantity: 1,
            unit_price: config?.price || 0
          }],
          total: config?.price || 0
        }
      });

      if (error) throw error;

      if (data?.qr_code) {
        setPaymentData({
          payment_id: data.payment_id,
          qr_code: data.qr_code,
          qr_code_base64: data.qr_code_base64,
          expires_at: data.expires_at,
          total: data.total
        });
        setPaymentStatus('pending');
      } else {
        throw new Error('QR Code não gerado');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Erro ao gerar pagamento PIX');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (paymentData?.qr_code) {
      navigator.clipboard.writeText(paymentData.qr_code);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-purple-950/20 to-zinc-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!config || !config.title) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-purple-950/20 to-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Landing Page não configurada</h1>
          <p className="text-zinc-400">Esta página ainda não foi configurada pelo vendedor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-purple-950/20 to-zinc-900">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-4xl">
        {/* Product Card */}
        <div className="bg-zinc-800/50 backdrop-blur-xl rounded-3xl border border-zinc-700/50 overflow-hidden shadow-2xl">
          {/* Image */}
          {config.image && (
            <div className="relative h-64 md:h-96">
              <img 
                src={config.image} 
                alt={config.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {config.title}
            </h1>

            {config.description && (
              <p className="text-zinc-300 text-lg mb-8 whitespace-pre-wrap">
                {config.description}
              </p>
            )}

            {/* Price and CTA */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-700/50">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Preço especial</p>
                <p className="text-4xl font-bold text-green-400">
                  {formatPrice(config.price)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">Pagamento via PIX</p>
              </div>

              <Button
                onClick={handleBuyClick}
                size="lg"
                className="w-full md:w-auto px-12 py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {config.buttonText || 'Comprar Agora'}
              </Button>
            </div>

            {/* WhatsApp Contact */}
            {config.whatsappNumber && (
              <div className="mt-6 text-center">
                <p className="text-zinc-400 text-sm">
                  Dúvidas? Entre em contato pelo WhatsApp
                </p>
                <a
                  href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 mt-2"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Falar no WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>Pagamento seguro via Mercado Pago</p>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {paymentData ? 'Pagamento PIX' : 'Finalizar Compra'}
            </DialogTitle>
          </DialogHeader>

          {!paymentData ? (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
                <p className="text-sm text-zinc-400">Produto:</p>
                <p className="font-semibold text-white">{config.title}</p>
                <p className="text-2xl font-bold text-green-400 mt-2">
                  {formatPrice(config.price)}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-zinc-300">Seu nome</Label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Digite seu nome"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-zinc-300">Seu WhatsApp *</Label>
                  <Input
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Ex: 11999999999"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Usaremos para enviar a confirmação do pagamento
                  </p>
                </div>
              </div>

              <Button
                onClick={handleCreatePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  'Gerar QR Code PIX'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentStatus === 'approved' ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-400 mb-2">
                    Pagamento Confirmado!
                  </h3>
                  <p className="text-zinc-400">
                    Obrigado pela sua compra. Você receberá as informações pelo WhatsApp.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <div className="bg-white p-4 rounded-xl mb-4">
                      <QRCodeSVG
                        value={paymentData.qr_code}
                        size={200}
                        level="H"
                      />
                    </div>

                    <p className="text-center text-zinc-400 text-sm mb-4">
                      Escaneie o QR Code com seu app de banco ou copie o código abaixo
                    </p>

                    <Button
                      variant="outline"
                      onClick={copyPixCode}
                      className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Código Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar Código PIX
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 text-center">
                    <p className="text-sm text-zinc-400">Valor a pagar:</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatPrice(paymentData.total)}
                    </p>
                    <p className="text-xs text-zinc-500 mt-2">
                      ⏳ Aguardando pagamento...
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
