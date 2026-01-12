import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Carlos Mendes",
    company: "Auto Peças Premium",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos",
    text: "A ISA revolucionou nosso atendimento. Antes perdíamos vendas à noite, agora vendemos 24h!",
    rating: 5,
  },
  {
    name: "Ana Beatriz",
    company: "Clínica Estética Bella",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=ana",
    text: "Impressionante como a IA entende o contexto. Nossos clientes nem percebem que é automático.",
    rating: 5,
  },
  {
    name: "Roberto Silva",
    company: "Tech Solutions",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=roberto",
    text: "O painel de controle é incrível. Tenho visão total de todas as conversas em tempo real.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      <div className="container px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que dizem quem já usa a{" "}
            <span className="text-gradient">ISA</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Empresas de todos os tamanhos confiam na ISA para automatizar seu
            atendimento
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-colors duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-primary/30 mb-4" />

              {/* Text */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full bg-secondary"
                />
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
