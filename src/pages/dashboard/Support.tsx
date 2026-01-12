import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  HeadphonesIcon, 
  Send, 
  Search, 
  Clock, 
  CheckCircle2,
  Loader2,
  Filter,
  AlertCircle,
  User,
  MessageSquare,
  Calendar,
  Tag,
  ArrowRight,
  XCircle,
  Paperclip,
  X,
  Image as ImageIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSupport, Ticket, TicketStatus } from "@/hooks/useSupport";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Support = () => {
  const { user } = useAuth();
  const {
    tickets,
    selectedTicket,
    setSelectedTicket,
    messages,
    isLoading,
    isLoadingMessages,
    pendingCount,
    sendMessage,
    uploadAttachment,
    updateTicketStatus,
  } = useSupport();

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

  const handleStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    await updateTicketStatus(selectedTicket.id, status);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Urgente</Badge>;
      case "high":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Alta</Badge>;
      case "normal":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Normal</Badge>;
      case "low":
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 text-xs">Baixa</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{priority}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">Aberto</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">Em Andamento</Badge>;
      case "resolved":
        return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">Resolvido</Badge>;
      case "closed":
        return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30 text-xs">Fechado</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved": 
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "in_progress": 
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "open":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "closed":
        return <XCircle className="w-4 h-4 text-zinc-500" />;
      default: 
        return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  const formatTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getCategoryLabel = (category: string | null) => {
    const categories: Record<string, string> = {
      connection: "Conexão",
      chat: "Chat",
      ai: "Inteligência Artificial",
      billing: "Pagamento",
      other: "Outros"
    };
    return categories[category || "other"] || category;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <HeadphonesIcon className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Central de Suporte</h1>
            {pendingCount > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</Badge>
            )}
          </div>
          <p className="text-muted-foreground ml-11">Gerencie os tickets de suporte dos clientes</p>
        </div>

        {/* Support Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100%-6rem)]">
          {/* Tickets List */}
          <Card className="lg:col-span-4 flex flex-col overflow-hidden bg-card/50 border-border/50">
            <div className="p-4 border-b border-border/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por assunto ou cliente..." 
                  className="pl-10 bg-background/50 border-border/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/50 border-border/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tickets</SelectItem>
                  <SelectItem value="open">🟡 Abertos</SelectItem>
                  <SelectItem value="in_progress">🔵 Em Andamento</SelectItem>
                  <SelectItem value="resolved">🟢 Resolvidos</SelectItem>
                  <SelectItem value="closed">⚫ Fechados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhum ticket encontrado</p>
                  <p className="text-sm opacity-70">Altere os filtros ou aguarde novas solicitações</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredTickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`w-full p-4 text-left transition-all duration-200 ${
                        selectedTicket?.id === ticket.id 
                          ? "bg-primary/10 border-l-2 border-l-primary" 
                          : "hover:bg-muted/30 border-l-2 border-l-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <span className="text-xs text-muted-foreground font-mono">#{ticket.id.slice(0, 8)}</span>
                        </div>
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      
                      <p className="font-medium text-sm mb-2 line-clamp-1">{ticket.subject}</p>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span className="truncate">{ticket.user_name || "Cliente"}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground/70">{formatTime(ticket.updated_at)}</span>
                        <ArrowRight className={`w-4 h-4 transition-opacity ${selectedTicket?.id === ticket.id ? "opacity-100 text-primary" : "opacity-0"}`} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-5 flex flex-col overflow-hidden bg-card/50 border-border/50">
            {selectedTicket ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <span className="font-medium truncate">{selectedTicket.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">#{selectedTicket.id.slice(0, 8)}</span>
                        <span>•</span>
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma mensagem ainda</p>
                        <p className="text-xs opacity-70">Envie a primeira resposta</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              msg.is_admin
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            }`}
                          >
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {msg.is_admin ? "Suporte ISA" : msg.sender_name || "Cliente"}
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
                            <p className="text-xs mt-2 opacity-50">
                              {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" ? (
                  <div className="p-4 border-t border-border/50 bg-muted/10">
                    {/* Preview de arquivo selecionado */}
                    {previewUrl && (
                      <div className="mb-3 relative inline-block">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="max-h-24 rounded-lg border border-border"
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
                        className="shrink-0"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Digite sua resposta..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        className="bg-background/50 border-border/50"
                        disabled={isSending}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={isSending || (!messageText.trim() && !selectedFile)}
                        size="icon"
                        className="shrink-0"
                      >
                        {isSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border-t border-border/50 bg-muted/20">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ticket {selectedTicket.status === "resolved" ? "resolvido" : "fechado"}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <MessageSquare className="w-10 h-10 opacity-50" />
                </div>
                <p className="text-lg font-medium">Selecione um ticket</p>
                <p className="text-sm opacity-70 text-center">Escolha um ticket na lista para ver a conversa e responder ao cliente</p>
              </div>
            )}
          </Card>

          {/* Ticket Details */}
          <Card className="lg:col-span-3 flex flex-col overflow-hidden bg-card/50 border-border/50">
            {selectedTicket ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    Detalhes do Ticket
                  </h3>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Status */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Status</label>
                      <div className="mt-1 flex items-center gap-2">
                        {getStatusIcon(selectedTicket.status)}
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Cliente */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Cliente</label>
                      <div className="mt-1">
                        <p className="font-medium text-sm">{selectedTicket.user_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Prioridade */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Prioridade</label>
                      <div className="mt-1">
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Categoria */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Categoria</label>
                      <p className="mt-1 text-sm">{getCategoryLabel(selectedTicket.category)}</p>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Data de Criação */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Criado em</label>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(selectedTicket.created_at)}
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Última Atualização */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">Última atualização</label>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {formatTime(selectedTicket.updated_at)}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Actions */}
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <div className="p-4 border-t border-border/50 space-y-2">
                    {selectedTicket.status === "open" && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange("in_progress")}
                        className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Assumir Ticket
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange("resolved")}
                      className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar como Resolvido
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6">
                <Tag className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm text-center">Selecione um ticket para ver os detalhes</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
