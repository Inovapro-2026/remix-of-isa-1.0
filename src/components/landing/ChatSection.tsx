import { IsaChatWidget } from "./IsaChatWidget";
import { Bot, MessageSquare, Sparkles } from "lucide-react";

export function ChatSection() {
  return (
    <section id="chat-section" className="relative py-20 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 border border-primary/30">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm">Demonstração ao vivo</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Converse com a <span className="text-gradient">ISA</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Experimente agora mesmo como funciona o atendimento automatizado. 
            Pergunte sobre funcionalidades, planos ou tire suas dúvidas!
          </p>
        </div>

        {/* Chat widget + decorative elements */}
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - Info cards */}
          <div className="space-y-6 order-2 lg:order-1">
            {/* Feature cards */}
            <div className="glass rounded-2xl p-6 border border-border/50 animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Respostas Instantâneas</h3>
                  <p className="text-muted-foreground">
                    A ISA responde em menos de 1 segundo, 24 horas por dia, sem deixar nenhum cliente esperando.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Inteligência Contextual</h3>
                  <p className="text-muted-foreground">
                    Entende o contexto da conversa e mantém o histórico para respostas mais precisas e personalizadas.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-border/50 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Nativo do WhatsApp</h3>
                  <p className="text-muted-foreground">
                    Integração completa com WhatsApp Business. Seus clientes conversam no app que já conhecem.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Chat widget */}
          <div className="order-1 lg:order-2">
            <IsaChatWidget />
          </div>
        </div>
      </div>
    </section>
  );
}
