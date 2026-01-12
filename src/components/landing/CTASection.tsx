import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container px-4 relative">
        <div className="glass rounded-3xl p-8 md:p-16 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para revolucionar seu
            <span className="text-gradient block">atendimento?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Junte-se a milhares de empresas que já automatizaram seu atendimento com a ISA. 
            Comece seu teste gratuito hoje.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro">
              <Button variant="hero" size="lg">
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="glass" size="lg">
                Já tenho conta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
