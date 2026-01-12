import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Package, ShoppingCart, MessageCircle, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ProductReviews } from "./ProductReviews";

interface Product {
  id: string;
  code: string | null;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string | null;
  images?: string[];
}

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onWhatsApp: () => void;
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

export const ProductModal = ({ product, onClose, onAddToCart, onWhatsApp, colors }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);
  const [showReviews, setShowReviews] = useState(false);

  const images = product.images?.length ? product.images : product.image_url ? [product.image_url] : [];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  const copyCode = () => {
    const code = product.code || product.id.slice(0, 6).toUpperCase();
    navigator.clipboard.writeText(code);
    toast.success(`Código ${code} copiado!`);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in flex flex-col"
        style={{ backgroundColor: colors.card }}
      >
        {/* Header */}
        <div className="relative shrink-0">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: colors.background + "cc" }}
          >
            <X className="h-5 w-5" style={{ color: colors.text }} />
          </button>

          {/* Image Gallery */}
          {images.length > 0 ? (
            <div className="relative">
              <div
                className="w-full aspect-video overflow-hidden"
                style={{ backgroundColor: colors.border }}
              >
                <img
                  src={images[currentImage]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm"
                    style={{ backgroundColor: colors.background + "cc" }}
                  >
                    <ChevronLeft className="h-5 w-5" style={{ color: colors.text }} />
                  </button>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm"
                    style={{ backgroundColor: colors.background + "cc" }}
                  >
                    <ChevronRight className="h-5 w-5" style={{ color: colors.text }} />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImage(idx)}
                        className="w-2 h-2 rounded-full transition-all"
                        style={{
                          backgroundColor: idx === currentImage ? colors.buttons : colors.muted,
                          transform: idx === currentImage ? "scale(1.3)" : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              className="w-full aspect-video flex items-center justify-center"
              style={{ backgroundColor: colors.border }}
            >
              <Package className="h-20 w-20" style={{ color: colors.muted }} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: colors.background }}>
          {/* Category & Code */}
          <div className="flex items-center gap-3 mb-3">
            {product.category && (
              <span
                className="text-xs px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.buttons + "20", color: colors.buttons }}
              >
                {product.category}
              </span>
            )}
            <button
              onClick={copyCode}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-full hover:scale-105 transition-transform"
              style={{ backgroundColor: colors.border, color: colors.muted }}
            >
              <Copy className="h-3 w-3" />
              {product.code || product.id.slice(0, 6).toUpperCase()}
            </button>
          </div>

          {/* Name & Price */}
          <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
            {product.name}
          </h2>
          <p className="text-3xl font-bold mb-4" style={{ color: colors.accent }}>
            {formatPrice(product.price)}
          </p>

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed mb-6" style={{ color: colors.muted }}>
              {product.description}
            </p>
          )}

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium" style={{ color: colors.text }}>
              Quantidade:
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: colors.border, color: colors.text }}
              >
                -
              </button>
              <span className="w-10 text-center text-lg font-semibold" style={{ color: colors.text }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold"
                style={{ backgroundColor: colors.buttons, color: "#fff" }}
              >
                +
              </button>
            </div>
            <span className="text-sm" style={{ color: colors.muted }}>
              = {formatPrice(product.price * quantity)}
            </span>
          </div>

          {/* Reviews Toggle */}
          <button
            onClick={() => setShowReviews(!showReviews)}
            className="text-sm font-medium mb-4 flex items-center gap-2 hover:underline"
            style={{ color: colors.accent }}
          >
            {showReviews ? "Ocultar avaliações" : "Ver avaliações"}
          </button>

          {showReviews && <ProductReviews productId={product.id} colors={colors} />}
        </div>

        {/* Footer Actions */}
        <div
          className="p-5 border-t shrink-0 flex gap-3"
          style={{ borderColor: colors.border, backgroundColor: colors.card }}
        >
          <Button
            onClick={onWhatsApp}
            variant="outline"
            className="flex-1"
            style={{ borderColor: "#22C55E", color: "#22C55E" }}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
          <Button
            onClick={() => {
              onAddToCart(product, quantity);
              onClose();
              toast.success(`${quantity}x ${product.name} adicionado ao carrinho!`);
            }}
            className="flex-1"
            style={{ backgroundColor: colors.buttons, color: "#fff" }}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};
