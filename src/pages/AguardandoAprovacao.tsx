import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Clock, Copy, Check, ArrowRight, Home } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const AguardandoAprovacao = () => {
  const [searchParams] = useSearchParams();
  const matricula = searchParams.get("matricula") || "";
  const [copied, setCopied] = useState(false);

  const handleCopyMatricula = async () => {
    if (!matricula) return;
    
    try {
      await navigator.clipboard.writeText(matricula);
      setCopied(true);
      toast.success("Matrícula copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
      </div>

      <Card variant="glass" className="max-w-md w-full text-center animate-scale-in relative z-10">
        <CardContent className="pt-8 pb-8">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-center justify-center gap-2 mb-6 group">
            <div className="w-14 h-14 rounded-2xl gradient-button flex items-center justify-center transition-all duration-500 group-hover:scale-110 glow-primary">
              <Bot className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-gradient">ISA</span>
          </Link>

          {/* Loading Icon */}
          <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500/50 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2">⏳ Aguardando Aprovação</h2>
          <p className="text-muted-foreground mb-6">
            Seu cadastro está em análise.<br />
            Aprovação em até <strong>24 horas</strong>.
          </p>
          
          {/* Matricula Display */}
          {matricula && (
            <div className="mb-6 p-6 rounded-2xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-muted-foreground mb-3">📋 SUA MATRÍCULA</p>
              <div className="flex justify-center gap-2 mb-4">
                {matricula.split('').map((digit, idx) => (
                  <div 
                    key={idx}
                    className="w-12 h-14 rounded-lg gradient-button flex items-center justify-center text-2xl font-bold text-primary-foreground animate-scale-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {digit}
                  </div>
                ))}
              </div>
              
              {/* Copy Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyMatricula}
                className="gap-2 transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-accent" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Matrícula
                  </>
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground mt-3">
                Guarde este número! Você usará para acessar a plataforma.
              </p>
            </div>
          )}

          {/* Status Info */}
          <div className="mb-6 p-4 rounded-xl bg-secondary/30 border border-border">
            <div className="flex items-center justify-center gap-2 text-yellow-500 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span className="font-medium">ANÁLISE EM ANDAMENTO</span>
            </div>
            <p className="text-sm text-muted-foreground">
              📧 Você receberá um email quando sua conta for aprovada.<br />
              📱 Ou use sua matrícula para verificar o status.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Link to="/login">
              <Button variant="hero" className="w-full group">
                Ir para Login
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full gap-2">
                <Home className="w-4 h-4" />
                Voltar ao Início
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            📞 Dúvidas? Entre em contato conosco
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AguardandoAprovacao;
