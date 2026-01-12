import { useState } from "react";
import { Contact } from "./ChatSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock, Tag, Brain, Power, Bell, FileText, Save, Trash2, 
  AlertTriangle, CheckCircle, HelpCircle, History, Shield,
  CreditCard, Package, UserCheck
} from "lucide-react";
import { toast } from "sonner";

interface ClientNote {
  reminder?: string;
  observation?: string;
  lastUpdated?: string;
}

interface EnhancedControlPanelProps {
  contact: Contact | null;
  isIsaSupport?: boolean;
  clientNote?: ClientNote;
  onSaveNote?: (note: ClientNote) => void;
  isPriority?: boolean;
  isFavorite?: boolean;
  isAiActive?: boolean;
  onToggleAi?: (active: boolean) => void;
  autonomyLevel?: number;
  onAutonomyChange?: (level: number) => void;
}

export const EnhancedControlPanel = ({ 
  contact,
  isIsaSupport = false,
  clientNote,
  onSaveNote,
  isPriority = false,
  isFavorite = false,
  isAiActive = true,
  onToggleAi,
  autonomyLevel = 50,
  onAutonomyChange
}: EnhancedControlPanelProps) => {
  const [reminder, setReminder] = useState(clientNote?.reminder || "");
  const [observation, setObservation] = useState(clientNote?.observation || "");
  const [localAiActive, setLocalAiActive] = useState(isAiActive);
  const [localAutonomy, setLocalAutonomy] = useState([autonomyLevel]);

  const handleSaveNotes = () => {
    onSaveNote?.({
      reminder,
      observation,
      lastUpdated: new Date().toISOString()
    });
    toast.success("Anotações salvas!");
  };

  const getAutonomyLabel = (value: number) => {
    if (value < 30) return { label: "Básico", color: "text-yellow-500" };
    if (value < 70) return { label: "Moderado", color: "text-[#007BFF]" };
    return { label: "Completo", color: "text-[#28A745]" };
  };

  if (!contact) {
    return (
      <div className="h-full bg-[#1E1E1E] p-6 flex flex-col items-center justify-center text-gray-500 text-center">
        <Brain className="w-12 h-12 mb-4 opacity-20" />
        <p>Selecione uma conversa</p>
        <p className="text-xs mt-2">para ver os controles</p>
      </div>
    );
  }

  // ISA Support specific panel
  if (isIsaSupport) {
    return (
      <div className="h-full bg-[#1E1E1E] flex flex-col overflow-y-auto custom-scrollbar">
        <div className="p-6 flex flex-col items-center border-b border-[#27272a] bg-gradient-to-b from-[#007BFF]/10 to-transparent">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#007BFF] to-[#0056B3] flex items-center justify-center mb-4 ring-4 ring-[#2A2A2A]">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-[#007BFF]">ISA Suporte</h2>
          <p className="text-gray-400 mt-1 text-sm">Assistente Oficial</p>
          <Badge className="mt-3 bg-[#28A745]/20 text-[#28A745] border-[#28A745]/30">
            Online 24/7
          </Badge>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              💡 Posso ajudar com:
            </h3>
            <div className="space-y-2">
              {[
                'Como conectar meu WhatsApp?',
                'Configurar respostas da IA',
                'Problemas com QR Code',
                'Resetar sessão',
                'Dúvidas sobre o plano'
              ].map((item) => (
                <div key={item} className="bg-[#2A2A2A] p-3 rounded-lg text-sm text-gray-300 hover:bg-[#333] cursor-pointer transition-colors">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#2A2A2A] p-4 rounded-lg">
            <p className="text-xs text-gray-400 text-center">
              Este é um chat interno de suporte.<br/>
              Não utiliza sua conexão WhatsApp.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const autonomyInfo = getAutonomyLabel(localAutonomy[0]);

  return (
    <div className="h-full bg-[#1E1E1E] flex flex-col overflow-y-auto custom-scrollbar">
      {/* Contact Profile */}
      <div className="p-6 flex flex-col items-center border-b border-[#27272a]">
        <div className="relative">
          <Avatar className="w-20 h-20 mb-4 ring-4 ring-[#2A2A2A]">
            <AvatarImage src={contact.avatar} />
            <AvatarFallback className="bg-[#333] text-2xl text-white">
              {contact.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {contact.status === 'online' && (
            <span className="absolute bottom-4 right-0 w-4 h-4 bg-[#28A745] border-2 border-[#1E1E1E] rounded-full" />
          )}
        </div>
        <h2 className="text-lg font-bold text-white text-center">{contact.name}</h2>
        <p className="text-gray-400 text-sm mt-1">{contact.phone}</p>

        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {isPriority && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              <AlertTriangle className="w-3 h-3 mr-1" /> Prioridade
            </Badge>
          )}
          {isFavorite && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              ⭐ Favorito
            </Badge>
          )}
          <Badge variant="secondary" className="bg-[#2A2A2A] text-gray-300">Cliente</Badge>
        </div>
      </div>

      {/* Notes Section */}
      <div className="p-4 border-b border-[#27272a] space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-3 h-3" /> Anotações do Cliente
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <Bell className="w-3 h-3" /> Lembrete
            </label>
            <Input
              placeholder="Ex: Retornar amanhã às 14h"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="bg-[#2A2A2A] border-[#333] text-white text-sm h-9"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Observação
            </label>
            <Textarea
              placeholder="Anotações sobre este cliente..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="bg-[#2A2A2A] border-[#333] text-white text-sm min-h-[80px] resize-none"
            />
          </div>

          <Button 
            onClick={handleSaveNotes} 
            size="sm" 
            className="w-full bg-[#007BFF] hover:bg-[#0069d9] text-xs h-8"
          >
            <Save className="w-3 h-3 mr-1" /> Salvar Anotações
          </Button>
        </div>
      </div>

      {/* AI Controls */}
      <div className="p-4 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Brain className="w-3 h-3" /> Configuração da IA
        </h3>

        <div className="space-y-4">
          <div className="bg-[#2A2A2A] p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                localAiActive ? 'bg-[#007BFF]/20 text-[#007BFF]' : 'bg-gray-600/20 text-gray-500'
              }`}>
                <Power className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">IA Ativa</p>
                <p className="text-xs text-gray-500">
                  {localAiActive ? 'Auto-respostas ligadas' : 'Desativado'}
                </p>
              </div>
            </div>
            <Switch 
              checked={localAiActive} 
              onCheckedChange={(checked) => {
                setLocalAiActive(checked);
                onToggleAi?.(checked);
              }}
              className="data-[state=checked]:bg-[#007BFF]" 
            />
          </div>

          <div className="bg-[#2A2A2A] p-3 rounded-lg space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white">Nível de Autonomia</span>
              <span className={autonomyInfo.color}>{autonomyInfo.label}</span>
            </div>
            <Slider 
              value={localAutonomy} 
              onValueChange={(value) => {
                setLocalAutonomy(value);
                onAutonomyChange?.(value[0]);
              }}
              max={100} 
              step={1} 
              className="py-2" 
            />
            <p className="text-[10px] text-gray-500">
              {localAutonomy[0] < 30 
                ? 'IA apenas sugere respostas, você envia manualmente.'
                : localAutonomy[0] < 70
                  ? 'IA responde perguntas simples, pede confirmação para ações.'
                  : 'IA age de forma autônoma em todas as situações.'}
            </p>
          </div>
        </div>

        {/* Active Rules */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Tag className="w-3 h-3" /> Regras Ativas
          </h3>
          <div className="space-y-2">
            {['Confirmar Pedidos', 'Coletar Endereço', 'Horário Comercial'].map(rule => (
              <div key={rule} className="flex items-center gap-2 text-sm text-gray-300 bg-[#2A2A2A]/50 p-2 rounded">
                <CheckCircle className="w-3 h-3 text-[#28A745]" />
                {rule}
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield className="w-3 h-3" /> Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="bg-[#2A2A2A] border-[#333] text-gray-300 text-xs h-8 hover:bg-[#333]">
              <History className="w-3 h-3 mr-1" /> Histórico
            </Button>
            <Button variant="outline" size="sm" className="bg-[#2A2A2A] border-[#333] text-gray-300 text-xs h-8 hover:bg-[#333]">
              <CreditCard className="w-3 h-3 mr-1" /> Pagamento
            </Button>
            <Button variant="outline" size="sm" className="bg-[#2A2A2A] border-[#333] text-gray-300 text-xs h-8 hover:bg-[#333]">
              <Package className="w-3 h-3 mr-1" /> Pedidos
            </Button>
            <Button variant="outline" size="sm" className="bg-[#2A2A2A] border-[#333] text-gray-300 text-xs h-8 hover:bg-[#333]">
              <UserCheck className="w-3 h-3 mr-1" /> Ticket
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Atividade Recente
          </h3>
          <div className="space-y-2 pl-2 border-l border-[#27272a] ml-1.5">
            <div className="pl-3 relative">
              <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#28A745]" />
              <p className="text-xs text-gray-400">Agora - Online</p>
            </div>
            <div className="pl-3 relative">
              <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#27272a]" />
              <p className="text-xs text-gray-400">15:30 - Primeiro contato</p>
            </div>
            <div className="pl-3 relative">
              <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-[#27272a]" />
              <p className="text-xs text-gray-400">15:31 - IA respondeu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
