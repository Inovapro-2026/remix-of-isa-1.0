import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { clientWhatsAppISA } from "@/services/clientWhatsAppISA";
import { socket, connectToSession } from "@/services/socket";
import { toast } from "sonner";
import { Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";

// Enhanced Components
import { EnhancedChatSidebar, ISA_SUPPORT_CONTACT } from "@/components/chat/EnhancedChatSidebar";
import { EnhancedChatArea, Message } from "@/components/chat/EnhancedChatArea";
import { EnhancedControlPanel } from "@/components/chat/EnhancedControlPanel";
import { Contact } from "@/components/chat/ChatSidebar";
import { useIsaSupportChat } from "@/hooks/useIsaSupportChat";
import { Badge } from "@/components/ui/badge";

interface ClientNote {
  reminder?: string;
  observation?: string;
  lastUpdated?: string;
}

const ClientChat = () => {
  const { profile, isLoading: authLoading } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);

  // Data State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Enhanced State
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [priorityIds, setPriorityIds] = useState<string[]>([]);
  const [clientNotes, setClientNotes] = useState<Record<string, ClientNote>>({});
  const [isAiActive, setIsAiActive] = useState(true);
  const [autonomyLevel, setAutonomyLevel] = useState(50);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Loading State
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // ISA Support Chat Hook
  const { 
    messages: isaSupportMessages, 
    isLoading: isaSupportLoading, 
    sendMessage: sendIsaSupportMessage 
  } = useIsaSupportChat();

  // Check if ISA Support is selected
  const isIsaSupport = selectedContact?.id === ISA_SUPPORT_CONTACT.id;

  // Helper: Get Client ID
  const getClientId = useCallback(() => {
    if (profile?.cpf) return profile.cpf.replace(/\D/g, '');
    if (profile?.matricula) return profile.matricula;
    return profile?.id;
  }, [profile]);

  // 1. Init ID
  useEffect(() => {
    if (!authLoading) {
      const id = getClientId();
      if (id) setActiveId(id);
    }
  }, [authLoading, profile, getClientId]);

  // 2. Load Contacts & Connect Socket
  useEffect(() => {
    if (!activeId) return;

    const loadContacts = async () => {
      setIsLoadingContacts(true);
      try {
        const data = await clientWhatsAppISA.getContacts(activeId);
        if (data) mapAndSetContacts(data);
        setConnectionStatus('connected');
      } catch (e) {
        console.error(e);
        setConnectionStatus('disconnected');
      } finally {
        setIsLoadingContacts(false);
      }
    };
    loadContacts();

    // Connect Socket
    connectToSession(activeId);
    setConnectionStatus('connecting');

    // Socket Listeners
    const handleContactUpdate = (data: any) => {
      if (data.contacts) {
        mapAndSetContacts(data.contacts);
      }
    };

    const handleContactStatus = (data: any) => {
      setContacts(prev => prev.map(c =>
        c.id === data.id ? { ...c, status: data.status } : c
      ));
      if (selectedContact?.id === data.id) {
        setSelectedContact(prev => prev ? { ...prev, status: data.status } : null);
      }
    };

    const handleMessageReceived = (data: any) => {
      if (selectedContact && !isIsaSupport && 
          (data.from === selectedContact.phone || data.from.includes(selectedContact.phone))) {
        addMessage({
          id: Date.now().toString(),
          text: data.content,
          sender: 'other',
          timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read'
        });
      }
    };

    const handleMessageSent = (data: any) => {
      if (selectedContact && !isIsaSupport &&
          (data.to === selectedContact.phone || data.to.includes(selectedContact.phone))) {
        addMessage({
          id: data.id || Date.now().toString(),
          text: data.content,
          sender: data.ai_used ? 'ai' : 'me',
          senderType: data.ai_used ? 'ai' : 'human',
          timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'sent'
        });
      }
    };

    const handleConnection = () => {
      setConnectionStatus('connected');
    };

    const handleDisconnection = () => {
      setConnectionStatus('disconnected');
    };

    socket.on('contact_list_update', handleContactUpdate);
    socket.on('contact_status_update', handleContactStatus);
    socket.on('message_received', handleMessageReceived);
    socket.on('message_sent', handleMessageSent);
    socket.on('connect', handleConnection);
    socket.on('disconnect', handleDisconnection);

    return () => {
      socket.off('contact_list_update', handleContactUpdate);
      socket.off('contact_status_update', handleContactStatus);
      socket.off('message_received', handleMessageReceived);
      socket.off('message_sent', handleMessageSent);
      socket.off('connect', handleConnection);
      socket.off('disconnect', handleDisconnection);
    };
  }, [activeId, selectedContact, isIsaSupport]);

  // 3. Load Messages when Contact Selected (not for ISA Support)
  useEffect(() => {
    if (!activeId || !selectedContact || isIsaSupport) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const data = await clientWhatsAppISA.getMessages(activeId, selectedContact.phone);
        if (data) {
          const mapped: Message[] = data.map((m: any) => ({
            id: m.id,
            text: m.content,
            sender: (m.sender === 'other' ? 'other' : (m.sender === 'ai' ? 'ai' : 'me')) as 'ai' | 'me' | 'other',
            senderType: (m.sender === 'ai' ? 'ai' : 'human') as 'ai' | 'human',
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read'
          }));
          setMessages(mapped);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingMessages(false);
      }
    };
    loadMessages();
  }, [activeId, selectedContact?.id, isIsaSupport]);

  // Helpers
  const mapAndSetContacts = (raw: any[]) => {
    const mapped: Contact[] = raw.map((c: any) => ({
      id: c.id,
      name: c.name || c.phone_number,
      phone: c.phone_number,
      avatar: c.profile_pic_url,
      lastMessage: c.last_message,
      lastMessageTime: c.last_message_time ? new Date(c.last_message_time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      unreadCount: c.unread_count,
      status: c.status || 'offline'
    }));
    setContacts(mapped);
  };

  const addMessage = (msg: Message) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  const handleSendMessage = async (text: string, mode: 'ai' | 'manual') => {
    if (!activeId || !selectedContact) return;

    // Handle ISA Support separately
    if (isIsaSupport) {
      sendIsaSupportMessage(text);
      return;
    }

    const tempId = Date.now().toString();
    const optimisticMsg: Message = {
      id: tempId,
      text,
      sender: mode === 'ai' ? 'ai' : 'me',
      senderType: mode === 'ai' ? 'ai' : 'human',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent'
    };
    addMessage(optimisticMsg);

    try {
      await clientWhatsAppISA.sendMessage(activeId, selectedContact.phone, text);
    } catch (e) {
      toast.error("Falha ao enviar");
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  // Enhanced handlers
  const handleAddReminder = (text: string) => {
    if (selectedContact && !isIsaSupport) {
      setClientNotes(prev => ({
        ...prev,
        [selectedContact.id]: {
          ...prev[selectedContact.id],
          reminder: text,
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  };

  const handleAddObservation = (text: string) => {
    if (selectedContact && !isIsaSupport) {
      setClientNotes(prev => ({
        ...prev,
        [selectedContact.id]: {
          ...prev[selectedContact.id],
          observation: text,
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  };

  const handleTogglePriority = () => {
    if (selectedContact && !isIsaSupport) {
      setPriorityIds(prev => 
        prev.includes(selectedContact.id)
          ? prev.filter(id => id !== selectedContact.id)
          : [...prev, selectedContact.id]
      );
    }
  };

  const handleTransferToHuman = () => {
    toast.info("Transferindo para atendente humano...");
    // Here you would implement the actual transfer logic
  };

  const handleExportConversation = () => {
    // Export conversation as text file
    const text = messages.map(m => 
      `[${m.timestamp}] ${m.sender === 'other' ? 'Cliente' : m.senderType === 'ai' ? 'ISA IA' : 'Manual'}: ${m.text}`
    ).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversa-${selectedContact?.name || 'chat'}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveNote = (note: ClientNote) => {
    if (selectedContact) {
      setClientNotes(prev => ({
        ...prev,
        [selectedContact.id]: note
      }));
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0D0D0D] text-white">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] text-white flex flex-col">
        {/* Connection Status Bar */}
        <div className={`h-8 flex items-center justify-center gap-2 text-xs transition-colors ${
          connectionStatus === 'connected' 
            ? 'bg-[#28A745]/20 text-[#28A745]' 
            : connectionStatus === 'connecting'
              ? 'bg-yellow-500/20 text-yellow-500'
              : 'bg-red-500/20 text-red-400'
        }`}>
          {connectionStatus === 'connected' ? (
            <><Wifi className="w-3 h-3" /> Conectado em tempo real</>
          ) : connectionStatus === 'connecting' ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Conectando...</>
          ) : (
            <><WifiOff className="w-3 h-3" /> Desconectado - O suporte ISA continua disponível</>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Col 1: Enhanced Sidebar */}
          <div className="w-[320px] flex-shrink-0 border-r border-[#27272a]">
            <EnhancedChatSidebar
              contacts={contacts}
              selectedId={selectedContact?.id || null}
              onSelect={setSelectedContact}
              isLoading={isLoadingContacts}
              favoriteIds={favoriteIds}
              priorityIds={priorityIds}
            />
          </div>

          {/* Col 2: Enhanced Chat Area */}
          <div className="flex-1 min-w-[400px] border-r border-[#27272a]">
            <EnhancedChatArea
              contact={selectedContact}
              messages={isIsaSupport ? isaSupportMessages : messages}
              isLoading={isIsaSupport ? isaSupportLoading : isLoadingMessages}
              onSendMessage={handleSendMessage}
              onAddReminder={handleAddReminder}
              onAddObservation={handleAddObservation}
              onTransferToHuman={handleTransferToHuman}
              onMarkPriority={handleTogglePriority}
              onExportConversation={handleExportConversation}
              isPriority={selectedContact ? priorityIds.includes(selectedContact.id) : false}
              isIsaSupport={isIsaSupport}
            />
          </div>

          {/* Col 3: Enhanced Control Panel */}
          <div className="w-[300px] flex-shrink-0 hidden xl:block">
            <EnhancedControlPanel
              contact={selectedContact}
              isIsaSupport={isIsaSupport}
              clientNote={selectedContact ? clientNotes[selectedContact.id] : undefined}
              onSaveNote={handleSaveNote}
              isPriority={selectedContact ? priorityIds.includes(selectedContact.id) : false}
              isFavorite={selectedContact ? favoriteIds.includes(selectedContact.id) : false}
              isAiActive={isAiActive}
              onToggleAi={setIsAiActive}
              autonomyLevel={autonomyLevel}
              onAutonomyChange={setAutonomyLevel}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientChat;
