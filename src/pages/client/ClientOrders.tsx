import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart, Package, User, Phone, Calendar, DollarSign, 
  Loader2, RefreshCw, Search, Eye, Copy, Check, ExternalLink,
  Send, Clock, MessageCircle, Truck, CheckCircle, AlertCircle, 
  ArrowRight, Trash2, Edit, X, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SaleItem {
  product_id: string;
  name: string;
  price?: number;
  unit_price?: number;
  quantity: number;
}

interface Sale {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  items: SaleItem[];
  total: number;
  subtotal: number;
  seller_amount: number;
  platform_fee: number;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  mp_payment_id: string | null;
  delivery_status: string | null;
  delivery_sent_at: string | null;
}

// Order status types for the workflow
type OrderWorkflowStatus = 'pending_payment' | 'new' | 'analyzing' | 'delivering' | 'completed' | 'cancelled';

const ORDER_STATUSES: Record<OrderWorkflowStatus, { label: string; color: string; icon: any; bgColor: string }> = {
  pending_payment: { label: 'Aguardando Pagamento', color: 'text-orange-500', icon: Clock, bgColor: 'bg-orange-500/20' },
  new: { label: 'Novo Pedido', color: 'text-yellow-500', icon: ShoppingCart, bgColor: 'bg-yellow-500/20' },
  analyzing: { label: 'Analisando', color: 'text-blue-500', icon: Search, bgColor: 'bg-blue-500/20' },
  delivering: { label: 'Entregando', color: 'text-purple-500', icon: Truck, bgColor: 'bg-purple-500/20' },
  completed: { label: 'Concluído', color: 'text-green-500', icon: CheckCircle, bgColor: 'bg-green-500/20' },
  cancelled: { label: 'Cancelado', color: 'text-red-500', icon: AlertCircle, bgColor: 'bg-red-500/20' },
};

const WORKFLOW_ORDER: OrderWorkflowStatus[] = ['new', 'analyzing', 'delivering', 'completed'];

const ClientOrders = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderWorkflowStatus | 'all'>('all');
  
  // Modal states
  const [actionLoading, setActionLoading] = useState(false);
  const [skipPhaseModal, setSkipPhaseModal] = useState<{ open: boolean; sale: Sale | null; nextStatus: OrderWorkflowStatus | null }>({ open: false, sale: null, nextStatus: null });
  const [skipPhaseMessage, setSkipPhaseMessage] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; sale: Sale | null }>({ open: false, sale: null });
  const [editModal, setEditModal] = useState<{ open: boolean; sale: Sale | null }>({ open: false, sale: null });
  const [editData, setEditData] = useState({ customerName: "", customerPhone: "" });
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; sale: Sale | null }>({ open: false, sale: null });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedSales = (data || []).map(sale => ({
        ...sale,
        items: typeof sale.items === 'string' ? JSON.parse(sale.items) : (sale.items || [])
      }));

      setSales(parsedSales);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Determine workflow status from sale data
  const getWorkflowStatus = (sale: Sale): OrderWorkflowStatus => {
    // Cancelled states
    if (sale.status === 'cancelled' || sale.payment_status === 'cancelled' || sale.payment_status === 'rejected') {
      return 'cancelled';
    }
    
    // Completed - delivery sent
    if (sale.delivery_status === 'sent' || sale.status === 'completed') {
      return 'completed';
    }
    
    // Check payment status first
    if (sale.payment_status !== 'approved') {
      return 'pending_payment';
    }
    
    // Payment approved - check workflow status
    if (sale.status === 'delivering') {
      return 'delivering';
    }
    if (sale.status === 'analyzing') {
      return 'analyzing';
    }
    
    // Default for approved payments without specific status
    return 'new';
  };

  // Get next status in workflow
  const getNextStatus = (currentStatus: OrderWorkflowStatus): OrderWorkflowStatus | null => {
    const currentIndex = WORKFLOW_ORDER.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= WORKFLOW_ORDER.length - 1) return null;
    return WORKFLOW_ORDER[currentIndex + 1];
  };

  // Send WhatsApp message helper
  const sendWhatsAppMessage = async (phone: string, message: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    const { error } = await supabase.functions.invoke('whatsapp-proxy/send', {
      body: { number: formattedPhone, message }
    });

    if (error) throw error;
  };

  // Skip to next phase with WhatsApp notification
  const handleSkipPhase = async () => {
    if (!skipPhaseModal.sale || !skipPhaseModal.nextStatus) return;
    
    setActionLoading(true);
    try {
      const sale = skipPhaseModal.sale;
      const nextStatus = skipPhaseModal.nextStatus;
      
      // Send WhatsApp message if provided
      if (skipPhaseMessage.trim()) {
        try {
          await sendWhatsAppMessage(sale.customer_phone, skipPhaseMessage);
        } catch (e) {
          console.log('WhatsApp message failed, continuing with status update');
        }
      }

      // Update sale status
      const updateData: Record<string, any> = { status: nextStatus };
      
      if (nextStatus === 'completed') {
        updateData.delivery_status = 'sent';
        updateData.delivery_sent_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', sale.id);

      if (error) throw error;

      const statusLabel = ORDER_STATUSES[nextStatus].label;
      toast.success(`Pedido movido para: ${statusLabel}`);
      setSkipPhaseModal({ open: false, sale: null, nextStatus: null });
      setSkipPhaseMessage("");
      loadSales();
    } catch (error) {
      console.error('Error skipping phase:', error);
      toast.error('Erro ao avançar fase');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delivery with product content
  const handleConfirmDelivery = async () => {
    if (!deliveryModal.sale) return;
    
    setActionLoading(true);
    try {
      const sale = deliveryModal.sale;
      const customerPhone = sale.customer_phone.replace(/\D/g, '');
      const formattedPhone = customerPhone.startsWith('55') ? customerPhone : `55${customerPhone}`;

      // Send product delivery content
      for (const item of sale.items) {
        const { data: product } = await supabase
          .from('products')
          .select('name, delivery_type, delivery_content, delivery_file_url')
          .eq('id', item.product_id)
          .single();

        if (product && product.delivery_type && product.delivery_type !== 'none') {
          let deliveryMessage = '';

          switch (product.delivery_type) {
            case 'text':
              if (product.delivery_content) {
                deliveryMessage = `📦 *Entrega do Produto: ${product.name}*\n\n${product.delivery_content}`;
              }
              break;
            case 'link':
              if (product.delivery_content) {
                deliveryMessage = `📦 *Entrega do Produto: ${product.name}*\n\n🔗 *Acesse seu produto:*\n${product.delivery_content}`;
              }
              break;
            case 'file':
              if (product.delivery_file_url) {
                deliveryMessage = `📦 *Entrega do Produto: ${product.name}*\n\n📄 *Baixe seu arquivo:*\n${product.delivery_file_url}`;
              }
              break;
          }

          if (deliveryMessage) {
            await supabase.functions.invoke('whatsapp-proxy/send', {
              body: { number: formattedPhone, message: deliveryMessage }
            });
          }
        }
      }

      const thankYouMsg = `✨ *Entrega Concluída!* ✨\n\nSeu produto foi entregue!\n\nObrigado pela preferência! 💚`;
      await supabase.functions.invoke('whatsapp-proxy/send', {
        body: { number: formattedPhone, message: thankYouMsg }
      });

      await supabase
        .from('sales')
        .update({ 
          status: 'completed',
          delivery_status: 'sent',
          delivery_sent_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      toast.success('Produto entregue com sucesso!');
      setDeliveryModal({ open: false, sale: null });
      loadSales();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Erro ao confirmar entrega');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete sale
  const handleDeleteSale = async () => {
    if (!deleteModal.sale) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', deleteModal.sale.id);

      if (error) throw error;

      toast.success('Pedido excluído!');
      setDeleteModal({ open: false, sale: null });
      setSelectedSale(null);
      loadSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Erro ao excluir pedido');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit sale
  const handleEditSale = async () => {
    if (!editModal.sale) return;
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('sales')
        .update({
          customer_name: editData.customerName,
          customer_phone: editData.customerPhone.replace(/\D/g, '')
        })
        .eq('id', editModal.sale.id);

      if (error) throw error;

      toast.success('Pedido atualizado!');
      setEditModal({ open: false, sale: null });
      loadSales();
    } catch (error) {
      console.error('Error editing sale:', error);
      toast.error('Erro ao editar pedido');
    } finally {
      setActionLoading(false);
    }
  };

  // Open skip phase modal
  const openSkipPhaseModal = (sale: Sale) => {
    const currentStatus = getWorkflowStatus(sale);
    const nextStatus = getNextStatus(currentStatus);
    
    if (!nextStatus) {
      toast.info('Este pedido já está na última fase');
      return;
    }

    const statusLabel = ORDER_STATUSES[nextStatus].label;
    setSkipPhaseMessage(`Olá${sale.customer_name ? ` ${sale.customer_name}` : ''}! 📦\n\nSeu pedido foi atualizado para: *${statusLabel}*\n\nQualquer dúvida, estamos à disposição!`);
    setSkipPhaseModal({ open: true, sale, nextStatus });
  };

  // Open edit modal
  const openEditModal = (sale: Sale) => {
    setEditData({
      customerName: sale.customer_name || '',
      customerPhone: formatPhone(sale.customer_phone)
    });
    setEditModal({ open: true, sale });
  };

  // Format helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group sales by status
  const salesByStatus = useMemo(() => {
    const grouped: Record<OrderWorkflowStatus | 'all', Sale[]> = {
      all: [],
      pending_payment: [],
      new: [],
      analyzing: [],
      delivering: [],
      completed: [],
      cancelled: []
    };

    sales.forEach(sale => {
      const status = getWorkflowStatus(sale);
      grouped[status].push(sale);
      grouped.all.push(sale);
    });

    return grouped;
  }, [sales]);

  // Filtered sales based on search and tab
  const filteredSales = useMemo(() => {
    let filtered = activeTab === 'all' ? sales : salesByStatus[activeTab] || [];
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.customer_name?.toLowerCase().includes(search) ||
        sale.customer_phone.includes(search) ||
        sale.id.includes(search)
      );
    }

    return filtered;
  }, [sales, salesByStatus, activeTab, searchTerm]);

  // Status counts
  const statusCounts = useMemo(() => ({
    all: sales.length,
    pending_payment: salesByStatus.pending_payment.length,
    new: salesByStatus.new.length,
    analyzing: salesByStatus.analyzing.length,
    delivering: salesByStatus.delivering.length,
    completed: salesByStatus.completed.length,
    cancelled: salesByStatus.cancelled.length,
  }), [sales, salesByStatus]);

  const renderOrderCard = (sale: Sale) => {
    const status = getWorkflowStatus(sale);
    const statusInfo = ORDER_STATUSES[status];
    const StatusIcon = statusInfo.icon;
    const nextStatus = getNextStatus(status);

    return (
      <Card key={sale.id} className="glass border-border/50 hover:border-primary/30 transition-all">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
              {sale.payment_status === 'approved' && (
                <Badge className="bg-green-500/20 text-green-500 border-0">
                  <Check className="w-3 h-3 mr-1" />
                  Pago
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(sale.created_at)}
            </span>
          </div>

          {/* Customer Info */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{sale.customer_name || 'Cliente'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-3 h-3" />
              <span>{formatPhone(sale.customer_phone)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => copyToClipboard(sale.customer_phone, `phone-${sale.id}`)}
              >
                {copiedId === `phone-${sale.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>

          {/* Items */}
          <div className="mb-3 p-2 rounded-lg bg-muted/30">
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatCurrency((item.unit_price || item.price || 0) * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="text-green-500">{formatCurrency(sale.total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedSale(sale)}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-1" /> Detalhes
            </Button>

            {status !== 'completed' && status !== 'cancelled' && status !== 'pending_payment' && (
              <Button
                size="sm"
                onClick={() => openSkipPhaseModal(sale)}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                {nextStatus ? `→ ${ORDER_STATUSES[nextStatus].label}` : 'Avançar'}
              </Button>
            )}

            {status === 'delivering' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeliveryModal({ open: true, sale })}
                className="border-green-500/50 text-green-500 hover:bg-green-500/10"
              >
                <Truck className="w-4 h-4 mr-1" /> Entregar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="flex items-center justify-center h-[calc(100vh-100px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin={false}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center border border-purple-500/30">
              <Package className="h-7 w-7 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Meus Pedidos
              </h1>
              <p className="text-muted-foreground">Gerencie o fluxo dos seus pedidos</p>
            </div>
          </div>
          <Button onClick={loadSales} variant="outline" className="glass">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>

        {/* Status Tabs */}
        <div className="overflow-x-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderWorkflowStatus | 'all')}>
            <TabsList className="glass border border-border/50 h-auto p-1 flex-wrap">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Todos ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="pending_payment" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                <Clock className="w-3 h-3 mr-1" /> Aguardando ({statusCounts.pending_payment})
              </TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                <ShoppingCart className="w-3 h-3 mr-1" /> Novos ({statusCounts.new})
              </TabsTrigger>
              <TabsTrigger value="analyzing" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Search className="w-3 h-3 mr-1" /> Analisando ({statusCounts.analyzing})
              </TabsTrigger>
              <TabsTrigger value="delivering" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                <Truck className="w-3 h-3 mr-1" /> Entregando ({statusCounts.delivering})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                <CheckCircle className="w-3 h-3 mr-1" /> Concluídos ({statusCounts.completed})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                <AlertCircle className="w-3 h-3 mr-1" /> Cancelados ({statusCounts.cancelled})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass border-border/50"
          />
        </div>

        {/* Orders Grid */}
        {filteredSales.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSales.map(renderOrderCard)}
          </div>
        )}

        {/* Order Details Modal */}
        <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
          <DialogContent className="glass border-border/50 max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {(() => {
                      const status = getWorkflowStatus(selectedSale);
                      const info = ORDER_STATUSES[status];
                      const Icon = info.icon;
                      return (
                        <Badge className={`${info.bgColor} ${info.color} border-0`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {info.label}
                        </Badge>
                      );
                    })()}
                    {selectedSale.payment_status === 'approved' && (
                      <Badge className="bg-green-500/20 text-green-500 border-0">Pago</Badge>
                    )}
                  </div>

                  {/* Customer */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" /> Cliente
                    </h4>
                    <p>{selectedSale.customer_name || 'Não informado'}</p>
                    <p className="text-sm text-muted-foreground">{formatPhone(selectedSale.customer_phone)}</p>
                  </div>

                  {/* Items */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Itens
                    </h4>
                    {selectedSale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm py-1">
                        <span>{item.quantity}x {item.name}</span>
                        <span>{formatCurrency((item.unit_price || item.price || 0) * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold mt-2 pt-2 border-t border-border/50">
                      <span>Total</span>
                      <span className="text-green-500">{formatCurrency(selectedSale.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Seu lucro</span>
                      <span>{formatCurrency(selectedSale.seller_amount)}</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Datas
                    </h4>
                    <div className="text-sm space-y-1">
                      <p>Criado: {formatDate(selectedSale.created_at)}</p>
                      {selectedSale.paid_at && <p>Pago: {formatDate(selectedSale.paid_at)}</p>}
                      {selectedSale.delivery_sent_at && <p>Entregue: {formatDate(selectedSale.delivery_sent_at)}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(selectedSale)}>
                      <Edit className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 border-red-500/50 hover:bg-red-500/10"
                      onClick={() => setDeleteModal({ open: true, sale: selectedSale })}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://wa.me/${selectedSale.customer_phone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Skip Phase Modal */}
        <Dialog open={skipPhaseModal.open} onOpenChange={(open) => !open && setSkipPhaseModal({ open: false, sale: null, nextStatus: null })}>
          <DialogContent className="glass border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                Avançar para: {skipPhaseModal.nextStatus && ORDER_STATUSES[skipPhaseModal.nextStatus].label}
              </DialogTitle>
              <DialogDescription>
                Envie uma mensagem ao cliente sobre a atualização do pedido
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Mensagem para o cliente (opcional)</Label>
                <Textarea
                  value={skipPhaseMessage}
                  onChange={(e) => setSkipPhaseMessage(e.target.value)}
                  rows={4}
                  className="glass border-border/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSkipPhaseModal({ open: false, sale: null, nextStatus: null })}>
                Cancelar
              </Button>
              <Button onClick={handleSkipPhase} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Avançar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delivery Modal */}
        <Dialog open={deliveryModal.open} onOpenChange={(open) => !open && setDeliveryModal({ open: false, sale: null })}>
          <DialogContent className="glass border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-500" />
                Confirmar Entrega
              </DialogTitle>
              <DialogDescription>
                O conteúdo dos produtos será enviado automaticamente ao cliente
              </DialogDescription>
            </DialogHeader>
            {deliveryModal.sale && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="font-medium">{deliveryModal.sale.customer_name || 'Cliente'}</p>
                <p className="text-sm text-muted-foreground">{formatPhone(deliveryModal.sale.customer_phone)}</p>
                <p className="text-sm mt-2">{deliveryModal.sale.items.map(i => i.name).join(', ')}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeliveryModal({ open: false, sale: null })}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmDelivery} disabled={actionLoading} className="bg-green-600 hover:bg-green-500">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Confirmar Entrega
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Modal */}
        <Dialog open={deleteModal.open} onOpenChange={(open) => !open && setDeleteModal({ open: false, sale: null })}>
          <DialogContent className="glass border-border/50">
            <DialogHeader>
              <DialogTitle className="text-red-500">Excluir Pedido</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. O pedido será removido permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteModal({ open: false, sale: null })}>
                Cancelar
              </Button>
              <Button onClick={handleDeleteSale} disabled={actionLoading} variant="destructive">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={editModal.open} onOpenChange={(open) => !open && setEditModal({ open: false, sale: null })}>
          <DialogContent className="glass border-border/50">
            <DialogHeader>
              <DialogTitle>Editar Pedido</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome do Cliente</Label>
                <Input
                  value={editData.customerName}
                  onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                  className="glass border-border/50"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editData.customerPhone}
                  onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                  className="glass border-border/50"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditModal({ open: false, sale: null })}>
                Cancelar
              </Button>
              <Button onClick={handleEditSale} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClientOrders;
