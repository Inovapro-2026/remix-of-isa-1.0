import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Package, MessageCircle, Star, ShoppingCart, 
  Check, Shield, Zap, Heart, Share2, Copy, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppContactModal } from "@/components/vitrine/WhatsAppContactModal";

interface Product {
  id: string;
  code: string | null;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
}

interface VitrineConfig {
  name: string;
  theme: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    buttons: string;
    accent: string;
  };
  whatsappNumber: string;
  companyName: string;
}

const DEFAULT_COLORS = {
  dark: {
    background: '#0D0D0D',
    text: '#FFFFFF',
    buttons: '#9333EA',
    accent: '#A855F7',
    card: '#1E1E1E',
    border: '#27272a',
    muted: '#71717a'
  },
  light: {
    background: '#FFFFFF',
    text: '#1F2937',
    buttons: '#7C3AED',
    accent: '#8B5CF6',
    card: '#F9FAFB',
    border: '#E5E7EB',
    muted: '#6B7280'
  }
};

const BENEFITS = [
  { icon: Zap, title: "Entrega Instantânea", description: "Receba automaticamente após o pagamento" },
  { icon: Shield, title: "Compra Segura", description: "Pagamento protegido pelo Mercado Pago" },
  { icon: MessageCircle, title: "Suporte via WhatsApp", description: "Atendimento humanizado quando precisar" },
  { icon: Star, title: "Garantia de Qualidade", description: "Satisfação garantida ou seu dinheiro de volta" },
];

const ProductPage = () => {
  const { cpf, productId } = useParams<{ cpf: string; productId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<VitrineConfig | null>(null);
  const [matricula, setMatricula] = useState("");
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (cpf && productId) {
      loadProduct();
    }
  }, [cpf, productId]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const identifier = (cpf || '').trim();
      
      // Load vitrine data
      const { data: vitrineData } = await supabase.rpc('get_public_vitrine', { identifier });
      
      if (!vitrineData) {
        toast.error('Vitrine não encontrada');
        navigate('/');
        return;
      }

      const vitrineConfig = (vitrineData as any)?.vitrine?.config ?? null;
      const vitrineProducts = Array.isArray((vitrineData as any)?.products) ? (vitrineData as any).products : [];
      const vitrineMatricula = (vitrineData as any)?.matricula;

      setConfig(vitrineConfig);
      if (vitrineMatricula) setMatricula(vitrineMatricula);

      // Find the specific product
      const foundProduct = vitrineProducts.find((p: any) => p.id === productId);
      
      if (!foundProduct) {
        toast.error('Produto não encontrado');
        navigate(`/vitrine/${cpf}`);
        return;
      }

      setProduct({
        id: String(foundProduct.id),
        code: foundProduct.code ?? null,
        name: String(foundProduct.name ?? ''),
        price: typeof foundProduct.price === 'number' ? foundProduct.price : Number.parseFloat(String(foundProduct.price ?? '0')),
        description: foundProduct.description ?? null,
        image_url: foundProduct.image_url ?? null,
        category: foundProduct.category ?? null,
        is_active: foundProduct.is_active ?? true,
      });

      // Get related products (same category, max 4)
      const related = vitrineProducts
        .filter((p: any) => p.id !== productId && p.category === foundProduct.category)
        .slice(0, 4)
        .map((p: any) => ({
          id: String(p.id),
          code: p.code ?? null,
          name: String(p.name ?? ''),
          price: typeof p.price === 'number' ? p.price : Number.parseFloat(String(p.price ?? '0')),
          description: p.description ?? null,
          image_url: p.image_url ?? null,
          category: p.category ?? null,
          is_active: p.is_active ?? true,
        }));
      setRelatedProducts(related);

    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Erro ao carregar produto');
    } finally {
      setLoading(false);
    }
  };

  const colors = useMemo(() => {
    if (!config) return DEFAULT_COLORS.dark;
    return config.theme === 'light' ? DEFAULT_COLORS.light : DEFAULT_COLORS.dark;
  }, [config]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado!');
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Confira: ${product?.name} por ${formatPrice(product?.price || 0)}`,
        url: window.location.href
      });
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div 
          className="w-12 h-12 border-4 rounded-full animate-spin"
          style={{ borderColor: colors.border, borderTopColor: colors.buttons }}
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4" style={{ color: colors.muted }} />
          <h1 className="text-xl font-bold" style={{ color: colors.text }}>Produto não encontrado</h1>
          <Button 
            onClick={() => navigate(`/vitrine/${cpf}`)}
            className="mt-4"
            style={{ backgroundColor: colors.buttons }}
          >
            Voltar à vitrine
          </Button>
        </div>
      </div>
    );
  }

  const images = product.image_url ? [product.image_url] : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ backgroundColor: colors.background + 'ee', borderColor: colors.border }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(`/vitrine/${cpf}`)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: colors.text }} />
            <span className="font-medium" style={{ color: colors.text }}>{config?.name || 'Vitrine'}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={shareProduct}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: colors.card }}
            >
              <Share2 className="h-5 w-5" style={{ color: colors.muted }} />
            </button>
            <button
              onClick={copyLink}
              className="p-2 rounded-full transition-colors"
              style={{ backgroundColor: colors.card }}
            >
              <Copy className="h-5 w-5" style={{ color: colors.muted }} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div 
              className="relative aspect-square rounded-2xl overflow-hidden"
              style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImage]}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm"
                        style={{ backgroundColor: colors.background + 'cc' }}
                      >
                        <ChevronLeft className="h-5 w-5" style={{ color: colors.text }} />
                      </button>
                      <button
                        onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full backdrop-blur-sm"
                        style={{ backgroundColor: colors.background + 'cc' }}
                      >
                        <ChevronRight className="h-5 w-5" style={{ color: colors.text }} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-24 w-24" style={{ color: colors.muted }} />
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 justify-center">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                    style={{ 
                      borderColor: idx === currentImage ? colors.buttons : 'transparent',
                      opacity: idx === currentImage ? 1 : 0.6
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            {product.category && (
              <span
                className="inline-block text-sm px-4 py-1.5 rounded-full"
                style={{ backgroundColor: colors.buttons + '20', color: colors.buttons }}
              >
                {product.category}
              </span>
            )}

            {/* Name & Price */}
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
                {product.name}
              </h1>
              <p className="text-4xl font-bold" style={{ color: colors.accent }}>
                {formatPrice(product.price)}
              </p>
              <p className="text-sm mt-1" style={{ color: colors.muted }}>
                ou 3x de {formatPrice(product.price / 3)} sem juros
              </p>
            </div>

            {/* Product Code */}
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-lg w-fit"
              style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
            >
              <span className="text-sm" style={{ color: colors.muted }}>Código:</span>
              <span className="font-mono font-medium" style={{ color: colors.text }}>
                {product.code || product.id.slice(0, 6).toUpperCase()}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(product.code || product.id.slice(0, 6).toUpperCase());
                  toast.success('Código copiado!');
                }}
              >
                <Copy className="h-4 w-4" style={{ color: colors.muted }} />
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h2 className="font-semibold" style={{ color: colors.text }}>Descrição</h2>
                <p className="leading-relaxed whitespace-pre-wrap" style={{ color: colors.muted }}>
                  {product.description}
                </p>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={() => setShowWhatsAppModal(true)}
                className="w-full h-14 text-lg font-semibold text-white"
                style={{ backgroundColor: '#22C55E' }}
              >
                <MessageCircle className="mr-3 h-6 w-6" />
                Comprar pelo WhatsApp
              </Button>
              
              <Button
                onClick={() => navigate(`/vitrine/${cpf}`)}
                variant="outline"
                className="w-full h-12"
                style={{ borderColor: colors.border, color: colors.text }}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Ver mais produtos
              </Button>
            </div>

            {/* Trust Badges */}
            <div 
              className="flex items-center gap-4 pt-4 border-t"
              style={{ borderColor: colors.border }}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm" style={{ color: colors.muted }}>Compra segura</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <span className="text-sm" style={{ color: colors.muted }}>Entrega digital</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
            Por que comprar aqui?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((benefit, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl"
                style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: colors.buttons + '20' }}
                >
                  <benefit.icon className="h-6 w-6" style={{ color: colors.buttons }} />
                </div>
                <h3 className="font-semibold mb-1" style={{ color: colors.text }}>
                  {benefit.title}
                </h3>
                <p className="text-sm" style={{ color: colors.muted }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
              Produtos relacionados
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((related) => (
                <button
                  key={related.id}
                  onClick={() => navigate(`/vitrine/${cpf}/produto/${related.id}`)}
                  className="text-left rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
                  style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
                >
                  <div 
                    className="aspect-square"
                    style={{ backgroundColor: colors.border }}
                  >
                    {related.image_url ? (
                      <img
                        src={related.image_url}
                        alt={related.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8" style={{ color: colors.muted }} />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium truncate" style={{ color: colors.text }}>
                      {related.name}
                    </p>
                    <p className="font-bold" style={{ color: colors.accent }}>
                      {formatPrice(related.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Fixed CTA for Mobile */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 border-t lg:hidden z-50"
        style={{ backgroundColor: colors.background, borderColor: colors.border }}
      >
        <Button
          onClick={() => setShowWhatsAppModal(true)}
          className="w-full h-14 text-lg font-semibold text-white"
          style={{ backgroundColor: '#22C55E' }}
        >
          <MessageCircle className="mr-3 h-6 w-6" />
          Comprar pelo WhatsApp
        </Button>
      </div>

      {/* Extra padding for fixed CTA */}
      <div className="h-24 lg:hidden" />

      {/* WhatsApp Contact Modal */}
      {showWhatsAppModal && (
        <WhatsAppContactModal
          product={product}
          onClose={() => setShowWhatsAppModal(false)}
          matricula={matricula || cpf || ""}
          storeName={config?.name || "Nossa Loja"}
          colors={colors}
        />
      )}
    </div>
  );
};

export default ProductPage;