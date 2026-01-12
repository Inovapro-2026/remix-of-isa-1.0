import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_admin_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
  user_email?: string;
  message_count?: number;
  last_message?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  is_system_message: boolean;
  created_at: string;
  // Joined data
  sender_name?: string;
  is_admin?: boolean;
}

interface CreateTicketData {
  subject: string;
  category: string;
  description: string;
  priority?: TicketPriority;
}

export function useSupport() {
  const { user, profile, isAdmin, isLoading: isAuthLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch tickets based on role
  const fetchTickets = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('updated_at', { ascending: false });

      // If not admin, only fetch user's own tickets
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }

      const { data: ticketsData, error } = await query;

      if (error) throw error;

      // Fetch user profiles for all tickets
      const userIds = [...new Set((ticketsData || []).map((t: any) => t.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

      const formattedTickets: Ticket[] = (ticketsData || []).map((t: any) => {
        const profile = profilesMap.get(t.user_id);
        return {
          id: t.id,
          user_id: t.user_id,
          subject: t.subject,
          category: t.category,
          status: t.status,
          priority: t.priority,
          assigned_admin_id: t.assigned_admin_id,
          created_at: t.created_at,
          updated_at: t.updated_at,
          user_name: profile?.full_name || 'Usuário',
          user_email: profile?.email || '',
        };
      });

      setTickets(formattedTickets);
      
      // Count pending (open) tickets for admin badge
      if (isAdmin) {
        const pending = formattedTickets.filter(t => t.status === 'open').length;
        setPendingCount(pending);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  // Fetch messages for a ticket
  const fetchMessages = useCallback(async (ticketId: string) => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch sender profiles
      const senderIds = [...new Set((data || []).map((m: any) => m.sender_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', senderIds);

      if (error) throw error;

      // Check which senders are admins
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', senderIds);

      const adminIds = new Set((roles || [])
        .filter((r: any) => r.role === 'admin' || r.role === 'super_admin')
        .map((r: any) => r.user_id));

      const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]));

      const formattedMessages: TicketMessage[] = (data || []).map((m: any) => ({
        id: m.id,
        ticket_id: m.ticket_id,
        sender_id: m.sender_id,
        content: m.content,
        attachment_url: m.attachment_url,
        is_system_message: m.is_system_message,
        created_at: m.created_at,
        sender_name: profilesMap.get(m.sender_id)?.full_name || 'Usuário',
        is_admin: adminIds.has(m.sender_id),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Create a new ticket
  const createTicket = async (data: CreateTicketData) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return null;
    }

    try {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          subject: data.subject,
          category: data.category,
          priority: data.priority || 'normal',
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create initial message with description
      const { error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: user.id,
          content: data.description,
        });

      if (messageError) throw messageError;

      toast.success('Ticket criado com sucesso!');
      await fetchTickets();
      return ticket;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Erro ao criar ticket');
      return null;
    }
  };

  // Upload attachment
  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast.error('Erro ao fazer upload do arquivo');
      return null;
    }
  };

  // Send a message
  const sendMessage = async (ticketId: string, content: string, attachmentUrl?: string | null) => {
    if (!user || (!content.trim() && !attachmentUrl)) return false;

    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          sender_id: user.id,
          content: content.trim() || (attachmentUrl ? '📎 Anexo' : ''),
          attachment_url: attachmentUrl || null,
        });

      if (error) throw error;

      // Update ticket's updated_at
      await supabase
        .from('tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      await fetchMessages(ticketId);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    }
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success(`Status atualizado para ${status === 'resolved' ? 'Resolvido' : status === 'in_progress' ? 'Em Andamento' : status}`);
      await fetchTickets();
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // Assign admin to ticket
  const assignTicket = async (ticketId: string, adminId: string | null) => {
    try {
      const updates: any = { 
        assigned_admin_id: adminId,
        updated_at: new Date().toISOString() 
      };
      
      // Auto-set to in_progress when assigning
      if (adminId) {
        updates.status = 'in_progress';
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId);

      if (error) throw error;

      toast.success(adminId ? 'Ticket atribuído' : 'Atribuição removida');
      await fetchTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Erro ao atribuir ticket');
    }
  };

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('support-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        (payload) => {
          console.log('Ticket change:', payload);
          fetchTickets();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
        },
        (payload) => {
          console.log('New message:', payload);
          if (selectedTicket && payload.new.ticket_id === selectedTicket.id) {
            fetchMessages(selectedTicket.id);
          }
          // Show notification for admin if message is from client
          if (isAdmin && payload.new.sender_id !== user.id) {
            toast.info('Nova mensagem recebida!');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, selectedTicket, fetchTickets, fetchMessages]);

  // Initial fetch - wait for auth to be ready
  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchTickets();
    }
  }, [fetchTickets, isAuthLoading, user, isAdmin]);

  // Fetch messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    } else {
      setMessages([]);
    }
  }, [selectedTicket, fetchMessages]);

  return {
    tickets,
    selectedTicket,
    setSelectedTicket,
    messages,
    isLoading,
    isLoadingMessages,
    pendingCount,
    createTicket,
    sendMessage,
    uploadAttachment,
    updateTicketStatus,
    assignTicket,
    fetchTickets,
    fetchMessages,
  };
}
