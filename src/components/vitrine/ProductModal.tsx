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
        {/* Header with close button only - fixed */}
        <div className="relative shrink-0 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="p-2 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: colors.background + "cc" }}
          >
            <X className="h-5 w-5" style={{ color: colors.text }} />
          </button>
        </div>

        {/* Scrollable Content - Image scrolls with content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {/* Image Gallery - Now inside scrollable area */}
          {images.length > 0 ? (
            <div className="relative mb-6 rounded-2xl overflow-hidden">
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
              className="w-full aspect-video flex items-center justify-center mb-6 rounded-2xl"
              style={{ backgroundColor: colors.border }}
            >
              <Package className="h-16 w-16" style={{ color: colors.muted }} />
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                {product.name}
              </h2>
              {product.category && (
                <p className="text-sm mt-1" style={{ color: colors.muted }}>
                  {product.category}
                </p>
              )}
            </div>

            <button
              onClick={copyCode}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: colors.border, color: colors.text }}
            >
              <Copy className="h-4 w-4" />
              Código: {product.code || product.id.slice(0, 6).toUpperCase()}
            </button>

            <p className="text-3xl font-bold" style={{ color: colors.buttons }}>
              {formatPrice(product.price)}
            </p>

            {product.description && (
              <p className="leading-relaxed" style={{ color: colors.muted }}>
                {product.description}
              </p>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span style={{ color: colors.text }}>Quantidade:</span>
              <div
                className="flex items-center gap-3 px-4 py-2 rounded-xl"
                style={{ backgroundColor: colors.border }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors"
                  style={{ backgroundColor: colors.muted, color: colors.text }}
                >
                  -
                </button>
                <span className="w-8 text-center font-bold" style={{ color: colors.text }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors"
                  style={{ backgroundColor: colors.buttons, color: "#fff" }}
                >
                  +
                </button>
              </div>
              <span className="text-lg font-semibold" style={{ color: colors.muted }}>
                = {formatPrice(product.price * quantity)}
              </span>
            </div>

            {/* Reviews Section */}
            <button
              onClick={() => setShowReviews(!showReviews)}
              className="text-sm font-medium hover:underline"
              style={{ color: colors.buttons }}
            >
              {showReviews ? "Ocultar avaliações" : "Ver avaliações"}
            </button>

            {showReviews && (
              <ProductReviews productId={product.id} colors={colors} />
            )}
          </div>
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div
          className="shrink-0 border-t p-4 flex gap-3"
          style={{ borderColor: colors.border }}
        >
          <Button
            onClick={onWhatsApp}
            variant="outline"
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2"
            style={{
              backgroundColor: "transparent",
              borderColor: colors.border,
              color: colors.text,
            }}
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </Button>
          <Button
            onClick={() => onAddToCart(product, quantity)}
            className="flex-1 h-12 rounded-xl flex items-center justify-center gap-2"
            style={{ backgroundColor: colors.buttons, color: "#fff" }}
          >
            <ShoppingCart className="h-5 w-5" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
};
