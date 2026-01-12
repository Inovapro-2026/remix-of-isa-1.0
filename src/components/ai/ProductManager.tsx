import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, Plus, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { clientWhatsAppISA } from "@/services/clientWhatsAppISA";

interface Product {
    id: string;
    name: string;
    price: string;
    description: string;
    image: string;
}

interface ProductManagerProps {
    clientId: string;
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const ProductManager = ({ clientId, products, setProducts }: ProductManagerProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Product>>({ name: '', price: '', description: '', image: '' });

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            toast.error("Nome e Preço são obrigatórios");
            return;
        }

        try {
            if (editingId) {
                // Update
                // @ts-ignore
                const updatedList = await clientWhatsAppISA.updateProduct(clientId, editingId, formData);
                setProducts(updatedList);
                toast.success("Produto atualizado!");
            } else {
                // Create
                // @ts-ignore
                const newList = await clientWhatsAppISA.addProduct(clientId, formData);
                setProducts(newList);
                toast.success("Produto adicionado!");
            }
            resetForm();
        } catch (e) {
            toast.error("Erro ao salvar produto");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            // @ts-ignore
            const newList = await clientWhatsAppISA.deleteProduct(clientId, id);
            setProducts(newList);
            toast.success("Produto removido");
        } catch (e) {
            toast.error("Erro ao remover");
        }
    };

    const startEdit = (p: Product) => {
        setEditingId(p.id);
        setFormData(p);
        setIsAdding(true);
    };

    const resetForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: '', price: '', description: '', image: '' });
    };

    if (isAdding) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-400">{editingId ? 'Editar Produto' : 'Novo Produto'}</h4>
                    <Button variant="ghost" size="sm" onClick={resetForm}><X className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-3">
                    <div>
                        <Label>Nome do Produto</Label>
                        <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-[#27272a] border-none" placeholder="Ex: Pizza Calabresa" />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label>Preço</Label>
                            <Input value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="bg-[#27272a] border-none" placeholder="R$ 0,00" />
                        </div>
                        <div className="flex-1">
                            <Label>Imagem (URL)</Label>
                            <Input value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className="bg-[#27272a] border-none" placeholder="http://..." />
                        </div>
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="bg-[#27272a] border-none bg-opacity-50" placeholder="Ingredientes, detalhes..." />
                    </div>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleSave}>
                        {editingId ? 'Salvar Alterações' : 'Adicionar Produto'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Button variant="outline" className="w-full border-dashed border-zinc-700 hover:bg-zinc-800 text-zinc-400" onClick={() => setIsAdding(true)}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
            </Button>

            <div className="space-y-2">
                {products.map(p => (
                    <div key={p.id} className="bg-[#27272a] p-3 rounded-lg flex items-start gap-3 group">
                        <div className="h-12 w-12 rounded bg-black/40 flex items-center justify-center flex-shrink-0 text-zinc-600 overflow-hidden">
                            {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-medium text-white truncate">{p.name}</h4>
                                <span className="text-green-400 font-mono text-sm">{p.price}</span>
                            </div>
                            <p className="text-xs text-zinc-400 line-clamp-2">{p.description}</p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(p)} className="p-1 hover:text-blue-400 text-zinc-500"><Edit2 className="h-3 w-3" /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-1 hover:text-red-400 text-zinc-500"><Trash2 className="h-3 w-3" /></button>
                        </div>
                    </div>
                ))}
                {products.length === 0 && <p className="text-center text-zinc-600 text-sm py-4">Nenhum produto cadastrado.</p>}
            </div>
        </div>
    );
};
