import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CompanyKnowledge {
  name: string;
  segment: string;
  mission: string;
  hours: string;
  payment: string;
  address: string;
  policies: string;
  scheduleConfig?: any;
}

const DEFAULT_COMPANY: CompanyKnowledge = {
  name: '',
  segment: '',
  mission: '',
  hours: '',
  payment: '',
  address: '',
  policies: '',
  scheduleConfig: undefined,
};

export const useCompanyKnowledge = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyKnowledge>(DEFAULT_COMPANY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_knowledge')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompany({
          name: data.name || '',
          segment: data.segment || '',
          mission: data.mission || '',
          hours: data.hours || '',
          payment: data.payment || '',
          address: data.address || '',
          policies: data.policies || '',
          scheduleConfig: data.schedule_config || undefined,
        });
        setUpdatedAt(data.updated_at);
      } else {
        setCompany(DEFAULT_COMPANY);
        setUpdatedAt(null);
      }
    } catch (e) {
      console.error('Error loading company knowledge:', e);
      toast.error('Erro ao carregar conhecimento da empresa');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const saveCompany = useCallback(
    async (newCompany: CompanyKnowledge, successMessage?: string) => {
      if (!user?.id) return false;

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('company_knowledge')
          .upsert(
            {
              user_id: user.id,
              name: newCompany.name,
              segment: newCompany.segment,
              mission: newCompany.mission,
              hours: newCompany.hours,
              payment: newCompany.payment,
              address: newCompany.address,
              policies: newCompany.policies,
              schedule_config: newCompany.scheduleConfig || {},
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );

        if (error) throw error;

        setCompany(newCompany);
        setUpdatedAt(new Date().toISOString());

        if (successMessage) {
          toast.success(successMessage);
        }
        return true;
      } catch (e) {
        console.error('Error saving company knowledge:', e);
        toast.error('Erro ao salvar conhecimento da empresa');
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  return {
    company,
    setCompany,
    isLoading,
    isSaving,
    updatedAt,
    loadCompany,
    saveCompany,
  };
};
