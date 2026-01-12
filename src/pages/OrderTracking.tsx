import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Package, CheckCircle, Clock, XCircle, Loader2, 
  Search, ArrowLeft, Phone, Calendar, CreditCard,
  Truck, ShoppingBag, Receipt
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaleItem {
  product_id: string;
  name: string;
  price?: number;
  unit_price?: number;
  quantity: number;
}

interface OrderData {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  items: SaleItem[];
  total: number;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
}

const OrderTracking = () => {
  const { paymentId } = useParams();
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState(paymentId || "");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (paymentId) {
      loadOrder(paymentId);
    }
  }, [paymentId]);

  const loadOrder = async (id: string) => {
    if (!id.trim()) {
      toast.error("Digite o ID do pedido");
      return;
    }

    setLoading(true);
    setNotFound(false);
    setOrder(null);

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('id, customer_name, customer_phone, items, total, status, payment_status, payment_method, created_at, paid_at')
        .eq('id', id.trim())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setNotFound(true);
        return;
      }

      setOrder({
        ...data,
        items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || [])
      });
    } catch (error) {
      console.error('Error loading order:', error);
      toast.error('Erro ao buscar pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchId.trim()) {
      window.history.pushState({}, '', `/rastrear/${searchId.trim()}`);
      loadOrder(searchId.trim());
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'credit_card': return 'Cartão de Crédito';
      case 'debit_card': return 'Cartão de Débito';
      case 'boleto': return 'Boleto';
      default: return method || 'N/A';
    }
  };

  const getStatusInfo = (status: string | null) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return {
          label: 'Pagamento Confirmado',
          description: 'Seu pagamento foi aprovado com sucesso!',
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30'
        };
      case 'pending':
      case 'awaiting_payment':
        return {
          label: 'Aguardando Pagamento',
          description: 'Estamos aguardando a confirmação do seu pagamento.',
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30'
        };
      case 'cancelled':
      case 'rejected':
        return {
          label: 'Pagamento Cancelado',
          description: 'O pagamento foi cancelado ou recusado.',
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30'
        };
      default:
        return {
          label: 'Processando',
          description: 'Seu pedido está sendo processado.',
          icon: Loader2,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30'
        };
    }
  };

  const getOrderSteps = (status: string | null) => {
    const steps = [
      { id: 'created', label: 'Pedido Criado', icon: ShoppingBag },
      { id: 'awaiting', label: 'Aguardando Pagamento', icon: Clock },
      { id: 'paid', label: 'Pagamento Confirmado', icon: CheckCircle },
      { id: 'preparing', label: 'Preparando Pedido', icon: Package },
      { id: 'delivered', label: 'Entregue', icon: Truck },
    ];

    let currentStep = 0;
    if (status === 'cancelled' || status === 'rejected') {
      currentStep = -1; // Cancelled state
    } else if (status === 'approved' || status === 'completed') {
      currentStep = 3;
    } else if (status === 'pending' || status === 'awaiting_payment') {
      currentStep = 1;
    }

    return { steps, currentStep };
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col">
      {/* Header */}
      <header className="bg-[#1A1A1A] border-b border-gray-800 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-white hover:text-gray-300">
            <ArrowLeft className="h-5 w-5" />
            <span>Voltar</span>
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-green-500" />
            Rastrear Pedido
          </h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Search Box */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Digite o ID do seu pedido..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-green-500 mx-auto" />
              <p className="text-gray-400 mt-4">Buscando seu pedido...</p>
            </div>
          )}

          {/* Not Found */}
          {notFound && !loading && (
            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="py-12 text-center">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Pedido não encontrado</h2>
                <p className="text-gray-400">
                  Não encontramos nenhum pedido com este ID. Verifique se o código está correto.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          {order && !loading && (
            <>
              {/* Status Card */}
              {(() => {
                const statusInfo = getStatusInfo(order.payment_status);
                const StatusIcon = statusInfo.icon;
                return (
                  <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                    <CardContent className="py-8">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-20 h-20 rounded-full ${statusInfo.bgColor} flex items-center justify-center mb-4`}>
                          <StatusIcon className={`h-10 w-10 ${statusInfo.color}`} />
                        </div>
                        <h2 className={`text-2xl font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </h2>
                        <p className="text-gray-300 mt-2">{statusInfo.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Progress Steps */}
              {(() => {
                const { steps, currentStep } = getOrderSteps(order.payment_status);
                if (currentStep === -1) return null; // Don't show for cancelled
                
                return (
                  <Card className="bg-[#1A1A1A] border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-500" />
                        Acompanhamento do Pedido
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />
                        <div 
                          className="absolute left-6 top-0 w-0.5 bg-green-500 transition-all duration-500"
                          style={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
                        />

                        {/* Steps */}
                        <div className="space-y-6">
                          {steps.map((step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted = index <= currentStep;
                            const isCurrent = index === currentStep;

                            return (
                              <div key={step.id} className="flex items-center gap-4 relative">
                                <div
                                  className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all ${
                                    isCompleted
                                      ? 'bg-green-500'
                                      : 'bg-gray-700'
                                  } ${isCurrent ? 'ring-4 ring-green-500/30' : ''}`}
                                >
                                  <StepIcon className={`h-5 w-5 ${isCompleted ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                  <p className={`font-medium ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                    {step.label}
                                  </p>
                                  {isCurrent && (
                                    <p className="text-green-400 text-sm">Status atual</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Order Info */}
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-purple-500" />
                    Informações do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1">ID do Pedido</p>
                      <p className="text-white font-mono text-sm break-all">{order.id}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Data do Pedido
                      </p>
                      <p className="text-white">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                        <CreditCard className="h-3 w-3" /> Forma de Pagamento
                      </p>
                      <p className="text-white">{getPaymentMethodLabel(order.payment_method)}</p>
                    </div>
                    {order.paid_at && (
                      <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-gray-400 text-sm mb-1 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Pago em
                        </p>
                        <p className="text-green-400">{formatDate(order.paid_at)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                    Itens do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-700">
                    {order.items.map((item, index) => (
                      <div key={index} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-gray-400 text-sm">Quantidade: {item.quantity}</p>
                        </div>
                        <p className="text-green-400 font-semibold">
                          {formatCurrency((item.price || item.unit_price || 0) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-700 mt-4 pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-green-400 font-bold">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Initial State */}
          {!order && !loading && !notFound && !paymentId && (
            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Rastreie seu pedido</h2>
                <p className="text-gray-400">
                  Digite o ID do pedido que você recebeu no WhatsApp para acompanhar o status em tempo real.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] border-t border-gray-800 py-4 px-6 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} • Sistema de Rastreamento de Pedidos
        </p>
      </footer>
    </div>
  );
};

export default OrderTracking;
