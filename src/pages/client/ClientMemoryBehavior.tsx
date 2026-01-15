import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useBehaviorRules } from "@/hooks/useBehaviorRules";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, Save, Loader2, Package, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
}

const ClientMemoryBehavior = () => {
  const { rules, isLoading: rulesLoading, isSaving: rulesSaving, saveRules } = useBehaviorRules();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    behavior_instructions: "",
  });

  useEffect(() => {
    if (rules) {
      setFormData(prev => ({ ...prev, behavior_instructions: rules }));
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

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, description, price, category')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('name');

      setProducts(productsData || []);

      if (data?.config) {
        const cfg = data.config as any;
        setFormData(prev => ({
          ...prev,
          behavior_instructions: cfg.behavior?.custom_rules || cfg.behavior_rules || "",
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
        behavior: {
          custom_rules: formData.behavior_instructions
        },
        behavior_rules: formData.behavior_instructions
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

      await saveRules(formData.behavior_instructions, "");

      toast.success("Memória da IA atualizada com sucesso!");

    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <FileText className="h-8 w-8 text-blue-500" />
                Memória da IA
              </h1>
              <p className="text-gray-400 mt-1">Configure como a IA deve se comportar e conheça seus produtos</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || rulesSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving || rulesSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>

          {/* Instruções da IA */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Instruções de Comportamento
              </CardTitle>
              <CardDescription className="text-gray-400">
                Escreva aqui como a IA deve agir, responder e se comportar com os clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.behavior_instructions}
                onChange={(e) => setFormData({ ...formData, behavior_instructions: e.target.value })}
                placeholder={`Exemplo:
- Seja sempre educada e simpática
- Responda de forma objetiva mas amigável
- Ofereça ajuda para encontrar produtos
- Sempre confirme o pedido antes de finalizar
- Se o cliente perguntar algo que não sabe, diga que vai verificar
- Use emojis moderadamente
- Não prometa prazos que não pode cumprir
- Se o cliente pedir desconto, ofereça 5% para pagamento via PIX`}
                className="bg-[#0D0D0D] border-gray-700 text-white min-h-[300px] resize-y"
              />
              <p className="text-gray-500 text-sm mt-2">
                Dica: Quanto mais detalhadas as instruções, melhor a IA vai se comportar de acordo com suas expectativas.
              </p>
            </CardContent>
          </Card>

          {/* Produtos Cadastrados */}
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="h-5 w-5 text-green-500" />
                Produtos na Memória da IA
              </CardTitle>
              <CardDescription className="text-gray-400">
                A IA conhece estes produtos e pode apresentá-los aos clientes. Gerencie seus produtos na aba "Produtos".
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum produto cadastrado</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Cadastre produtos na aba "Produtos" para que a IA possa apresentá-los
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 bg-[#0D0D0D] rounded-lg border border-gray-800"
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{product.name}</h4>
                        {product.description && (
                          <p className="text-gray-500 text-sm line-clamp-1">{product.description}</p>
                        )}
                        {product.category && (
                          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded mt-1 inline-block">
                            {product.category}
                          </span>
                        )}
                      </div>
                      <div className="text-green-400 font-bold ml-4">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-gray-500 text-sm mt-4">
                Total de {products.length} produto(s) na memória da IA
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientMemoryBehavior;
