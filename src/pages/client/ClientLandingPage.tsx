import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useClientMemory } from "@/hooks/useClientMemory";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Rocket,
  Save,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  X,
  DollarSign,
  FileText,
  Sparkles,
  Eye
} from "lucide-react";

interface LandingPageConfig {
  title: string;
  description: string;
  image: string;
  price: number;
  buttonText: string;
  whatsappNumber: string;
}

const DEFAULT_CONFIG: LandingPageConfig = {
  title: '',
  description: '',
  image: '',
  price: 0,
  buttonText: 'Comprar Agora',
  whatsappNumber: ''
};

const ClientLandingPage = () => {
  const { profile, user } = useAuth();
  const { landingPage: savedLandingPage, isLoading, isSaving, loadMemory, updateSection } = useClientMemory();

  const [landingId, setLandingId] = useState<string>('');
  const landingUrl = landingId ? `${window.location.origin}/lp/${landingId}` : '';
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [config, setConfig] = useState<LandingPageConfig>(DEFAULT_CONFIG);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Fetch vitrine_id from clients table (reusing for landing page)
  useEffect(() => {
    const fetchLandingId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('clients')
        .select('vitrine_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.vitrine_id) {
        setLandingId(data.vitrine_id);
      }
    };
    fetchLandingId();
  }, [user?.id]);

  useEffect(() => {
    if (!hasInitialized && savedLandingPage?.config) {
      setConfig({ ...DEFAULT_CONFIG, ...savedLandingPage.config });
      setHasInitialized(true);
    }
  }, [savedLandingPage, hasInitialized]);

  const handleSave = async () => {
    if (!config.title) {
      toast.error("Por favor, adicione um título para o produto");
      return;
    }
    if (!config.price || config.price <= 0) {
      toast.error("Por favor, defina um preço válido");
      return;
    }
    const success = await updateSection('landingPage', { config }, 'Landing Page salva com sucesso!');
    if (!success) {
      toast.error("Erro ao salvar landing page");
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-landing-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setConfig({ ...config, image: urlData.publicUrl });
      toast.success("Imagem carregada!");
    } catch (error) {
      console.error('Upload error:', error);
      // Fallback to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, image: reader.result as string });
        toast.success("Imagem carregada!");
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = () => {
    setConfig({ ...config, image: '' });
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <DashboardLayout isAdmin={false}>
      <div className="min-h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 border-b border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/20">
                <Rocket className="h-7 w-7 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Minha Landing Page
                  </h1>
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <p className="text-muted-foreground">Configure sua página de vendas com PIX</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={loadMemory}
                disabled={isLoading}
                className="glass border-border/50 hover:bg-white/5 hover:border-purple-500/50 transition-all duration-300"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-300"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto space-y-6">

              {/* Card 1: Link da Landing Page */}
              <div 
                className="glass rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-500/30">
                    <LinkIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Link da Sua Landing Page</h3>
                    <p className="text-sm text-muted-foreground">Compartilhe este link para vender seu produto</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Input
                    value={landingUrl}
                    readOnly
                    className="glass border-border/50 flex-1 min-w-[200px] focus:border-purple-500/50"
                  />
                  <Button
                    onClick={() => copyToClipboard(landingUrl, "Link copiado!")}
                    variant="outline"
                    className="glass border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar
                  </Button>
                  <Button
                    onClick={() => window.open(landingUrl, '_blank')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 transition-all duration-300"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir
                  </Button>
                </div>
              </div>

              {/* Card 2: Título do Produto */}
              <div 
                className="glass rounded-2xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/30">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Título do Produto</h3>
                    <p className="text-sm text-muted-foreground">Nome que aparecerá na página de vendas</p>
                  </div>
                </div>

                <Input
                  value={config.title}
                  onChange={e => setConfig({ ...config, title: e.target.value })}
                  className="glass border-border/50 focus:border-primary/50 transition-all duration-300 text-lg"
                  placeholder="Ex: Curso Completo de Marketing Digital"
                />
              </div>

              {/* Card 3: Descrição */}
              <div 
                className="glass rounded-2xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.3s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-accent/30">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Descrição do Produto</h3>
                    <p className="text-sm text-muted-foreground">Descreva os benefícios e o que o cliente receberá</p>
                  </div>
                </div>

                <Textarea
                  value={config.description}
                  onChange={e => setConfig({ ...config, description: e.target.value })}
                  className="glass border-border/50 focus:border-accent/50 transition-all duration-300 min-h-[150px]"
                  placeholder="Descreva seu produto aqui... Ex: Acesso vitalício ao curso mais completo de marketing digital, com +100 aulas, certificado incluso e suporte por 1 ano."
                />
              </div>

              {/* Card 4: Imagem */}
              <div 
                className="glass rounded-2xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.4s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-pink-500/30">
                    <ImageIcon className="h-5 w-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Imagem do Produto</h3>
                    <p className="text-sm text-muted-foreground">Imagem que será exibida na landing page</p>
                  </div>
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {config.image ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/50 group/image">
                    <img
                      src={config.image}
                      alt="Produto"
                      className="w-full h-64 object-cover transition-transform duration-500 group-hover/image:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={removeImage}
                      className="absolute top-3 right-3 opacity-0 group-hover/image:opacity-100 transition-all duration-300"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full h-64 rounded-xl border-2 border-dashed border-border/50 hover:border-pink-500/50 transition-all duration-300 flex flex-col items-center justify-center gap-4 group/upload"
                  >
                    <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-300">
                      <Upload className="h-8 w-8 text-pink-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{isUploadingImage ? "Enviando..." : "Clique para fazer upload"}</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG até 5MB</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Card 5: Preço */}
              <div 
                className="glass rounded-2xl p-6 border border-green-500/20 hover:border-green-500/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.5s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-green-500/30">
                    <DollarSign className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Preço do Produto</h3>
                    <p className="text-sm text-muted-foreground">Valor que será cobrado via PIX</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.price || ''}
                      onChange={e => setConfig({ ...config, price: parseFloat(e.target.value) || 0 })}
                      className="glass border-border/50 focus:border-green-500/50 transition-all duration-300 text-2xl font-bold pl-12"
                      placeholder="0,00"
                    />
                  </div>
                  {config.price > 0 && (
                    <div className="glass rounded-xl px-6 py-3 border border-green-500/30 bg-green-500/10">
                      <p className="text-sm text-muted-foreground">Preço final</p>
                      <p className="text-2xl font-bold text-green-400">{formatPrice(config.price)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 6: WhatsApp */}
              <div 
                className="glass rounded-2xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.6s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-emerald-500/30">
                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">WhatsApp para Contato</h3>
                    <p className="text-sm text-muted-foreground">Número para o cliente entrar em contato</p>
                  </div>
                </div>

                <Input
                  value={config.whatsappNumber}
                  onChange={e => setConfig({ ...config, whatsappNumber: e.target.value })}
                  className="glass border-border/50 focus:border-emerald-500/50 transition-all duration-300"
                  placeholder="Ex: 5511999999999"
                />
              </div>

              {/* Preview Card */}
              {config.title && config.price > 0 && (
                <div 
                  className="glass rounded-2xl p-6 border border-purple-500/20 animate-fade-in"
                  style={{ animationDelay: '0.7s' }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30">
                      <Eye className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">Preview da Landing Page</h3>
                      <p className="text-sm text-muted-foreground">Como sua página vai aparecer</p>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6 border border-border/50 max-w-md mx-auto">
                    {config.image && (
                      <img src={config.image} alt={config.title} className="w-full h-48 object-cover rounded-lg mb-4" />
                    )}
                    <h4 className="text-xl font-bold mb-2">{config.title}</h4>
                    {config.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{config.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-400">{formatPrice(config.price)}</span>
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                        Comprar Agora
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientLandingPage;
