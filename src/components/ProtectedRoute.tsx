import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  clientOnly?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, clientOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingExpiration, setCheckingExpiration] = useState(true);

  useEffect(() => {
    const checkPlanExpiration = async () => {
      if (!user || isAdmin) {
        setCheckingExpiration(false);
        return;
      }

      try {
        const { data: clientData } = await supabase
          .from('clients')
          .select('expiration_date, is_active')
          .eq('user_id', user.id)
          .maybeSingle();

        if (clientData) {
          const today = new Date().toISOString().split('T')[0];
          const isExpired = clientData.expiration_date && clientData.expiration_date < today;
          const isInactive = !clientData.is_active;

          if (isExpired || isInactive) {
            // Update client as inactive if expired
            if (isExpired && clientData.is_active) {
              await supabase
                .from('clients')
                .update({ is_active: false })
                .eq('user_id', user.id);
            }
            setIsBlocked(true);
          }
        }
      } catch (error) {
        console.error('Error checking plan expiration:', error);
      } finally {
        setCheckingExpiration(false);
      }
    };

    if (user && !isAdmin) {
      checkPlanExpiration();
    } else {
      setCheckingExpiration(false);
    }
  }, [user, isAdmin]);

  if (isLoading || checkingExpiration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Show blocked screen for clients with expired plans
  if (isBlocked && clientOnly) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Plano Expirado</CardTitle>
            <CardDescription>
              Seu plano expirou. Renove agora para continuar usando o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => window.open('https://mpago.la/12hYK2o', '_blank')}
              className="w-full gradient-button"
            >
              Pagar R$ 97,00
            </Button>
            <Button 
              onClick={() => window.location.href = '/renovar-plano'}
              variant="outline"
              className="w-full"
            >
              Já paguei - Enviar comprovante
            </Button>
            <Button 
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              variant="ghost"
              className="w-full"
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin trying to access client-only routes
  if (clientOnly && isAdmin) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  // Client trying to access admin routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard/client" replace />;
  }

  // Non-admin trying to access admin routes (extra check)
  if (!clientOnly && !requireAdmin && isAdmin) {
    // Admin accessing general protected routes - allow but might want to redirect
  }

  return <>{children}</>;
}
