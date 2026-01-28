import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { 
  MapPin, Clock, Heart, ArrowLeft, Loader2, Users, 
  Thermometer, Bus, Car, Caravan, ChevronRight
} from "lucide-react";
import type { Trip } from "@shared/schema";

export default function TripsListPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips?published=true");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: favorites = [] } = useQuery<{ tripId: number }[]>({
    queryKey: ["/api/user/favorites"],
    queryFn: async () => {
      const res = await fetch("/api/user/favorites", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const favoriteTripIds = new Set(favorites.map((f: any) => f.tripId || f.trip?.id));

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer" data-testid="link-back">
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </div>
          </Link>
          {isAuthenticated && (
            <Link href="/trips-club/member">
              <div className="text-yellow-400 hover:text-yellow-300 text-sm cursor-pointer" data-testid="link-my-account">
                Minha conta
              </div>
            </Link>
          )}
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-black text-white mb-4" data-testid="text-page-title">
              Viagens Disponíveis
            </h1>
            <p className="text-white/60 max-w-lg mx-auto">
              Roteiros de 1 dia, destinos secretos e experiências que não aparecem no Google.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-white/50">Nenhuma viagem disponível no momento.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 mb-16">
                {trips.slice(0, 3).map((trip, index) => (
                  <TripCard 
                    key={trip.id} 
                    trip={trip} 
                    index={index}
                    isFavorited={favoriteTripIds.has(trip.id)}
                    isAuthenticated={isAuthenticated}
                    isLocked={false}
                  />
                ))}
              </div>

              {trips.length > 3 && (
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-t from-black to-transparent z-10 -mt-32" />
                  <div className="grid gap-6 opacity-40 pointer-events-none blur-[2px]">
                    {trips.slice(3, 5).map((trip, index) => (
                      <TripCard 
                        key={trip.id} 
                        trip={trip} 
                        index={index + 3}
                        isFavorited={false}
                        isAuthenticated={false}
                        isLocked={true}
                      />
                    ))}
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="mt-12 p-8 rounded-3xl bg-zinc-900 border border-yellow-400/30 text-center relative z-20 shadow-2xl shadow-yellow-400/5"
                  >
                    <Users className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-black mb-4">NTG Trips Club</h2>
                    <p className="text-white/70 mb-8 max-w-md mx-auto">
                      Para ver as viagens que ainda estão incubadas, e poder votar e participar de roteiros exclusivos, você precisa fazer parte do nosso clube.
                    </p>
                    <Link href="/trips-club/onboarding">
                      <button 
                        className="px-10 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all"
                        data-testid="button-join-club-trips"
                      >
                        Descubra seu Perfil e Entre no Club
                      </button>
                    </Link>
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TripCard({ trip, index, isFavorited, isAuthenticated, isLocked = false }: { 
  trip: Trip; 
  index: number;
  isFavorited: boolean;
  isAuthenticated: boolean;
  isLocked?: boolean;
}) {
  const queryClient = useQueryClient();

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        const res = await fetch(`/api/user/favorites/${trip.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to remove favorite");
      } else {
        const res = await fetch(`/api/user/favorites/${trip.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ interestLevel: "interested" }),
        });
        if (!res.ok) throw new Error("Failed to add favorite");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
    },
  });

  const handleFavoriteClick = () => {
    if (isLocked) {
      window.location.href = "/trips-club/onboarding";
      return;
    }
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  const { data: favoriteCount = 0 } = useQuery({
    queryKey: [`/api/trips/${trip.id}/favorite-count`],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${trip.id}/favorite-count`);
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count;
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden hover:border-yellow-400/30 transition-all group"
      data-testid={`card-trip-${trip.id}`}
    >
      <div className="flex flex-col md:flex-row">
        {trip.heroImage && (
          <div className="w-full md:w-64 h-48 md:h-auto flex-shrink-0 overflow-hidden">
            <img 
              src={trip.heroImage} 
              alt={trip.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}
        
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              {isLocked ? (
                <div onClick={() => window.location.href = "/trips-club/onboarding"} className="cursor-pointer">
                  <h2 className="text-2xl font-bold text-white/40" data-testid={`text-trip-title-${trip.id}`}>
                    {trip.title}
                  </h2>
                </div>
              ) : (
                <Link href={`/viagens/${trip.slug}`}>
                  <div className="block cursor-pointer">
                    <h2 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors" data-testid={`text-trip-title-${trip.id}`}>
                      {trip.title}
                    </h2>
                  </div>
                </Link>
              )}
              <div className="flex items-center gap-4 text-white/50 text-sm mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {trip.destination}
                </span>
                {trip.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {trip.duration}
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={handleFavoriteClick}
              disabled={toggleFavoriteMutation.isPending}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                isFavorited 
                  ? "bg-red-500/20 text-red-400" 
                  : "bg-white/5 text-white/50 hover:bg-yellow-400/10 hover:text-yellow-400"
              }`}
              data-testid={`button-favorite-${trip.id}`}
            >
              {toggleFavoriteMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              )}
            </button>
          </div>
          
          <p className="text-white/60 mb-4 line-clamp-2">
            {trip.shortDescription}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {trip.price && (
                <span className="text-yellow-400 font-bold">{trip.price}</span>
              )}
              
              {favoriteCount > 0 && (
                <div className="flex items-center gap-2 text-white/40 text-sm">
                  <Thermometer className="w-4 h-4" />
                  <span>{favoriteCount} interessado{favoriteCount > 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
            
            {isLocked ? (
              <button 
                onClick={() => window.location.href = "/trips-club/onboarding"}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-white/40 rounded-full text-sm font-medium"
              >
                Bloqueado
              </button>
            ) : (
              <Link href={`/viagens/${trip.slug}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-full text-sm font-medium transition-colors cursor-pointer" data-testid={`button-view-trip-${trip.id}`}>
                  Ver detalhes
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
