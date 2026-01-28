import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import bgImage from "@assets/generated_images/mystical_stone_path_in_fog.png";

type Question = {
  id: number;
  question: string;
  type: "choice" | "multi-choice" | "text";
  options?: string[];
};

const questions: Question[] = [
  {
    id: 1,
    question: "Primeira vez em Coimbra?",
    type: "choice",
    options: ["Sim, primeira vez", "Não, já visitei antes", "Moro aqui"],
  },
  {
    id: 2,
    question: "Quantos dias vai ficar?",
    type: "choice",
    options: ["Apenas 1 dia", "2-3 dias", "4-7 dias", "Mais de uma semana"],
  },
  {
    id: 3,
    question: "Viaja sozinho(a) ou acompanhado(a)?",
    type: "choice",
    options: ["Sozinho(a)", "Casal", "Família com crianças", "Grupo de amigos"],
  },
  {
    id: 4,
    question: "Que tipo de experiência procura?",
    type: "multi-choice",
    options: [
      "🏛️ História Secreta",
      "🍷 Gastronomia Local",
      "🌿 Natureza & Trilhas",
      "👻 Lendas & Mistérios",
      "🎨 Arte & Cultura",
      "🍺 Vida Noturna",
    ],
  },
  {
    id: 5,
    question: "Como nos conheceu?",
    type: "choice",
    options: ["Instagram", "Google", "Indicação de amigos", "Outro"],
  },
];

export default function QualificationPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const handleOptionSelect = (option: string) => {
    if (currentQuestion.type === "multi-choice") {
      const current = answers[currentQuestion.id] || [];
      const updated = current.includes(option)
        ? current.filter((item: string) => item !== option)
        : [...current, option];
      setAnswers({ ...answers, [currentQuestion.id]: updated });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: option });
      setTimeout(() => handleNext(), 300); // Auto advance for single choice
    }
  };

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      setLocation("/");
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setLocation("/confirmacao");
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-black text-white font-sans flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        <img
          src={bgImage}
          alt="Foggy Path"
          className="w-full h-full object-cover opacity-60 blur-sm scale-105"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 flex-1 flex flex-col max-w-md mx-auto w-full px-6 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="text-sm font-medium text-white/60">
            Passo {step + 1} de {questions.length}
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10 rounded-full mb-12 overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-bold leading-tight">
                {currentQuestion.question}
              </h2>

              <div className="space-y-3">
                {currentQuestion.options?.map((option, idx) => {
                  const isSelected = 
                    currentQuestion.type === "multi-choice"
                      ? (answers[currentQuestion.id] || []).includes(option)
                      : answers[currentQuestion.id] === option;

                  return (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleOptionSelect(option)}
                      className={`w-full p-4 rounded-xl text-left transition-all duration-200 border flex items-center justify-between group ${
                        isSelected
                          ? "bg-primary text-black border-primary font-bold shadow-[0_0_20px_rgba(250,204,21,0.2)]"
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/30"
                      }`}
                    >
                      <span className="text-lg">{option}</span>
                      {isSelected && <Check className="w-5 h-5" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="mt-8">
          {currentQuestion.type === "multi-choice" && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]?.length}
              className={`w-full py-4 rounded-full flex items-center justify-center space-x-2 font-bold text-lg transition-all ${
                answers[currentQuestion.id]?.length
                  ? "bg-white text-black hover:bg-white/90"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              <span>Continuar</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-white font-medium animate-pulse">Enviando para a Teresa...</p>
          </div>
        </div>
      )}
    </div>
  );
}
