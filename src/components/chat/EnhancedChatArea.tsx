import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Phone, Video, MoreVertical, Smile, Paperclip, Send, Mic, Bot, User, Zap, 
  Check, CheckCheck, Bell, FileText, UserCheck, Star, Download, HelpCircle,
  AlertTriangle, MessageSquare
} from "lucide-react";
import { Contact } from "./ChatSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other' | 'ai';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  senderType?: 'human' | 'ai';
}

interface EnhancedChatAreaProps {
  contact: Contact | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, mode: 'ai' | 'manual') => void;
  onAddReminder?: (text: string) => void;
  onAddObservation?: (text: string) => void;
  onTransferToHuman?: () => void;
  onMarkPriority?: () => void;
  onExportConversation?: () => void;
  isPriority?: boolean;
  isIsaSupport?: boolean;
}

export const EnhancedChatArea = ({ 
  contact, 
  messages, 
  isLoading, 
  onSendMessage,
  onAddReminder,
  onAddObservation,
  onTransferToHuman,
  onMarkPriority,
  onExportConversation,
  isPriority = false,
  isIsaSupport = false
}: EnhancedChatAreaProps) => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<'ai' | 'manual' | 'mixed'>('ai');
  const [reminderText, setReminderText] = useState("");
  const [observationText, setObservationText] = useState("");
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showObservationDialog, setShowObservationDialog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const effectiveMode = mode === 'mixed' ? 'manual' : mode;
    onSendMessage(input, effectiveMode);
    setInput("");
  };

  const handleSaveReminder = () => {
    if (reminderText.trim() && onAddReminder) {
      onAddReminder(reminderText);
      setReminderText("");
      setShowReminderDialog(false);
      toast.success("Lembrete adicionado!");
    }
  };

  const handleSaveObservation = () => {
    if (observationText.trim() && onAddObservation) {
      onAddObservation(observationText);
      setObservationText("");
      setShowObservationDialog(false);
      toast.success("Observação salva!");
    }
  };

  if (!contact) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0D0D0D] text-gray-500">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] rounded-full mx-auto flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-lg mb-2 text-white font-medium">Selecione uma conversa</p>
          <p className="text-sm text-gray-500">Escolha um contato na lista ou<br/>clique em "ISA Suporte" para ajuda</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0D0D]">
      {/* Header */}
      <div className={`h-16 px-4 flex items-center justify-between border-b border-[#27272a] ${
        isIsaSupport 
          ? 'bg-gradient-to-r from-[#007BFF]/20 to-[#1E1E1E]' 
          : isPriority 
            ? 'bg-gradient-to-r from-red-950/50 to-[#1E1E1E]'
            : 'bg-[#1E1E1E]'
      }`}>
        <div className="flex items-center gap-3">
          <Avatar className={`w-10 h-10 ${isIsaSupport ? 'ring-2 ring-[#007BFF]' : ''}`}>
            {isIsaSupport ? (
              <AvatarFallback className="bg-gradient-to-br from-[#007BFF] to-[#0056B3] text-white">
                <HelpCircle className="w-5 h-5" />
              </AvatarFallback>
            ) : (
              <>
                <AvatarImage src={contact.avatar} />
                <AvatarFallback className="bg-[#333] text-gray-300">
                  {contact.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-medium text-sm ${isIsaSupport ? 'text-[#007BFF]' : 'text-white'}`}>
                {contact.name}
              </h3>
              {isPriority && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-xs flex items-center gap-1 text-gray-400">
              {contact.status === 'online' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28A745]" />
                  <span className="text-[#28A745]">Online</span>
                </>
              ) : (
                "Offline"
              )}
              {isIsaSupport && <span className="ml-2 text-[#007BFF]">• Suporte 24/7</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          {!isIsaSupport && (
            <>
              <Button variant="ghost" size="icon" className="hover:bg-[#2A2A2A] hover:text-white"><Phone className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="hover:bg-[#2A2A2A] hover:text-white"><Video className="w-4 h-4" /></Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="hover:bg-[#2A2A2A] hover:text-white"><MoreVertical className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0A0A0A]">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <span className="text-gray-500 text-sm">Carregando mensagens...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center p-8">
            <div className="text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma mensagem ainda</p>
              {isIsaSupport && (
                <p className="text-xs mt-2 text-[#007BFF]">Digite sua dúvida abaixo para começar!</p>
              )}
            </div>
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.sender === 'other' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] rounded-lg p-3 shadow-lg relative ${
              msg.sender === 'other'
                ? 'bg-[#1E1E1E] text-white rounded-tl-none border border-[#27272a]'
                : msg.senderType === 'ai'
                  ? 'bg-gradient-to-br from-[#0056B3] to-[#003d82] text-white rounded-tr-none'
                  : 'bg-gradient-to-br from-[#15803d] to-[#166534] text-white rounded-tr-none'
            }`}>
              {/* Sender Label */}
              {msg.sender !== 'other' && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] opacity-80 font-semibold uppercase tracking-wider">
                  {msg.senderType === 'ai' ? (
                    <><Bot className="w-3 h-3" /> ISA IA</>
                  ) : (
                    <><User className="w-3 h-3" /> Enviado Manual</>
                  )}
                </div>
              )}
              {msg.sender === 'other' && (
                <div className="flex items-center gap-1.5 mb-1.5 text-[10px] opacity-60 font-semibold uppercase tracking-wider">
                  <User className="w-3 h-3" /> Cliente
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>

              <div className="flex items-center justify-end gap-1.5 mt-2 opacity-70">
                <span className="text-[10px]">{msg.timestamp}</span>
                {msg.sender !== 'other' && (
                  msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> :
                    msg.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5" /> :
                      <Check className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Action Buttons Bar (only for regular contacts, not ISA Support) */}
      {!isIsaSupport && (
        <div className="px-3 py-2 bg-[#1a1a1a] border-t border-[#27272a] flex flex-wrap gap-2 justify-center">
          {/* Reminder Dialog */}
          <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-[#2A2A2A] border-[#333] text-gray-300 hover:bg-[#333] hover:text-white text-xs h-8">
                <Bell className="w-3 h-3 mr-1" /> Lembrete
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E1E1E] border-[#27272a] text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar Lembrete</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Ex: Cliente novo, precisa de ajuda com QR Code"
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  className="bg-[#2A2A2A] border-[#333] text-white"
                />
                <Button onClick={handleSaveReminder} className="w-full bg-[#007BFF] hover:bg-[#0069d9]">
                  Salvar Lembrete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Observation Dialog */}
          <Dialog open={showObservationDialog} onOpenChange={setShowObservationDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-[#2A2A2A] border-[#333] text-gray-300 hover:bg-[#333] hover:text-white text-xs h-8">
                <FileText className="w-3 h-3 mr-1" /> Observação
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1E1E1E] border-[#27272a] text-white">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar Observação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Anotações detalhadas sobre o cliente..."
                  value={observationText}
                  onChange={(e) => setObservationText(e.target.value)}
                  className="bg-[#2A2A2A] border-[#333] text-white min-h-[100px]"
                />
                <Button onClick={handleSaveObservation} className="w-full bg-[#007BFF] hover:bg-[#0069d9]">
                  Salvar Observação
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            className="bg-[#2A2A2A] border-[#333] text-gray-300 hover:bg-[#333] hover:text-white text-xs h-8"
            onClick={() => {
              onTransferToHuman?.();
              toast.info("Conversa transferida para atendente humano");
            }}
          >
            <UserCheck className="w-3 h-3 mr-1" /> Humano
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className={`border-[#333] text-xs h-8 ${
              isPriority 
                ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#333] hover:text-white'
            }`}
            onClick={() => {
              onMarkPriority?.();
              toast.success(isPriority ? "Prioridade removida" : "Marcado como prioridade!");
            }}
          >
            <AlertTriangle className="w-3 h-3 mr-1" /> {isPriority ? 'Remover' : 'Prioridade'}
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="bg-[#2A2A2A] border-[#333] text-gray-300 hover:bg-[#333] hover:text-white text-xs h-8"
            onClick={() => {
              onExportConversation?.();
              toast.success("Conversa exportada!");
            }}
          >
            <Download className="w-3 h-3 mr-1" /> Exportar
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            className="bg-[#2A2A2A] border-[#333] text-yellow-500 hover:bg-[#333] hover:text-yellow-400 text-xs h-8"
            onClick={() => toast.info("Conversa favoritada!")}
          >
            <Star className="w-3 h-3 mr-1" /> Favoritar
          </Button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-[#1E1E1E] border-t border-[#27272a]">
        {/* Mode Toggles - only show for regular contacts */}
        {!isIsaSupport && (
          <div className="flex gap-2 mb-2 justify-center">
            <button
              onClick={() => setMode('ai')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'ai' 
                  ? 'bg-gradient-to-r from-[#007BFF] to-[#0056B3] text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" /> Auto (IA)
            </button>
            <button
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'manual' 
                  ? 'bg-gradient-to-r from-[#28A745] to-[#1e7e34] text-white shadow-lg shadow-green-500/20' 
                  : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Manual
            </button>
            <button
              onClick={() => setMode('mixed')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                mode === 'mixed' 
                  ? 'bg-gradient-to-r from-[#EAB308] to-[#ca9a06] text-white shadow-lg shadow-yellow-500/20' 
                  : 'bg-[#2A2A2A] text-gray-400 hover:bg-[#333]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Misto
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-[#2A2A2A] rounded-xl p-2">
          <Button variant="ghost" size="icon" className="hover:bg-[#333] text-gray-400 h-9 w-9"><Smile className="w-5 h-5" /></Button>
          {!isIsaSupport && (
            <Button variant="ghost" size="icon" className="hover:bg-[#333] text-gray-400 h-9 w-9"><Paperclip className="w-5 h-5" /></Button>
          )}

          <Input
            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-gray-500 h-9"
            placeholder={
              isIsaSupport 
                ? "Digite sua dúvida sobre o ISA 1.0..." 
                : mode === 'ai' 
                  ? "Digite instrução para IA..." 
                  : "Digite uma mensagem..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />

          {input ? (
            <Button 
              size="icon" 
              className="bg-gradient-to-r from-[#007BFF] to-[#0056B3] hover:from-[#0069d9] hover:to-[#004085] h-9 w-9 shadow-lg shadow-blue-500/20" 
              onClick={handleSend}
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="hover:bg-[#333] text-gray-400 h-9 w-9">
              <Mic className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
