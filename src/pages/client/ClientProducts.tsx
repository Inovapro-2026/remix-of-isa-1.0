import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useProducts, ProductInput, uploadDeliveryFile } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ShoppingBag, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Package,
  DollarSign,
  FileText,
  Image,
  Upload,
  Loader2,
  Copy,
  FolderOpen,
  Send,
  Link,
  File,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Default categories for digital products
const DEFAULT_CATEGORIES = [
  { value: 'alimentacao', label: '🍔 Alimentação' },
  { value: 'cursos', label: '📚 Cursos' },
  { value: 'ebooks', label: '📖 E-books' },
  { value: 'servicos', label: '💼 Serviços digitais' },
  { value: 'assinaturas', label: '🔄 Assinaturas' },
  { value: 'outros', label: '📦 Outros' },
];

// Delivery type options
const DELIVERY_TYPES = [
  { value: 'none', label: 'Sem entrega digital', icon: Package, description: 'Produto físico ou serviço presencial' },
  { value: 'text', label: 'Mensagem automática', icon: MessageSquare, description: 'Enviar texto/instruções via WhatsApp' },
  { value: 'link', label: 'Link de acesso', icon: Link, description: 'URL para curso, drive, site, etc' },
  { value: 'file', label: 'Arquivo digital', icon: File, description: 'PDF, ZIP, imagem ou vídeo leve' },
];

const ClientProducts = () => {
  const { user } = useAuth();
  const { products, isLoading, isSaving, loadProducts, addProduct, updateProduct, deleteProduct, formatPrice } = useProducts();
  const { categories } = useCategories();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [formData, setFormData] = useState<ProductInput>({
    name: '',
    price: '',
    description: '',
    image_url: '',
    category: '',
    delivery_type: 'none',
    delivery_content: '',
    delivery_file_url: ''
  });

  const openAddDialog = () => {
    setEditingProductId(null);
    setFormData({ 
      name: '', 
      price: '', 
      description: '', 
      image_url: '', 
      category: '',
      delivery_type: 'none',
      delivery_content: '',
      delivery_file_url: ''
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (product: typeof products[0]) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      price: formatPrice(product.price).replace('R$', '').trim(),
      description: product.description || '',
      image_url: product.image_url || '',
      category: product.category || '',
      delivery_type: product.delivery_type || 'none',
      delivery_content: product.delivery_content || '',
      delivery_file_url: product.delivery_file_url || ''
    });
    setIsDialogOpen(true);
  };

  const handlePriceChange = (value: string) => {
    // Remove non-numeric characters except comma and dot
    let cleanValue = value.replace(/[^\d,]/g, '');
    
    // Format as currency
    if (cleanValue) {
      // Remove existing formatting
      cleanValue = cleanValue.replace(/\./g, '');
      
      // Add decimal separator if needed
      if (cleanValue.length > 2) {
        const intPart = cleanValue.slice(0, -2);
        const decPart = cleanValue.slice(-2);
        cleanValue = intPart + ',' + decPart;
      }
    }
    
    setFormData({ ...formData, price: cleanValue });
  };

  const handleDeliveryFileUpload = async (file: File) => {
    if (!user?.id) return;
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 50MB.");
      return;
    }
    
    setIsUploadingFile(true);
    try {
      const url = await uploadDeliveryFile(user.id, file);
      if (url) {
        setFormData({ ...formData, delivery_file_url: url });
        toast.success("Arquivo enviado com sucesso!");
      } else {
        toast.error("Erro ao enviar arquivo");
      }
    } catch (e) {
      console.error('Error uploading file:', e);
      toast.error("Erro ao enviar arquivo");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmitProduct = async () => {
    if (!formData.name) {
      toast.error("Preencha o nome do produto");
      return;
    }
    
    if (!formData.price) {
      toast.error("Preencha o preço do produto");
      return;
    }

    // Validate delivery content for digital products
    if (formData.delivery_type === 'text' && !formData.delivery_content) {
      toast.error("Preencha a mensagem que será enviada após a compra");
      return;
    }
    
    if (formData.delivery_type === 'link' && !formData.delivery_content) {
      toast.error("Preencha o link de acesso do produto");
      return;
    }
    
    if (formData.delivery_type === 'file' && !formData.delivery_file_url) {
      toast.error("Envie o arquivo que será entregue após a compra");
      return;
    }

    if (editingProductId) {
      await updateProduct(editingProductId, formData);
    } else {
      await addProduct(formData);
    }
    
    setIsDialogOpen(false);
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
  };

  const getDeliveryTypeLabel = (type: string | null) => {
    const found = DELIVERY_TYPES.find(d => d.value === type);
    return found?.label || 'Sem entrega';
  };

  const getDeliveryTypeIcon = (type: string | null) => {
    const found = DELIVERY_TYPES.find(d => d.value === type);
    return found?.icon || Package;
  };

  if (isLoading) {
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
      <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#0D0D0D] text-white flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Produtos e Serviços</h1>
              <p className="text-zinc-400">Cadastre produtos digitais com entrega automática via WhatsApp</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadProducts} 
              disabled={isLoading}
              className="border-zinc-700 hover:bg-zinc-800 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button 
              onClick={openAddDialog}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Novo Produto
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">Nenhum produto cadastrado</h3>
              <p className="text-zinc-500 mb-6 max-w-md">
                Cadastre seu primeiro produto em menos de 2 minutos. 
                A ISA vai vender e entregar automaticamente no WhatsApp! 🚀
              </p>
              <Button onClick={openAddDialog} className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" /> Cadastrar Primeiro Produto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => {
                const DeliveryIcon = getDeliveryTypeIcon(product.delivery_type);
                return (
                  <div 
                    key={product.id}
                    className="bg-[#1E1E1E] rounded-xl border border-[#27272a] p-4 hover:border-green-600/50 transition-colors"
                  >
                    {product.image_url && (
                      <div className="w-full h-40 rounded-lg bg-[#27272a] mb-4 overflow-hidden">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white text-lg">{product.name}</h3>
                      <span className="text-green-500 font-bold">{formatPrice(product.price)}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {product.category && (
                        <span className="inline-block text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      )}
                      {product.delivery_type && product.delivery_type !== 'none' && (
                        <span className="inline-flex items-center gap-1 text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
                          <DeliveryIcon className="h-3 w-3" />
                          {getDeliveryTypeLabel(product.delivery_type)}
                        </span>
                      )}
                    </div>
                    
                    {product.description && (
                      <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{product.description}</p>
                    )}

                    {/* Código do produto */}
                    {product.code && (
                      <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-3 py-2 mb-3">
                        <span className="text-xs text-zinc-400">Código:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-green-400 text-sm">{product.code}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(product.code!);
                              toast.success("Código copiado!");
                            }}
                            className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            title="Copiar código"
                          >
                            <Copy className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Status ativo */}
                    <div className="flex items-center gap-2 mb-3 text-xs text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Ativo na vitrine</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEditDialog(product)}
                        className="flex-1 border-zinc-700 hover:bg-zinc-800"
                      >
                        <Edit3 className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="border-red-600/50 text-red-500 hover:bg-red-600/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#27272a] text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              {editingProductId ? "Editar Produto" : "Cadastrar Novo Produto"}
            </DialogTitle>
            <p className="text-sm text-zinc-400 mt-1">
              Preencha os campos abaixo. A ISA vai vender e entregar automaticamente!
            </p>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Nome do Produto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" /> Nome do Produto *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-zinc-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 border-zinc-700">
                      <p>Use um nome simples e direto</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#27272a] border-none text-white"
                placeholder="Ex: Fígado acebolado"
              />
            </div>
            
            {/* Preço */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" /> Preço *
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-zinc-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 border-zinc-700">
                      <p>Valor que o cliente vai pagar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">R$</span>
                <Input
                  value={formData.price}
                  onChange={e => handlePriceChange(e.target.value)}
                  className="bg-[#27272a] border-none text-white pl-10"
                  placeholder="16,00"
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-green-500" /> Categoria
              </Label>
              <Select 
                value={formData.category || "none"} 
                onValueChange={(value) => setFormData({ ...formData, category: value === "none" ? "" : value })}
              >
                <SelectTrigger className="bg-[#27272a] border-none text-white">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#27272a] border-[#404040]">
                  <SelectItem value="none" className="text-zinc-400">Sem categoria</SelectItem>
                  {/* User's custom categories first */}
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name} className="text-white">
                      <div className="flex items-center gap-2">
                        {cat.image_url && (
                          <img src={cat.image_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                  {/* Default categories */}
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.label} className="text-white">
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Descrição */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-500" /> Descrição
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-zinc-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 border-zinc-700">
                      <p>Explique exatamente o que o cliente vai receber</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#27272a] border-none text-white min-h-[80px]"
                placeholder="Ex: Fígado acebolado, arroz, feijão, farofa e fritas 🍽️"
              />
              <p className="text-xs text-zinc-500">Suporte a emojis 😊</p>
            </div>
            
            {/* Imagem do Produto */}
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <Image className="h-4 w-4 text-green-500" /> Imagem do Produto (opcional)
              </Label>
              <p className="text-xs text-zinc-500">A imagem ajuda a vender mais, mas não é obrigatória.</p>
              
              {formData.image_url ? (
                <div className="relative w-full h-32 rounded-lg bg-[#27272a] overflow-hidden">
                  <img 
                    src={formData.image_url} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* File upload */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Imagem muito grande. Máximo 5MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, image_url: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="product-image-upload"
                    />
                    <label
                      htmlFor="product-image-upload"
                      className="flex flex-col items-center justify-center w-full h-24 rounded-lg bg-[#27272a] border-2 border-dashed border-zinc-600 hover:border-green-500 cursor-pointer transition-colors"
                    >
                      <Upload className="h-6 w-6 text-zinc-500 mb-1" />
                      <span className="text-sm text-zinc-400">Fazer upload</span>
                    </label>
                  </div>
                  
                  {/* Or paste URL */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-zinc-700" />
                    <span className="text-xs text-zinc-500">ou cole o link</span>
                    <div className="flex-1 h-px bg-zinc-700" />
                  </div>
                  
                  <Input
                    placeholder="https://exemplo.com/imagem.jpg"
                    onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                    className="bg-[#27272a] border-none text-white"
                  />
                </div>
              )}
            </div>

            {/* Entrega Digital - NOVO */}
            <div className="space-y-3 p-4 rounded-xl bg-purple-600/10 border border-purple-600/30">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-purple-400" />
                <Label className="text-white font-semibold">Entrega Digital Automática</Label>
              </div>
              <p className="text-xs text-zinc-400">
                Esse conteúdo será enviado automaticamente pela ISA no WhatsApp após o pagamento.
              </p>
              
              {/* Tipo de entrega */}
              <Select 
                value={formData.delivery_type || "none"} 
                onValueChange={(value) => setFormData({ 
                  ...formData, 
                  delivery_type: value as 'none' | 'text' | 'link' | 'file',
                  delivery_content: '',
                  delivery_file_url: ''
                })}
              >
                <SelectTrigger className="bg-[#27272a] border-none text-white">
                  <SelectValue placeholder="Tipo de entrega" />
                </SelectTrigger>
                <SelectContent className="bg-[#27272a] border-[#404040]">
                  {DELIVERY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4 text-purple-400" />
                        <div>
                          <span>{type.label}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Campo dinâmico baseado no tipo */}
              {formData.delivery_type === 'text' && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Mensagem automática *</Label>
                  <Textarea
                    value={formData.delivery_content}
                    onChange={e => setFormData({ ...formData, delivery_content: e.target.value })}
                    className="bg-[#27272a] border-none text-white min-h-[100px]"
                    placeholder="Ex: Obrigado pela compra! 🎉 Aqui estão as instruções de preparo do seu prato..."
                  />
                  <p className="text-xs text-zinc-500">
                    Esta mensagem será enviada automaticamente quando o pagamento for confirmado.
                  </p>
                </div>
              )}
              
              {formData.delivery_type === 'link' && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Link de acesso *</Label>
                  <Input
                    value={formData.delivery_content}
                    onChange={e => setFormData({ ...formData, delivery_content: e.target.value })}
                    className="bg-[#27272a] border-none text-white"
                    placeholder="https://drive.google.com/file/..."
                  />
                  <p className="text-xs text-zinc-500">
                    Cole o link do Drive, PDF, vídeo, site ou checkout externo.
                  </p>
                </div>
              )}
              
              {formData.delivery_type === 'file' && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Arquivo para entrega *</Label>
                  {formData.delivery_file_url ? (
                    <div className="flex items-center justify-between bg-[#27272a] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <File className="h-5 w-5 text-green-400" />
                        <span className="text-sm text-zinc-300 truncate max-w-[200px]">
                          Arquivo enviado ✓
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setFormData({ ...formData, delivery_file_url: '' })}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp3,.mp4"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleDeliveryFileUpload(file);
                          }
                        }}
                        className="hidden"
                        id="delivery-file-upload"
                        disabled={isUploadingFile}
                      />
                      <label
                        htmlFor="delivery-file-upload"
                        className={`flex flex-col items-center justify-center w-full h-20 rounded-lg bg-[#27272a] border-2 border-dashed border-zinc-600 hover:border-purple-500 cursor-pointer transition-colors ${isUploadingFile ? 'opacity-50' : ''}`}
                      >
                        {isUploadingFile ? (
                          <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-6 w-6 text-zinc-500 mb-1" />
                            <span className="text-sm text-zinc-400">Enviar arquivo (máx. 50MB)</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-zinc-500">
                    PDF, ZIP, imagem ou vídeo leve. Será enviado automaticamente no WhatsApp.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-zinc-700 hover:bg-zinc-800 flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitProduct}
              disabled={isSaving || isUploadingFile}
              className="bg-green-600 hover:bg-green-700 flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {editingProductId ? "Salvar Alterações" : "Salvar e Ativar na Vitrine"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientProducts;
