import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Wallet, Save, Loader2, CreditCard, Clock, DollarSign, QrCode
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ClientFinanceiro = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    // Formas de Pagamento
    payment_methods: "",
    // Taxas e Prazos
    payment_fees: "",
    // PIX do vendedor
    pix_key: "",
    pix_key_type: "cpf",
    pix_holder_name: "",
    pix_holder_document: "",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch AI memory config for payment info
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
          payment_methods: cfg.payments?.methods || "",
          payment_fees: cfg.payments?.fees || "",
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

      // First get existing config to merge
      const { data: existingData } = await supabase
        .from('client_ai_memory')
        .select('config')
        .eq('user_id', user.id)
        .maybeSingle();

      const existingConfig = (existingData?.config as any) || {};

      // Build config payload merging with existing
      const configPayload = {
        ...existingConfig,
        payments: {
          methods: formData.payment_methods,
          fees: formData.payment_fees,
        },
      };

      // Save to Supabase
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

      toast.success("Configurações financeiras salvas com sucesso!");

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0D0D0D]">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Wallet className="h-8 w-8 text-green-500" />
                Financeiro
              </h1>
              <p className="text-gray-400 mt-1">Configure formas de pagamento, taxas e dados PIX</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>

          {/* Formas de Pagamento */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-500" />
                Formas de Pagamento
              </CardTitle>
              <CardDescription className="text-gray-400">
                Informe quais formas de pagamento você aceita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.payment_methods}
                onChange={(e) => setFormData({ ...formData, payment_methods: e.target.value })}
                placeholder="Ex: PIX, Cartão de Crédito (até 12x), Boleto, Transferência Bancária..."
                className="bg-[#0D0D0D] border-gray-700 text-white min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Taxas e Prazos */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Taxas e Prazos
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure taxas de parcelamento, prazos de pagamento e outras condições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.payment_fees}
                onChange={(e) => setFormData({ ...formData, payment_fees: e.target.value })}
                placeholder={`Ex:
- PIX: 5% de desconto
- Cartão de crédito: até 12x sem juros
- Boleto: vencimento em 3 dias úteis
- Parcelamento acima de 6x tem acréscimo de 2%`}
                className="bg-[#0D0D0D] border-gray-700 text-white min-h-[150px]"
              />
            </CardContent>
          </Card>

          {/* Dados PIX */}
          <Card className="bg-[#1A1A1A] border-gray-800 border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <QrCode className="h-5 w-5 text-green-500" />
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
                      <SelectValue />
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
                  <Label className="text-gray-300">CPF/CNPJ do Titular (opcional)</Label>
                  <Input
                    value={formData.pix_holder_document}
                    onChange={(e) => setFormData({ ...formData, pix_holder_document: e.target.value })}
                    placeholder="000.000.000-00"
                    className="bg-[#0D0D0D] border-gray-700 text-white mt-1"
                  />
                </div>
              </div>

              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estes dados serão usados para receber os pagamentos das suas vendas via PIX
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientFinanceiro;
