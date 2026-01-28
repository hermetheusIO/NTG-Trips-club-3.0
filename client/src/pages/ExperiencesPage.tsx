import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Filter, Clock, Euro, Star, Calendar, Loader2 } from "lucide-react";
import type { Experience } from "@shared/schema";

const CATEGORIES = ["Todos", "cultural", "gastronomia", "historia", "natureza", "aventura"];
const categoryLabels: Record<string, string> = {
  "Todos": "Todos",
  "cultural": "Cultura",
  "gastronomia": "Gastronomia",
  "historia": "História",
  "natureza": "Natureza",
  "aventura": "Aventura"
};

export default function ExperiencesPage() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedExp, setSelectedExp] = useState<number | null>(null);

  const { data: experiences, isLoading } = useQuery<Experience[]>({
    queryKey: ["/api/experiences"],
  });

  const filteredExperiences = selectedCategory === "Todos" 
    ? experiences 
    : experiences?.filter(exp => exp.category === selectedCategory);

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <button data-testid="button-back" className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </Link>
        <h1 className="text-lg font-bold tracking-wide">Experiências</h1>
        <button data-testid="button-filter" className="p-2 -mr-2 text-white/70 hover:text-primary transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Categories Scroller */}
      <div className="px-6 py-6 overflow-x-auto no-scrollbar">
        <div className="flex space-x-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              data-testid={`filter-category-${cat}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-black"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              {categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!filteredExperiences || filteredExperiences.length === 0) && (
        <div className="text-center py-20 px-6">
          <p className="text-white/60">Nenhuma experiência disponível no momento.</p>
          <p className="text-white/40 text-sm mt-2">Volte em breve para novidades!</p>
        </div>
      )}

      {/* Grid */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredExperiences?.map((exp, idx) => (
          <motion.div
            key={exp.id}
            data-testid={`card-experience-${exp.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-primary/30 transition-all cursor-pointer"
            onClick={() => setSelectedExp(exp.id)}
          >
            {/* Image */}
            <div className="aspect-[4/3] overflow-hidden bg-white/5">
              {exp.heroImage ? (
                <img 
                  src={exp.heroImage} 
                  alt={exp.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <Star className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
            </div>

            {/* Content overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {categoryLabels[exp.category] || exp.category}
                </span>
                {exp.isFeatured && (
                  <div className="flex items-center space-x-1 text-xs text-white/80 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>Destaque</span>
                  </div>
                )}
              </div>
              
              <h3 data-testid={`text-experience-title-${exp.id}`} className="text-xl font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
                {exp.title}
              </h3>
              
              <div className="flex items-center space-x-4 text-xs text-white/70">
                {exp.duration && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{exp.duration}</span>
                  </div>
                )}
                {exp.price && (
                  <div className="flex items-center space-x-1">
                    <Euro className="w-3 h-3" />
                    <span>{exp.price}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedExp !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => setSelectedExp(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#111] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const exp = experiences?.find(e => e.id === selectedExp);
                if (!exp) return null;

                return (
                  <div className="relative pb-8">
                    {/* Close Button */}
                    <button 
                      onClick={() => setSelectedExp(null)}
                      data-testid="button-close-modal"
                      className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:text-white"
                    >
                      ×
                    </button>

                    <div className="h-64 overflow-hidden relative bg-white/5">
                      {exp.heroImage ? (
                        <img src={exp.heroImage} alt={exp.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Star className="w-16 h-16" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                    </div>

                    <div className="px-6 -mt-12 relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="text-primary text-xs font-bold uppercase tracking-widest">
                            {categoryLabels[exp.category] || exp.category}
                          </span>
                          <h2 className="text-2xl font-bold mt-1">{exp.title}</h2>
                        </div>
                        {exp.price && (
                          <div className="bg-white/10 px-3 py-1 rounded-lg text-center">
                            <span className="block text-xs text-white/50">desde</span>
                            <span className="font-bold text-lg">{exp.price}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-white/70 leading-relaxed mb-4">
                        {exp.shortDescription}
                      </p>

                      {exp.longDescription && (
                        <p className="text-white/60 text-sm leading-relaxed mb-6">
                          {exp.longDescription}
                        </p>
                      )}

                      {exp.tags && exp.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                          {exp.tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60 border border-white/5">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <button 
                        data-testid="button-book-experience"
                        className="w-full py-4 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-5 h-5" />
                        <span>Ver Disponibilidade</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
