import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AIMemoryConfig {
  behavior?: { rules: string };
  identity?: { name: string; tone: string; greeting: string; farewell: string };
  company?: {
    name: string;
    segment: string;
    mission: string;
    hours: string;
    payment: string;
    address: string;
    policies: string;
    scheduleConfig?: any;
  };
  products?: Array<{ id: string; code: string | null; name: string; price: number; description: string | null; image_url?: string | null; category?: string | null }>;
  vitrine?: { config: any };
  landingPage?: { config: any };
}

export const useClientMemory = () => {
  const { user, profile } = useAuth();
  const [config, setConfig] = useState<AIMemoryConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadMemory = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get user's matricula from profile or clients table
      let matricula = profile?.matricula;
      
      if (!matricula) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('matricula')
          .eq('user_id', user.id)
          .maybeSingle();
        matricula = clientData?.matricula;
      }

      console.log(`[useClientMemory] Loading for user_id: ${user.id}, matricula: ${matricula}`);

      // Load AI memory config
      const { data: memoryData, error: memoryError } = await supabase
        .from('client_ai_memory')
        .select('config')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memoryError) throw memoryError;

      // Load products - try by matricula first, fallback to user_id
      let productsData: any[] = [];
      
      if (matricula) {
        const { data, error } = await supabase
          .from('products')
          .select('id, code, name, price, description, image_url, category')
          .eq('matricula', matricula)
          .eq('is_active', true)
          .order('name');
        
        if (!error && data && data.length > 0) {
          productsData = data;
          console.log(`[useClientMemory] Found ${data.length} products by matricula ${matricula}`);
        }
      }

      // Fallback to user_id if no products found by matricula
      if (productsData.length === 0) {
        const { data, error } = await supabase
          .from('products')
          .select('id, code, name, price, description, image_url, category')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');

        if (!error && data) {
          productsData = data;
          console.log(`[useClientMemory] Found ${data.length} products by user_id ${user.id}`);
        }
      }

      const baseConfig = (memoryData?.config as AIMemoryConfig) || {};

      // Merge products from Supabase into config
      const mergedConfig: AIMemoryConfig = {
        ...baseConfig,
        products: productsData
      };

      if (!memoryData) {
        // Initialize empty record if none exists
        const { error: insertError } = await supabase
          .from('client_ai_memory')
          .insert({ user_id: user.id, config: {} });

        if (insertError && insertError.code !== '23505') {
          console.error('Insert error:', insertError);
        }
      }

      setConfig(mergedConfig);
    } catch (e) {
      console.error('Error loading memory:', e);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profile?.matricula]);

  const saveMemory = useCallback(async (newConfig: Partial<AIMemoryConfig>) => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const mergedConfig = { ...config, ...newConfig };

      const { error } = await supabase
        .from('client_ai_memory')
        .upsert({
          user_id: user.id,
          config: mergedConfig,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Note: Removed backend sync - now using Supabase-only architecture
      // Products are queried directly from Supabase by matricula

      setConfig(mergedConfig);
      return true;
    } catch (e) {
      console.error('Error saving memory:', e);
      toast.error('Erro ao salvar configurações');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, config, profile?.cpf]);

  const updateSection = useCallback(async <K extends keyof AIMemoryConfig>(
    section: K,
    data: AIMemoryConfig[K],
    successMessage?: string
  ) => {
    const success = await saveMemory({ [section]: data });
    if (success && successMessage) {
      toast.success(successMessage);
    }
    return success;
  }, [saveMemory]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  return {
    config,
    isLoading,
    isSaving,
    loadMemory,
    saveMemory,
    updateSection,
    // Section getters
    behavior: config.behavior,
    identity: config.identity,
    company: config.company,
    products: config.products || [],
    vitrine: config.vitrine,
    landingPage: config.landingPage
  };
};
