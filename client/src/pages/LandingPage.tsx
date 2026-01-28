import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Map, Compass, Sparkles, ChevronRight, BookOpen } from "lucide-react";
import bgImage from "@assets/generated_images/mysterious_stone_doorway_in_forest.png";
import ntgLogo from "@assets/ntg-logo_1767353783208.png";
import Footer from "@/components/Footer";

export default function LandingPage() {
  const [lang, setLang] = useState<"PT" | "EN" | "ES">("PT");

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black text-white font-sans selection:bg-primary selection:text-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/95 z-10" />
        <img
          src={bgImage}
          alt="Coimbra"
          className="w-full h-full object-cover opacity-70 scale-105"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-20 flex flex-col min-h-screen max-w-md mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center space-y-5 mt-6">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-20 h-20 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.3)]"
          >
            <img src={ntgLogo} alt="NonTourist Guide" className="w-full h-full object-cover" />
          </motion.div>

          {/* Welcome Text */}
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-medium tracking-wide text-white/90"
          >
            Welcome to Coimbra!
          </motion.h2>

          {/* Language Switcher */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-1 bg-white/10 backdrop-blur-md rounded-full px-1 py-1"
          >
            {(["PT", "EN", "ES"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                data-testid={`lang-switch-${l}`}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  lang === l 
                    ? "bg-primary text-black shadow-lg" 
                    : "text-white/70 hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mt-10 mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold leading-[1.15] tracking-tight"
          >
            Coimbra como você <br />
            nunca viveu.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/70 text-sm mt-4 max-w-xs leading-relaxed"
          >
            Sem tour genérico. Sem armadilha turística.<br/>
            Curadoria real da NTG.
          </motion.p>
        </div>

        {/* Main CTAs */}
        <div className="flex-1 flex flex-col space-y-4">
          
          {/* CTA 1 - Primary: Conhecer Coimbra */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/coimbra/conhecer/form">
              <button 
                data-testid="cta-conhecer"
                className="w-full bg-primary hover:bg-primary/90 text-black rounded-2xl p-5 text-left transition-all group shadow-lg shadow-primary/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-bold text-lg">Quero conhecer Coimbra</span>
                    </div>
                    <p className="text-black/70 text-xs leading-relaxed">
                      Fale com a Teresa, nossa Guia de Inteligência Orgânica. Pergunte sobre pontos de interesse, onde comer e o que fazer.
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 mt-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </Link>
          </motion.div>

          {/* CTA 2 - Viver Coimbra */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link href="/coimbra/viver">
              <button 
                data-testid="cta-viver"
                className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white rounded-2xl p-5 text-left transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="font-bold text-lg">Quero viver Coimbra</span>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">
                      Experiências recomendadas (pagas e gratuitas)
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 mt-1 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </button>
            </Link>
          </motion.div>

          {/* CTA 3 - Outros Lugares */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Link href="/viagens/lista">
              <button 
                data-testid="cta-trips"
                className="w-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/10 text-white rounded-2xl p-5 text-left transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Compass className="w-5 h-5 text-primary" />
                      <span className="font-bold text-lg">Quero conhecer outros lugares</span>
                    </div>
                    <p className="text-white/60 text-xs leading-relaxed">
                      Day-trips e viagens curadas saindo de Coimbra
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 mt-1 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </button>
            </Link>
          </motion.div>

          {/* Digitais - Secondary/Less prominent */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="pt-2"
          >
            <Link href="/digitais">
              <button 
                data-testid="cta-digitais"
                className="w-full text-center py-3 text-white/50 hover:text-white/80 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Dicas rápidas (sem conversa)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        </div>

      </div>
      
      <div className="relative z-20">
        <Footer variant="compact" />
      </div>
    </div>
  );
}
