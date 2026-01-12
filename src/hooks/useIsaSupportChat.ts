import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Message } from '@/components/chat/EnhancedChatArea';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const useIsaSupportChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Olá! 👋 Sou a ISA Suporte, sua assistente técnica do painel ISA 3.0.\n\nEstou aqui para te ajudar com TUDO sobre o painel:\n\n📱 **Meu WhatsApp** - Conexão e QR Code\n🧠 **Memória da IA** - Configurações de respostas\n💬 **Chat** - Atendimento aos seus clientes\n\nQual é sua dúvida? 😊',
      sender: 'other',
      senderType: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  const sendMessage = useCallback(async (text: string) => {
    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'me',
      senderType: 'human',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    setMessages(prev => [...prev, userMessage]);

    // Update conversation history
    const updatedHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: text }
    ];
    setConversationHistory(updatedHistory);

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('isa-support-chat', {
        body: { messages: updatedHistory }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message || 'Desculpe, não consegui processar sua mensagem.',
        sender: 'other',
        senderType: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationHistory(prev => [
        ...prev,
        { role: 'assistant', content: data.message }
      ]);

    } catch (error) {
      console.error('ISA Support chat error:', error);
      toast.error('Erro ao conectar com o suporte. Tente novamente.');
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, estou tendo dificuldades para responder. Por favor, tente novamente em alguns instantes.',
        sender: 'other',
        senderType: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'read'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationHistory]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      text: 'Chat reiniciado! Como posso ajudar?',
      sender: 'other',
      senderType: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'read'
    }]);
    setConversationHistory([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearChat
  };
};
