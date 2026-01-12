import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Save, Mail, Phone, BadgeCheck, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\(\d{2}\)\s?\d{4,5}-?\d{4}$/, "Telefone inválido. Use (XX) XXXXX-XXXX").optional().or(z.literal('')),
});

const ClientProfile = () => {
  const { user, profile: authProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    matricula: '',
    cpf: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          matricula: data.matricula || '666058',
          cpf: data.cpf || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error("Erro ao carregar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    setErrors({ ...errors, phone: '' });
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
    setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    try {
      profileSchema.parse({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || undefined,
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Corrija os erros antes de salvar");
      return;
    }

    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Erro ao atualizar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout isAdmin={false}>
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-[#0D0D0D] text-white">
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <User className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Meu Perfil</h1>
              <p className="text-zinc-400">Gerencie suas informações pessoais</p>
            </div>
          </div>

          <Card className="bg-[#1E1E1E] border-[#27272a]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-blue-500" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Atualize seus dados de cadastro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <>
                  {/* Nome Completo */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2">
                      <User className="h-4 w-4 text-zinc-500" />
                      Nome Completo
                    </Label>
                    <Input 
                      value={formData.full_name}
                      onChange={handleChange('full_name')}
                      className={`bg-[#27272a] border-[#3f3f46] text-white placeholder:text-zinc-500 ${
                        errors.full_name ? 'border-red-500' : ''
                      }`}
                      placeholder="Seu nome completo"
                    />
                    {errors.full_name && (
                      <p className="text-red-500 text-sm">{errors.full_name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-zinc-500" />
                      Email
                    </Label>
                    <Input 
                      value={formData.email}
                      disabled
                      className="bg-[#27272a] border-[#3f3f46] text-zinc-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-500">O email não pode ser alterado</p>
                  </div>

                  {/* Telefone */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-zinc-500" />
                      Telefone
                    </Label>
                    <Input 
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className={`bg-[#27272a] border-[#3f3f46] text-white placeholder:text-zinc-500 ${
                        errors.phone ? 'border-red-500' : ''
                      }`}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm">{errors.phone}</p>
                    )}
                  </div>

                  {/* Matrícula */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-zinc-500" />
                      Matrícula
                    </Label>
                    <div className="relative">
                      <Input 
                        value={formData.matricula || '666058'}
                        disabled
                        className="bg-[#27272a] border-[#3f3f46] text-zinc-400 cursor-not-allowed pr-10"
                      />
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-xs text-zinc-500">Identificador único - não pode ser alterado</p>
                  </div>

                  {/* CPF (se existir) */}
                  {formData.cpf && (
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-zinc-500" />
                        CPF
                      </Label>
                      <Input 
                        value={formData.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                        disabled
                        className="bg-[#27272a] border-[#3f3f46] text-zinc-400 cursor-not-allowed"
                      />
                    </div>
                  )}

                  {/* Botão Salvar */}
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientProfile;