import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryInput {
  name: string;
  image_url?: string;
}

export const useCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadCategories = useCallback(async () => {
    if (!user?.id) {
      setCategories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      setCategories((data as Category[]) || []);
    } catch (e) {
      console.error('Error loading categories:', e);
      toast.error('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('category-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (e) {
      console.error('Error uploading image:', e);
      toast.error('Erro ao fazer upload da imagem');
      return null;
    }
  }, [user?.id]);

  const addCategory = useCallback(async (input: CategoryInput) => {
    if (!user?.id) return null;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: input.name,
          image_url: input.image_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success('Categoria criada!');
      return data;
    } catch (e) {
      console.error('Error adding category:', e);
      toast.error('Erro ao criar categoria');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  const updateCategory = useCallback(async (id: string, input: CategoryInput) => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: input.name,
          image_url: input.image_url || null,
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => 
        prev.map(c => c.id === id ? data : c).sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success('Categoria atualizada!');
      return true;
    } catch (e) {
      console.error('Error updating category:', e);
      toast.error('Erro ao atualizar categoria');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user?.id) return false;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success('Categoria removida!');
      return true;
    } catch (e) {
      console.error('Error deleting category:', e);
      toast.error('Erro ao remover categoria');
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    isLoading,
    isSaving,
    loadCategories,
    uploadImage,
    addCategory,
    updateCategory,
    deleteCategory
  };
};
