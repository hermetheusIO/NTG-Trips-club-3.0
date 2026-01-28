import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Map, Utensils, Compass, Download, ExternalLink } from "lucide-react";

const guides = [
  {
    id: 1,
    title: "Guia Gastronômico",
    description: "Os melhores restaurantes, cafés e tasquinhas de Coimbra curados pela NTG.",
    icon: Utensils,
    color: "from-orange-500 to-red-500"
  },
  {
    id: 2,
    title: "Pins de Coimbra",
    description: "Mapa interativo com pontos de interesse fora dos guias tradicionais.",
    icon: Map,
    color: "from-blue-500 to-purple-500"
  },
  {
    id: 3,
    title: "Roteiro a Pé",
    description: "Circuito de 2h pelos cantos escondidos do centro histórico.",
    icon: Compass,
    color: "from-green-500 to-teal-500"
  }
];

export default function DigitaisPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/">
            <button className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm">
              <ChevronLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>
          </Link>
          <h1 className="text-lg font-bold">Dicas Rápidas</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-2">Conteúdos Digitais</h2>
          <p className="text-white/60 text-sm">
            Guias e roteiros para explorar no seu ritmo, sem precisar conversar.
          </p>
        </motion.div>

        <div className="space-y-4">
          {guides.map((guide, idx) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.color} flex items-center justify-center`}>
                  <guide.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {guide.description}
                  </p>
                </div>
                <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-white/40 text-sm mb-4">
            Quer algo mais personalizado?
          </p>
          <Link href="/coimbra/conhecer/form">
            <button className="bg-primary hover:bg-primary/90 text-black font-bold px-6 py-3 rounded-full transition-colors">
              Falar com a Teresa
            </button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
