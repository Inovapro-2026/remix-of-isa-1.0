import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  HeadphonesIcon, 
  Send, 
  Plus, 
  MessageSquare, 
  ArrowLeft,
  Clock,
  CheckCircle2,
  Loader2,
  Paperclip,
  X,
  Image as ImageIcon
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupport, Ticket, TicketMessage } from "@/hooks/useSupport";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIES = [
  { value: "connection", label: "Problemas com conexão" },
  { value: "ai_config", label: "Configuração da IA" },
  { value: "chat", label: "Erro no chat" },
  { value: "billing", label: "Cobrança / Plano" },
  { value: "other", label: "Outros" },
];

const ClientSupport = () => {
  const { user } = useAuth();
  const {
    tickets,
    selectedTicket,
    setSelectedTicket,
    messages,
    isLoading,
    isLoadingMessages,
    createTicket,
    sendMessage,
    uploadAttachment,
  } = useSupport();

  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCreateTicket = async () => {
    if (!subject.trim() || !category || !description.trim()) return;
    
    setIsCreating(true);
    const ticket = await createTicket({
      subject: subject.trim(),
      category,
      description: description.trim(),
    });
    setIsCreating(false);

    if (ticket) {
      setNewTicketOpen(false);
      setSubject("");
      setCategory("");
      setDescription("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar se é uma imagem
      if (!file.type.startsWith('image/')) {
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || (!messageText.trim() && !selectedFile)) return;
    
    setIsSending(true);
    
    let attachmentUrl: string | null = null;
    if (selectedFile) {
      attachmentUrl = await uploadAttachment(selectedFile);
    }
    
    await sendMessage(selectedTicket.id, messageText, attachmentUrl);
    setIsSending(false);
    setMessageText("");
    clearSelectedFile();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500">Aberto</Badge>;
      case "in_progress":
        return <Badge variant="outline" className="border-blue-500/50 text-blue-500">Em Andamento</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">Resolvido</Badge>;
      case "closed":
        return <Badge variant="secondary">Fechado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  // Chat view when a ticket is selected
  if (selectedTicket) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="h-[calc(100vh-64px)] flex flex-col bg-[#0D0D0D]">
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setSelectedTicket(null)}
              className="hover:bg-zinc-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-500">#{selectedTicket.id.slice(0, 8)}</span>
                {getStatusBadge(selectedTicket.status)}
              </div>
              <p className="font-medium text-white">{selectedTicket.subject}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Nenhuma mensagem ainda
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender_id === user?.id
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-zinc-800 text-white rounded-bl-sm"
                    }`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-70">
                      {msg.sender_id === user?.id ? "Você" : msg.is_admin ? "Suporte ISA" : msg.sender_name}
                    </p>
                    {msg.attachment_url && (
                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                        <img 
                          src={msg.attachment_url} 
                          alt="Anexo" 
                          className="max-w-full max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </a>
                    )}
                    {msg.content && msg.content !== '📎 Anexo' && (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                    <p className="text-xs mt-1 opacity-50">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
            <div className="p-4 border-t border-zinc-800">
              {/* Preview de arquivo selecionado */}
              {previewUrl && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-24 rounded-lg border border-zinc-700"
                  />
                  <button
                    onClick={clearSelectedFile}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              )}
              
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="shrink-0 border-zinc-700 hover:bg-zinc-800"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                  className="bg-zinc-800 border-zinc-700"
                  disabled={isSending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={isSending || (!messageText.trim() && !selectedFile)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {(selectedTicket.status === "resolved" || selectedTicket.status === "closed") && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
              <p className="text-center text-zinc-500 text-sm">
                Este ticket foi {selectedTicket.status === "resolved" ? "resolvido" : "fechado"}
              </p>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Ticket list view
  return (
    <DashboardLayout isAdmin={false}>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Meu Suporte</h1>
            <p className="text-muted-foreground">Seus tickets de atendimento</p>
          </div>
          <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle>Abrir Novo Ticket</DialogTitle>
                <DialogDescription>
                  Descreva seu problema ou dúvida para nossa equipe
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assunto</label>
                  <Input
                    placeholder="Resumo do problema"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    placeholder="Descreva detalhadamente seu problema..."
                    className="min-h-32 bg-zinc-800 border-zinc-700"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setNewTicketOpen(false)}
                  className="border-zinc-700"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateTicket}
                  disabled={isCreating || !subject.trim() || !category || !description.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Ticket"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : tickets.length > 0 ? (
            tickets.map((ticket) => (
              <Card 
                key={ticket.id} 
                className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-500">#{ticket.id.slice(0, 8)}</span>
                          {getStatusBadge(ticket.status)}
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                            {CATEGORIES.find(c => c.value === ticket.category)?.label || ticket.category || "Geral"}
                          </Badge>
                        </div>
                        <p className="font-medium mt-1">{ticket.subject}</p>
                        <p className="text-sm text-zinc-500">Atualizado {formatTime(ticket.updated_at)}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-zinc-700 hover:bg-zinc-800">
                      Ver Conversa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-12 text-center">
                <HeadphonesIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">Você não tem tickets abertos</p>
                <p className="text-sm text-zinc-500 mt-1">Clique em "Novo Ticket" para abrir um chamado</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientSupport;
