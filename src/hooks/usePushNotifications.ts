import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SaleNotification {
  id: string;
  customerName: string;
  total: number;
  status: string;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if browser supports notifications
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta notificações');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notificações ativadas!');
        return true;
      } else if (result === 'denied') {
        toast.error('Notificações bloqueadas pelo navegador');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported, permission]);

  const showSaleNotification = useCallback((sale: SaleNotification) => {
    const formattedTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(sale.total);

    showNotification('🎉 Nova Venda!', {
      body: `${sale.customerName || 'Cliente'} comprou por ${formattedTotal}`,
      tag: `sale-${sale.id}`,
      requireInteraction: true,
    });

    // Also show in-app toast
    toast.success(`Nova venda: ${formattedTotal}`, {
      description: `Cliente: ${sale.customerName || 'Não identificado'}`,
      duration: 8000,
    });
  }, [showNotification]);

  // Subscribe to real-time sales updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sales-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          const sale = payload.new as any;
          showSaleNotification({
            id: sale.id,
            customerName: sale.customer_name,
            total: sale.total,
            status: sale.status,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sales',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          const sale = payload.new as any;
          const oldSale = payload.old as any;
          
          // Notify when payment is approved
          if (oldSale.payment_status !== 'approved' && sale.payment_status === 'approved') {
            const formattedTotal = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(sale.total);

            showNotification('✅ Pagamento Confirmado!', {
              body: `Pagamento de ${formattedTotal} foi aprovado`,
              tag: `payment-${sale.id}`,
            });

            toast.success(`Pagamento aprovado: ${formattedTotal}`, {
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, showSaleNotification, showNotification]);

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showSaleNotification,
  };
}
