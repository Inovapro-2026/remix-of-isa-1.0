import { Card, CardContent } from "@/components/ui/card";
import { Bot, MessageSquare, Shield, Zap, Users, BarChart3, Laptop, Clock } from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "IA 24/7 no WhatsApp",
    description: "Atendimento automático inteligente que nunca dorme. Responde seus clientes a qualquer hora.",
    color: "primary",
  },
  {
    icon: Laptop,
    title: "Painel de Gestão em Tempo Real",
    description: "Visualize todas as conversas, métricas e configure a IA em um dashboard completo.",
    color: "purple",
  },
  {
    icon: Users,
    title: "Transição Perfeita para Humano",
    description: "A IA sabe quando passar a conversa para sua equipe. Sem fricção para o cliente.",
    color: "accent",
  },
  {
    icon: Zap,
    title: "Resposta em Menos de 1 Segundo",
    description: "Velocidade que impressiona. Seus clientes nunca mais vão esperar.",
    color: "primary",
  },
  {
    icon: Shield,
    title: "Segurança e Conformidade LGPD",
    description: "Dados criptografados, armazenamento seguro e total conformidade legal.",
    color: "purple",
  },
  {
    icon: BarChart3,
    title: "Relatórios e Analytics",
    description: "Métricas detalhadas de conversas, conversões e performance da IA.",
    color: "accent",
  },
];

export function FeaturesSection() {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          bg: "bg-purple-500/10",
          text: "text-purple-400",
          glow: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]",
        };
      case "accent":
        return {
          bg: "bg-accent/10",
          text: "text-accent",
          glow: "group-hover:shadow-[0_0_30px_rgba(34,197,94,0.3)]",
        };
      default:
        return {
          bg: "bg-primary/10",
          text: "text-primary",
          glow: "group-hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]",
        };
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 border border-border/50">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm">Como a ISA revoluciona seu atendimento</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que você precisa em{" "}
            <span className="text-gradient">uma plataforma</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Automatize, gerencie e escale seu atendimento com inteligência artificial
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            return (
              <Card
                key={feature.title}
                variant="gradient"
                className={`group hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 animate-slide-up ${colors.glow}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-5 transition-all duration-300`}
                  >
                    <feature.icon className={`w-7 h-7 ${colors.text}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Dashboard mockup */}
        <div className="mt-20 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />
            
            {/* Mockup */}
            <div className="relative glass rounded-2xl p-2 border border-border/50">
              <div className="bg-card rounded-xl overflow-hidden">
                {/* Browser header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-accent/70" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                      isa.app/admin/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard preview */}
                <div className="p-6 h-64 md:h-80 flex items-center justify-center bg-gradient-to-br from-background to-secondary/30">
                  <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gradient">1.2K</div>
                      <div className="text-xs text-muted-foreground">Conversas</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-accent">98%</div>
                      <div className="text-xs text-muted-foreground">Satisfação</div>
                    </div>
                    <div className="glass rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">24/7</div>
                      <div className="text-xs text-muted-foreground">Online</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
