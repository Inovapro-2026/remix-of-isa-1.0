import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, CheckCircle, Clock, Loader2, ArrowRight, ArrowLeft, User, Building2, FileCheck, Phone, Mail, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Step = 1 | 2 | 3;

const Cadastro = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    empresa: "",
    segmento: "",
    cpf: "",
    dataNascimento: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedMatricula, setGeneratedMatricula] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Format CPF
    if (name === 'cpf') {
      const formatted = value
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
      setFormData({ ...formData, cpf: formatted });
      return;
    }
    
    // Format phone
    if (name === 'telefone') {
      const formatted = value
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
      setFormData({ ...formData, telefone: formatted });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const isStep1Valid = formData.nome.length > 2 && formData.email.includes('@') && formData.telefone.length >= 14;
  const isStep2Valid = formData.cpf.length === 14;
  const isStep3Valid = termsAccepted;

  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast.error("Você precisa aceitar os termos de uso");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('account_requests')
        .insert({
          full_name: formData.nome,
          email: formData.email,
          cpf: formData.cpf.replace(/\D/g, ''),
          phone: formData.telefone.replace(/\D/g, ''),
          company_name: formData.empresa || null,
          birth_date: formData.dataNascimento || null,
          segmento: formData.segmento || null,
          message: formData.segmento ? `Segmento: ${formData.segmento}` : null,
          status: 'pending',
        })
        .select('matricula')
        .single();

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error("Este email ou CPF já possui uma solicitação");
        } else {
          toast.error("Erro ao enviar solicitação. Tente novamente.");
        }
        console.error('Error:', error);
        return;
      }

      toast.success("Cadastro realizado com sucesso!");
      // Redirect to waiting page with matricula
      navigate(`/aguardando-aprovacao?matricula=${data.matricula}`);
    } catch (error) {
      toast.error("Erro ao enviar solicitação");
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        </div>

        <Card variant="glass" className="max-w-md w-full text-center animate-scale-in relative z-10">
          <CardContent className="pt-8 pb-8">
            {/* Success Icon */}
            <div className="w-24 h-24 rounded-full gradient-accent flex items-center justify-center mx-auto mb-6 glow-accent animate-pulse-glow">
              <CheckCircle className="w-12 h-12 text-accent-foreground" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">🎉 Parabéns!</h2>
            <p className="text-muted-foreground mb-6">Seu cadastro foi recebido com sucesso.</p>
            
            {/* Matricula Display */}
            {generatedMatricula && (
              <div className="mb-6 p-6 rounded-2xl bg-primary/10 border border-primary/30">
                <p className="text-sm text-muted-foreground mb-2">📋 SUA MATRÍCULA</p>
                <div className="flex justify-center gap-2">
                  {generatedMatricula.split('').map((digit, idx) => (
                    <div 
                      key={idx}
                      className="w-12 h-14 rounded-lg gradient-button flex items-center justify-center text-2xl font-bold text-primary-foreground animate-scale-in"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Guarde este número!</p>
              </div>
            )}

            {/* Status Card */}
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
                <Clock className="w-5 h-5 animate-pulse" />
                <span className="font-medium">EM ANÁLISE</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ⏱️ Tempo estimado: <strong>24-48 horas</strong>
              </p>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              📧 Você receberá um email quando for aprovado.<br />
              📱 Ou use sua matrícula para acompanhar.
            </p>
            
            <div className="flex flex-col gap-3">
              <Link to="/login">
                <Button variant="hero" className="w-full group">
                  👁️ Acompanhar Status
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full">Voltar ao Início</Button>
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              📞 Dúvidas? (11) 99999-9999
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex flex-col items-center justify-center gap-2 mb-6 group">
          <div className="w-14 h-14 rounded-2xl gradient-button flex items-center justify-center transition-all duration-500 group-hover:scale-110 glow-primary">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-gradient">ISA</span>
        </Link>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all duration-300 ${
                  step >= s 
                    ? 'gradient-button text-primary-foreground glow-primary' 
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-1 rounded transition-all duration-300 ${
                  step > s ? 'bg-primary' : 'bg-secondary'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Card variant="glass" className="animate-scale-in">
          <CardContent className="pt-6 pb-6">
            {/* Step Header */}
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">PASSO {step}/3</p>
              <h2 className="text-xl font-bold">
                {step === 1 && "Dados Pessoais"}
                {step === 2 && "Dados Empresariais"}
                {step === 3 && "Termos e Finalização"}
              </h2>
            </div>

            {/* Step 1: Personal Data */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Nome Completo *
                  </label>
                  <Input
                    name="nome"
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={handleChange}
                    className="h-12 transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    Email *
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-12 transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    WhatsApp *
                  </label>
                  <Input
                    name="telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={handleChange}
                    className="h-12 transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business Data */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Nome da Empresa (opcional)
                  </label>
                  <Input
                    name="empresa"
                    placeholder="Nome da sua empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    className="h-12 transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    🏷️ Segmento
                  </label>
                  <Select 
                    value={formData.segmento} 
                    onValueChange={(value) => setFormData({ ...formData, segmento: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Selecione o segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="varejo">Varejo</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="industria">Indústria</SelectItem>
                      <SelectItem value="saude">Saúde</SelectItem>
                      <SelectItem value="educacao">Educação</SelectItem>
                      <SelectItem value="tecnologia">Tecnologia</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      📄 CPF *
                    </label>
                    <Input
                      name="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={handleChange}
                      className="h-12 transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      Nascimento
                    </label>
                    <Input
                      name="dataNascimento"
                      type="date"
                      value={formData.dataNascimento}
                      onChange={handleChange}
                      className="h-12 transition-all duration-200 focus:scale-[1.01]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Terms */}
            {step === 3 && (
              <div className="space-y-4 animate-fade-in">
                <div className="p-4 rounded-xl bg-secondary/30 border border-border">
                  <p className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary" />
                    TERMOS DE USO
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                      <Checkbox 
                        id="terms"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label htmlFor="terms" className="text-sm cursor-pointer">
                        Li e aceito os <span className="text-primary hover:underline">termos de uso</span> e a{" "}
                        <span className="text-primary hover:underline">política de privacidade</span> da plataforma ISA. *
                      </label>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                      <Checkbox 
                        id="marketing"
                        checked={marketingAccepted}
                        onCheckedChange={(checked) => setMarketingAccepted(checked as boolean)}
                        className="mt-0.5"
                      />
                      <label htmlFor="marketing" className="text-sm cursor-pointer">
                        Aceito receber comunicações e novidades por email.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium mb-2">📋 Resumo do Cadastro</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>👤 {formData.nome}</p>
                    <p>📧 {formData.email}</p>
                    <p>📱 {formData.telefone}</p>
                    {formData.empresa && <p>🏢 {formData.empresa}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setStep((step - 1) as Step)}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}
              
              {step < 3 ? (
                <Button 
                  variant="hero"
                  onClick={() => setStep((step + 1) as Step)}
                  disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
                  className="flex-1 h-12 group"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button 
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={isLoading || !isStep3Valid}
                  className="flex-1 h-12"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      ✨ FINALIZAR CADASTRO
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link to="/login" className="text-primary hover:underline transition-colors">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Cadastro;
