import { Check, ShoppingCart, Zap, Shield, Clock, Headphones, Users, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Zap, text: "Conexão WhatsApp + IA 24/7" },
  { icon: Shield, text: "Painel de Controle Completo" },
  { icon: Headphones, text: "Atendimento Humano Integrado" },
  { icon: Users, text: "Suporte Técnico Prioritário" },
  { icon: Check, text: "Cadastro e Aprovação de Clientes" },
  { icon: CreditCard, text: "Sem taxa de instalação" },
];

export function OfferCard() {
  const checkoutUrl = "https://www.mercadopago.com.br/checkout/v1/payment/redirect/?preference-id=2453606405-b86681ca-7376-488b-96e2-92cc35d6ad0c&router-request-id=0785cfe5-a8ee-4792-be07-b3ed46b2faf3";

  return (
    <div className="relative group">
      {/* Animated glow background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-accent rounded-3xl opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
      
      {/* Card */}
      <div className="relative glass rounded-2xl p-8 border border-primary/30">
        {/* Badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            OFERTA ESPECIAL
          </div>
        </div>

        {/* Header */}
        <div className="text-center mt-4 mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-2">
            Comece Agora por Apenas
          </h3>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-lg text-muted-foreground">R$</span>
            <span className="text-6xl md:text-7xl font-bold text-gradient">97</span>
            <span className="text-lg text-muted-foreground">/mês</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-4 mb-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <benefit.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button
            size="xl"
            className="w-full bg-gradient-to-r from-accent to-green-500 hover:from-accent/90 hover:to-green-500/90 text-accent-foreground font-bold text-lg py-6 rounded-xl shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 transition-all duration-300 group"
          >
            <ShoppingCart className="w-5 h-5 mr-2 group-hover:animate-bounce" />
            QUERO A ISA AGORA!
          </Button>
        </a>

        {/* Guarantee */}
        <div className="mt-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-accent" />
              <span>Aprovação imediata</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              <span>Acesso em 5 minutos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Headphones className="w-4 h-4 text-accent" />
              <span>Suporte 7 dias</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
