import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, MessageSquare, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroSection() {
  const scrollToChat = () => {
    document.getElementById("chat-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* WhatsApp decorative bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-3 h-3 rounded-full bg-green-500/30 animate-float" style={{ animationDelay: "0s" }} />
        <div className="absolute top-40 right-20 w-4 h-4 rounded-full bg-green-500/20 animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-40 left-20 w-2 h-2 rounded-full bg-green-500/40 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 right-1/4 w-5 h-5 rounded-full bg-primary/20 animate-float" style={{ animationDelay: "0.5s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 rounded-full bg-purple-500/20 animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container relative z-10 px-4 py-12">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">Automação inteligente 24/7 no WhatsApp</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 animate-slide-up leading-tight">
            Automatize <span className="text-gradient">100%</span> do seu{" "}
            <span className="inline-flex items-center gap-2">
              <MessageSquare className="w-10 h-10 md:w-14 md:h-14 text-green-500" />
              WhatsApp
            </span>{" "}
            com IA
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: "0.1s" }}>
            A <span className="text-primary font-semibold">ISA 2.5</span> é o assistente de IA que conversa com seus clientes, 
            organiza pedidos e deixa sua equipe livre para o que importa.{" "}
            <span className="text-foreground">Atenda 24h e Venda Mais.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button
              onClick={scrollToChat}
              variant="hero"
              size="xl"
              className="group"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Experimente a IA
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Link to="/cadastro">
              <Button variant="outline" size="xl" className="border-primary/50 hover:border-primary hover:bg-primary/10">
                Quero Começar
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {[
              { value: "99.9%", label: "Uptime garantido" },
              { value: "24/7", label: "Disponível sempre" },
              { value: "<1s", label: "Tempo de resposta" },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 md:p-6 border border-border/50">
                <div className="text-2xl md:text-4xl font-bold text-gradient">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce-arrow flex justify-center">
            <button onClick={scrollToChat} className="text-muted-foreground hover:text-primary transition-colors">
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
