import { Contact } from "./ChatSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Clock, Tag, Brain, Power } from "lucide-react";

interface ChatControlPanelProps {
    contact: Contact | null;
}

export const ChatControlPanel = ({ contact }: ChatControlPanelProps) => {
    if (!contact) {
        return (
            <div className="h-full bg-[#1E1E1E] border-l border-[#27272a] p-6 flex flex-col items-center justify-center text-gray-500 text-center">
                <Brain className="w-12 h-12 mb-4 opacity-20" />
                <p>Selecione uma conversa para ver os controles da IA</p>
            </div>
        )
    }

    return (
        <div className="h-full bg-[#1E1E1E] border-l border-[#27272a] flex flex-col overflow-y-auto custom-scrollbar">
            {/* Contact Profile */}
            <div className="p-6 flex flex-col items-center border-b border-[#27272a]">
                <Avatar className="w-24 h-24 mb-4 ring-4 ring-[#2A2A2A]">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback className="bg-[#333] text-2xl text-white">
                        {contact.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-white text-center">{contact.name}</h2>
                <p className="text-gray-400 mt-1">{contact.phone}</p>

                <div className="flex gap-2 mt-4 flex-wrap justify-center">
                    <Badge variant="secondary" className="bg-[#2A2A2A] text-gray-300 hover:bg-[#333]">Novo Cliente</Badge>
                    <Badge variant="secondary" className="bg-[#2A2A2A] text-gray-300 hover:bg-[#333]">WhatsApp</Badge>
                </div>
            </div>

            {/* AI Controls */}
            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Brain className="w-3 h-3" /> Configuração da IA
                    </h3>

                    <div className="space-y-4">
                        <div className="bg-[#2A2A2A] p-4 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#007BFF]/20 flex items-center justify-center text-[#007BFF]">
                                    <Power className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">IA Ativa</p>
                                    <p className="text-xs text-gray-500">Auto-respostas ligadas</p>
                                </div>
                            </div>
                            <Switch checked={true} className="data-[state=checked]:bg-[#007BFF]" />
                        </div>

                        <div className="bg-[#2A2A2A] p-4 rounded-lg space-y-3">
                            <div className="flex justify-between text-sm text-white">
                                <span>Autonomia</span>
                                <span className="text-[#007BFF]">Moderada</span>
                            </div>
                            <Slider defaultValue={[50]} max={100} step={1} className="py-2" />
                            <p className="text-[10px] text-gray-500">IA pode responder perguntas comuns mas pede confirmação para vendas.</p>
                        </div>
                    </div>
                </div>

                {/* Active Rules */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Tag className="w-3 h-3" /> Regras Ativas
                    </h3>
                    <div className="grid gap-2">
                        {['Confirmar Pedidos', 'Coletar Endereço', 'Horário Comercial'].map(rule => (
                            <div key={rule} className="flex items-center gap-2 text-sm text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#007BFF]" />
                                {rule}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Histórico Recente
                    </h3>
                    <div className="space-y-3 pl-2 border-l border-[#27272a] ml-1.5">
                        <div className="pl-4 relative">
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#27272a] border border-gray-600" />
                            <p className="text-xs text-gray-400">15:30 - Entrou em contato</p>
                        </div>
                        <div className="pl-4 relative">
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#27272a] border border-gray-600" />
                            <p className="text-xs text-gray-400">15:31 - IA respondeu saudação</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
