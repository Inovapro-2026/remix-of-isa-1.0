import { Bot } from "lucide-react";

export function FloatingRobots() {
  return (
    <>
      {/* Left robot */}
      <div className="fixed left-4 md:left-8 top-1/4 opacity-20 animate-float pointer-events-none hidden lg:block">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl" />
          <Bot className="w-16 h-16 text-primary relative z-10" />
        </div>
      </div>

      {/* Right robot */}
      <div
        className="fixed right-4 md:right-8 top-2/3 opacity-15 animate-float pointer-events-none hidden lg:block"
        style={{ animationDelay: "2s" }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl" />
          <Bot className="w-20 h-20 text-purple-400 relative z-10" />
        </div>
      </div>

      {/* Bottom left robot */}
      <div
        className="fixed left-12 bottom-1/4 opacity-10 animate-float pointer-events-none hidden xl:block"
        style={{ animationDelay: "4s" }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-accent/30 rounded-full blur-2xl" />
          <Bot className="w-12 h-12 text-accent relative z-10" />
        </div>
      </div>
    </>
  );
}
