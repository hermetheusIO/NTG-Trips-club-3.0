import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, Check, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface OnboardingData {
  ritmo: string;
  motivacao: string;
  grupo: string;
  planejamento: string;
  social: string;
  contexto: string;
  cidadeBase: string;
}

const initialData: OnboardingData = {
  ritmo: "",
  motivacao: "",
  grupo: "",
  planejamento: "",
  social: "",
  contexto: "",
  cidadeBase: ""
};

const questions = [
  {
    id: "ritmo",
    title: "Como você prefere viver um dia de viagem?",
    options: [
      { value: "lento", label: "Com tempo, pausas e pouca pressa" },
      { value: "moderado", label: "Em movimento, mas sem correria" },
      { value: "intenso", label: "Quero aproveitar bastante o dia" }
    ]
  },
  {
    id: "motivacao",
    title: "O que mais te puxa para uma viagem?",
    options: [
      { value: "natureza", label: "Natureza e paisagens" },
      { value: "cultura", label: "História e contexto" },
      { value: "gastronomia", label: "Sabores e gastronomia" },
      { value: "visual", label: "Estética e cenários" },
      { value: "exploracao", label: "Ir onde quase ninguém vai" }
    ]
  },
  {
    id: "grupo",
    title: "Você se sente melhor viajando como?",
    options: [
      { value: "onibus", label: "Grupo maior, bem organizado" },
      { value: "van", label: "Grupo pequeno, mais próximo" },
      { value: "pequeno", label: "Pouquíssimas pessoas" },
      { value: "flexivel", label: "Depende da viagem" }
    ]
  },
  {
    id: "planejamento",
    title: "Qual frase mais parece com você?",
    options: [
      { value: "estruturado", label: "Gosto de saber tudo antes de ir" },
      { value: "equilibrado", label: "Prefiro estrutura com alguma liberdade" },
      { value: "aberto", label: "Gosto de deixar espaço para o inesperado" }
    ]
  },
  {
    id: "social",
    title: "Antes mesmo da viagem, você prefere:",
    options: [
      { value: "publico", label: "Conhecer quem também se interessou" },
      { value: "anonimo", label: "Só observar, sem me expor" },
      { value: "flexivel", label: "Depende da viagem" }
    ]
  },
  {
    id: "contexto",
    title: "Hoje, você está:",
    options: [
      { value: "residente", label: "Morando em Portugal" },
      { value: "visitante", label: "Visitando Portugal" },
      { value: "hibrido", label: "Um pouco dos dois" }
    ],
    hasTextField: true,
    textFieldLabel: "Cidade base (opcional)"
  }
];

function getTribeResult(data: OnboardingData): { primary: string; secondary: string; description: string } {
  const motivationToTribe: Record<string, string> = {
    natureza: "Os Caminhantes",
    cultura: "Os Curiosos",
    gastronomia: "Os Sensoriais",
    visual: "Os Visuais",
    exploracao: "Os Fora do Mapa"
  };

  const ritmoToTribe: Record<string, string> = {
    lento: "Os Contemplativos",
    moderado: "Os Curiosos",
    intenso: "Os Pragmáticos"
  };

  const primary = motivationToTribe[data.motivacao] || "Os Curiosos";
  const secondary = ritmoToTribe[data.ritmo] || "Os Caminhantes";

  const ritmoText = data.ritmo === "lento" ? "tranquilo" : data.ritmo === "moderado" ? "moderado" : "intenso";
  const grupoText = data.grupo === "onibus" ? "grupos maiores" : data.grupo === "van" ? "grupos pequenos" : data.grupo === "pequeno" ? "pouquíssimas pessoas" : "formato flexível";
  const motivacaoText = data.motivacao === "natureza" ? "natureza" : data.motivacao === "cultura" ? "história e cultura" : data.motivacao === "gastronomia" ? "gastronomia" : data.motivacao === "visual" ? "cenários visuais" : "exploração";

  return {
    primary,
    secondary,
    description: `Pelo seu perfil, você tende a gostar de viagens com ritmo ${ritmoText}, ${grupoText} e foco em ${motivacaoText}.`
  };
}

const STORAGE_KEY = "ntg_onboarding_data";

export default function TripsClubOnboarding() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(-1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileData)
      });
      if (!response.ok) throw new Error("Failed to save profile");
      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem(STORAGE_KEY);
      setProfileSaved(true);
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
        if (parsed.motivacao && parsed.ritmo) {
          setShowResult(true);
        }
      } catch (e) {
        console.error("Error parsing saved data:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && showResult && !profileSaved && !saveProfileMutation.isPending) {
      const tribeResult = getTribeResult(data);
      saveProfileMutation.mutate({
        primaryTribe: tribeResult.primary,
        secondaryTribe: tribeResult.secondary,
        ritmo: data.ritmo,
        motivacao: data.motivacao,
        grupo: data.grupo,
        planejamento: data.planejamento,
        social: data.social,
        contexto: data.contexto,
        cidadeBase: data.cidadeBase
      });
    }
  }, [isAuthenticated, showResult, profileSaved]);

  const totalSteps = questions.length;
  const progress = currentStep >= 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const handleSelect = (questionId: string, value: string) => {
    setData(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (currentStep === 0) {
      setCurrentStep(-1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowResult(true);
    setIsSubmitting(false);
  };

  const handleLoginAndContinue = () => {
    window.location.href = "/api/login";
  };

  const currentQuestion = currentStep >= 0 ? questions[currentStep] : null;
  const currentValue = currentQuestion ? data[currentQuestion.id as keyof OnboardingData] : "";
  const canProceed = currentQuestion ? !!currentValue : true;

  const tribeResult = getTribeResult(data);

  if (showResult) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center mx-auto mb-8">
            <Check className="w-10 h-10 text-black" />
          </div>
          
          <h1 className="text-4xl font-black text-white mb-4" data-testid="text-result-title">
            Sua tribo está formada.
          </h1>
          
          <div className="p-6 rounded-2xl bg-zinc-900 border border-white/10 mb-8">
            <p className="text-white/80 text-lg mb-6">{tribeResult.description}</p>
            
            <div className="flex flex-wrap justify-center gap-3">
              <span className="px-4 py-2 rounded-full bg-yellow-400 text-black font-bold text-sm" data-testid="text-primary-tribe">
                {tribeResult.primary}
              </span>
              <span className="px-4 py-2 rounded-full bg-white/10 text-white/70 font-medium text-sm" data-testid="text-secondary-tribe">
                {tribeResult.secondary}
              </span>
            </div>
          </div>
          
          {authLoading ? (
            <div className="flex items-center justify-center gap-3 text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
              A verificar...
            </div>
          ) : isAuthenticated ? (
            <div className="space-y-4">
              {saveProfileMutation.isPending ? (
                <div className="flex items-center justify-center gap-3 text-white/60">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  A guardar o seu perfil...
                </div>
              ) : (
                <>
                  <p className="text-green-400 text-sm mb-4">
                    Perfil guardado com sucesso!
                  </p>
                  <Link href="/minha-conta">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                      data-testid="button-view-trips"
                    >
                      Ver trips disponíveis
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-white/60 text-sm">
                Para guardar o seu perfil e ver as viagens,
                <br />precisa criar uma conta ou entrar.
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLoginAndContinue}
                className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all"
                data-testid="button-login-continue"
              >
                <LogIn className="w-5 h-5" />
                Entrar / Criar conta
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <Link href="/trips-club">
            <div className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-colors cursor-pointer" data-testid="link-back-to-club">
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </div>
          </Link>
          
          <h1 className="text-4xl font-black text-white mb-4" data-testid="text-onboarding-title">
            Como você gosta de viajar?
          </h1>
          
          <p className="text-white/60 text-lg mb-12">
            Sem certo ou errado. Queremos entender seu ritmo.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setCurrentStep(0)}
            className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all"
            data-testid="button-start-onboarding"
          >
            Começar
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1 max-w-xs mx-4">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-yellow-400 rounded-full"
            />
          </div>
        </div>
        
        <span className="text-white/50 text-sm font-medium">
          {currentStep + 1}/{totalSteps}
        </span>
      </header>
      
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-lg w-full"
            >
              <h2 className="text-2xl md:text-3xl font-black text-white mb-8 text-center" data-testid="text-question-title">
                {currentQuestion.title}
              </h2>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelect(currentQuestion.id, option.value)}
                    className={`w-full p-5 rounded-2xl text-left transition-all ${
                      currentValue === option.value
                        ? "bg-yellow-400 text-black font-bold"
                        : "bg-zinc-900 text-white/80 hover:bg-zinc-800 border border-white/5"
                    }`}
                    data-testid={`button-option-${option.value}`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
              
              {currentQuestion.hasTextField && (
                <div className="mt-6">
                  <label className="block text-white/50 text-sm mb-2">
                    {currentQuestion.textFieldLabel}
                  </label>
                  <input
                    type="text"
                    value={data.cidadeBase}
                    onChange={(e) => setData(prev => ({ ...prev, cidadeBase: e.target.value }))}
                    placeholder="Ex: Lisboa, Porto, Coimbra..."
                    className="w-full p-4 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-yellow-400"
                    data-testid="input-cidade-base"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      
      <footer className="p-6">
        <motion.button
          whileHover={{ scale: canProceed ? 1.02 : 1 }}
          whileTap={{ scale: canProceed ? 0.98 : 1 }}
          onClick={handleNext}
          disabled={!canProceed || isSubmitting}
          className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
            canProceed
              ? "bg-yellow-400 hover:bg-yellow-300 text-black"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
          data-testid="button-next"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              A processar...
            </>
          ) : currentStep === totalSteps - 1 ? (
            <>
              Concluir
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </footer>
    </div>
  );
}
