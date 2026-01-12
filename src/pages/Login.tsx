import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Shield, User, Loader2, ArrowRight, CheckCircle, XCircle, Clock, Settings, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LoginType = "admin" | "client";

interface AdminData {
  full_name: string;
  email: string;
  avatar_url: string | null;
  needsRegistration?: boolean;
}

interface ClientData {
  full_name: string;
  status: 'pending' | 'approved' | 'rejected';
  email: string;
  needsRegistration?: boolean;
}

const Login = () => {
  const [loginType, setLoginType] = useState<LoginType>("client");
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid' | 'pending'>('idle');
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        navigate("/dashboard/admin");
      } else {
        navigate("/dashboard/client");
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  // Validate matricula in real-time
  useEffect(() => {
    const validateMatricula = async () => {
      if (loginType === "admin" && matricula.length === 7) {
        setIsValidating(true);
        setValidationStatus('idle');
        
        try {
          // 1. Try admins table first
          let { data: adminRecord } = await supabase
            .from('admins')
            .select('id, full_name, email, avatar_url, is_active')
            .eq('matricula', matricula)
            .maybeSingle();

          // 2. If not found, try account_requests (fallback for new admins not yet in admins table)
          if (!adminRecord) {
             const { data: requestRecord } = await supabase
              .from('account_requests')
              .select('id, full_name, email, status')
              .eq('matricula', matricula)
              .eq('status', 'approved') // Must be approved
              .maybeSingle();
              
             if (requestRecord) {
                adminRecord = {
                    id: requestRecord.id,
                    full_name: requestRecord.full_name,
                    email: requestRecord.email,
                    avatar_url: null,
                    is_active: true
                } as any;
             }
          }

          if (adminRecord) {
            if (adminRecord.is_active) {
              setValidationStatus('valid');
              setAdminData({
                full_name: adminRecord.full_name,
                email: adminRecord.email,
                avatar_url: adminRecord.avatar_url,
              });
            } else {
              setValidationStatus('invalid');
              setAdminData(null);
              toast.error("Administrador inativo. Contate o suporte.");
            }
          } else {
            setValidationStatus('invalid');
            setAdminData(null);
          }
        } catch (error) {
          setValidationStatus('invalid');
          setAdminData(null);
        } finally {
          setIsValidating(false);
        }
      } else if (loginType === "client" && matricula.length === 6) {
        setIsValidating(true);
        setValidationStatus('idle');
        
        try {
          // Check in clients table ONLY
          const { data: clientRecord } = await supabase
            .from('clients')
            .select('id, full_name, email, status, is_active')
            .eq('matricula', matricula)
            .maybeSingle();

          if (clientRecord) {
            if (clientRecord.is_active && clientRecord.status === 'active') {
              setValidationStatus('valid');
              setClientData({
                full_name: clientRecord.full_name,
                email: clientRecord.email,
                status: 'approved',
              });
            } else if (clientRecord.status === 'pending') {
              setValidationStatus('pending');
              setClientData({
                full_name: clientRecord.full_name,
                email: clientRecord.email,
                status: 'pending',
              });
            } else {
              setValidationStatus('invalid');
              setClientData({
                full_name: clientRecord.full_name,
                email: clientRecord.email,
                status: 'rejected',
              });
            }
          } else {
            // Check in account_requests for pending registrations
            const { data: requestData } = await supabase
              .from('account_requests')
              .select('full_name, email, status')
              .eq('matricula', matricula)
              .maybeSingle();

            if (requestData) {
              if (requestData.status === 'approved') {
                setValidationStatus('valid');
                setClientData({
                  full_name: requestData.full_name,
                  email: requestData.email,
                  status: 'approved',
                });
              } else if (requestData.status === 'pending') {
                setValidationStatus('pending');
                setClientData({
                  full_name: requestData.full_name,
                  email: requestData.email,
                  status: 'pending',
                });
              } else {
                setValidationStatus('invalid');
                setClientData(null);
              }
            } else {
              setValidationStatus('invalid');
              setClientData(null);
            }
          }
        } catch (error) {
          setValidationStatus('invalid');
          setClientData(null);
        } finally {
          setIsValidating(false);
        }
      } else {
        setValidationStatus('idle');
        setAdminData(null);
        setClientData(null);
      }
    };

    const debounceTimer = setTimeout(validateMatricula, 300);
    return () => clearTimeout(debounceTimer);
  }, [matricula, loginType]);

  // Reset state when switching login type
  useEffect(() => {
    setMatricula("");
    setValidationStatus('idle');
    setAdminData(null);
    setClientData(null);
  }, [loginType]);

  const handleLogin = async () => {
    // Admin login: validate against admins table
    if (loginType === "admin") {
      if (validationStatus !== 'valid') return;
      
      setIsLoading(true);
      try {
        const email = adminData?.email;
        if (!email) {
          toast.error("Email não encontrado");
          return;
        }

        // Get admin CPF from admins table
        let { data: adminRecord } = await supabase
          .from('admins')
          .select('cpf')
          .eq('email', email)
          .maybeSingle();

        // Fallback: Check account_requests
        if (!adminRecord) {
             const { data: requestRecord } = await supabase
              .from('account_requests')
              .select('cpf')
              .eq('email', email)
              .maybeSingle();
             
             if (requestRecord) {
                 adminRecord = { cpf: requestRecord.cpf };
             }
        }

        const cpfPassword = adminRecord?.cpf?.replace(/\D/g, '') || '';

        if (!cpfPassword || cpfPassword.length < 6) {
          toast.error("CPF inválido ou muito curto. Mínimo 6 dígitos.");
          setIsLoading(false);
          return;
        }

        const trySignIn = async () => {
          return supabase.auth.signInWithPassword({
            email,
            password: cpfPassword,
          });
        };

        let { error } = await trySignIn();

        // If user doesn't exist yet in Supabase Auth, provision it via Edge Function
        if (error?.message?.toLowerCase().includes('invalid login credentials')) {
          console.log("User not found in Auth, provisioning...");
          const { data, error: provisionError } = await supabase.functions.invoke('provision-user', {
            body: {
              loginType: 'admin',
              matricula,
            },
          });

          if (provisionError || !data?.ok) {
            console.error("Provision error:", provisionError || data?.error);
            toast.error(data?.error || "Erro ao provisionar acesso. Verifique se o CPF é válido.");
            setIsLoading(false);
            return;
          }

          console.log("User provisioned, retrying login...");
          ({ error } = await trySignIn());
        }

        if (error) {
          console.error("Final login error:", error);
          toast.error("Erro ao entrar: " + error.message);
          return;
        }

        toast.success("Login realizado com sucesso!");
      } catch (error) {
        toast.error("Erro ao fazer login. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Client login: validate against clients table ONLY
    if (validationStatus !== 'valid') return;
    
    setIsLoading(true);

    try {
      const email = clientData?.email;
      
      if (!email) {
        toast.error("Email não encontrado");
        setIsLoading(false);
        return;
      }

      // Get client's CPF from clients table
      const { data: clientRecord } = await supabase
        .from('clients')
        .select('cpf')
        .eq('email', email)
        .maybeSingle();

      // Use CPF as password (remove formatting)
      const cpfPassword = clientRecord?.cpf?.replace(/\D/g, '') || '';

      if (!cpfPassword) {
        toast.error("CPF do cliente não encontrado");
        setIsLoading(false);
        return;
      }

      const trySignIn = async () => {
        return supabase.auth.signInWithPassword({
          email,
          password: cpfPassword,
        });
      };

      let { error } = await trySignIn();

      // If user doesn't exist yet in Supabase Auth, provision it via Edge Function
      if (error?.message?.toLowerCase().includes('invalid login credentials')) {
        const { data, error: provisionError } = await supabase.functions.invoke('provision-user', {
          body: {
            loginType: 'client',
            matricula,
          },
        });

        if (provisionError || !data?.ok) {
          toast.error("Conta ainda não liberada para login. Contate o suporte.");
          setIsLoading(false);
          return;
        }

        ({ error } = await trySignIn());
      }

      if (error) {
        console.error('Login error:', error);
        toast.error("Erro ao entrar. Verifique seus dados ou contate o suporte.");
        setIsLoading(false);
        return;
      }

      toast.success("Login realizado com sucesso!");
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const email = loginType === "admin" ? adminData?.email : clientData?.email;
    
    if (!email) {
      toast.error("Digite sua matrícula primeiro");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Email de recuperação enviado para ${email}`);
    } catch (error) {
      toast.error("Erro ao enviar email de recuperação");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputBorderClass = () => {
    if (isValidating) return "border-yellow-500/50 focus:border-yellow-500";
    switch (validationStatus) {
      case 'valid': return "border-green-500/50 focus:border-green-500 bg-green-500/5";
      case 'invalid': return "border-red-500/50 focus:border-red-500 bg-red-500/5";
      case 'pending': return "border-yellow-500/50 focus:border-yellow-500 bg-yellow-500/5";
      default: return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Animated Logo */}
        <Link to="/" className="flex flex-col items-center justify-center gap-2 mb-8 group">
          <div className="w-16 h-16 rounded-2xl gradient-button flex items-center justify-center transition-all duration-500 group-hover:scale-110 glow-primary animate-float">
            <Bot className="w-9 h-9 text-primary-foreground" />
          </div>
          <span className="text-3xl font-bold text-gradient">ISA</span>
          <span className="text-sm text-muted-foreground">
            {loginType === "admin" ? "PAINEL ADMINISTRATIVO" : "BEM-VINDO À PLATAFORMA"}
          </span>
        </Link>

        {/* Login Type Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setLoginType("admin")}
            className={`flex-1 py-3.5 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              loginType === "admin"
                ? "gradient-button text-primary-foreground glow-primary scale-[1.02]"
                : "glass text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <Shield className="w-5 h-5" />
            Administrador
          </button>
          <button
            onClick={() => setLoginType("client")}
            className={`flex-1 py-3.5 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
              loginType === "client"
                ? "gradient-button text-primary-foreground glow-primary scale-[1.02]"
                : "glass text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            <User className="w-5 h-5" />
            Cliente
          </button>
        </div>

        {/* Login Card */}
        <Card variant="glass" className="animate-scale-in overflow-hidden">
          <CardContent className="pt-8 pb-6">
            <div className="text-center mb-6">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 ${
                loginType === "admin" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
              }`}>
                {loginType === "admin" ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                <span className="text-sm font-medium">
                  {loginType === "admin" ? "ADMINISTRADOR" : "ACESSO DO CLIENTE"}
                </span>
              </div>
            </div>

            {/* Matricula Input */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium flex items-center gap-2">
                📋 {loginType === "admin" ? "Matrícula Administrativa" : "Sua Matrícula"}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={loginType === "admin" ? "_ _ _ _ _ _ _" : "_ _ _ _ _ _"}
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value.replace(/\D/g, '').slice(0, loginType === "admin" ? 7 : 6))}
                  maxLength={loginType === "admin" ? 7 : 6}
                  className={`text-center text-2xl tracking-[0.5em] font-mono h-14 transition-all duration-300 ${getInputBorderClass()}`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidating && <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />}
                  {!isValidating && validationStatus === 'valid' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {!isValidating && validationStatus === 'invalid' && <XCircle className="w-5 h-5 text-red-500" />}
                  {!isValidating && validationStatus === 'pending' && <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />}
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {loginType === "admin" ? "7 dígitos" : "6 dígitos"}
              </p>
            </div>

            {/* Admin Info Card */}
            {loginType === "admin" && validationStatus === 'valid' && adminData && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 animate-scale-in">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full gradient-button flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {adminData.avatar_url ? (
                      <img src={adminData.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(adminData.full_name)
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{adminData.full_name}</p>
                    <p className="text-sm text-muted-foreground">{adminData.email}</p>
                    <span className="inline-flex items-center gap-1 text-xs text-green-500 mt-1">
                      <CheckCircle className="w-3 h-3" />
                      Administrador Verificado
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Client Status Cards */}
            {loginType === "client" && validationStatus === 'valid' && clientData && (
              <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 animate-scale-in">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs text-green-500 mb-1">
                      <CheckCircle className="w-3 h-3" />
                      Status: Ativo
                    </span>
                    <p className="font-semibold">{clientData.full_name}</p>
                  </div>
                </div>
              </div>
            )}
            {loginType === "client" && validationStatus === 'pending' && clientData && (
              <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 animate-scale-in">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
                  <div>
                    <p className="font-semibold text-yellow-500">Em Análise</p>
                    <p className="text-sm text-muted-foreground">Volte em 24-48 horas</p>
                  </div>
                </div>
              </div>
            )}

            {validationStatus === 'invalid' && matricula.length >= (loginType === "admin" ? 7 : 6) && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 animate-scale-in">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-red-500" />
                  <div>
                    <p className="font-semibold text-red-500">Matrícula não encontrada</p>
                    <p className="text-sm text-muted-foreground">
                      {loginType === "client" ? "Deseja se cadastrar?" : "Verifique e tente novamente"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Password Field - REMOVED: Now using CPF as automatic password */}

            {/* Login Button - Admin: no password needed */}
            {loginType === "admin" && validationStatus === 'valid' && (
              <Button 
                onClick={handleLogin}
                variant="hero" 
                className="w-full h-14 text-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in group" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    ENTRAR
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            )}

            {/* Login Button - Client: no password needed anymore */}
            {loginType === "client" && validationStatus === 'valid' && (
              <Button 
                onClick={handleLogin}
                variant="hero" 
                className="w-full h-14 text-lg transition-all duration-300 hover:scale-[1.02] animate-scale-in group" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    ENTRAR
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            )}

            {/* Cadastro link for clients */}
            {loginType === "client" && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <p className="text-center text-sm text-muted-foreground mb-4">ou</p>
                <Link to="/cadastro">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 group hover:bg-accent/10 hover:border-accent/50"
                  >
                    <span className="mr-2">✨</span>
                    NOVO POR AQUI? CADASTRAR-SE
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Recovery link removed - passwordless login */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
