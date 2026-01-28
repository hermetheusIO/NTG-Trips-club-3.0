import { useState, useReducer } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, ArrowRight, Check, Clock, Users, 
  Compass, MessageCircle, User, MapPin, Send, Sparkles, Map, Utensils, TreePine, Star
} from "lucide-react";
import { 
  CountryCode, TimeBucket, PartyType, InterestType, GuidanceStyle, AgeRange, 
  LeadState, generateLeadJSON, LeadData 
} from "@/lib/lead";

// --- State Management ---

type Action = 
  | { type: 'SET_COUNTRY', payload: { code: CountryCode; name: string } }
  | { type: 'SET_TIME', payload: TimeBucket }
  | { type: 'SET_PARTY', payload: PartyType }
  | { type: 'TOGGLE_INTEREST', payload: InterestType }
  | { type: 'SET_STYLE', payload: GuidanceStyle }
  | { type: 'SET_NAME', payload: string }
  | { type: 'SET_AGE', payload: AgeRange | undefined }
  | { type: 'RESET' };

const initialState: LeadState = {
  interests: []
};

function reducer(state: LeadState, action: Action): LeadState {
  switch (action.type) {
    case 'SET_COUNTRY': return { ...state, country: action.payload };
    case 'SET_TIME': return { ...state, timeBucket: action.payload };
    case 'SET_PARTY': return { ...state, partyType: action.payload };
    case 'TOGGLE_INTEREST': 
      const exists = state.interests.includes(action.payload);
      return { 
        ...state, 
        interests: exists 
          ? state.interests.filter(i => i !== action.payload)
          : [...state.interests, action.payload]
      };
    case 'SET_STYLE': return { ...state, guidanceStyle: action.payload };
    case 'SET_NAME': return { ...state, firstName: action.payload };
    case 'SET_AGE': return { ...state, ageRange: action.payload };
    case 'RESET': return initialState;
    default: return state;
  }
}

// --- Layout Component ---

const WizardLayout = ({ 
  children, 
  title, 
  subtitle, 
  progress, 
  onBack,
  canContinue,
  onContinue,
  showContinue = true,
  continueText = "Continuar",
  showSkip = false,
  onSkip
}: any) => (
  <div className="min-h-screen bg-black text-white flex flex-col items-center p-6 relative overflow-hidden">
    {/* Progress Bar */}
    <div className="w-full max-w-md h-0.5 bg-white/10 rounded-full mb-6 relative z-20">
      <motion.div 
        className="h-full bg-primary rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </div>

    {/* Header */}
    <div className="w-full max-w-md flex items-center mb-6 relative z-20">
      <button 
        onClick={onBack}
        className="flex items-center gap-1 text-white/40 hover:text-white transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>
    </div>

    {/* Content */}
    <div className="flex-1 w-full max-w-md flex flex-col relative z-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold mb-2 leading-tight">{title}</h1>
        {subtitle && <p className="text-white/50 text-sm leading-relaxed">{subtitle}</p>}
      </motion.div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-28">
        {children}
      </div>
    </div>

    {/* Floating CTA */}
    <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-30 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto space-y-2">
        {showSkip && (
          <button
            onClick={onSkip}
            className="w-full py-3 text-white/50 hover:text-white/80 text-sm transition-colors"
          >
            Pular esta pergunta
          </button>
        )}
        {showContinue && (
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className={`w-full py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              canContinue 
                ? "bg-white text-black hover:bg-white/90 shadow-lg" 
                : "bg-white/10 text-white/20 cursor-not-allowed"
            }`}
          >
            <span>{continueText}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  </div>
);

// --- Step Components ---

// NEW ORDER: Time → Party → Interests → Style → Country → Name → Age

const StepTime = ({ onSelect, selected }: any) => {
  const options: {value: TimeBucket, label: string, icon: any}[] = [
    { value: "curto", label: "1–2 horas", icon: Clock },
    { value: "medio", label: "Meio dia", icon: Clock },
    { value: "longo", label: "Dia inteiro", icon: Clock },
    { value: "estadia", label: "Mais de um dia", icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {options.map((opt, idx) => (
        <motion.button
          key={opt.value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(opt.value)}
          className={`p-5 rounded-2xl text-left border transition-all flex items-center gap-4 ${
            selected === opt.value
              ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
          }`}
        >
          <opt.icon className={`w-5 h-5 ${selected === opt.value ? "text-black" : "text-white/50"}`} />
          <span className="text-lg">{opt.label}</span>
          {selected === opt.value && <Check className="w-5 h-5 ml-auto" />}
        </motion.button>
      ))}
    </div>
  );
};

const StepParty = ({ onSelect, selected }: any) => {
  const options: {value: PartyType, label: string, icon: any}[] = [
    { value: "solo", label: "Sozinho(a)", icon: User },
    { value: "casal", label: "Em casal", icon: Users },
    { value: "grupo", label: "Com amigos", icon: Users },
    { value: "familia", label: "Em família", icon: Users },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt, idx) => (
        <motion.button
          key={opt.value}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(opt.value)}
          className={`p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border transition-all aspect-square ${
            selected === opt.value
              ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }`}
        >
          <opt.icon className={`w-8 h-8 ${selected === opt.value ? "text-black" : "text-white/50"}`} />
          <span className="text-sm font-medium">{opt.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

const StepInterests = ({ onToggle, selected }: any) => {
  const options: {value: InterestType, label: string, sub: string, icon: any}[] = [
    { value: "classicos", label: "Clássicos", sub: "Pontos turísticos com história", icon: Map },
    { value: "oculto", label: "Segredos", sub: "Fora do óbvio, lugares escondidos", icon: Compass },
    { value: "gastronomia", label: "Gastronomia", sub: "Onde comer e beber bem", icon: Utensils },
    { value: "gratis", label: "Gratuitos", sub: "Parques, vistas e rotas a pé", icon: TreePine },
    { value: "experiencias_pagas", label: "Premium", sub: "Experiências exclusivas NTG", icon: Star },
  ];

  return (
    <div className="space-y-3">
      {options.map((opt, idx) => {
        const isSelected = selected.includes(opt.value);
        return (
          <motion.button
            key={opt.value}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => onToggle(opt.value)}
            className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center gap-4 ${
              isSelected
                ? "bg-primary/20 text-white border-primary/50"
                : "bg-white/5 border-white/10 text-white hover:bg-white/10"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSelected ? "bg-primary text-black" : "bg-white/10 text-white/50"
            }`}>
              <opt.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="block font-bold">{opt.label}</span>
              <span className="text-xs text-white/50">{opt.sub}</span>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected ? "border-primary bg-primary" : "border-white/20"
            }`}>
              {isSelected && <Check className="w-4 h-4 text-black" />}
            </div>
          </motion.button>
        )
      })}
    </div>
  );
};

const StepStyle = ({ onSelect, selected }: any) => {
  const options: {value: GuidanceStyle, label: string, desc: string}[] = [
    { value: "rapido", label: "Sugestões rápidas", desc: "Direto ao ponto" },
    { value: "contexto", label: "Com contexto e história", desc: "Entender o porquê" },
    { value: "guiado", label: "Guiado passo a passo", desc: "Me leve pela mão" },
    { value: "conversa", label: "Conversar com a Teresa", desc: "Interação livre" },
  ];

  return (
    <div className="space-y-3">
      {options.map((opt, idx) => (
        <motion.button
          key={opt.value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(opt.value)}
          className={`w-full p-5 rounded-2xl text-left border transition-all ${
            selected === opt.value
              ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }`}
        >
          <span className="block text-lg">{opt.label}</span>
          <span className={`text-xs ${selected === opt.value ? "text-black/60" : "text-white/40"}`}>{opt.desc}</span>
        </motion.button>
      ))}
    </div>
  );
};

const StepCountry = ({ onSelect, selected }: any) => {
  const countries: {code: CountryCode, name: string, flag: string}[] = [
    { code: "PT", name: "Portugal", flag: "🇵🇹" },
    { code: "BR", name: "Brasil", flag: "🇧🇷" },
    { code: "ES", name: "Espanha", flag: "🇪🇸" },
    { code: "FR", name: "França", flag: "🇫🇷" },
    { code: "UK", name: "Reino Unido", flag: "🇬🇧" },
    { code: "US", name: "EUA", flag: "🇺🇸" },
    { code: "DE", name: "Alemanha", flag: "🇩🇪" },
    { code: "OTHER", name: "Outro país", flag: "🌍" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {countries.map((c, idx) => (
        <motion.button
          key={c.code}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.03 }}
          onClick={() => onSelect(c)}
          className={`p-4 rounded-2xl flex items-center gap-3 transition-all border ${
            selected?.code === c.code
              ? "bg-primary text-black border-primary font-bold"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }`}
        >
          <span className="text-2xl">{c.flag}</span>
          <span className="text-sm">{c.name}</span>
        </motion.button>
      ))}
    </div>
  );
};

const StepName = ({ value, onChange }: any) => (
  <div className="flex flex-col items-center pt-8">
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Seu nome"
      data-testid="input-name"
      className="w-full bg-transparent border-b-2 border-white/20 text-3xl font-bold py-4 text-white placeholder-white/20 focus:outline-none focus:border-primary transition-colors text-center"
      autoFocus
    />
  </div>
);

const StepAge = ({ onSelect, selected }: any) => {
  const options: {value: AgeRange, label: string}[] = [
    { value: "18_25", label: "18 – 25" },
    { value: "26_35", label: "26 – 35" },
    { value: "36_50", label: "36 – 50" },
    { value: "51_plus", label: "51+" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((opt, idx) => (
        <motion.button
          key={opt.value}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.05 }}
          onClick={() => onSelect(opt.value)}
          className={`p-6 rounded-2xl text-center border transition-all text-xl font-medium ${
            selected === opt.value
              ? "bg-primary text-black border-primary font-bold"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }`}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
};

// --- Result Screen ---

const ResultScreen = ({ lead }: { lead: LeadData }) => {
  const suggestions = [];
  if (lead.interests.includes("gastronomia")) suggestions.push({ icon: Utensils, label: "Guia Gastronômico" });
  if (lead.interests.includes("oculto")) suggestions.push({ icon: Compass, label: "Pontos Secretos" });
  if (lead.interests.includes("experiencias_pagas")) suggestions.push({ icon: Star, label: "Experiências Premium" });
  if (suggestions.length === 0) suggestions.push({ icon: Map, label: "Roteiro Personalizado" });

  const timeLabels: Record<string, string> = { curto: "1-2h", medio: "Meio dia", longo: "Dia inteiro", estadia: "Vários dias" };
  const partyLabels: Record<string, string> = { solo: "Sozinho(a)", casal: "Em casal", grupo: "Com amigos", familia: "Em família" };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Success Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-16 h-16 bg-gradient-to-br from-primary to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30"
          >
            <Sparkles className="w-8 h-8 text-black" />
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-2">
            Já entendi o seu estilo, {lead.identity.firstName}!
          </h2>
          <p className="text-white/60 text-sm">
            Posso te guiar agora.
          </p>
        </div>

        {/* Profile Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3">Seu Perfil</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">Tempo</span>
              <span className="font-medium">{timeLabels[lead.context.timeBucket]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Companhia</span>
              <span className="font-medium">{partyLabels[lead.context.partyType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">País</span>
              <span className="font-medium">{lead.identity.countryName}</span>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3">Sugestões para você</h3>
          <div className="flex gap-2 flex-wrap">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-2 rounded-full text-sm">
                <s.icon className="w-4 h-4" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a 
          href={`https://wa.me/${lead.whatsapp.to}?text=${lead.whatsapp.prefilledMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full"
          data-testid="cta-whatsapp"
        >
          <button className="w-full py-4 bg-[#25D366] hover:bg-[#1fad53] text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-green-500/20 group">
            <Send className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            <span>Abrir WhatsApp da Teresa</span>
          </button>
        </a>
        
        <p className="mt-4 text-xs text-white/30 text-center">
          Conversa segura • Lead #{lead.leadId.slice(0, 8)}
        </p>
      </motion.div>
    </div>
  );
};

// --- Main Wizard ---

const STEPS = ["Time", "Party", "Interests", "Style", "Country", "Name", "Age", "Result"];

export default function WizardFormPage() {
  const [, setLocation] = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [lead, setLead] = useState<LeadData | null>(null);

  const handleNext = async () => {
    if (stepIndex < STEPS.length - 1) {
      if (stepIndex === STEPS.length - 2) {
        const generatedLead = generateLeadJSON(state);
        console.log("CRM_LEAD Generated:", generatedLead);
        
        try {
          const response = await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: generatedLead.source,
              language: generatedLead.language,
              firstName: generatedLead.identity.firstName,
              countryCode: generatedLead.identity.countryCode,
              countryName: generatedLead.identity.countryName,
              ageRange: generatedLead.identity.ageRange,
              timeBucket: generatedLead.context.timeBucket,
              partyType: generatedLead.context.partyType,
              guidanceStyle: generatedLead.context.guidanceStyle,
              interests: generatedLead.interests,
              tags: generatedLead.tags,
              segmentPrimary: generatedLead.segmentPrimary,
              segmentRules: generatedLead.segmentRulesApplied,
              teresaModes: generatedLead.teresaModeSuggestions,
              whatsappMessage: generatedLead.whatsapp.prefilledMessage
            })
          });
          
          if (response.ok) {
            const savedLead = await response.json();
            console.log("Lead saved:", savedLead.id);
            generatedLead.leadId = savedLead.id;
          }
        } catch (error) {
          console.error("Failed to save lead:", error);
        }
        
        setLead(generatedLead);
      }
      setStepIndex(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
    } else {
      setLocation("/");
    }
  };

  const handleSkipAge = () => {
    dispatch({ type: 'SET_AGE', payload: undefined });
    handleNext();
  };

  const renderStep = () => {
    switch (stepIndex) {
      case 0: return <StepTime selected={state.timeBucket} onSelect={(t: any) => { dispatch({type: 'SET_TIME', payload: t}); setTimeout(handleNext, 200); }} />;
      case 1: return <StepParty selected={state.partyType} onSelect={(p: any) => { dispatch({type: 'SET_PARTY', payload: p}); setTimeout(handleNext, 200); }} />;
      case 2: return <StepInterests selected={state.interests} onToggle={(i: any) => dispatch({type: 'TOGGLE_INTEREST', payload: i})} />;
      case 3: return <StepStyle selected={state.guidanceStyle} onSelect={(s: any) => { dispatch({type: 'SET_STYLE', payload: s}); setTimeout(handleNext, 200); }} />;
      case 4: return <StepCountry selected={state.country} onSelect={(c: any) => { dispatch({type: 'SET_COUNTRY', payload: c}); setTimeout(handleNext, 200); }} />;
      case 5: return <StepName value={state.firstName} onChange={(n: string) => dispatch({type: 'SET_NAME', payload: n})} />;
      case 6: return <StepAge selected={state.ageRange} onSelect={(a: any) => { dispatch({type: 'SET_AGE', payload: a}); setTimeout(handleNext, 200); }} />;
      default: return null;
    }
  };

  const stepConfigs = [
    { title: "Quanto tempo você tem em Coimbra?", sub: null, valid: !!state.timeBucket, showContinue: false },
    { title: "Você está explorando Coimbra…", sub: null, valid: !!state.partyType, showContinue: false },
    { title: "Posso te ajudar com:", sub: "Pode marcar mais de uma opção.", valid: state.interests.length > 0, showContinue: true },
    { title: "Como prefere as recomendações?", sub: null, valid: !!state.guidanceStyle, showContinue: false },
    { title: "De onde você vem?", sub: "Só pra ajustar o jeito de te guiar.", valid: !!state.country, showContinue: false },
    { title: "Como posso te chamar?", sub: "Prometo não transformar isso em mailing chato.", valid: !!state.firstName && state.firstName.length > 1, showContinue: true },
    { title: "Sua faixa etária", sub: "Ajuda a sugerir o ritmo certo.", valid: true, showContinue: true, showSkip: true },
  ];

  if (lead) {
    return <ResultScreen lead={lead} />;
  }

  const currentConfig = stepConfigs[stepIndex];
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  return (
    <WizardLayout
      title={currentConfig.title}
      subtitle={currentConfig.sub}
      progress={progress}
      onBack={handleBack}
      onContinue={handleNext}
      canContinue={currentConfig.valid}
      showContinue={currentConfig.showContinue}
      continueText={stepIndex === STEPS.length - 2 ? "Finalizar" : "Continuar"}
      showSkip={currentConfig.showSkip}
      onSkip={handleSkipAge}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.25 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </WizardLayout>
  );
}
