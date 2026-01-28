import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowRight, Users, MapPin, Thermometer, Bus, Car, Caravan, 
  Eye, EyeOff, Check, X, Footprints, BookOpen, UtensilsCrossed, 
  Compass, Sparkles, Timer, Camera, ChevronRight
} from "lucide-react";

const tribes = [
  {
    id: "caminhantes",
    name: "Os Caminhantes",
    essence: "Ritmo humano. Paisagem, pausa e presença.",
    prefers: ["natureza e trilhos leves", "roteiros sem correria"],
    tag: "Ritmo: lento–moderado",
    icon: Footprints
  },
  {
    id: "curiosos",
    name: "Os Curiosos",
    essence: "Viajar para entender o lugar, não só ver.",
    prefers: ["história e contexto", "lugares com narrativa"],
    tag: "Estilo: cultura",
    icon: BookOpen
  },
  {
    id: "sensoriais",
    name: "Os Sensoriais",
    essence: "Sabores, atmosfera e detalhes que ficam.",
    prefers: ["gastronomia local", "experiências autênticas"],
    tag: "Estilo: sensorial",
    icon: UtensilsCrossed
  },
  {
    id: "fora-do-mapa",
    name: "Os Fora do Mapa",
    essence: "Destinos discretos. Caminhos improváveis.",
    prefers: ["lugares secretos", "grupos pequenos"],
    tag: "Estilo: exploratório",
    icon: Compass
  },
  {
    id: "contemplativos",
    name: "Os Contemplativos",
    essence: "Beleza, silêncio e espaço interno.",
    prefers: ["paisagens e luz", "tempo livre"],
    tag: "Ritmo: lento",
    icon: Sparkles
  },
  {
    id: "pragmaticos",
    name: "Os Pragmáticos",
    essence: "Bem organizado, simples e sem fricção.",
    prefers: ["logística clara", "bom custo-benefício"],
    tag: "Estilo: direto",
    icon: Timer
  },
  {
    id: "visuais",
    name: "Os Visuais",
    essence: "O mundo como enquadramento.",
    prefers: ["cenários marcantes", "melhores horários de luz"],
    tag: "Estilo: visual",
    icon: Camera
  }
];

const travelTypes = [
  {
    id: "onibus",
    title: "Ônibus",
    capacity: "até 50 pessoas",
    description: "Acessível, bem organizado e fora do circuito turístico tradicional.",
    icon: Bus
  },
  {
    id: "van",
    title: "Van",
    capacity: "até 8 pessoas",
    description: "Destinos mais secretos, grupos pequenos e experiência mais próxima.",
    icon: Car
  },
  {
    id: "carro",
    title: "Carro",
    capacity: "até 3 pessoas",
    description: "Curadoria máxima. Ritmo humano. Quase uma expedição.",
    icon: Car
  },
  {
    id: "motorhome",
    title: "Motorhome",
    capacity: "liberdade total",
    description: "Roteiros sugeridos + intermediação de autocaravana para quem quer liberdade total.",
    icon: Caravan
  }
];

export default function TripsClubPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <HeroSection />
      <ManifestoSection />
      <HowItWorksSection />
      <TribesSection />
      <ThermometerSection />
      <TravelTypesSection />
      <SocialSection />
      <ForWhoSection />
      <FinalCTASection />
    </div>
  );
}

function HeroSection() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex justify-center gap-4 mb-8">
            <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-xs uppercase tracking-widest font-bold">
              Clube Exclusivo
            </span>
            {!isAuthenticated && (
              <a 
                href="/api/login"
                className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-colors"
                data-testid="link-login"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                Entrar / Registrar
              </a>
            )}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1]" data-testid="text-hero-title">
            NTG Trips Club
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 mb-4 font-light">
            Viagens curtas. Lugares não turísticos.
            <br />Pessoas na mesma sintonia.
          </p>
          
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-8">
            Descubra Portugal além do óbvio.
          </h2>
          
          <p className="text-white/70 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Roteiros de 1 dia, destinos secretos e experiências que não aparecem no Google nem nos pacotes de agência.
          </p>
          
          <p className="text-white/50 text-sm mb-8">
            👉 Entre no clube. Escolha sua tribo. Viaje quando fizer sentido.
          </p>
          
          {isAuthenticated ? (
            <Link href="/trips-club/onboarding">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-yellow-400/20 cursor-pointer"
                data-testid="button-join-club"
              >
                Descobrir minha tribo
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </Link>
          ) : (
            <a href="/api/login">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-yellow-400/20 cursor-pointer"
                data-testid="button-join-club"
              >
                Entrar no Trips Club
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </a>
          )}
        </motion.div>
      </div>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
        <ChevronRight className="w-6 h-6 rotate-90" />
      </div>
    </section>
  );
}

function ManifestoSection() {
  return (
    <section className="px-6 py-24 bg-zinc-950">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight">
            O NTG Trips Club não é um pacote turístico.
          </h2>
          
          <p className="text-xl text-white/70 leading-relaxed">
            É um clube de pessoas curiosas, inquietas e minimamente interessantes que querem explorar Portugal com tempo, critério e boas companhias.
          </p>
          
          <p className="text-lg text-white/50 leading-relaxed">
            Nada de multidões, filas ou "paradas obrigatórias".
            <br />
            <span className="text-yellow-400 font-semibold">Aqui, o destino só acontece quando a tribo certa se forma.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: "01",
      title: "Entre no clube",
      description: "Crie sua conta, diga como gosta de viajar e definimos sua \"tribo\"."
    },
    {
      number: "02",
      title: "Explore as trips",
      description: "Roteiros de 1 dia pela Serra da Estrela, Gerês, Aldeias de Xisto, rotas secretas e lugares que não vivem de selfie."
    },
    {
      number: "03",
      title: "Demonstre interesse",
      description: "Algumas viagens já têm data. Outras só ganham data quando há pessoas suficientes interessadas. O termômetro sobe. A viagem acontece."
    }
  ];

  return (
    <section className="px-6 py-24 bg-black">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Como Funciona</h2>
          <p className="text-white/50">3 passos simples</p>
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-zinc-900 border border-white/5 relative overflow-hidden group"
            >
              <span className="absolute -top-4 -right-2 text-8xl font-black text-white/5 group-hover:text-yellow-400/10 transition-colors">
                {step.number}
              </span>
              <h3 className="text-xl font-bold text-white mb-4 relative z-10">{step.title}</h3>
              <p className="text-white/60 leading-relaxed relative z-10">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TribesSection() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="px-6 py-24 bg-zinc-950">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Encontre sua Tribo</h2>
          <p className="text-white/50 max-w-lg mx-auto">
            Não é um pacote. É um clube. A viagem melhora quando as pessoas combinam.
          </p>
        </motion.div>
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tribes.map((tribe, index) => (
            <motion.div
              key={tribe.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="p-6 rounded-2xl bg-black border border-white/5 hover:border-yellow-400/30 transition-all group"
              data-testid={`card-tribe-${tribe.id}`}
            >
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-4 group-hover:bg-yellow-400/20 transition-colors">
                <tribe.icon className="w-6 h-6 text-yellow-400" />
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{tribe.name}</h3>
              <p className="text-white/60 text-sm mb-4 italic">"{tribe.essence}"</p>
              
              <div className="space-y-2 mb-4">
                {tribe.prefers.map((pref, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/50 text-xs">
                    <div className="w-1 h-1 rounded-full bg-yellow-400" />
                    {pref}
                  </div>
                ))}
              </div>
              
              <span className="inline-block px-3 py-1 rounded-full bg-white/5 text-white/40 text-[10px] uppercase tracking-wider">
                {tribe.tag}
              </span>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          {isAuthenticated ? (
            <Link href="/trips-club/onboarding">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all cursor-pointer"
                data-testid="button-define-tribe"
              >
                Definir minha tribo
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </Link>
          ) : (
            <a href="/api/login">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-bold rounded-xl transition-all cursor-pointer"
                data-testid="button-define-tribe"
              >
                Entrar para definir tribo
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </a>
          )}
          <p className="text-white/40 text-sm mt-3">Leva menos de 2 minutos.</p>
        </motion.div>
      </div>
    </section>
  );
}

function ThermometerSection() {
  return (
    <section className="px-6 py-24 bg-black">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center mx-auto mb-6">
            <Thermometer className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">O Termômetro</h2>
          <p className="text-white/60 max-w-lg mx-auto">
            Cada trip tem um termômetro de interesse.
            Quando atinge o número ideal de pessoas, a viagem ganha data.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-3xl bg-zinc-900 border border-white/10"
        >
          <div className="flex items-center gap-4 mb-6">
            <MapPin className="w-6 h-6 text-yellow-400" />
            <div>
              <h3 className="text-xl font-bold text-white">Serra da Estrela</h3>
              <p className="text-white/50 text-sm">Van – 8 pessoas</p>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/60">Interessados</span>
              <span className="text-yellow-400 font-bold">6/8</span>
            </div>
            <div className="h-3 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "75%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full"
              />
            </div>
          </div>
          
          <p className="text-yellow-400 text-sm font-medium">🔥 Quase na hora de datar</p>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/40 text-sm mt-8"
        >
          Sem achismo. Sem spam. Sem "talvez".
        </motion.p>
      </div>
    </section>
  );
}

function TravelTypesSection() {
  return (
    <section className="px-6 py-24 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Tipos de Viagem</h2>
          <p className="text-white/50">Escolha o formato que combina com você</p>
        </motion.div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          {travelTypes.map((type, index) => (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-black border border-white/5 hover:border-yellow-400/30 transition-all"
              data-testid={`card-travel-type-${type.id}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center flex-shrink-0">
                  <type.icon className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{type.title}</h3>
                  <p className="text-yellow-400 text-sm font-medium mb-2">{type.capacity}</p>
                  <p className="text-white/60 text-sm">{type.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialSection() {
  return (
    <section className="px-6 py-24 bg-black">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">O Diferencial Social</h2>
          <p className="text-white/50">(sem virar bagunça)</p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <p className="text-white/70 text-lg text-center mb-8">
            Antes mesmo da viagem acontecer, você pode:
          </p>
          
          <div className="grid gap-4">
            {[
              "Ver quem mais se interessou pela mesma trip",
              "Conectar-se com pessoas da mesma tribo",
              "Decidir se quer viajar acompanhado ou só observar"
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-white/5"
              >
                <Check className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <span className="text-white/80">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-6 rounded-2xl bg-zinc-900 border border-yellow-400/20 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <EyeOff className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">Privacidade é regra.</span>
          </div>
          <p className="text-white/60">Aparece quem quer. O resto segue anônimo.</p>
        </motion.div>
      </div>
    </section>
  );
}

function ForWhoSection() {
  const forWho = [
    "Mora em Portugal ou está viajando pelo país",
    "Prefere experiências reais a pontos turísticos lotados",
    "Gosta de natureza, cultura, história e bons caminhos",
    "Não tem paciência para turismo de massa"
  ];
  
  const notForWho = [
    "Quem quer \"checklist de atrações\"",
    "Quem só viaja pelo preço",
    "Quem acha que turismo é só Instagram"
  ];

  return (
    <section className="px-6 py-24 bg-zinc-950">
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-8 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-3xl bg-black border border-green-500/20"
          >
            <h3 className="text-2xl font-black text-white mb-6">Para Quem É</h3>
            <div className="space-y-4">
              {forWho.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-3xl bg-black border border-red-500/20"
          >
            <h3 className="text-2xl font-black text-white mb-6">Para Quem Não É</h3>
            <div className="space-y-4">
              {notForWho.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FinalCTASection() {
  const { isAuthenticated } = useAuth();
  
  return (
    <section className="px-6 py-32 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center relative z-10"
      >
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight">
          O destino você já sabe.
          <br />
          <span className="text-yellow-400">Falta saber com quem e quando.</span>
        </h2>
        
        <p className="text-white/60 text-lg mb-12">
          Descubra trips. Encontre sua tribo. Viaje melhor.
        </p>
        
        {isAuthenticated ? (
          <Link href="/trips-club/onboarding">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-12 py-6 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-yellow-400/30 cursor-pointer"
              data-testid="button-final-cta"
            >
              Descobrir minha tribo
              <ArrowRight className="w-6 h-6" />
            </motion.div>
          </Link>
        ) : (
          <a href="/api/login">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 px-12 py-6 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-yellow-400/30 cursor-pointer"
              data-testid="button-final-cta"
            >
              Entrar no NTG Trips Club
              <ArrowRight className="w-6 h-6" />
            </motion.div>
          </a>
        )}
      </motion.div>
    </section>
  );
}
