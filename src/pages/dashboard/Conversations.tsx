import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send, User, Bot, Monitor } from "lucide-react";

const mockContacts = [
  { id: 1, name: "João Silva", lastMessage: "Olá, gostaria de saber mais...", time: "10:30", unread: 2 },
  { id: 2, name: "Maria Santos", lastMessage: "Obrigada pelo atendimento!", time: "09:45", unread: 0 },
  { id: 3, name: "Pedro Lima", lastMessage: "Qual o valor do produto?", time: "Ontem", unread: 1 },
  { id: 4, name: "Ana Costa", lastMessage: "Pode me enviar o catálogo?", time: "Ontem", unread: 0 },
  { id: 5, name: "Carlos Oliveira", lastMessage: "Fechado! Vou fazer o PIX", time: "Seg", unread: 0 },
];

const mockMessages = [
  { id: 1, sender: "client", text: "Olá, bom dia!", time: "10:25" },
  { id: 2, sender: "bot", text: "Olá! Bem-vindo! Sou a ISA, assistente virtual. Como posso ajudar você hoje?", time: "10:25" },
  { id: 3, sender: "client", text: "Gostaria de saber mais sobre os serviços de vocês", time: "10:28" },
  { id: 4, sender: "bot", text: "Claro! Oferecemos automação de atendimento via WhatsApp com inteligência artificial. Quer que eu explique melhor nossos planos?", time: "10:28" },
  { id: 5, sender: "client", text: "Sim, por favor!", time: "10:30" },
];

const Conversations = () => {
  const [selectedContact, setSelectedContact] = useState(mockContacts[0]);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSend = () => {
    if (message.trim()) {
      // Simula envio
      setMessage("");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Minhas Conversas</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Monitor className="w-4 h-4" />
            <p className="text-sm">Recomendado para uso em desktop</p>
          </div>
        </div>

        {/* Chat Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-5rem)]">
          {/* Contacts List */}
          <Card variant="gradient" className="lg:col-span-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar conversa..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {mockContacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`w-full p-4 text-left border-b border-border transition-colors ${
                    selectedContact.id === contact.id ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{contact.name}</p>
                        <span className="text-xs text-muted-foreground">{contact.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{contact.lastMessage}</p>
                    </div>
                    {contact.unread > 0 && (
                      <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {contact.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Area */}
          <Card variant="gradient" className="lg:col-span-2 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedContact.name}</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.sender === "client" ? "justify-start" : "justify-end"}`}
                >
                  {msg.sender === "client" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender === "client"
                        ? "bg-secondary text-secondary-foreground rounded-tl-sm"
                        : "gradient-button text-primary-foreground rounded-tr-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.sender === "client" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                      {msg.time}
                    </p>
                  </div>
                  {msg.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full gradient-button flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <Button variant="hero" size="icon" onClick={handleSend}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Conversations;
