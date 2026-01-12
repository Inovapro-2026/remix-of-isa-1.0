import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart, Package, User, Phone, Calendar, DollarSign, 
  Loader2, RefreshCw, Search, Eye, Copy, Check, ExternalLink,
  TrendingUp, Send, Clock, BarChart3, Award, Zap, MessageCircle,
  ThumbsUp, Truck, CheckCircle, AlertCircle, Wallet, ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface ProductStats {
  product_id: string;
  name: string;
  quantity: number;
  revenue: number;
}

interface SellerBalance {
  available_balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
}

// Order status types for the workflow
type OrderWorkflowStatus = 'new' | 'analyzing' | 'delivering' | 'completed' | 'cancelled';

const ORDER_STATUSES: Record<OrderWorkflowStatus, { label: string; color: string; icon: any; bgColor: string }> = {
  new: { label: 'Novo pedido', color: 'text-yellow-500', icon: ShoppingCart, bgColor: 'bg-yellow-500/20' },
  analyzing: { label: 'Analisando', color: 'text-blue-500', icon: Search, bgColor: 'bg-blue-500/20' },
  delivering: { label: 'Entregando', color: 'text-purple-500', icon: Truck, bgColor: 'bg-purple-500/20' },
  completed: { label: 'Concluído', color: 'text-green-500', icon: CheckCircle, bgColor: 'bg-green-500/20' },
  cancelled: { label: 'Cancelado', color: 'text-red-500', icon: AlertCircle, bgColor: 'bg-red-500/20' },
};

const ClientSales = () => {
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [balance, setBalance] = useState<SellerBalance | null>(null);
  
  // Modal states
  const [thankYouModal, setThankYouModal] = useState<{ open: boolean; sale: Sale | null }>({ open: false, sale: null });
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [deliveryModal, setDeliveryModal] = useState<{ open: boolean; sale: Sale | null }>({ open: false, sale: null });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadSales();
    loadBalance();
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
      toast.error('Erro ao carregar vendas');
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('seller_balances')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setBalance(data);
      }
    } catch (error) {
      console.log('No balance found');
    }
  };

  // Determine workflow status from sale data
  const getWorkflowStatus = (sale: Sale): OrderWorkflowStatus => {
    if (sale.status === 'cancelled' || sale.payment_status === 'cancelled' || sale.payment_status === 'rejected') {
      return 'cancelled';
    }
    if (sale.delivery_status === 'sent') {
      return 'completed';
    }
    if (sale.payment_status === 'approved') {
      // Check if we've sent a thank you message (we'll track this via status field)
      if (sale.status === 'processing' || sale.status === 'analyzing') {
        return 'analyzing';
      }
      if (sale.status === 'delivering') {
        return 'delivering';
      }
      return 'new';
    }
    if (sale.payment_status === 'pending' || sale.payment_status === 'awaiting_payment') {
      return 'new';
    }
    return 'new';
  };

  // Send thank you message
  const handleThankCustomer = async () => {
    if (!thankYouModal.sale || !thankYouMessage.trim()) return;
    
    setActionLoading(true);
    try {
      const sale = thankYouModal.sale;
      const customerPhone = sale.customer_phone.replace(/\D/g, '');
      
      // Send message via WhatsApp
      const { error } = await supabase.functions.invoke('whatsapp-proxy/send', {
        body: {
          phone: customerPhone.startsWith('55') ? customerPhone : `55${customerPhone}`,
          message: thankYouMessage,
        }
      });

      if (error) throw error;

      // Update sale status
      await supabase
        .from('sales')
        .update({ status: 'analyzing' })
        .eq('id', sale.id);

      toast.success('Mensagem enviada! Cliente agradecido.');
      setThankYouModal({ open: false, sale: null });
      setThankYouMessage("");
      loadSales();
    } catch (error) {
      console.error('Error sending thank you:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm delivery
  const handleConfirmDelivery = async () => {
    if (!deliveryModal.sale) return;
    
    setActionLoading(true);
    try {
      const sale = deliveryModal.sale;
      const customerPhone = sale.customer_phone.replace(/\D/g, '');
      const formattedPhone = customerPhone.startsWith('55') ? customerPhone : `55${customerPhone}`;

      // Get product delivery info for each item
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
                deliveryMessage = `📦 *Entrega do Produto: ${product.name}*\n\n🔗 *Acesse seu produto:*\n${product.delivery_content}\n\n💡 Guarde este link!`;
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
              body: { phone: formattedPhone, message: deliveryMessage }
            });
          }
        }
      }

      // Send thank you message
      const thankYouMsg = `✨ *Entrega Concluída!* ✨\n\nSeu produto foi entregue! Guarde as mensagens acima.\n\nObrigado pela preferência! 💚`;
      await supabase.functions.invoke('whatsapp-proxy/send', {
        body: { phone: formattedPhone, message: thankYouMsg }
      });

      // Update sale status
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
      loadBalance();
    } catch (error) {
      console.error('Error confirming delivery:', error);
      toast.error('Erro ao confirmar entrega');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const approvedSales = sales.filter(s => s.payment_status === 'approved');
    const pendingSales = sales.filter(s => s.payment_status === 'pending' || s.payment_status === 'awaiting_payment');
    const newOrders = approvedSales.filter(s => getWorkflowStatus(s) === 'new');
    const completedOrders = sales.filter(s => getWorkflowStatus(s) === 'completed');
    
    const totalRevenue = approvedSales.reduce((sum, s) => sum + s.seller_amount, 0);
    
    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todaySales = approvedSales.filter(s => s.paid_at?.startsWith(today));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.seller_amount, 0);

    // This month
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthSales = approvedSales.filter(s => s.paid_at?.startsWith(thisMonth));
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.seller_amount, 0);

    // Top products
    const productMap = new Map<string, ProductStats>();
    approvedSales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productMap.get(item.product_id);
        const price = item.price || item.unit_price || 0;
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += price * item.quantity;
        } else {
          productMap.set(item.product_id, {
            product_id: item.product_id,
            name: item.name,
            quantity: item.quantity,
            revenue: price * item.quantity
          });
        }
      });
    });
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSales: approvedSales.length,
      pendingSales: pendingSales.length,
      newOrders: newOrders.length,
      completedOrders: completedOrders.length,
      totalRevenue,
      todaySales: todaySales.length,
      todayRevenue,
      monthSales: monthSales.length,
      monthRevenue,
      topProducts
    };
  }, [sales]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
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

  const openWhatsApp = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleaned}`, '_blank');
  };

  const filteredSales = sales.filter(sale => {
    const search = searchTerm.toLowerCase();
    return (
      sale.customer_name?.toLowerCase().includes(search) ||
      sale.customer_phone.includes(search) ||
      sale.id.toLowerCase().includes(search) ||
      sale.items.some(item => item.name.toLowerCase().includes(search))
    );
  });

  // Group sales by workflow status
  const ordersByStatus = useMemo(() => {
    const grouped: Record<OrderWorkflowStatus, Sale[]> = {
      new: [],
      analyzing: [],
      delivering: [],
      completed: [],
      cancelled: []
    };
    
    sales.forEach(sale => {
      const status = getWorkflowStatus(sale);
      grouped[status].push(sale);
    });
    
    return grouped;
  }, [sales]);

  const renderOrderCard = (sale: Sale) => {
    const status = getWorkflowStatus(sale);
    const statusInfo = ORDER_STATUSES[status];
    const StatusIcon = statusInfo.icon;

    return (
      <Card 
        key={sale.id} 
        className="bg-[#1A1A1A] border-gray-800 hover:border-gray-700 transition-all cursor-pointer"
        onClick={() => setSelectedSale(sale)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
              </div>
              <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none`}>
                {statusInfo.label}
              </Badge>
            </div>
            <span className="text-gray-500 text-xs">{formatDate(sale.created_at)}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-white font-medium">{sale.customer_name || 'Cliente'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-500" />
              <span className="text-gray-400 text-sm">{formatPhone(sale.customer_phone)}</span>
              <button
                onClick={(e) => { e.stopPropagation(); openWhatsApp(sale.customer_phone); }}
                className="text-green-500 hover:text-green-400"
              >
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-500" />
              <span className="text-gray-400 text-sm">
                {sale.items.length} item(s)
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-green-400 font-bold text-lg">{formatCurrency(sale.total)}</span>
            
            {/* Action Buttons */}
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              {status === 'new' && sale.payment_status === 'approved' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setThankYouMessage(`Olá${sale.customer_name ? ` ${sale.customer_name}` : ''}! 🙌\n\nObrigado pela sua compra! Já estamos preparando seu produto.\n\nEm breve você receberá a entrega. Aguarde!`);
                    setThankYouModal({ open: true, sale });
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Agradecer
                </Button>
              )}
              
              {(status === 'analyzing' || status === 'new') && sale.payment_status === 'approved' && (
                <Button
                  size="sm"
                  onClick={() => setDeliveryModal({ open: true, sale })}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Entregar
                </Button>
              )}
              
              {status === 'completed' && (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Finalizado
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout isAdmin={false}>
        <div className="h-[calc(100vh-64px)] flex items-center justify-center bg-[#0D0D0D]">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-8 w-8 text-green-500" />
                Vendas & Estatísticas
              </h1>
              <p className="text-gray-400 mt-1">Gerencie seus pedidos e acompanhe seu faturamento</p>
            </div>
            <Button
              variant="outline"
              onClick={() => { loadSales(); loadBalance(); }}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Financial Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-br from-green-600/20 to-green-900/20 border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 text-sm font-medium">Faturamento Total</p>
                    <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-400 text-sm font-medium">Saldo Disponível</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {formatCurrency(balance?.available_balance || 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 text-sm font-medium">Total de Pedidos</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalSales}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-400 text-sm font-medium">Concluídos</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.completedOrders}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-400 text-sm font-medium">Vendas Hoje</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.todaySales}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(stats.todayRevenue)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Orders Alert */}
          {stats.newOrders > 0 && (
            <Card className="bg-yellow-500/10 border-yellow-500/30 animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-yellow-400 font-semibold text-lg">
                      🎉 {stats.newOrders} novo(s) pedido(s) aguardando!
                    </p>
                    <p className="text-gray-400 text-sm">
                      Clique em "Agradecer" para iniciar o atendimento
                    </p>
                  </div>
                  <Button
                    onClick={() => setActiveTab("orders")}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    Ver pedidos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-[#1A1A1A] border-gray-800">
              <TabsTrigger value="orders" className="data-[state=active]:bg-green-600">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Pedidos ({sales.length})
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-green-600">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-green-600">
                <Clock className="h-4 w-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab - Kanban Style */}
            <TabsContent value="orders" className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1A1A1A] border-gray-700 text-white"
                />
              </div>

              {/* Orders Grid by Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* New Orders */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <ShoppingCart className="h-4 w-4 text-yellow-500" />
                    </div>
                    <h3 className="text-white font-semibold">Novos ({ordersByStatus.new.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {ordersByStatus.new.filter(s => 
                      !searchTerm || 
                      s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.customer_phone.includes(searchTerm)
                    ).map(renderOrderCard)}
                    {ordersByStatus.new.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-8">Nenhum pedido novo</p>
                    )}
                  </div>
                </div>

                {/* Analyzing */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Search className="h-4 w-4 text-blue-500" />
                    </div>
                    <h3 className="text-white font-semibold">Analisando ({ordersByStatus.analyzing.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {ordersByStatus.analyzing.filter(s => 
                      !searchTerm || 
                      s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.customer_phone.includes(searchTerm)
                    ).map(renderOrderCard)}
                    {ordersByStatus.analyzing.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-8">Nenhum em análise</p>
                    )}
                  </div>
                </div>

                {/* Delivering */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Truck className="h-4 w-4 text-purple-500" />
                    </div>
                    <h3 className="text-white font-semibold">Entregando ({ordersByStatus.delivering.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {ordersByStatus.delivering.filter(s => 
                      !searchTerm || 
                      s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.customer_phone.includes(searchTerm)
                    ).map(renderOrderCard)}
                    {ordersByStatus.delivering.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-8">Nenhum em entrega</p>
                    )}
                  </div>
                </div>

                {/* Completed */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <h3 className="text-white font-semibold">Concluídos ({ordersByStatus.completed.length})</h3>
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {ordersByStatus.completed.filter(s => 
                      !searchTerm || 
                      s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      s.customer_phone.includes(searchTerm)
                    ).slice(0, 10).map(renderOrderCard)}
                    {ordersByStatus.completed.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-8">Nenhum concluído</p>
                    )}
                    {ordersByStatus.completed.length > 10 && (
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTab("history")}
                        className="w-full text-gray-400"
                      >
                        Ver todos ({ordersByStatus.completed.length})
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <Card className="bg-[#1A1A1A] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      Produtos Mais Vendidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.topProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma venda ainda</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {stats.topProducts.map((product, index) => (
                          <div key={product.product_id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                index === 2 ? 'bg-orange-600/20 text-orange-600' :
                                'bg-gray-700 text-gray-500'
                              }`}>
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-white font-medium">{product.name}</p>
                                <p className="text-gray-500 text-sm">{product.quantity} vendas</p>
                              </div>
                            </div>
                            <p className="text-green-400 font-semibold">{formatCurrency(product.revenue)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Monthly Stats */}
                <Card className="bg-[#1A1A1A] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Este Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Vendas realizadas</span>
                        <span className="text-white font-bold text-xl">{stats.monthSales}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Faturamento</span>
                        <span className="text-green-400 font-bold text-xl">{formatCurrency(stats.monthRevenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Ticket médio</span>
                        <span className="text-blue-400 font-bold text-xl">
                          {formatCurrency(stats.monthSales > 0 ? stats.monthRevenue / stats.monthSales : 0)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card className="bg-[#1A1A1A] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Histórico Completo</CardTitle>
                  <CardDescription className="text-gray-400">
                    {filteredSales.length} pedido(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">ID</TableHead>
                          <TableHead className="text-gray-400">Data</TableHead>
                          <TableHead className="text-gray-400">Cliente</TableHead>
                          <TableHead className="text-gray-400">Total</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => {
                          const status = getWorkflowStatus(sale);
                          const statusInfo = ORDER_STATUSES[status];
                          return (
                            <TableRow key={sale.id} className="border-gray-800 hover:bg-gray-800/50">
                              <TableCell className="text-white font-mono text-xs">
                                <div className="flex items-center gap-2">
                                  <span>{sale.id.slice(0, 8)}...</span>
                                  <button onClick={() => copyToClipboard(sale.id, sale.id)}>
                                    {copiedId === sale.id ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3 text-gray-400" />
                                    )}
                                  </button>
                                </div>
                              </TableCell>
                              <TableCell className="text-white text-sm">{formatDate(sale.created_at)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-white font-medium">{sale.customer_name || 'N/A'}</span>
                                  <span className="text-gray-400 text-xs">{formatPhone(sale.customer_phone)}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-green-400 font-semibold">{formatCurrency(sale.total)}</TableCell>
                              <TableCell>
                                <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none`}>
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedSale(sale)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Thank You Modal */}
      <Dialog open={thankYouModal.open} onOpenChange={(open) => !actionLoading && setThankYouModal({ open, sale: open ? thankYouModal.sale : null })}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-yellow-500" />
              Agradecer Cliente
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Envie uma mensagem de agradecimento via WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Enviando para:</p>
              <p className="text-white font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-500" />
                {thankYouModal.sale && formatPhone(thankYouModal.sale.customer_phone)}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Mensagem</Label>
              <Textarea
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                placeholder="Digite sua mensagem de agradecimento..."
                className="bg-gray-800 border-gray-700 text-white min-h-[120px]"
              />
              <p className="text-xs text-gray-500">Use emojis para deixar a mensagem mais amigável!</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setThankYouModal({ open: false, sale: null })}
              disabled={actionLoading}
              className="border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleThankCustomer}
              disabled={actionLoading || !thankYouMessage.trim()}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Enviar Agradecimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Confirmation Modal */}
      <Dialog open={deliveryModal.open} onOpenChange={(open) => !actionLoading && setDeliveryModal({ open, sale: open ? deliveryModal.sale : null })}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-500" />
              Confirmar Entrega
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Os produtos digitais serão enviados automaticamente via WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          {deliveryModal.sale && (
            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                <p className="text-sm text-gray-400">Itens a entregar:</p>
                {deliveryModal.sale.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="text-white">{item.quantity}x {item.name}</span>
                  </div>
                ))}
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-purple-400 text-sm">
                  ⚡ A ISA vai enviar automaticamente o conteúdo digital (links, arquivos ou textos) 
                  configurado em cada produto.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeliveryModal({ open: false, sale: null })}
              disabled={actionLoading}
              className="border-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar e Entregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5 text-green-500" />
              Detalhes do Pedido
            </DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* Status */}
                <div className="flex items-center gap-3">
                  {(() => {
                    const status = getWorkflowStatus(selectedSale);
                    const statusInfo = ORDER_STATUSES[status];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-none text-sm px-4 py-2`}>
                        <StatusIcon className="h-4 w-4 mr-2" />
                        {statusInfo.label}
                      </Badge>
                    );
                  })()}
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm">ID do Pedido</p>
                    <p className="text-white font-mono text-sm flex items-center gap-2">
                      {selectedSale.id.slice(0, 16)}...
                      <button onClick={() => copyToClipboard(selectedSale.id, 'dialog-id')}>
                        <Copy className="h-3 w-3 text-gray-400" />
                      </button>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-400 text-sm">Data do Pedido</p>
                    <p className="text-white">{formatDate(selectedSale.created_at)}</p>
                  </div>
                  {selectedSale.paid_at && (
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Pago em</p>
                      <p className="text-green-400">{formatDate(selectedSale.paid_at)}</p>
                    </div>
                  )}
                  {selectedSale.delivery_sent_at && (
                    <div className="space-y-1">
                      <p className="text-gray-400 text-sm">Entregue em</p>
                      <p className="text-purple-400">{formatDate(selectedSale.delivery_sent_at)}</p>
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Nome</p>
                      <p className="text-white">{selectedSale.customer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">WhatsApp</p>
                      <p className="text-white flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        {formatPhone(selectedSale.customer_phone)}
                        <button
                          onClick={() => openWhatsApp(selectedSale.customer_phone)}
                          className="text-green-500 hover:text-green-400"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    Itens do Pedido
                  </h4>
                  <div className="bg-gray-800/50 rounded-lg divide-y divide-gray-700">
                    {selectedSale.items.map((item, index) => {
                      const price = item.price || item.unit_price || 0;
                      return (
                        <div key={index} className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-white font-medium">{item.name}</p>
                            <p className="text-gray-400 text-sm">{item.quantity}x {formatCurrency(price)}</p>
                          </div>
                          <p className="text-green-400 font-semibold">{formatCurrency(price * item.quantity)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-green-600/10 rounded-lg p-4 space-y-2 border border-green-600/30">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Taxa da plataforma</span>
                    <span className="text-red-400">-{formatCurrency(selectedSale.platform_fee)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-green-600/30">
                    <span>Você recebe</span>
                    <span className="text-green-400">{formatCurrency(selectedSale.seller_amount)}</span>
                  </div>
                </div>

                {/* Actions */}
                {getWorkflowStatus(selectedSale) !== 'completed' && selectedSale.payment_status === 'approved' && (
                  <div className="flex gap-3">
                    {getWorkflowStatus(selectedSale) === 'new' && (
                      <Button
                        onClick={() => {
                          setSelectedSale(null);
                          setThankYouMessage(`Olá${selectedSale.customer_name ? ` ${selectedSale.customer_name}` : ''}! 🙌\n\nObrigado pela sua compra! Já estamos preparando seu produto.`);
                          setThankYouModal({ open: true, sale: selectedSale });
                        }}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                      >
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Agradecer
                      </Button>
                    )}
                    <Button
                      onClick={() => {
                        setSelectedSale(null);
                        setDeliveryModal({ open: true, sale: selectedSale });
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Entregar Produto
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientSales;