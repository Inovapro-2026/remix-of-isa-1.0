import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useClientMemory } from "@/hooks/useClientMemory";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Brain, Save, RotateCcw, User, Mic, MessageCircle, HandMetal } from "lucide-react";

const ClientAIIdentity = () => {
  const { identity: savedIdentity, isLoading, isSaving, loadMemory, updateSection } = useClientMemory();
  
  const [identity, setIdentity] = useState({
    name: '',
    tone: 'friendly',
    greeting: '',
    farewell: ''
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!hasInitialized && savedIdentity) {
      setIdentity(prev => ({ ...prev, ...savedIdentity }));
      setHasInitialized(true);
    }
  }, [savedIdentity, hasInitialized]);

  const handleSave = async () => {
    const success = await updateSection('identity', identity, 'Identidade da IA salva!');
    if (!success) {
      toast.error("Erro ao salvar");
    }
  };

  const toneDescriptions: Record<string, string> = {
    friendly: "A IA será amigável, acolhedora e usará linguagem informal",
    formal: "A IA será profissional, respeitosa e usará linguagem formal",
    casual: "A IA será descontraída, leve e usará gírias moderadas",
    technical: "A IA será precisa, técnica e usará termos específicos do setor"
  };

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] text-white flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Identidade da IA</h1>
              <p className="text-zinc-400">Configure a personalidade e tom de voz da sua assistente</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadMemory} 
              disabled={isLoading}
              className="border-zinc-700 hover:bg-zinc-800 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Restaurar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="mr-2 h-4 w-4" /> 
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Name Card */}
            <div className="bg-[#1E1E1E] rounded-xl border border-[#27272a] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Nome da Assistente</h3>
                  <p className="text-sm text-zinc-400">Como sua IA se apresentará aos clientes</p>
                </div>
              </div>
              
              <Input
                value={identity.name}
                onChange={e => setIdentity({ ...identity, name: e.target.value })}
                className="bg-[#27272a] border-none text-white"
                placeholder="Ex: ISA, Luna, Atendente Virtual..."
              />
            </div>

            {/* Tone Card */}
            <div className="bg-[#1E1E1E] rounded-xl border border-[#27272a] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Tom de Voz</h3>
                  <p className="text-sm text-zinc-400">Defina como a IA se comunicará</p>
                </div>
              </div>
              
              <Select value={identity.tone} onValueChange={v => setIdentity({ ...identity, tone: v })}>
                <SelectTrigger className="bg-[#27272a] border-none text-white">
                  <SelectValue placeholder="Selecione um tom" />
                </SelectTrigger>
                <SelectContent className="bg-[#27272a] border-zinc-700 text-white">
                  <SelectItem value="friendly">😊 Amigável</SelectItem>
                  <SelectItem value="formal">👔 Formal</SelectItem>
                  <SelectItem value="casual">😎 Casual</SelectItem>
                  <SelectItem value="technical">🔧 Técnico</SelectItem>
                </SelectContent>
              </Select>
              
              {identity.tone && (
                <p className="mt-3 text-sm text-zinc-500 bg-[#27272a] p-3 rounded-lg">
                  {toneDescriptions[identity.tone]}
                </p>
              )}
            </div>

            {/* Greeting Card */}
            <div className="bg-[#1E1E1E] rounded-xl border border-[#27272a] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Saudação Inicial</h3>
                  <p className="text-sm text-zinc-400">Mensagem que a IA enviará ao iniciar uma conversa</p>
                </div>
              </div>
              
              <Textarea
                value={identity.greeting}
                onChange={e => setIdentity({ ...identity, greeting: e.target.value })}
                className="bg-[#27272a] border-none text-white min-h-[100px]"
                placeholder="Ex: Olá! Sou a ISA, assistente virtual da [Sua Empresa]. Como posso ajudar você hoje? 😊"
              />
            </div>

            {/* Farewell Card */}
            <div className="bg-[#1E1E1E] rounded-xl border border-[#27272a] p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center">
                  <HandMetal className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Despedida</h3>
                  <p className="text-sm text-zinc-400">Mensagem que a IA enviará ao encerrar uma conversa</p>
                </div>
              </div>
              
              <Textarea
                value={identity.farewell}
                onChange={e => setIdentity({ ...identity, farewell: e.target.value })}
                className="bg-[#27272a] border-none text-white min-h-[100px]"
                placeholder="Ex: Foi um prazer atendê-lo! Se precisar de mais alguma coisa, estarei por aqui. Até logo! 👋"
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientAIIdentity;
