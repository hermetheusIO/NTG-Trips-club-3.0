import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { 
  ArrowLeft, Send, Sparkles, MapPin, Clock, Euro, 
  Users, Check, Loader2, AlertCircle, ChevronRight,
  Mountain, Coffee, Camera, Sunrise
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import type { TripStop, ItineraryItem } from "@shared/schema";

interface ProposalDraft {
  title: string;
  subtitle: string;
  narrativeShort: string;
  startCity: string;
  stops: TripStop[];
  durationHoursEst: number;
  difficulty: "leve" | "moderada";
  priceEstimated: {
    essential: { min: number; max: number };
    complete: { min: number; max: number };
  };
  itinerary: {
    essential: ItineraryItem[];
    complete: ItineraryItem[];
  };
  includes: string[];
  excludes: string[];
  optionalAddOns: Array<{
    name: string;
    description: string;
    priceSuggestion: { min: number; max: number };
  }>;
  tags: string[];
  capacitySuggestion: number;
  viabilityRule: { minInterested: number };
  coverImagePrompt: string;
}

const suggestedPrompts = [
  "Quero um bate-volta tranquilo à Serra da Estrela, com paisagens e queijo",
  "Um dia em Óbidos e Nazaré com tempo para fotografias",
  "Escapadela cultural ao Douro com visita a quinta vinícola",
  "Trilho leve na Serra da Lousã com almoço tradicional",
];

export default function TripsClubCreate() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const [userMessage, setUserMessage] = useState("");
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [activeTab, setActiveTab] = useState<"essential" | "complete">("essential");

  const generateMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch("/api/teresa/proposal-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userMessage: message }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao gerar roteiro");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setDraft(data.draft);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/teresa/save-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ draft }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao guardar proposta");
      }
      return res.json();
    },
    onSuccess: () => {
      navigate("/minha-conta");
    },
  });

  const handleGenerate = () => {
    if (userMessage.trim().length < 10) return;
    generateMutation.mutate(userMessage);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setUserMessage(prompt);
    generateMutation.mutate(prompt);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Crie o Seu Roteiro</h1>
          <p className="text-white/60 mb-8">
            Para criar propostas de viagem com a Teresa, precisa estar autenticado como membro do Club.
          </p>
          <a
            href="/api/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-bold rounded-full hover:bg-yellow-300 transition-all"
            data-testid="button-login"
          >
            Entrar no Club
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/trips-club">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center cursor-pointer" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </div>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Criar Proposta</h1>
            <p className="text-xs text-white/50">Com a Teresa</p>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!draft ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold mb-3">Descreva o seu bate-volta ideal</h2>
                <p className="text-white/60 max-w-md mx-auto">
                  A Teresa vai criar um roteiro realista, com experiências gratuitas e pagas, 
                  sempre a partir de Coimbra.
                </p>
              </div>

              <div className="space-y-4">
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Ex: Quero um dia tranquilo na Serra da Estrela, com paisagens bonitas e tempo para comer queijo da serra..."
                  className="w-full h-32 px-4 py-3 bg-zinc-900 border border-white/10 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 resize-none"
                  data-testid="input-message"
                />

                <button
                  onClick={handleGenerate}
                  disabled={userMessage.trim().length < 10 || generateMutation.isPending}
                  className="w-full py-4 bg-yellow-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-300 transition-all"
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      A Teresa está a criar...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Gerar Roteiro com Teresa
                    </>
                  )}
                </button>

                {generateMutation.isError && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{generateMutation.error.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm text-white/40 uppercase tracking-wider font-medium">Sugestões</p>
                <div className="grid gap-2">
                  {suggestedPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestedPrompt(prompt)}
                      disabled={generateMutation.isPending}
                      className="text-left p-4 bg-zinc-900/50 border border-white/5 rounded-xl hover:border-yellow-400/30 hover:bg-zinc-900 transition-all disabled:opacity-50"
                      data-testid={`button-suggestion-${i}`}
                    >
                      <p className="text-white/80 text-sm">{prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="p-6 bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/20 rounded-3xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-1" data-testid="text-title">{draft.title}</h2>
                    <p className="text-yellow-400 text-sm font-medium">{draft.subtitle}</p>
                  </div>
                </div>
                <p className="text-white/70 leading-relaxed">{draft.narrativeShort}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-zinc-900 rounded-2xl text-center">
                  <MapPin className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Partida</p>
                  <p className="text-white font-medium">{draft.startCity}</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-2xl text-center">
                  <Clock className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Duração</p>
                  <p className="text-white font-medium">{draft.durationHoursEst}h</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-2xl text-center">
                  <Mountain className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Esforço</p>
                  <p className="text-white font-medium capitalize">{draft.difficulty}</p>
                </div>
                <div className="p-4 bg-zinc-900 rounded-2xl text-center">
                  <Users className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Grupo</p>
                  <p className="text-white font-medium">até {draft.capacitySuggestion}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-yellow-400" />
                  Paragens ({draft.stops.length})
                </h3>
                {draft.stops.map((stop, i) => (
                  <div key={i} className="p-5 bg-zinc-900 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-white">{stop.name}</h4>
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/60 capitalize">
                        {stop.effort}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium text-sm">{stop.freeExperience.label}</p>
                          <p className="text-white/50 text-xs">{stop.freeExperience.details}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
                        <Euro className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white font-medium text-sm">{stop.paidExperience.label}</p>
                          <p className="text-white/50 text-xs">{stop.paidExperience.details}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("essential")}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      activeTab === "essential"
                        ? "bg-yellow-400 text-black"
                        : "bg-zinc-900 text-white/60 hover:text-white"
                    }`}
                    data-testid="tab-essential"
                  >
                    Essencial (€{draft.priceEstimated.essential.min}-{draft.priceEstimated.essential.max})
                  </button>
                  <button
                    onClick={() => setActiveTab("complete")}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      activeTab === "complete"
                        ? "bg-yellow-400 text-black"
                        : "bg-zinc-900 text-white/60 hover:text-white"
                    }`}
                    data-testid="tab-complete"
                  >
                    Completa (€{draft.priceEstimated.complete.min}-{draft.priceEstimated.complete.max})
                  </button>
                </div>

                <div className="space-y-3">
                  {(activeTab === "essential" ? draft.itinerary.essential : draft.itinerary.complete).map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-zinc-900/50 rounded-xl">
                      <div className="flex flex-col items-center">
                        <span className="text-yellow-400 font-bold text-sm">{item.time}</span>
                        {i < (activeTab === "essential" ? draft.itinerary.essential : draft.itinerary.complete).length - 1 && (
                          <div className="w-0.5 flex-1 bg-white/10 mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-white/50 text-sm">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-5 bg-zinc-900 rounded-2xl">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Inclui
                  </h4>
                  <ul className="space-y-2">
                    {draft.includes.map((item, i) => (
                      <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-5 bg-zinc-900 rounded-2xl">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-white/40" />
                    Não inclui
                  </h4>
                  <ul className="space-y-2">
                    {draft.excludes.map((item, i) => (
                      <li key={i} className="text-white/50 text-sm">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-yellow-400/10 text-yellow-400 text-xs font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 sticky bottom-4">
                <button
                  onClick={() => setDraft(null)}
                  className="flex-1 py-4 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all"
                  data-testid="button-regenerate"
                >
                  Gerar Novo
                </button>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="flex-1 py-4 bg-yellow-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-yellow-300 transition-all"
                  data-testid="button-save"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar para Revisão
                    </>
                  )}
                </button>
              </div>

              {saveMutation.isError && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{saveMutation.error.message}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
