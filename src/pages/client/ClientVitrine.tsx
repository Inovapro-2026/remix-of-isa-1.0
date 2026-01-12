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
  Store,
  Save,
  RotateCcw,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Megaphone,
  X,
  Sun,
  Moon,
  Phone,
  Building2,
  Sparkles,
  Check,
  Palette,
  ShoppingBag,
  Share2
} from "lucide-react";

interface VitrineConfig {
  name: string;
  banner: string;
  announcements: string;
  theme: 'light' | 'dark';
  colors: {
    background: string;
    text: string;
    buttons: string;
    accent: string;
  };
  whatsappNumber: string;
  companyName: string;
  cnpj: string;
}

const DEFAULT_CONFIG: VitrineConfig = {
  name: '',
  banner: '',
  announcements: '',
  theme: 'dark',
  colors: {
    background: '#0D0D0D',
    text: '#FFFFFF',
    buttons: '#9333EA',
    accent: '#A855F7'
  },
  whatsappNumber: '',
  companyName: '',
  cnpj: ''
};

const THEME_PRESETS = {
  dark: {
    background: '#0D0D0D',
    text: '#FFFFFF',
    buttons: '#9333EA',
    accent: '#A855F7'
  },
  light: {
    background: '#FFFFFF',
    text: '#1F2937',
    buttons: '#7C3AED',
    accent: '#8B5CF6'
  }
};

const features = [
  "Loja virtual pronta em minutos",
  "Catálogo automático de produtos",
  "Link exclusivo para compartilhar",
  "Botão flutuante do WhatsApp",
  "100% responsivo para celular",
  "Integrado com a IA ISA"
];

const ClientVitrine = () => {
  const { profile, user } = useAuth();
  const { vitrine: savedVitrine, isLoading, isSaving, loadMemory, updateSection } = useClientMemory();

  const [vitrineId, setVitrineId] = useState<string>('');
  const vitrineUrl = vitrineId ? `${window.location.origin}/vitrine/${vitrineId}` : '';
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [config, setConfig] = useState<VitrineConfig>(DEFAULT_CONFIG);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Fetch vitrine_id from clients table
  useEffect(() => {
    const fetchVitrineId = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('clients')
        .select('vitrine_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.vitrine_id) {
        setVitrineId(data.vitrine_id);
      }
    };
    fetchVitrineId();
  }, [user?.id]);

  useEffect(() => {
    if (!hasInitialized && savedVitrine?.config) {
      setConfig({ ...DEFAULT_CONFIG, ...savedVitrine.config });
      setHasInitialized(true);
    }
  }, [savedVitrine, hasInitialized]);

  const handleSave = async () => {
    const success = await updateSection('vitrine', { config }, 'Vitrine salva com sucesso!');
    if (!success) {
      toast.error("Erro ao salvar vitrine");
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setIsUploadingBanner(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setConfig({ ...config, banner: reader.result as string });
      setIsUploadingBanner(false);
      toast.success("Banner carregado!");
    };
    reader.onerror = () => {
      toast.error("Erro ao carregar imagem");
      setIsUploadingBanner(false);
    };
    reader.readAsDataURL(file);
  };

  const removeBanner = () => {
    setConfig({ ...config, banner: '' });
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setConfig({
      ...config,
      theme,
      colors: THEME_PRESETS[theme]
    });
  };

  return (
    <DashboardLayout isAdmin={false}>
      <div className="min-h-[calc(100vh-64px)] overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 border-b border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/20">
                <Store className="h-7 w-7 text-purple-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                    Minha Vitrine
                  </h1>
                  <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <p className="text-muted-foreground">Personalize sua loja virtual</p>
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

              {/* Card 1: Link da Vitrine */}
              <div 
                className="glass rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.1s' }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-500/30">
                    <LinkIcon className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Link da Sua Vitrine</h3>
                    <p className="text-sm text-muted-foreground">Compartilhe este link com seus clientes</p>
                  </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Input
                    value={vitrineUrl}
                    readOnly
                    className="glass border-border/50 flex-1 min-w-[200px] focus:border-purple-500/50"
                  />
                  <Button
                    onClick={() => copyToClipboard(vitrineUrl, "Link copiado!")}
                    variant="outline"
                    className="glass border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <Copy className="mr-2 h-4 w-4" /> Copiar
                  </Button>
                  <Button
                    onClick={() => window.open(vitrineUrl, '_blank')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 transition-all duration-300"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir
                  </Button>
                </div>
              </div>

              {/* Card 2: Informações Básicas */}
              <div 
                className="glass rounded-2xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.2s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-primary/30">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Informações da Loja</h3>
                    <p className="text-sm text-muted-foreground">Configure os dados exibidos na vitrine</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Store className="h-4 w-4" /> Nome da Vitrine
                    </Label>
                    <Input
                      value={config.name}
                      onChange={e => setConfig({ ...config, name: e.target.value })}
                      className="glass border-border/50 focus:border-primary/50 transition-all duration-300"
                      placeholder="Ex: Loja do João"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" /> WhatsApp
                    </Label>
                    <Input
                      value={config.whatsappNumber}
                      onChange={e => setConfig({ ...config, whatsappNumber: e.target.value })}
                      className="glass border-border/50 focus:border-primary/50 transition-all duration-300"
                      placeholder="Ex: 5511999999999"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Nome da Empresa
                    </Label>
                    <Input
                      value={config.companyName}
                      onChange={e => setConfig({ ...config, companyName: e.target.value })}
                      className="glass border-border/50 focus:border-primary/50 transition-all duration-300"
                      placeholder="Ex: João Comércio LTDA"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> CNPJ
                    </Label>
                    <Input
                      value={config.cnpj}
                      onChange={e => setConfig({ ...config, cnpj: e.target.value })}
                      className="glass border-border/50 focus:border-primary/50 transition-all duration-300"
                      placeholder="Ex: 00.000.000/0001-00"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Tema */}
              <div 
                className="glass rounded-2xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.3s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-accent/30">
                    <Palette className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Tema da Vitrine</h3>
                    <p className="text-sm text-muted-foreground">Escolha a aparência da sua loja</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`glass rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] ${
                      config.theme === 'dark'
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                        : 'border-border/50 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-[#0D0D0D] border border-zinc-700 flex items-center justify-center shadow-lg">
                        <Moon className="h-8 w-8 text-purple-400" />
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg">Tema Escuro</span>
                        <p className="text-sm text-muted-foreground mt-1">Elegante e moderno</p>
                      </div>
                      {config.theme === 'dark' && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center animate-scale-in">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`glass rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-[1.02] ${
                      config.theme === 'light'
                        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20'
                        : 'border-border/50 hover:border-purple-500/50'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white border border-zinc-300 flex items-center justify-center shadow-lg">
                        <Sun className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div className="text-center">
                        <span className="font-semibold text-lg">Tema Claro</span>
                        <p className="text-sm text-muted-foreground mt-1">Clean e minimalista</p>
                      </div>
                      {config.theme === 'light' && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center animate-scale-in">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Card 4: Banner */}
              <div 
                className="glass rounded-2xl p-6 border border-pink-500/20 hover:border-pink-500/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.4s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-pink-500/30">
                    <ImageIcon className="h-5 w-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Banner da Vitrine</h3>
                    <p className="text-sm text-muted-foreground">Imagem de destaque no topo da loja</p>
                  </div>
                </div>

                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />

                {config.banner ? (
                  <div className="relative rounded-xl overflow-hidden border border-border/50 group/banner">
                    <img
                      src={config.banner}
                      alt="Banner"
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover/banner:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/banner:opacity-100 transition-opacity duration-300" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-3 right-3 opacity-0 group-hover/banner:opacity-100 transition-all duration-300"
                      onClick={removeBanner}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="w-full h-48 rounded-xl border-2 border-dashed border-border/50 hover:border-pink-500/50 hover:bg-pink-500/5 flex flex-col items-center justify-center gap-3 transition-all duration-300 group/upload"
                  >
                    <div className="w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-300">
                      <Upload className="h-7 w-7 text-pink-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">
                        {isUploadingBanner ? "Carregando..." : "Clique para enviar"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG ou GIF (máx. 5MB)</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Card 5: Anúncios */}
              <div 
                className="glass rounded-2xl p-6 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-500 group animate-fade-in"
                style={{ animationDelay: '0.5s' }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-yellow-500/30">
                    <Megaphone className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Anúncios Promocionais</h3>
                    <p className="text-sm text-muted-foreground">Destaque ofertas e novidades</p>
                  </div>
                </div>

                <Textarea
                  value={config.announcements}
                  onChange={e => setConfig({ ...config, announcements: e.target.value })}
                  className="glass border-border/50 focus:border-yellow-500/50 min-h-[120px] resize-none transition-all duration-300"
                  placeholder="Ex: 🔥 PROMOÇÃO: 20% OFF em todos os produtos! Válido até sexta-feira."
                />
              </div>

              {/* Features Grid */}
              <div 
                className="glass rounded-2xl p-6 border border-border/30 animate-fade-in"
                style={{ animationDelay: '0.6s' }}
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  Recursos Incluídos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature, index) => (
                    <div 
                      key={feature}
                      className="flex items-center gap-2 text-sm animate-fade-in"
                      style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                    >
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientVitrine;
