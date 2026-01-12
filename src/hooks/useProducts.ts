import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Product {
  id: string;
  code: string | null;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  delivery_type: 'none' | 'text' | 'link' | 'file' | null;
  delivery_content: string | null;
  delivery_file_url: string | null;
}

export interface ProductInput {
  name: string;
  price: string;
  description?: string;
  image_url?: string;
  category?: string;
  delivery_type?: 'none' | 'text' | 'link' | 'file';
  delivery_content?: string;
  delivery_file_url?: string;
}

// Helper function to create product text content
const createProductTextContent = (product: {
  code: string | null;
  name: string;
  price: number;
  description: string | null;
  category: string | null;
  delivery_type?: string | null;
  created_at?: string;
  updated_at?: string;
}): string => {
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(product.price);

  const deliveryLabels: Record<string, string> = {
    'none': 'Sem entrega digital',
    'text': 'Mensagem automática',
    'link': 'Link de acesso',
    'file': 'Arquivo digital'
  };

  const lines = [
    `=================================`,
    `INFORMAÇÕES DO PRODUTO`,
    `=================================`,
    ``,
    `Código: ${product.code || 'N/A'}`,
    `Nome: ${product.name}`,
    `Preço: ${priceFormatted}`,
    `Categoria: ${product.category || 'Sem categoria'}`,
    `Tipo de Entrega: ${deliveryLabels[product.delivery_type || 'none'] || 'Sem entrega'}`,
    ``,
    `Descrição:`,
    `${product.description || 'Sem descrição'}`,
    ``,
    `=================================`,
    `Criado em: ${product.created_at ? new Date(product.created_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}`,
    `Atualizado em: ${product.updated_at ? new Date(product.updated_at).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR')}`,
    `=================================`,
  ];

  return lines.join('\n');
};

// Helper function to save product text file
const saveProductTextFile = async (userId: string, productId: string, content: string): Promise<void> => {
  const filePath = `${userId}/${productId}.txt`;
  const blob = new Blob([content], { type: 'text/plain' });
  
  const { error } = await supabase.storage
    .from('produtos')
    .upload(filePath, blob, { 
      upsert: true,
      contentType: 'text/plain'
    });

  if (error) {
    console.error('Error saving product text file:', error);
  } else {
    console.log('Product text file saved:', filePath);
  }
};

// Helper function to delete product text file
const deleteProductTextFile = async (userId: string, productId: string): Promise<void> => {
  const filePath = `${userId}/${productId}.txt`;
  
  const { error } = await supabase.storage
    .from('produtos')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting product text file:', error);
  } else {
    console.log('Product text file deleted:', filePath);
  }
};

// Helper function to upload delivery file
export const uploadDeliveryFile = async (userId: string, file: File): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}_delivery.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('produtos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading delivery file:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('produtos')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
};

export const useProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [matricula, setMatricula] = useState<string | null>(null);

  // Fetch user's matricula (prefer profiles; fallback to clients by user_id/email)
  useEffect(() => {
    const fetchMatricula = async () => {
      if (!user?.id) return;

      // Try profiles first
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("matricula")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) console.error("Error fetching profile matricula:", profileError);

      if (profileData?.matricula) {
        setMatricula(profileData.matricula);
        return;
      }

      // Fallback to clients table (some older records may not have user_id linked yet)
      const { data: clientDataByUserId, error: clientByUserIdError } = await supabase
        .from("clients")
        .select("matricula")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientByUserIdError) console.error("Error fetching client matricula by user_id:", clientByUserIdError);

      if (clientDataByUserId?.matricula) {
        setMatricula(clientDataByUserId.matricula);
        return;
      }

      if (user.email) {
        const { data: clientDataByEmail, error: clientByEmailError } = await supabase
          .from("clients")
          .select("matricula")
          .eq("email", user.email)
          .maybeSingle();

        if (clientByEmailError) console.error("Error fetching client matricula by email:", clientByEmailError);

        if (clientDataByEmail?.matricula) {
          setMatricula(clientDataByEmail.matricula);
        }
      }
    };

    fetchMatricula();
  }, [user?.id, user?.email]);

  const loadProducts = useCallback(async () => {
    if (!user?.id) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts((data as Product[]) || []);
    } catch (e) {
      console.error('Error loading products:', e);
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const addProduct = useCallback(async (input: ProductInput) => {
    if (!user?.id) return null;

    setIsSaving(true);
    try {
      const priceNumber = parseFloat(input.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      const { data, error } = await supabase
        .from('products')
        .insert({
          user_id: user.id,
          name: input.name,
          price: priceNumber,
          description: input.description || null,
          image_url: input.image_url || null,
          category: input.category || null,
          matricula: matricula,
          delivery_type: input.delivery_type || 'none',
          delivery_content: input.delivery_content || null,
          delivery_file_url: input.delivery_file_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Save product info to text file
      const textContent = createProductTextContent({
        code: data.code,
        name: data.name,
        price: data.price,
        description: data.description,
        category: data.category,
        delivery_type: data.delivery_type,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      await saveProductTextFile(user.id, data.id, textContent);

      setProducts(prev => [data as Product, ...prev]);
      toast.success('Produto cadastrado e ativado na vitrine! 🎉');
      return data;
    } catch (e) {
      console.error('Error adding product:', e);
      toast.error('Erro ao adicionar produto');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, matricula]);

  const updateProduct = useCallback(async (id: string, input: ProductInput) => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const priceNumber = parseFloat(input.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      const { data, error } = await supabase
        .from('products')
        .update({
          name: input.name,
          price: priceNumber,
          description: input.description || null,
          image_url: input.image_url || null,
          category: input.category || null,
          delivery_type: input.delivery_type || 'none',
          delivery_content: input.delivery_content || null,
          delivery_file_url: input.delivery_file_url || null,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Update product info text file
      const textContent = createProductTextContent({
        code: data.code,
        name: data.name,
        price: data.price,
        description: data.description,
        category: data.category,
        delivery_type: data.delivery_type,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
      await saveProductTextFile(user.id, data.id, textContent);

      setProducts(prev => prev.map(p => p.id === id ? data as Product : p));
      toast.success('Produto atualizado!');
      return true;
    } catch (e) {
      console.error('Error updating product:', e);
      toast.error('Erro ao atualizar produto');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  const deleteProduct = useCallback(async (id: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Delete product text file
      await deleteProductTextFile(user.id, id);

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido!');
      return true;
    } catch (e) {
      console.error('Error deleting product:', e);
      toast.error('Erro ao remover produto');
      return false;
    }
  }, [user?.id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    isLoading,
    isSaving,
    loadProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    formatPrice
  };
};
