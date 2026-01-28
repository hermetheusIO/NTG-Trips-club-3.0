import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  CheckCircle2, XCircle, Camera, Users, ArrowRight, Sparkles, 
  Vote, Calendar, Ticket, MapPin, Clock, Heart
} from "lucide-react";
import Footer from "@/components/Footer";

export default function HowItWorks() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-16 space-y-20">
        
        {/* Hero Section */}
        <motion.section {...fadeIn} className="text-center space-y-6 pt-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
            Viajar em Portugal<br />
            <span className="text-yellow-500">sem cair no turismo básico.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Roteiros curtos, bem contados, com ritmo humano.<br />
            Saída de Coimbra e arredores (por agora).
          </p>
          <div className="pt-4 space-y-3">
            <p className="text-zinc-300 text-sm">
              <span className="font-bold text-white">NTG Trips</span> é a nossa coleção de bate-voltas e escapadinhas "como se fosse com amigos locais".
            </p>
            <p className="text-zinc-300 text-sm">
              <span className="font-bold text-yellow-500">NTG Trips Club</span> é onde os membros escolhem o que vai acontecer a seguir, com vantagens reais.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Link href="/trips-club/propostas">
              <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-full px-8 py-6 text-lg font-bold w-full sm:w-auto" data-testid="cta-ver-roteiros">
                Quero ver os roteiros <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/trips-club">
              <Button size="lg" variant="outline" className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 rounded-full px-8 py-6 text-lg font-bold w-full sm:w-auto" data-testid="cta-entrar-club">
                Quero entrar no Club
              </Button>
            </Link>
          </div>
          <p className="text-zinc-500 text-xs pt-2">
            Sem letras miúdas. Sem "últimas vagas" inventadas. Sem spam.
          </p>
        </motion.section>

        {/* Bloco 1: O que é NTG Trips */}
        <motion.section {...fadeIn} className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold border-l-4 border-yellow-500 pl-4">
            O que é NTG Trips
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            O NTG Trips é a nossa biblioteca viva de viagens curtas.<br />
            Bate-voltas desenhados para quem quer:
          </p>
          <ul className="space-y-3 text-zinc-400">
            <li className="flex gap-3 items-start">
              <MapPin className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <span>ver lugares com história e beleza, sem correr como se estivesse a fugir da polícia</span>
            </li>
            <li className="flex gap-3 items-start">
              <Heart className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <span>comer bem, sem cair em armadilhas para turistas</span>
            </li>
            <li className="flex gap-3 items-start">
              <Clock className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <span>ter um plano claro, mas com espaço para respirar</span>
            </li>
            <li className="flex gap-3 items-start">
              <Camera className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <span>levar memórias a sério (sim, fotos e vídeos incluídos)</span>
            </li>
          </ul>
          <p className="text-yellow-500 font-semibold italic text-lg pt-4">
            Um roteiro NTG nunca é só "vai ali e volta".<br />
            É curadoria + ritmo + narrativa.
          </p>
        </motion.section>

        {/* CTA Destaque - Conheça o NTG Trips Club */}
        <motion.section {...fadeIn} className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-500/10 to-transparent rounded-3xl blur-xl" />
          <div className="relative bg-zinc-900/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-yellow-500/30 text-center space-y-6">
            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto" />
            <h2 className="text-2xl md:text-4xl font-bold">
              O Club é onde a viagem deixa de ser<br />
              <span className="text-yellow-500">"um produto"</span> e vira <span className="text-yellow-500">decisão de comunidade</span>.
            </h2>
            <Link href="/trips-club">
              <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-full px-10 py-7 text-xl font-bold mt-4" data-testid="cta-conheca-club">
                Conheça o NTG Trips Club <ArrowRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Bloco 2: Como funciona o Club */}
        <motion.section {...fadeIn} className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Como funciona o <span className="text-yellow-500">NTG Trips Club</span>
          </h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Sparkles, num: "1", title: "Criação", desc: "Membros propõem ideias e a Teresa (IA) transforma em roteiro." },
              { icon: Calendar, num: "2", title: "Propostas", desc: "Publicamos roteiros-proposta (sem data fixa)." },
              { icon: Vote, num: "3", title: "Votação", desc: "Travellers votam e entram na lista de interessados." },
              { icon: Ticket, num: "4", title: "Lançamento", desc: "Com gente suficiente: data + preço final + reservas." }
            ].map((item, i) => (
              <div key={i} className="p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500 text-black font-bold flex items-center justify-center text-sm">
                    {item.num}
                  </div>
                  <item.icon className="w-5 h-5 text-yellow-500" />
                </div>
                <h4 className="font-bold text-lg">{item.title}</h4>
                <p className="text-sm text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-zinc-500 italic text-sm pt-2">
            Em vez de inventarmos viagens e rezarmos para vender, o Club decide o que merece existir.
          </p>
        </motion.section>

        {/* Bloco 3: Vantagens de ser membro */}
        <motion.section {...fadeIn} className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 space-y-6">
          <h2 className="text-2xl font-bold text-center">
            Vantagens de ser membro <span className="text-yellow-500">(sem enrolar)</span>
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "🎟️", text: "Prioridade nas reservas (entra antes do público geral)" },
              { icon: "💰", text: "Desconto exclusivo nas viagens do Club" },
              { icon: "👀", text: "Acesso a roteiros em primeira mão (antes de virarem 'públicos')" },
              { icon: "🗳️", text: "Participação real: votar, sugerir e ajudar a moldar as próximas rotas" }
            ].map((item, i) => (
              <div key={i} className="flex gap-3 p-4 bg-black/50 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-zinc-300 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
          
          <p className="text-center text-zinc-500 text-xs">
            Não é um grupo de WhatsApp com bom dia. É um clube com poder de escolha.
          </p>
        </motion.section>

        {/* Bloco 4: O que está incluído */}
        <motion.section {...fadeIn} className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            O que está incluído em <span className="text-yellow-500">TODAS</span> as viagens NTG
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-zinc-800 space-y-4">
              <Camera className="w-8 h-8 text-yellow-500" />
              <h3 className="font-bold text-lg">Memórias incluídas</h3>
              <p className="text-zinc-400 text-sm">
                Toda viagem é documentada com fotos e vídeos. Depois, todos recebem um Álbum Digital NTG para download.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl border border-zinc-800 space-y-4">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <h3 className="font-bold text-lg">Sessão individual</h3>
              <p className="text-zinc-400 text-sm">
                Quer fotos tuas a sério (retrato/casal/família)? Dá para contratar uma sessão individual durante a viagem.
              </p>
            </div>
            
            <div className="p-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 space-y-4">
              <Ticket className="w-8 h-8 text-yellow-500" />
              <h3 className="font-bold text-lg">Duas programações</h3>
              <p className="text-zinc-400 text-sm">
                <strong className="text-white">Essencial:</strong> experiências gratuitas<br />
                <strong className="text-yellow-500">Completa:</strong> entradas/experiências opcionais
              </p>
            </div>
          </div>
          
          <p className="text-center text-zinc-500 italic text-sm">
            Ninguém é forçado a gastar. Ninguém fica de fora.
          </p>
        </motion.section>

        {/* Bloco 5: Como é uma viagem */}
        <motion.section {...fadeIn} className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold border-l-4 border-yellow-500 pl-4">
            Como é uma viagem na prática
          </h2>
          <p className="text-zinc-300">
            Ritmo confortável. Pausas previstas. Logística simples.<br />
            A NTG organiza o dia para que a tua cabeça não precise.
          </p>
          <ul className="space-y-3 text-zinc-400">
            {[
              "ponto de encontro claro",
              "horários realistas (com pausas)",
              "recomendações honestas (comida, miradouros, tempo, calçado)",
              "acompanhamento do casal NTG (sem atuação teatral)"
            ].map((item, i) => (
              <li key={i} className="flex gap-3 items-center">
                <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-zinc-500 italic text-sm pt-2">
            Turismo "correria" é ótimo. Para quem quer odiar a própria vida.
          </p>
        </motion.section>

        {/* Bloco 6: Para quem é / não é */}
        <motion.section {...fadeIn} className="grid md:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border border-green-500/30 bg-green-500/5 space-y-4">
            <h3 className="font-bold text-lg text-green-400">Isto é para ti se:</h3>
            <ul className="space-y-3">
              {[
                "queres conhecer Portugal com profundidade, mas sem complicar",
                "gostas de natureza, história, aldeias e boa comida",
                "preferes qualidade a quantidade",
                "queres sentir que estás a viver, não só a 'marcar presença'"
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-4">
            <h3 className="font-bold text-lg text-red-400">Não é para ti se:</h3>
            <ul className="space-y-3">
              {[
                "o teu sonho é fazer 6 cidades num dia e chamar isso de experiência",
                "precisas de um guia a gritar com bandeirinha",
                "queres 'turismo de lista', sem história nem contexto"
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.section>

        {/* Bloco 7: Roteiros em votação */}
        <motion.section {...fadeIn} className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 space-y-6">
          <h2 className="text-2xl font-bold text-center">
            Roteiros em votação agora
          </h2>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              "Rota dos Templários (Tomar + Dornes/Almourol)",
              "Douro N222 (Régua + Pinhão)",
              "Fé, Pedra e Mar (Fátima + Alcobaça + Nazaré)",
              "Gerês Essencial (Terras de Bouro + cascatas)",
              "Aldeias de Xisto (Lousã / Góis)",
              "Piódão + Foz d'Égua"
            ].map((route, i) => (
              <div key={i} className="px-4 py-3 bg-black/50 rounded-xl border border-white/5 text-sm text-zinc-300">
                {route}
              </div>
            ))}
          </div>
          
          <div className="text-center pt-4">
            <Link href="/trips-club/propostas">
              <Button size="lg" className="bg-yellow-500 text-black hover:bg-yellow-400 rounded-full px-8" data-testid="cta-ver-votar">
                Ver roteiros e votar <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-zinc-500 text-xs pt-3">
              Votar é rápido. Fingir que depois vais "ver" é que demora anos.
            </p>
          </div>
        </motion.section>

        {/* FAQ */}
        <motion.section {...fadeIn} className="space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Perguntas Frequentes</h2>
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "Preciso ser membro para viajar?", a: "Não. Mas membros têm prioridade e desconto." },
              { q: "Como funciona o preço?", a: "Os roteiros-proposta têm valores estimados. Quando há interessados suficientes, fechamos logística e publicamos preço final." },
              { q: "E se eu quiser a versão económica?", a: "Sempre existe. A Essencial é pensada para não te obrigar a gastar." },
              { q: "Recebo mesmo as fotos e vídeos?", a: "Sim. A viagem gera um álbum digital para download." }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-zinc-800">
                <AccordionTrigger className="text-left hover:text-yellow-500">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.section>

        {/* Emotional CTA */}
        <motion.section {...fadeIn} className="text-center space-y-6 py-8">
          <p className="text-xl text-zinc-400 max-w-xl mx-auto">
            Portugal é pequeno. O problema é como as pessoas o vivem.
          </p>
          <p className="text-yellow-500 font-semibold">
            A NTG existe para te devolver tempo, história e prazer de viajar.
          </p>
        </motion.section>

      </div>
      
      <Footer variant="full" />
    </div>
  );
}
