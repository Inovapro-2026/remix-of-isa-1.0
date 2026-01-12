import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useClientMemory } from "@/hooks/useClientMemory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, 
  Send, 
  Trash2, 
  Sparkles, 
  User, 
  Brain,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Settings,
  MessageSquare
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ClientIsaTest = () => {
  const { config, isLoading: configLoading, loadMemory } = useClientMemory();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasInitialized && config.identity?.greeting) {
      setMessages([{
        id: '0',
        role: 'assistant',
        content: config.identity.greeting,
        timestamp: new Date()
      }]);
      setHasInitialized(true);
    }
  }, [config.identity?.greeting, hasInitialized]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('test-behavior-ai', {
        body: {
          message: input,
          config: config
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "Desculpe, não consegui processar sua mensagem.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error(e);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Erro ao processar mensagem. Verifique se as configurações da IA estão corretas.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    const welcomeMessage = config.identity?.greeting 
      ? [{
          id: '0',
          role: 'assistant' as const,
          content: config.identity.greeting,
          timestamp: new Date()
        }]
      : [];
    setMessages(welcomeMessage);
    toast.success("Histórico limpo!");
  };

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] text-white flex">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-[#27272a]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  ISA de Teste
                  <span className="text-xs bg-yellow-600/20 text-yellow-500 px-2 py-1 rounded-full">
                    Ambiente de Teste
                  </span>
                </h1>
                <p className="text-sm text-zinc-400">
                  Teste sua IA com base no prompt de comportamento
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadMemory}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <RefreshCw className="h-4 w-4 mr-2" /> Recarregar Config
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={clearHistory}
                className="border-zinc-700 hover:bg-zinc-800"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Limpar Histórico
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <div className="w-16 h-16 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-zinc-400 mb-2">
                    Teste sua IA
                  </h3>
                  <p className="text-zinc-500 max-w-md">
                    Envie mensagens como se fosse um cliente para testar como sua IA responderá com base nas configurações definidas.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-[#1E1E1E] text-zinc-200 rounded-bl-sm border border-[#27272a]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-zinc-300" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
                    <Brain className="h-4 w-4 text-white animate-pulse" />
                  </div>
                  <div className="bg-[#1E1E1E] border border-[#27272a] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-[#27272a]">
            <div className="max-w-3xl mx-auto flex gap-3">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Digite como um cliente para testar a IA..."
                className="bg-[#1E1E1E] border-[#27272a] text-white focus-visible:ring-blue-600"
                disabled={isLoading || configLoading}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={isLoading || configLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 px-6"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Config Sidebar */}
        <div className="w-80 border-l border-[#27272a] bg-[#0D0D0D] flex flex-col">
          <div className="p-4 border-b border-[#27272a]">
            <h3 className="font-semibold flex items-center gap-2 text-white">
              <Settings className="h-4 w-4 text-zinc-400" />
              Configuração Ativa
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              A IA está usando estas configurações
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {/* Identity */}
              <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#27272a]">
                <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-2">
                  <Brain className="h-3 w-3" /> Identidade
                </h4>
                {config.identity?.name ? (
                  <div className="space-y-1 text-xs text-zinc-400">
                    <p><span className="text-zinc-500">Nome:</span> {config.identity.name}</p>
                    <p><span className="text-zinc-500">Tom:</span> {config.identity.tone}</p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Não configurado
                  </p>
                )}
              </div>

              {/* Behavior */}
              <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#27272a]">
                <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Comportamento
                </h4>
                {config.behavior?.rules ? (
                  <p className="text-xs text-zinc-400 line-clamp-4">
                    {config.behavior.rules}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Não configurado
                  </p>
                )}
              </div>

              {/* Company */}
              <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#27272a]">
                <h4 className="text-sm font-medium text-orange-400 mb-2 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> Empresa
                </h4>
                {config.company?.name ? (
                  <div className="space-y-1 text-xs text-zinc-400">
                    <p><span className="text-zinc-500">Nome:</span> {config.company.name}</p>
                    <p><span className="text-zinc-500">Segmento:</span> {config.company.segment}</p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Não configurado
                  </p>
                )}
              </div>

              {/* Products */}
              <div className="bg-[#1E1E1E] rounded-lg p-3 border border-[#27272a]">
                <h4 className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Produtos
                </h4>
                <p className="text-xs text-zinc-400">
                  {config.products?.length || 0} produto(s) cadastrado(s)
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-[#27272a]">
            <p className="text-xs text-zinc-500 text-center">
              As respostas são geradas com base nas suas configurações
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientIsaTest;
