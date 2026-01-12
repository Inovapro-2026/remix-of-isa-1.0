import { OfferCard } from "./OfferCard";
import { Rocket } from "lucide-react";

export function OfferSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 border border-accent/30">
            <Rocket className="w-4 h-4 text-accent" />
            <span className="text-sm">Planos e Investimento</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Transforme seu atendimento{" "}
            <span className="text-gradient">hoje</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Comece a usar a ISA agora mesmo e veja resultados imediatos no seu negócio
          </p>
        </div>

        {/* Offer card */}
        <div className="max-w-lg mx-auto">
          <OfferCard />
        </div>
      </div>
    </section>
  );
}
