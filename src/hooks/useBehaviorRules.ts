import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useBehaviorRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_behavior_rules')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRules(data.rules || '');
        setUpdatedAt(data.updated_at);
      } else {
        setRules('');
        setUpdatedAt(null);
      }
    } catch (e) {
      console.error('Error loading behavior rules:', e);
      toast.error('Erro ao carregar regras de comportamento');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const saveRules = useCallback(async (newRules: string, successMessage?: string) => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ai_behavior_rules')
        .upsert(
          {
            user_id: user.id,
            rules: newRules,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      setRules(newRules);
      setUpdatedAt(new Date().toISOString());

      if (successMessage) {
        toast.success(successMessage);
      }
      return true;
    } catch (e) {
      console.error('Error saving behavior rules:', e);
      toast.error('Erro ao salvar regras de comportamento');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return {
    rules,
    setRules,
    isLoading,
    isSaving,
    updatedAt,
    loadRules,
    saveRules,
  };
};
