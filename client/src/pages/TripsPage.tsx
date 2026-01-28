import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ChevronLeft, Calendar, MapPin, Users, ArrowRight, Bell, Loader2, Map } from "lucide-react";
import type { Trip } from "@shared/schema";

export default function TripsPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans pb-20">
      
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <button data-testid="button-back" className="p-2 -ml-2 text-white/70 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        </Link>
        <h1 className="text-lg font-bold tracking-wide">NTG Trips</h1>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* Intro */}
      <div className="px-6 py-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Viagens de Autor</h2>
        <p className="text-white/60 text-sm max-w-xs mx-auto">
          Pequenos grupos. Lugares autênticos. Memórias que não cabem no Instagram.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!trips || trips.length === 0) && (
        <div className="text-center py-20 px-6">
          <Map className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">Nenhuma viagem disponível no momento.</p>
          <p className="text-white/40 text-sm mt-2">Subscreve abaixo para ser o primeiro a saber!</p>
        </div>
      )}

      {/* Trips List */}
      <div className="px-6 space-y-8">
        {trips?.map((trip, idx) => (
          <motion.div
            key={trip.id}
            data-testid={`card-trip-${trip.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative rounded-3xl overflow-hidden bg-[#111] border border-white/10"
          >
            {/* Image */}
            <div className="h-64 overflow-hidden relative bg-white/5">
              {trip.heroImage ? (
                <img 
                  src={trip.heroImage} 
                  alt={trip.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/20">
                  <MapPin className="w-16 h-16" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-transparent to-transparent opacity-90" />
              
              {/* Featured Badge */}
              {trip.isFeatured && (
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-black text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-wide">
                    Destaque
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6 -mt-16 relative z-10">
              {trip.destination && (
                <div className="flex items-center space-x-2 text-primary font-medium text-xs uppercase tracking-widest mb-2">
                  <MapPin className="w-3 h-3" />
                  <span>{trip.destination}</span>
                </div>
              )}
              
              <h3 data-testid={`text-trip-title-${trip.id}`} className="text-2xl font-bold mb-3">
                {trip.title}
              </h3>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                {trip.shortDescription}
              </p>

              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex flex-col">
                  {trip.price && (
                    <>
                      <span className="text-xs text-white/40">Investimento</span>
                      <span className="font-bold text-lg">{trip.price}</span>
                    </>
                  )}
                  {trip.duration && (
                    <span className="text-xs text-white/50 mt-1">{trip.duration}</span>
                  )}
                </div>

                <Link href={`/viagens/${trip.slug}`}>
                  <button 
                    data-testid={`button-book-trip-${trip.id}`}
                    className="px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 bg-white text-black hover:bg-white/90"
                  >
                    <span>Saber Mais</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Newsletter Section */}
      <div className="mt-16 px-6">
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-primary/20 w-24 h-24 rounded-full blur-2xl" />
          
          <Bell className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">Não perca a próxima</h3>
          <p className="text-white/60 text-sm mb-6">
            Receba alertas de novas viagens 24h antes do lançamento oficial.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col space-y-3">
            <input 
              type="email" 
              placeholder="Seu melhor email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email-newsletter"
              className="w-full bg-black/30 border border-primary/30 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors text-center"
            />
            <button 
              type="submit"
              data-testid="button-subscribe-newsletter"
              className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors"
            >
              {subscribed ? "Inscrito com sucesso!" : "Me Avise"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
