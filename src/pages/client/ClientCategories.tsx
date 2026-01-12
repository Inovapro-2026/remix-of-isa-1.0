import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useCategories, CategoryInput } from "@/hooks/useCategories";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FolderOpen, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Upload,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const ClientCategories = () => {
  const { categories, isLoading, isSaving, loadCategories, uploadImage, addCategory, updateCategory, deleteCategory } = useCategories();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryInput>({ name: '', image_url: '' });
  const [isUploading, setIsUploading] = useState(false);

  const openAddDialog = () => {
    setEditingCategoryId(null);
    setFormData({ name: '', image_url: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: typeof categories[0]) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name,
      image_url: category.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }

    setIsUploading(true);
    const url = await uploadImage(file);
    if (url) {
      setFormData(prev => ({ ...prev, image_url: url }));
    }
    setIsUploading(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    if (editingCategoryId) {
      await updateCategory(editingCategoryId, formData);
    } else {
      await addCategory(formData);
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(id);
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
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <FolderOpen className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Categorias</h1>
              <p className="text-zinc-400">Organize seus produtos em categorias com imagens</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadCategories} 
              disabled={isLoading}
              className="border-zinc-700 hover:bg-zinc-800 text-white"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Atualizar
            </Button>
            <Button 
              onClick={openAddDialog}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" /> Nova Categoria
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-[#1E1E1E] flex items-center justify-center mb-4">
                <FolderOpen className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">Nenhuma categoria cadastrada</h3>
              <p className="text-zinc-500 mb-4">Crie categorias para organizar seus produtos</p>
              <Button onClick={openAddDialog} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="mr-2 h-4 w-4" /> Criar Primeira Categoria
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  className="bg-[#1E1E1E] rounded-xl border border-[#27272a] p-4 hover:border-purple-500/50 transition-colors"
                >
                  {/* Circle Image */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-[#27272a] border-2 border-purple-500/30 overflow-hidden">
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-zinc-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-white text-center mb-4">{category.name}</h3>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openEditDialog(category)}
                      className="flex-1 border-zinc-700 hover:bg-zinc-800"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDelete(category.id)}
                      className="border-red-600/50 text-red-500 hover:bg-red-600/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] border-[#27272a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-purple-500" />
              {editingCategoryId ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Nome da Categoria</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#27272a] border-none text-white"
                placeholder="Ex: Pizzas, Bebidas, Eletrônicos..."
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-zinc-400">Imagem da Categoria</Label>
              
              {formData.image_url ? (
                <div className="relative flex justify-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500">
                    <img 
                      src={formData.image_url} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-0 right-1/4"
                    onClick={() => setFormData({ ...formData, image_url: '' })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="category-image-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="category-image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 rounded-lg bg-[#27272a] border-2 border-dashed border-zinc-600 hover:border-purple-500 cursor-pointer transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-zinc-500 mb-2" />
                        <span className="text-sm text-zinc-400">Clique para fazer upload</span>
                        <span className="text-xs text-zinc-500">PNG, JPG até 5MB</span>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSaving || isUploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                editingCategoryId ? "Salvar Alterações" : "Criar Categoria"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClientCategories;
