import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ShoppingCart as CartIcon, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Loader2,
  QrCode,
  Banknote,
  Smartphone,
  Copy,
  Check,
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface PaymentData {
  qr_code: string;
  qr_code_base64: string;
  copy_paste: string;
  payment_id: string;
  expires_at: string;
  total: number;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cpf: string;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  colors: {
    background: string;
    text: string;
    buttons: string;
    accent: string;
    card: string;
    border: string;
    muted: string;
  };
  matricula: string;
  onClose: () => void;
}

type PaymentMethod = "pix" | "credit_card" | "debit_card" | "boleto";

export const ShoppingCart = ({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  colors,
  matricula,
  onClose,
}: ShoppingCartProps) => {
  const [customer, setCustomer] = useState<CustomerData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [step, setStep] = useState<"cart" | "checkout" | "payment">("cart");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 minutes in seconds
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer countdown
  useEffect(() => {
    if (step !== "payment" || !paymentData) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.error("PIX expirado! Gere um novo pagamento.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, paymentData]);

  const validateForm = (): boolean => {
    if (!customer.firstName.trim()) {
      toast.error("Informe seu nome");
      return false;
    }
    if (!customer.lastName.trim()) {
      toast.error("Informe seu sobrenome");
      return false;
    }
    if (!customer.email.trim() || !customer.email.includes("@")) {
      toast.error("Informe um e-mail válido");
      return false;
    }
    if (customer.phone.replace(/\D/g, "").length < 10) {
      toast.error("Informe um WhatsApp válido");
      return false;
    }
    if (customer.cpf.replace(/\D/g, "").length !== 11) {
      toast.error("Informe um CPF válido");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;

    setIsCheckingOut(true);
    setPaymentError(null);

    try {
      const cartItems = items.map((item) => ({
        product_id: item.id,
        code: item.code,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const customerName = `${customer.firstName} ${customer.lastName}`;

      const { data, error } = await supabase.functions.invoke("isa-create-payment", {
        body: {
          matricula,
          customer_phone: customer.phone.replace(/\D/g, ""),
          customer_name: customerName,
          customer_email: customer.email,
          customer_cpf: customer.cpf.replace(/\D/g, ""),
          payment_method: paymentMethod,
          items: cartItems,
          total,
        },
      });

      console.log("[ShoppingCart] Payment response:", data);

      if (error) {
        console.error("[ShoppingCart] Function error:", error);
        throw new Error(error.message || "Erro ao processar pagamento");
      }

      if (!data?.success) {
        throw new Error(data?.error || "Erro ao gerar pagamento");
      }

      if (paymentMethod === "pix") {
        // CRITICAL: Validate PIX data before showing modal
        const pixQrCode = data.payment?.pix_qr_code;
        const pixQrCodeBase64 = data.payment?.pix_qr_code_base64;

        if (!pixQrCode || pixQrCode.length < 10) {
          console.error("[ShoppingCart] Invalid PIX data:", data.payment);
          throw new Error("PIX não foi gerado corretamente. Tente novamente.");
        }

        setPaymentData({
          qr_code: pixQrCode,
          qr_code_base64: pixQrCodeBase64 || "",
          copy_paste: pixQrCode,
          payment_id: data.payment.payment_id,
          expires_at: data.payment.expires_at,
          total: data.payment.total,
        });
        setTimeLeft(30 * 60);
        setStep("payment");
        toast.success("PIX gerado com sucesso!");
      } else if ((paymentMethod === "credit_card" || paymentMethod === "debit_card") && data?.payment?.checkout_url) {
        toast.success("Redirecionando para pagamento...");
        window.open(data.payment.checkout_url, "_blank");
        onClearCart();
        onClose();
      } else if (paymentMethod === "boleto" && data?.payment?.boleto_url) {
        toast.success("Boleto gerado!");
        window.open(data.payment.boleto_url, "_blank");
        onClearCart();
        onClose();
      } else {
        toast.success("Pedido realizado! Você receberá instruções por WhatsApp.");
        onClearCart();
        onClose();
      }
    } catch (err: unknown) {
      console.error("[ShoppingCart] Checkout error:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro ao finalizar pedido";
      setPaymentError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const copyPix = useCallback(async () => {
    const pixCode = paymentData?.copy_paste || paymentData?.qr_code;
    
    if (!pixCode || pixCode.length < 10) {
      toast.error("Código PIX inválido. Gere um novo pagamento.");
      return;
    }

    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success("Código PIX copiado com sucesso!");
      
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("[ShoppingCart] Clipboard error:", err);
      // Fallback: select text manually
      try {
        const textArea = document.createElement("textarea");
        textArea.value = pixCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        toast.success("Código PIX copiado!");
        setTimeout(() => setCopied(false), 3000);
      } catch (fallbackErr) {
        toast.error("Não foi possível copiar. Selecione o código manualmente.");
      }
    }
  }, [paymentData]);

  const paymentMethods = [
    { id: "pix" as const, label: "PIX", icon: QrCode, description: "Pagamento instantâneo" },
    { id: "credit_card" as const, label: "Cartão de Crédito", icon: CreditCard, description: "Parcele em até 12x" },
    { id: "debit_card" as const, label: "Cartão de Débito", icon: Smartphone, description: "Débito à vista" },
    { id: "boleto" as const, label: "Boleto", icon: Banknote, description: "Vence em 3 dias úteis" },
  ];

  // Check if PIX data is valid
  const hasValidPixData = paymentData?.qr_code && paymentData.qr_code.length > 10;

  if (items.length === 0 && step === "cart") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div
          className="w-full max-w-md rounded-3xl p-8 text-center animate-in fade-in zoom-in relative"
          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10">
            <X className="h-5 w-5" style={{ color: colors.muted }} />
          </button>
          <CartIcon className="h-16 w-16 mx-auto mb-4" style={{ color: colors.muted }} />
          <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            Carrinho vazio
          </h3>
          <p className="text-sm" style={{ color: colors.muted }}>
            Adicione produtos para continuar
          </p>
          <Button onClick={onClose} className="mt-6" style={{ backgroundColor: colors.buttons, color: "#fff" }}>
            Continuar comprando
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-xl max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom flex flex-col"
        style={{ backgroundColor: colors.card }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 shrink-0"
          style={{ backgroundColor: colors.buttons }}
        >
          <div className="flex items-center gap-3">
            {step === "payment" ? (
              <QrCode className="h-6 w-6 text-white" />
            ) : (
              <CartIcon className="h-6 w-6 text-white" />
            )}
            <h3 className="font-semibold text-white text-lg">
              {step === "cart" && "Meu Carrinho"}
              {step === "checkout" && "Finalizar Pedido"}
              {step === "payment" && "Pagamento PIX"}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5" style={{ backgroundColor: colors.background }}>
          {step === "cart" && (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
                >
                  {item.image_url && (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate" style={{ color: colors.text }}>
                      {item.name}
                    </h4>
                    <p className="text-sm" style={{ color: colors.accent }}>
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: colors.border }}
                    >
                      <Minus className="h-4 w-4" style={{ color: colors.text }} />
                    </button>
                    <span className="w-8 text-center font-medium" style={{ color: colors.text }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: colors.border }}
                    >
                      <Plus className="h-4 w-4" style={{ color: colors.text }} />
                    </button>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-1.5 rounded-lg ml-2"
                      style={{ backgroundColor: "#EF444420" }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button onClick={onClearCart} className="text-sm text-red-500 hover:underline">
                  Limpar carrinho
                </button>
              </div>
            </div>
          )}

          {step === "checkout" && (
            <div className="space-y-5">
              {/* Error Alert */}
              {paymentError && (
                <div className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: "#EF444420", border: "1px solid #EF444440" }}>
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-500">Erro no pagamento</p>
                    <p className="text-xs text-red-400 mt-1">{paymentError}</p>
                  </div>
                </div>
              )}

              {/* Personal Info */}
              <div className="rounded-xl p-4" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <h4 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.text }}>
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">1</span>
                  Dados pessoais
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: colors.muted }}>Nome</Label>
                    <Input
                      value={customer.firstName}
                      onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })}
                      placeholder="João"
                      className="h-10"
                      style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: colors.muted }}>Sobrenome</Label>
                    <Input
                      value={customer.lastName}
                      onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })}
                      placeholder="Silva"
                      className="h-10"
                      style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label className="text-xs mb-1 block" style={{ color: colors.muted }}>E-mail</Label>
                  <Input
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    placeholder="joao@email.com"
                    className="h-10"
                    style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: colors.muted }}>WhatsApp</Label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: formatPhone(e.target.value) })}
                      placeholder="(11) 99999-9999"
                      className="h-10"
                      style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block" style={{ color: colors.muted }}>CPF</Label>
                    <Input
                      value={customer.cpf}
                      onChange={(e) => setCustomer({ ...customer, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      className="h-10"
                      style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-xl p-4" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <h4 className="font-medium mb-4 flex items-center gap-2" style={{ color: colors.text }}>
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">2</span>
                  Forma de pagamento
                </h4>

                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;
                      return (
                        <label
                          key={method.id}
                          className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
                          style={{
                            backgroundColor: isSelected ? `${colors.buttons}20` : colors.background,
                            border: `2px solid ${isSelected ? colors.buttons : colors.border}`,
                          }}
                        >
                          <RadioGroupItem value={method.id} className="mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" style={{ color: isSelected ? colors.buttons : colors.muted }} />
                              <span className="text-sm font-medium" style={{ color: colors.text }}>
                                {method.label}
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: colors.muted }}>
                              {method.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>

              {/* Order Summary */}
              <div className="rounded-xl p-4" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: colors.text }}>
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">3</span>
                  Resumo do pedido
                </h4>
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1" style={{ color: colors.muted }}>
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t mt-3 pt-3 flex justify-between font-semibold" style={{ borderColor: colors.border, color: colors.text }}>
                  <span>Total</span>
                  <span style={{ color: colors.accent }}>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-4 text-center">
              {/* Timer */}
              <div 
                className="rounded-xl p-3 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: timeLeft < 300 ? "#EF444420" : "#F59E0B20", 
                  border: `1px solid ${timeLeft < 300 ? "#EF444440" : "#F59E0B40"}` 
                }}
              >
                <Clock className={`h-5 w-5 ${timeLeft < 300 ? "text-red-500" : "text-amber-500"}`} />
                <span className={`font-mono font-bold text-lg ${timeLeft < 300 ? "text-red-500" : "text-amber-500"}`}>
                  {formatTime(timeLeft)}
                </span>
                <span className={`text-sm ${timeLeft < 300 ? "text-red-400" : "text-amber-400"}`}>
                  {timeLeft < 300 ? "PIX expirando!" : "para pagar"}
                </span>
              </div>

              {hasValidPixData ? (
                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
                >
                  <p className="text-sm mb-4" style={{ color: colors.muted }}>
                    Escaneie o QR Code ou copie o código PIX
                  </p>

                  {/* QR Code */}
                  {paymentData.qr_code_base64 ? (
                    <div className="bg-white p-4 rounded-xl inline-block mb-4 shadow-lg">
                      <img 
                        src={`data:image/png;base64,${paymentData.qr_code_base64}`} 
                        alt="QR Code PIX" 
                        className="w-48 h-48"
                      />
                    </div>
                  ) : (
                    <div 
                      className="bg-white/10 p-4 rounded-xl inline-block mb-4 w-48 h-48 flex items-center justify-center"
                      style={{ border: `2px dashed ${colors.border}` }}
                    >
                      <div className="text-center">
                        <QrCode className="h-16 w-16 mx-auto mb-2" style={{ color: colors.muted }} />
                        <p className="text-xs" style={{ color: colors.muted }}>
                          QR Code não disponível
                        </p>
                      </div>
                    </div>
                  )}

                  {/* PIX Code Display */}
                  <div 
                    className="rounded-lg p-3 mb-4 text-left break-all font-mono text-xs"
                    style={{ 
                      backgroundColor: colors.background, 
                      border: `1px solid ${colors.border}`,
                      color: colors.text 
                    }}
                  >
                    {paymentData.qr_code.substring(0, 80)}...
                  </div>

                  {/* Copy Button */}
                  <Button 
                    onClick={copyPix} 
                    className="w-full h-12 text-base font-semibold" 
                    style={{ 
                      backgroundColor: copied ? "#22C55E" : colors.buttons, 
                      color: "#fff" 
                    }}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Código copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-5 w-5" />
                        Copiar código PIX
                      </>
                    )}
                  </Button>

                  <p className="text-xs mt-4" style={{ color: colors.muted }}>
                    Cole o código no app do seu banco para pagar
                  </p>
                </div>
              ) : (
                /* Error state - no valid PIX data */
                <div
                  className="rounded-xl p-6"
                  style={{ backgroundColor: "#EF444410", border: "1px solid #EF444430" }}
                >
                  <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                  <h4 className="text-lg font-semibold text-red-500 mb-2">
                    Erro ao gerar PIX
                  </h4>
                  <p className="text-sm text-red-400 mb-4">
                    Não foi possível gerar o código PIX. Tente novamente.
                  </p>
                  <Button 
                    onClick={() => {
                      setStep("checkout");
                      setPaymentData(null);
                      setPaymentError(null);
                    }}
                    className="w-full"
                    style={{ backgroundColor: colors.buttons, color: "#fff" }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              )}

              {/* Success message */}
              {hasValidPixData && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "#22C55E20", border: "1px solid #22C55E40" }}>
                  <p className="text-sm font-medium text-green-500">
                    ✅ Após o pagamento, você receberá a confirmação por WhatsApp
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t shrink-0" style={{ borderColor: colors.border, backgroundColor: colors.card }}>
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium" style={{ color: colors.text }}>
              Total
            </span>
            <span className="text-2xl font-bold" style={{ color: colors.accent }}>
              {formatPrice(step === "payment" && paymentData ? paymentData.total : total)}
            </span>
          </div>

          {step === "cart" && (
            <Button
              onClick={() => setStep("checkout")}
              className="w-full py-6"
              style={{ backgroundColor: colors.buttons, color: "#fff" }}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Finalizar compra
            </Button>
          )}

          {step === "checkout" && (
            <div className="flex gap-3">
              <Button onClick={() => setStep("cart")} variant="outline" className="flex-1">
                Voltar
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="flex-1"
                style={{ backgroundColor: "#22C55E", color: "#fff" }}
              >
                {isCheckingOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : paymentMethod === "pix" ? (
                  "Gerar PIX"
                ) : (
                  "Confirmar Pedido"
                )}
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setStep("checkout");
                  setPaymentData(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={() => {
                  onClearCart();
                  onClose();
                }}
                className="flex-1"
                style={{ backgroundColor: colors.buttons, color: "#fff" }}
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
