import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Brain, Building2, FileText, ShoppingBag, Save, RotateCcw, Loader2 } from "lucide-react";

// Components
import { MemorySection } from "@/components/ai/MemorySection";
import { ProductManager } from "@/components/ai/ProductManager";
import { Simulator } from "@/components/ai/Simulator";

const ClientAI = () => {
    const { profile, user } = useAuth();
    const clientId = profile?.cpf?.replace(/\D/g, '') || profile?.id || '';
    const userId = user?.id || '';

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // State for each section
    const [identity, setIdentity] = useState({ name: '', tone: 'friendly', greeting: '', farewell: '' });
    const [company, setCompany] = useState({ name: '', segment: '', mission: '', hours: '', payment: '', address: '', policies: '' });
    const [behavior, setBehavior] = useState({ rules: '' });
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        if (!userId) return;
        loadData();
    }, [userId]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load from client_ai_memory table
            const { data: memoryData, error: memoryError } = await supabase
                .from('client_ai_memory')
                .select('config')
                .eq('user_id', userId)
                .maybeSingle();

            if (memoryError) throw memoryError;

            const mem = memoryData?.config as any || {};
            if (mem.identity) setIdentity(mem.identity);
            if (mem.company) setCompany(mem.company);
            if (mem.behavior) setBehavior(mem.behavior);

            // Load products from products table
            const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('name');

            if (productsData) setProducts(productsData);
        } catch (e) {
            console.error(e);
            toast.error("Erro ao carregar memória");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!userId) {
            toast.error("Usuário não identificado");
            return;
        }

        setIsSaving(true);
        try {
            // Build full config
            const fullConfig = {
                identity,
                company,
                behavior,
                products: products.map(p => ({
                    id: p.id,
                    code: p.code,
                    name: p.name,
                    price: p.price,
                    description: p.description,
                    category: p.category
                }))
            };

            // Save to client_ai_memory table
            const { error: memoryError } = await supabase
                .from('client_ai_memory')
                .upsert({
                    user_id: userId,
                    config: fullConfig,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (memoryError) throw memoryError;

            // Also save behavior rules to ai_behavior_rules for backward compatibility
            await supabase
                .from('ai_behavior_rules')
                .upsert({
                    user_id: userId,
                    rules: behavior.rules,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            // Save company info to company_knowledge for backward compatibility
            await supabase
                .from('company_knowledge')
                .upsert({
                    user_id: userId,
                    name: company.name,
                    segment: company.segment,
                    mission: company.mission,
                    hours: company.hours,
                    address: company.address,
                    payment: company.payment,
                    policies: company.policies,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            toast.success("Configurações salvas com sucesso!");
        } catch (e) {
            console.error(e);
            toast.error("Erro ao salvar configurações");
        } finally {
            setIsSaving(false);
        }
    };

    const currentConfig = { identity, company, behavior, products };

    return (
        <DashboardLayout isAdmin={false}>
            <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] text-white flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[#27272a]">
                    <div>
                        <h1 className="text-2xl font-bold">Memória de IA</h1>
                        <p className="text-zinc-400">Configure o comportamento e conhecimento da sua assistente</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={loadData} disabled={isLoading} className="border-zinc-700 hover:bg-zinc-800 text-white">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                            Restaurar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 overflow-hidden p-6">
                    <div className="grid grid-cols-12 gap-6 h-full">

                        {/* Left Column: Configuration (8 cols) */}
                        <div className="col-span-8 overflow-y-auto pr-2 custom-scrollbar space-y-6 pb-20">

                            {/* Section 1: Identity */}
                            <MemorySection title="Identidade da IA" icon={<Brain className="h-5 w-5" />} color="#9333ea">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nome da Assistente</Label>
                                            <Input value={identity.name} onChange={e => setIdentity({ ...identity, name: e.target.value })} className="bg-[#27272a] border-none" />
                                        </div>
                                        <div>
                                            <Label>Tom de Voz</Label>
                                            <Select value={identity.tone} onValueChange={v => setIdentity({ ...identity, tone: v })}>
                                                <SelectTrigger className="bg-[#27272a] border-none">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#27272a] border-zinc-700 text-white">
                                                    <SelectItem value="friendly">Amigável</SelectItem>
                                                    <SelectItem value="formal">Formal</SelectItem>
                                                    <SelectItem value="casual">Casual</SelectItem>
                                                    <SelectItem value="technical">Técnico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Saudação Inicial</Label>
                                        <Textarea value={identity.greeting} onChange={e => setIdentity({ ...identity, greeting: e.target.value })} className="bg-[#27272a] border-none" rows={2} />
                                    </div>
                                    <div>
                                        <Label>Despedida</Label>
                                        <Textarea value={identity.farewell} onChange={e => setIdentity({ ...identity, farewell: e.target.value })} className="bg-[#27272a] border-none" rows={2} />
                                    </div>
                                </div>
                            </MemorySection>

                            {/* Section 2: Company */}
                            <MemorySection title="Conhecimento da Empresa" icon={<Building2 className="h-5 w-5" />} color="#f97316">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nome da Empresa</Label>
                                            <Input value={company.name} onChange={e => setCompany({ ...company, name: e.target.value })} className="bg-[#27272a] border-none" />
                                        </div>
                                        <div>
                                            <Label>Segmento</Label>
                                            <Input value={company.segment} onChange={e => setCompany({ ...company, segment: e.target.value })} className="bg-[#27272a] border-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Missão / Slogan</Label>
                                        <Input value={company.mission} onChange={e => setCompany({ ...company, mission: e.target.value })} className="bg-[#27272a] border-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Horário de Funcionamento</Label>
                                            <Input value={company.hours} onChange={e => setCompany({ ...company, hours: e.target.value })} className="bg-[#27272a] border-none" />
                                        </div>
                                        <div>
                                            <Label>Formas de Pagamento</Label>
                                            <Input value={company.payment} onChange={e => setCompany({ ...company, payment: e.target.value })} className="bg-[#27272a] border-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Endereço</Label>
                                        <Input value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} className="bg-[#27272a] border-none" />
                                    </div>
                                </div>
                            </MemorySection>

                            {/* Section 3: Behavior */}
                            <MemorySection title="Memória de Comportamento" icon={<FileText className="h-5 w-5" />} color="#3b82f6">
                                <div className="space-y-2">
                                    <Label>Regras Gerais e Comportamento</Label>
                                    <Textarea
                                        value={behavior.rules}
                                        onChange={e => setBehavior({ ...behavior, rules: e.target.value })}
                                        className="bg-[#27272a] border-none min-h-[150px]"
                                        placeholder="Ex: Sempre confirme o endereço antes de finalizar o pedido. Não ofereça descontos a menos que solicitado..."
                                    />
                                </div>
                            </MemorySection>

                            {/* Section 4: Products */}
                            <MemorySection title="Produtos e Serviços" icon={<ShoppingBag className="h-5 w-5" />} color="#22c55e">
                                <ProductManager clientId={clientId} products={products} setProducts={setProducts} />
                            </MemorySection>

                        </div>

                        {/* Right Column: Simulator (4 cols) */}
                        <div className="col-span-4 h-full pb-20">
                            <Simulator clientId={clientId} config={currentConfig} />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default ClientAI;
