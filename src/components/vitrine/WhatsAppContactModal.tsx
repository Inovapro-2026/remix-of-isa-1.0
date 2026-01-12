import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, MessageCircle, Sparkles, Loader2, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  code: string | null;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string | null;
}

interface WhatsAppContactModalProps {
  product: Product;
  onClose: () => void;
  matricula: string;
  storeName: string;
  colors: {
    background: string;
    text: string;
    buttons: string;
    accent: string;
    card: string;
    border: string;
    muted: string;
  };
}

export const WhatsAppContactModal = ({
  product,
  onClose,
  matricula,
  storeName,
  colors,
}: WhatsAppContactModalProps) => {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const isValidPhone = () => {
    const numbers = phone.replace(/\D/g, "");
    return numbers.length === 10 || numbers.length === 11;
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const handleSubmit = async () => {
    if (!isValidPhone()) {
      toast.error("Digite um número de WhatsApp válido");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("isa-start-conversation", {
        body: {
          customerPhone: phone.replace(/\D/g, ""),
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productDescription: product.description,
          productCode: product.code || product.id.slice(0, 6).toUpperCase(),
          matricula,
          storeName,
        },
      });

      if (error) throw error;

      setIsSent(true);
      toast.success("ISA vai iniciar a conversa com você!");
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Não foi possível iniciar a conversa. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-90 duration-300"
          style={{ backgroundColor: colors.card }}
        >
          <div className="p-8 text-center">
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce"
              style={{ backgroundColor: "#22C55E20" }}
            >
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>

            <h2 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
              Mensagem Enviada! 🎉
            </h2>

            <p className="text-sm mb-6" style={{ color: colors.muted }}>
              A ISA já está iniciando a conversa no seu WhatsApp com todas as informações do produto.
            </p>

            <div
              className="rounded-xl p-4 mb-6"
              style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}` }}
            >
              <p className="text-sm font-medium" style={{ color: colors.text }}>
                📱 {phone}
              </p>
              <p className="text-xs mt-1" style={{ color: colors.muted }}>
                Verifique seu WhatsApp
              </p>
            </div>

            <Button
              onClick={onClose}
              className="w-full text-white"
              style={{ backgroundColor: colors.buttons }}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-90 duration-300"
        style={{ backgroundColor: colors.card }}
      >
        {/* Header */}
        <div
          className="relative p-6 pb-4"
          style={{ backgroundColor: "#22C55E" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Falar com a ISA
              </h2>
              <p className="text-sm text-white/80">
                sobre este produto
              </p>
            </div>
          </div>
        </div>

        {/* Product Preview */}
        <div
          className="mx-6 -mt-4 rounded-xl overflow-hidden shadow-lg"
          style={{ backgroundColor: colors.background, border: `1px solid ${colors.border}` }}
        >
          <div className="flex gap-3 p-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: colors.border }}
              >
                <Sparkles className="h-6 w-6" style={{ color: colors.muted }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" style={{ color: colors.text }}>
                {product.name}
              </p>
              <p className="text-lg font-bold" style={{ color: colors.accent }}>
                {formatPrice(product.price)}
              </p>
              {product.category && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.buttons + "20", color: colors.buttons }}
                >
                  {product.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 pt-5">
          <p className="text-sm mb-4" style={{ color: colors.muted }}>
            Informe seu WhatsApp para receber todos os detalhes automaticamente.
          </p>

          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2" style={{ color: colors.text }}>
              <Phone className="h-4 w-4" />
              Número do WhatsApp
            </Label>
            <Input
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(99) 99999-9999"
              className="text-lg h-12"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              }}
            />
            <p className="text-xs" style={{ color: colors.muted }}>
              A conversa será iniciada automaticamente pela ISA.
            </p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!isValidPhone() || isLoading}
            className="w-full h-12 text-white font-semibold"
            style={{ backgroundColor: "#22C55E" }}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-5 w-5" />
                Receber informações no WhatsApp
              </>
            )}
          </Button>

          <p className="text-xs text-center mt-4" style={{ color: colors.muted }}>
            🔒 Seu número não será compartilhado ou usado para spam.
          </p>
        </div>
      </div>
    </div>
  );
};