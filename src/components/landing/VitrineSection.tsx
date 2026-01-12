import { Button } from "@/components/ui/button";
import { Store, ShoppingBag, Palette, Share2, ArrowRight, Check, Sparkles } from "lucide-react";
import vitrineShowcase from "@/assets/vitrine-showcase.jpg";
import vitrineMobile from "@/assets/vitrine-mobile.jpg";

const features = [
  "Loja virtual pronta em minutos",
  "Tema claro, escuro ou personalizado",
  "Catálogo de produtos automático",
  "Link exclusivo para compartilhar",
  "Botão flutuante do WhatsApp",
  "100% responsivo para celular"
];

export function VitrineSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-950/10 to-background" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -translate-y-1/2" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 border border-purple-500/30">
            <Store className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">Novidade: Sua Loja Virtual</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Crie sua{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Vitrine Online
            </span>
            {" "}em segundos
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Uma loja virtual completa conectada ao seu WhatsApp. Seus clientes navegam pelos produtos e 
            pedem diretamente pelo chat.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left side - Features */}
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-6">
              {/* Feature cards */}
              <div className="glass rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Palette className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Personalize do Seu Jeito</h3>
                    <p className="text-muted-foreground">
                      Escolha cores, temas, banner e adicione anúncios promocionais. Sua marca, sua identidade.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 border border-primary/20 hover:border-primary/40 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Produtos Sincronizados</h3>
                    <p className="text-muted-foreground">
                      Cadastre uma vez, aparece em todos os lugares. A IA também usa para responder clientes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass rounded-2xl p-6 border border-accent/20 hover:border-accent/40 transition-all duration-300 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Share2 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Compartilhe com 1 Link</h3>
                    <p className="text-muted-foreground">
                      Envie o link da vitrine nas redes sociais, status ou para clientes. Sem baixar nada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div 
                  key={feature}
                  className="flex items-center gap-2 text-sm animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/25 group"
            >
              Criar Minha Vitrine
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Right side - Images */}
          <div className="relative animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {/* Desktop mockup */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-primary/30 rounded-3xl blur-2xl opacity-60" />
              
              <div className="relative glass rounded-2xl p-2 border border-purple-500/30 shadow-2xl shadow-purple-500/20">
                <img 
                  src={vitrineShowcase}
                  alt="Vitrine ISA - Loja Online"
                  className="rounded-xl w-full"
                />
              </div>
            </div>

            {/* Mobile mockup floating */}
            <div className="absolute -bottom-8 -left-8 w-40 md:w-52 animate-float">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-br from-primary/40 to-purple-500/40 rounded-3xl blur-xl" />
                <div className="relative glass rounded-2xl p-1 border border-primary/30">
                  <img 
                    src={vitrineMobile}
                    alt="Vitrine ISA Mobile"
                    className="rounded-xl w-full"
                  />
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 glass rounded-full px-4 py-2 border border-accent/30 animate-float" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm font-medium text-accent">Loja Online</span>
              </div>
            </div>

            {/* Stats badge */}
            <div className="absolute bottom-24 -right-4 md:right-4 glass rounded-xl px-4 py-3 border border-purple-500/30 animate-float" style={{ animationDelay: "1s" }}>
              <div className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  +500
                </div>
                <div className="text-xs text-muted-foreground">Vitrines criadas</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
