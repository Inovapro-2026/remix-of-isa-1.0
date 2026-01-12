import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ChatSection } from "@/components/landing/ChatSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { VitrineSection } from "@/components/landing/VitrineSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { OfferSection } from "@/components/landing/OfferSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { FloatingRobots } from "@/components/landing/FloatingRobots";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <FloatingRobots />
      <Header />
      <main className="relative z-10">
        <HeroSection />
        <ChatSection />
        <FeaturesSection />
        <VitrineSection />
        <OfferSection />
        <TestimonialsSection />
        <FinalCTA />
      </main>
    </div>
  );
};

export default Index;
