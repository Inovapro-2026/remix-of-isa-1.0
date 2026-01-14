import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useBehaviorRules } from "@/hooks/useBehaviorRules";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  FileText, Save, Loader2, Building2, User, MapPin, Clock, Megaphone, 
  Info, Phone, Link2, Copy as CopyIcon, CreditCard, Truck, Shield, 
  RefreshCw, Wallet, DollarSign, MessageSquare, Image, Video, Upload, X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const ClientMemoryBehavior = () => {
  const { rules, isLoading: rulesLoading, isSaving: rulesSaving, loadRules, saveRules } = useBehaviorRules();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Phone Number Dialog State
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tempConfigPayload, setTempConfigPayload] = useState<any>(null);

  // Form State - Extended with marketplace fields
  const [formData, setFormData] = useState({
    // Identidade
    identity_name: "",
    identity_function: "",
    // Empresa
    company_name: "",
    company_industry: "",
    company_target_audience: "",
    company_differentials: "",
    // Tom de voz
    behavior_tone: "",
    // Operações
    company_business_hours: "",
    company_location: "",
    // Marketing
    company_promotions: "",
    // Políticas
    policy_delivery: "",
    policy_warranty: "",
    policy_exchange: "",
    // Pagamentos
    payment_methods: "",
    payment_fees: "",
    // Links
    vitrine_link: "",
    official_links: "",
    // Instruções
    company_additional_info: "",
    behavior_custom_rules: "",
    // PIX do vendedor
    pix_key: "",
    pix_key_type: "cpf",
    pix_holder_name: "",
    pix_holder_document: "",
    // Primeira Interação
    first_message_prompt: "",
    welcome_media_url: "",
    welcome_media_type: "" as "" | "image" | "video",
  });
  
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    if (rules) {
      setFormData(prev => ({ ...prev, behavior_custom_rules: rules }));
    }
  }, [rules]);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch AI memory config
      const { data, error } = await supabase
        .from('client_ai_memory')
        .select('config')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch PIX info
      const { data: pixData } = await supabase
        .from('seller_pix_info')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data?.config) {
        const cfg = data.config as any;
        setFormData(prev => ({
          ...prev,
          identity_name: cfg.identity?.name || "",
          identity_function: cfg.identity?.function || "",
          company_name: cfg.company?.name || "",
          company_industry: cfg.company?.industry || "",
          company_target_audience: cfg.company?.target_audience || "",
          company_differentials: cfg.company?.differentials || "",
          behavior_tone: cfg.behavior?.tone || "",
          company_business_hours: cfg.company?.business_hours || "",
          company_location: cfg.company?.location || "",
          company_promotions: cfg.company?.promotions || "",
          policy_delivery: cfg.policies?.delivery || "",
          policy_warranty: cfg.policies?.warranty || "",
          policy_exchange: cfg.policies?.exchange || "",
          payment_methods: cfg.payments?.methods || "",
          payment_fees: cfg.payments?.fees || "",
          vitrine_link: cfg.company?.vitrine_link || "",
          official_links: cfg.company?.official_links || "",
          company_additional_info: cfg.company?.additional_info || "",
          behavior_custom_rules: cfg.behavior?.custom_rules || "",
          first_message_prompt: cfg.first_interaction?.message_prompt || "",
          welcome_media_url: cfg.first_interaction?.media_url || "",
          welcome_media_type: cfg.first_interaction?.media_type || "",
        }));
      }

      if (pixData) {
        setFormData(prev => ({
          ...prev,
          pix_key: pixData.pix_key || "",
          pix_key_type: pixData.pix_key_type || "cpf",
          pix_holder_name: pixData.holder_name || "",
          pix_holder_document: pixData.holder_document || "",
        }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Build config payload
      const configPayload = {
        identity: {
          name: formData.identity_name,
          function: formData.identity_function
        },
        behavior: {
          tone: formData.behavior_tone,
          custom_rules: formData.behavior_custom_rules
        },
        company: {
          name: formData.company_name,
          industry: formData.company_industry,
          target_audience: formData.company_target_audience,
          differentials: formData.company_differentials,
          business_hours: formData.company_business_hours,
          location: formData.company_location,
          promotions: formData.company_promotions,
          vitrine_link: formData.vitrine_link,
          official_links: formData.official_links,
          additional_info: formData.company_additional_info,
        },
        policies: {
          delivery: formData.policy_delivery,
          warranty: formData.policy_warranty,
          exchange: formData.policy_exchange,
        },
        payments: {
          methods: formData.payment_methods,
          fees: formData.payment_fees,
        },
        behavior_rules: formData.behavior_custom_rules,
        first_interaction: {
          message_prompt: formData.first_message_prompt,
          media_url: formData.welcome_media_url,
          media_type: formData.welcome_media_type,
        }
      };

      // Save to Supabase (Cloud)
      const { error } = await supabase
        .from('client_ai_memory')
        .upsert({
          user_id: user.id,
          config: configPayload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Save PIX info if provided
      if (formData.pix_key && formData.pix_holder_name) {
        await supabase
          .from('seller_pix_info')
          .upsert({
            user_id: user.id,
            pix_key: formData.pix_key,
            pix_key_type: formData.pix_key_type,
            holder_name: formData.pix_holder_name,
            holder_document: formData.pix_holder_document,
          }, { onConflict: 'user_id' });
      }

      await saveRules(formData.behavior_custom_rules, "");

      // Check if phone number is already saved in localStorage
      const savedPhone = localStorage.getItem('isa_memory_phone');

      if (!savedPhone) {
        // Show dialog to ask for phone number
        setTempConfigPayload(configPayload);
        setShowPhoneDialog(true);
        setSaving(false);
        return;
      }

      // If phone exists, sync directly
      await syncToLocalMemory(savedPhone, configPayload);

      toast.success("Memória da IA atualizada com sucesso!");

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneSubmit = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      toast.error("Digite um número de telefone válido (mínimo 10 dígitos)");
      return;
    }

    // Save to localStorage (one-time)
    localStorage.setItem('isa_memory_phone', cleanPhone);

    // Sync to local memory
    await syncToLocalMemory(cleanPhone, tempConfigPayload);

    setShowPhoneDialog(false);
    setPhoneNumber("");
    setTempConfigPayload(null);

    toast.success("Memória da IA atualizada com sucesso!");
  };

  const syncToLocalMemory = async (phone: string, config: any) => {
    try {
      const response = await fetch(`/api/whatsapp/${phone}/save-memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        console.warn('[ClientMemoryBehavior] Failed to sync to local SQLite');
      } else {
        console.log('[ClientMemoryBehavior] ✅ Synced to local SQLite');
      }
    } catch (e) {
      console.error('[ClientMemoryBehavior] Error syncing to local:', e);
    }
  };

  const generateVitrineLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Get client's vitrine_id (random unique ID)
      const { data: client } = await supabase
        .from('clients')
        .select('vitrine_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (client?.vitrine_id) {
        const vitrineUrl = `${window.location.origin}/vitrine/${client.vitrine_id}`;
        setFormData({ ...formData, vitrine_link: vitrineUrl });
        toast.success("Link da vitrine gerado!");
      } else {
        toast.error("Vitrine não encontrada. Por favor, contate o suporte.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar link da vitrine");
    }
  };

  const copyVitrineLink = () => {
    if (formData.vitrine_link) {
      navigator.clipboard.writeText(formData.vitrine_link);
      toast.success("Link copiado!");
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast.error("Por favor, envie uma imagem ou vídeo");
      return;
    }

    // Validate file size (max 10MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${isVideo ? '50MB' : '10MB'}`);
      return;
    }

    setUploadingMedia(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/welcome-media.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('welcome-media')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('welcome-media')
        .getPublicUrl(fileName);

      setFormData(prev => ({
        ...prev,
        welcome_media_url: publicUrl,
        welcome_media_type: isImage ? 'image' : 'video'
      }));

      toast.success("Mídia de boas-vindas enviada!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar mídia");
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeWelcomeMedia = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try to delete from storage (ignore errors if file doesn't exist)
      await supabase.storage
        .from('welcome-media')
        .remove([`${user.id}/welcome-media.*`]);

      setFormData(prev => ({
        ...prev,
        welcome_media_url: "",
        welcome_media_type: ""
      }));

      toast.success("Mídia removida!");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || rulesLoading) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0D0D0D]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <FileText className="h-8 w-8 text-blue-500" />
                Memória da IA
              </h1>
              <p className="text-gray-400 mt-1">Configure a personalidade, conhecimento e políticas da sua IA vendedora</p>
            </div>
          </div>

          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-[#1A1A1A] border border-gray-800">
              <TabsTrigger value="identity" className="data-[state=active]:bg-blue-600">
                <User className="h-4 w-4 mr-2" />
                Identidade
              </TabsTrigger>
              <TabsTrigger value="company" className="data-[state=active]:bg-blue-600">
                <Building2 className="h-4 w-4 mr-2" />
                Empresa
              </TabsTrigger>
              <TabsTrigger value="policies" className="data-[state=active]:bg-blue-600">
                <Shield className="h-4 w-4 mr-2" />
                Políticas
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600">
                <CreditCard className="h-4 w-4 mr-2" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-600">
                <Info className="h-4 w-4 mr-2" />
                Avançado
              </TabsTrigger>
            </TabsList>

            {/* IDENTITY TAB */}
            <TabsContent value="identity" className="space-y-4 mt-4">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Identidade da IA
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Defina quem é a IA e qual sua função
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="identity_name" className="text-gray-300">Nome da IA</Label>
                    <Input
                      id="identity_name"
                      value={formData.identity_name}
                      onChange={(e) => setFormData({ ...formData, identity_name: e.target.value })}
                      placeholder="Ex: ISA"
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="identity_function" className="text-gray-300">Função</Label>
                    <Input
                      id="identity_function"
                      value={formData.identity_function}
                      onChange={(e) => setFormData({ ...formData, identity_function: e.target.value })}
                      placeholder="Ex: Atendente virtual e vendedora da loja"
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="behavior_tone" className="text-gray-300">Tom de Voz</Label>
                    <Select
                      value={formData.behavior_tone}
                      onValueChange={(value) => setFormData({ ...formData, behavior_tone: value })}
                    >
                      <SelectTrigger className="bg-[#0D0D0D] border-gray-700 text-white mt-1">
                        <SelectValue placeholder="Selecione o tom de voz" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1A1A1A] border-gray-700">
                        <SelectItem value="formal">Formal e Profissional</SelectItem>
                        <SelectItem value="vendedor">Vendedor e Persuasivo</SelectItem>
                        <SelectItem value="amigavel">Amigável e Casual</SelectItem>
                        <SelectItem value="premium">Premium e Sofisticado</SelectItem>
                        <SelectItem value="tecnico">Técnico e Especializado</SelectItem>
                        <SelectItem value="jovem">Jovem e Descontraído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* First Interaction Message Card */}
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-500" />
                    Mensagem de Primeira Interação
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure como a IA deve abordar os clientes na primeira mensagem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.first_message_prompt}
                    onChange={(e) => setFormData({ ...formData, first_message_prompt: e.target.value })}
                    placeholder="Exemplo de instruções para primeira interação:

Ao receber a primeira mensagem de um novo cliente:
- Cumprimente de forma calorosa e personalizada
- Apresente-se brevemente (nome e função)
- Mencione as principais ofertas ou promoções do dia
- Pergunte como pode ajudar
- Se houver mídia de boas-vindas, envie junto com a saudação

Exemplo de mensagem:
'Olá! 👋 Seja muito bem-vindo(a)! Eu sou a ISA, sua assistente virtual aqui na [Nome da Loja]! 🛍️
Hoje temos promoções especiais esperando por você!
Como posso te ajudar?'"
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[200px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

              {/* Welcome Media Card */}
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Image className="h-5 w-5 text-purple-500" />
                    Mídia de Boas-Vindas
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Envie uma imagem ou vídeo que a IA mandará na primeira interação com cada cliente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.welcome_media_url ? (
                    <div className="relative">
                      {formData.welcome_media_type === 'video' ? (
                        <video
                          src={formData.welcome_media_url}
                          controls
                          className="w-full max-h-64 rounded-lg object-contain bg-black"
                        />
                      ) : (
                        <img
                          src={formData.welcome_media_url}
                          alt="Mídia de boas-vindas"
                          className="w-full max-h-64 rounded-lg object-contain bg-black"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={removeWelcomeMedia}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                        {formData.welcome_media_type === 'video' ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <Image className="h-4 w-4" />
                        )}
                        <span>
                          {formData.welcome_media_type === 'video' ? 'Vídeo' : 'Imagem'} de boas-vindas configurada
                        </span>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-[#0D0D0D]">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingMedia ? (
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                        ) : (
                          <Upload className="h-8 w-8 text-gray-500 mb-2" />
                        )}
                        <p className="text-sm text-gray-400">
                          {uploadingMedia ? 'Enviando...' : 'Clique para enviar imagem ou vídeo'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF (max. 10MB) ou MP4, MOV (max. 50MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleMediaUpload}
                        disabled={uploadingMedia}
                      />
                    </label>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* COMPANY TAB */}
            <TabsContent value="company" className="space-y-4 mt-4">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-500" />
                    Informações da Empresa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Nome da Empresa</Label>
                      <Input
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="Ex: Minha Loja"
                        className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Ramo/Nicho</Label>
                      <Input
                        value={formData.company_industry}
                        onChange={(e) => setFormData({ ...formData, company_industry: e.target.value })}
                        placeholder="Ex: Moda feminina, Tecnologia, Alimentação"
                        className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Público-Alvo</Label>
                    <Input
                      value={formData.company_target_audience}
                      onChange={(e) => setFormData({ ...formData, company_target_audience: e.target.value })}
                      placeholder="Ex: Mulheres de 25-45 anos, empresários, gamers"
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300">Diferenciais da Empresa</Label>
                    <Textarea
                      value={formData.company_differentials}
                      onChange={(e) => setFormData({ ...formData, company_differentials: e.target.value })}
                      placeholder="Ex: Entrega rápida, produtos exclusivos, 10 anos de experiência..."
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1 min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Operações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Horário de Atendimento
                    </Label>
                    <Input
                      value={formData.company_business_hours}
                      onChange={(e) => setFormData({ ...formData, company_business_hours: e.target.value })}
                      placeholder="Ex: Seg-Sex 8h–20h, Sáb 9h–14h"
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Localização
                    </Label>
                    <Textarea
                      value={formData.company_location}
                      onChange={(e) => setFormData({ ...formData, company_location: e.target.value })}
                      placeholder="Ex: São Paulo - SP, Entrega para todo Brasil"
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1 min-h-[60px]"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Megaphone className="h-4 w-4" />
                      Promoções Ativas
                    </Label>
                    <Textarea
                      value={formData.company_promotions}
                      onChange={(e) => setFormData({ ...formData, company_promotions: e.target.value })}
                      placeholder="Ex: Frete grátis acima de R$100, 10% OFF na primeira compra"
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1 min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-blue-500" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Link da Vitrine</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={formData.vitrine_link}
                        readOnly
                        placeholder="Clique em 'Gerar Link' para criar o link da vitrine"
                        className="bg-[#0D0D0D] border-gray-700 text-white flex-1"
                      />
                      {formData.vitrine_link && (
                        <Button
                          type="button"
                          onClick={copyVitrineLink}
                          variant="outline"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <CopyIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={generateVitrineLink}
                      className="w-full mt-2 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Link2 className="mr-2 h-4 w-4" />
                      Gerar Link da Vitrine
                    </Button>
                  </div>
                  <div>
                    <Label className="text-gray-300">Links Oficiais</Label>
                    <Textarea
                      value={formData.official_links}
                      onChange={(e) => setFormData({ ...formData, official_links: e.target.value })}
                      placeholder="Instagram: @minhaloja
Site: www.minhaloja.com.br
WhatsApp: (11) 99999-9999"
                      className="bg-[#0D0D0D] border-gray-700 text-white mt-1 min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* POLICIES TAB */}
            <TabsContent value="policies" className="space-y-4 mt-4">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-500" />
                    Política de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.policy_delivery}
                    onChange={(e) => setFormData({ ...formData, policy_delivery: e.target.value })}
                    placeholder="Ex: Enviamos para todo Brasil pelos Correios e transportadoras. Prazo de 3-7 dias úteis. Frete grátis acima de R$150."
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[100px]"
                  />
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Política de Garantia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.policy_warranty}
                    onChange={(e) => setFormData({ ...formData, policy_warranty: e.target.value })}
                    placeholder="Ex: Garantia de 30 dias contra defeitos de fabricação. Produtos com defeito são substituídos sem custo adicional."
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[100px]"
                  />
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-blue-500" />
                    Política de Trocas e Devoluções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.policy_exchange}
                    onChange={(e) => setFormData({ ...formData, policy_exchange: e.target.value })}
                    placeholder="Ex: Trocas aceitas em até 7 dias após o recebimento. Produto deve estar na embalagem original, sem uso."
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[100px]"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* PAYMENTS TAB */}
            <TabsContent value="payments" className="space-y-4 mt-4">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    Formas de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.payment_methods}
                    onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })}
                    placeholder="Ex: PIX (5% de desconto), Cartão de crédito em até 12x, Boleto bancário"
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[100px]"
                  />
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    Taxas e Prazos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.payment_fees}
                    onChange={(e) => setFormData({ ...formData, payment_fees: e.target.value })}
                    placeholder="Ex: Parcelamento sem juros até 3x. Acima de 3x, juros de 2.99% a.m."
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[80px]"
                  />
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-green-500" />
                    Dados PIX para Recebimento
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure seus dados PIX para receber os pagamentos das vendas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Tipo de Chave PIX</Label>
                      <Select
                        value={formData.pix_key_type}
                        onValueChange={(value) => setFormData({ ...formData, pix_key_type: value })}
                      >
                        <SelectTrigger className="bg-[#0D0D0D] border-gray-700 text-white mt-1">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-gray-700">
                          <SelectItem value="cpf">CPF</SelectItem>
                          <SelectItem value="cnpj">CNPJ</SelectItem>
                          <SelectItem value="email">E-mail</SelectItem>
                          <SelectItem value="phone">Telefone</SelectItem>
                          <SelectItem value="random">Chave Aleatória</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Chave PIX</Label>
                      <Input
                        value={formData.pix_key}
                        onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                        placeholder="Digite sua chave PIX"
                        className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Nome do Titular</Label>
                      <Input
                        value={formData.pix_holder_name}
                        onChange={(e) => setFormData({ ...formData, pix_holder_name: e.target.value })}
                        placeholder="Nome completo do titular"
                        className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">CPF/CNPJ do Titular</Label>
                      <Input
                        value={formData.pix_holder_document}
                        onChange={(e) => setFormData({ ...formData, pix_holder_document: e.target.value })}
                        placeholder="Documento do titular"
                        className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ADVANCED TAB */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-500" />
                    Instruções para Interesse em Produtos
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure como a IA deve agir quando um cliente demonstrar interesse ou tiver dúvidas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.company_additional_info}
                    onChange={(e) => setFormData({ ...formData, company_additional_info: e.target.value })}
                    placeholder="Exemplo de instruções:

Quando o cliente perguntar sobre um produto:
- Apresente o nome, preço e descrição do produto
- Sempre envie o link da vitrine
- Pergunte se deseja adicionar à sacola

Quando o cliente confirmar interesse:
- Adicione à sacola
- Informe o total parcial
- Pergunte se quer continuar comprando ou finalizar

Após informar o total da sacola:
- Envie o link de pagamento PIX
- Informe que o pagamento é seguro
- Aguarde confirmação do pagamento"
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[250px] font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Regras Customizadas
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Regras adicionais de comportamento para a IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.behavior_custom_rules}
                    onChange={(e) => setFormData({ ...formData, behavior_custom_rules: e.target.value })}
                    placeholder="Regras personalizadas que a IA deve seguir...

Exemplo:
- Nunca mencionar concorrentes
- Sempre sugerir produtos complementares
- Oferecer cupom de desconto para primeira compra"
                    className="bg-[#0D0D0D] border-gray-700 text-white min-h-[150px] font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Salvar Tudo e Atualizar IA
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Configure seu Número de Telefone
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Digite o número de telefone que será usado para criar a memória local da IA.
              Esta ação é feita apenas uma vez.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="phone" className="text-gray-300">Número de Telefone</Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ex: 11999999999"
              className="bg-[#0D0D0D] border-gray-700 text-white mt-2"
              maxLength={15}
            />
            <p className="text-xs text-gray-500 mt-2">
              Digite apenas números (DDD + número). Mínimo 10 dígitos.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPhoneDialog(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePhoneSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientMemoryBehavior;
