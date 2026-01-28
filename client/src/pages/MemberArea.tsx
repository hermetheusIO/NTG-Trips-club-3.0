import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowRight, Heart, MapPin, Clock, Users, Loader2, LogOut, 
  User, Settings, ChevronRight, Footprints, Star, Vote, ThumbsUp,
  Wallet, Sparkles, History, Plus
} from "lucide-react";
import type { Trip, UserProfile, TripFavorite, TripVote, CreditTransaction } from "@shared/schema";
import Footer from "@/components/Footer";

export default function MemberArea() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      const res = await fetch("/api/user/profile", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useQuery<(TripFavorite & { trip: Trip })[]>({
    queryKey: ["/api/user/favorites"],
    queryFn: async () => {
      const res = await fetch("/api/user/favorites", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: allTrips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
    queryFn: async () => {
      const res = await fetch("/api/trips?published=true");
      if (!res.ok) return [];
      return res.json();
    },
  });
  
  const { data: creditsData } = useQuery<{ credits: number }>({
    queryKey: ["/api/user/credits"],
    queryFn: async () => {
      const res = await fetch("/api/user/credits", { credentials: "include" });
      if (!res.ok) return { credits: 0 };
      return res.json();
    },
    enabled: isAuthenticated,
  });
  
  const { data: creditHistory = [] } = useQuery<CreditTransaction[]>({
    queryKey: ["/api/user/credits/history"],
    queryFn: async () => {
      const res = await fetch("/api/user/credits/history", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });
  
  const { data: userVotes = [] } = useQuery<(TripVote & { trip: Trip })[]>({
    queryKey: ["/api/user/votes"],
    queryFn: async () => {
      const res = await fetch("/api/user/votes", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const res = await fetch(`/api/user/favorites/${tripId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove favorite");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
    },
  });

  const isLoading = authLoading || profileLoading || favoritesLoading;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/trips-club">
            <div className="text-yellow-400 font-black text-xl cursor-pointer" data-testid="link-logo">NTG Trips Club</div>
          </Link>
          <button
            onClick={() => logout()}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-yellow-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" data-testid="text-user-name">
                  Olá, {user?.firstName || "Viajante"}!
                </h1>
                <p className="text-white/50">{user?.email}</p>
              </div>
            </div>

            {profile?.isOnboardingComplete && profile.primaryTribe ? (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10">
                <p className="text-white/60 text-sm mb-3">Sua tribo:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-yellow-400 text-black font-bold text-sm" data-testid="text-profile-tribe">
                    {profile.primaryTribe}
                  </span>
                  {profile.secondaryTribe && (
                    <span className="px-3 py-1.5 rounded-full bg-white/10 text-white/70 font-medium text-sm">
                      {profile.secondaryTribe}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <Link href="/trips-club/onboarding">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/20 hover:border-yellow-400/40 transition-all cursor-pointer group" data-testid="link-complete-profile">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                      <Footprints className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Descubra sua tribo de viagem</h3>
                      <p className="text-white/60 text-sm">Responda algumas perguntas rápidas para personalizar suas recomendações</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                  </div>
                </div>
              </Link>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-400/10 to-amber-500/10 border border-yellow-400/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Créditos de Viagem</p>
                    <p className="text-2xl font-bold text-yellow-400" data-testid="text-credit-balance">
                      €{((creditsData?.credits || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
                {creditHistory.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-yellow-400/10">
                    <p className="text-xs text-white/40 uppercase tracking-wider">Histórico recente</p>
                    {creditHistory.slice(0, 3).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between text-sm">
                        <span className="text-white/60 truncate max-w-[180px]">{tx.description}</span>
                        <span className={tx.amountCents > 0 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                          {tx.amountCents > 0 ? "+" : ""}€{(tx.amountCents / 100).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {(creditsData?.credits || 0) === 0 && creditHistory.length === 0 && (
                  <p className="text-white/40 text-sm mt-2">
                    Crie roteiros com a Teresa e ganhe créditos quando virarem viagens reais!
                  </p>
                )}
              </div>
              
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-white/50 text-xs uppercase tracking-wider">Meus Votos</p>
                    <p className="text-2xl font-bold text-white" data-testid="text-votes-count">
                      {userVotes.length}
                    </p>
                  </div>
                </div>
                {userVotes.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/10">
                    {userVotes.slice(0, 3).map((vote) => (
                      <Link key={vote.id} href={`/viagem/${vote.trip.slug}`}>
                        <div className="flex items-center gap-2 text-sm text-white/60 hover:text-yellow-400 transition-colors cursor-pointer">
                          <Vote className="w-3.5 h-3.5" />
                          <span className="truncate">{vote.trip.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {userVotes.length === 0 && (
                  <p className="text-white/40 text-sm mt-2">
                    Vote em propostas de roteiro para ajudar a decidir o que acontece!
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-400" />
                Minhas Viagens Favoritas
              </h2>
              <span className="text-white/50 text-sm">{favorites.length} viagens</span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-white/50" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-white/50 mb-4">Ainda não favoritou nenhuma viagem</p>
          <Link href="/viagens/lista">
            <div className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer" data-testid="link-explore-trips">
              Explorar viagens
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {favorites.map((fav) => (
                  <motion.div
                    key={fav.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:border-yellow-400/30 transition-all group"
                    data-testid={`card-favorite-${fav.trip.id}`}
                  >
                    <div className="flex items-start gap-4">
                      {fav.trip.heroImage && (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={fav.trip.heroImage} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link href={`/viagens/${fav.trip.slug}`}>
                          <div className="block cursor-pointer">
                            <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors truncate" data-testid={`text-trip-title-${fav.trip.id}`}>
                              {fav.trip.title}
                            </h3>
                          </div>
                        </Link>
                        <div className="flex items-center gap-4 text-white/50 text-sm mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {fav.trip.destination}
                          </span>
                          {fav.trip.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {fav.trip.duration}
                            </span>
                          )}
                        </div>
                        <p className="text-white/40 text-sm mt-2 line-clamp-1">
                          {fav.trip.shortDescription}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFavoriteMutation.mutate(fav.trip.id)}
                        disabled={removeFavoriteMutation.isPending}
                        className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
                        data-testid={`button-remove-favorite-${fav.trip.id}`}
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Vote className="w-5 h-5 text-yellow-400" />
                Propostas de Roteiro
              </h2>
              <Link href="/trips-club/propostas">
                <div className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 cursor-pointer" data-testid="link-proposals">
                  Ver todas
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
            
            <Link href="/trips-club/propostas">
              <div className="block p-6 rounded-2xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/20 hover:border-yellow-400/40 transition-all group cursor-pointer" data-testid="link-vote-cta">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                    <ThumbsUp className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Vote nos próximos roteiros</h3>
                    <p className="text-white/60 text-sm">
                      Ajude a decidir quais viagens vão acontecer. Quanto mais votos, maior a chance!
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-yellow-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </section>

          <section className="mb-12">
            <Link href="/trips-club/criar">
              <div className="block p-6 rounded-2xl bg-gradient-to-r from-purple-400/10 to-pink-500/10 border border-purple-400/20 hover:border-purple-400/40 transition-all group cursor-pointer" data-testid="link-create-trip-cta">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-400/20 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">Crie seu próprio roteiro</h3>
                    <p className="text-white/60 text-sm">
                      Use a Teresa para criar roteiros e ganhe até €20 de crédito quando virar viagem real!
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-purple-400 group-hover:rotate-90 transition-transform" />
                </div>
              </div>
            </Link>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                Descobrir Mais Viagens
              </h2>
              <Link href="/viagens/lista">
                <div className="text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1 cursor-pointer" data-testid="link-all-trips">
                  Ver todas
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {allTrips
                .filter(t => !favorites.some(f => f.trip.id === t.id))
                .slice(0, 4)
                .map((trip) => (
                  <TripCard key={trip.id} trip={trip} />
                ))}
            </div>
          </section>
        </div>
      </main>
      
      <Footer variant="full" />
    </div>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const queryClient = useQueryClient();
  
  const addFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/user/favorites/${trip.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ interestLevel: "interested" }),
      });
      if (!res.ok) throw new Error("Failed to add favorite");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/favorites"] });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-zinc-900 border border-white/10 hover:border-yellow-400/30 transition-all group"
      data-testid={`card-trip-${trip.id}`}
    >
      <div className="flex items-start gap-4">
        {trip.heroImage && (
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <img src={trip.heroImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/viagens/${trip.slug}`}>
              <h3 className="font-bold text-white group-hover:text-yellow-400 transition-colors truncate cursor-pointer">
                {trip.title}
              </h3>
          </Link>
          <div className="flex items-center gap-3 text-white/50 text-xs mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {trip.destination}
            </span>
          </div>
        </div>
        <button
          onClick={() => addFavoriteMutation.mutate()}
          disabled={addFavoriteMutation.isPending}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-yellow-400/10 hover:text-yellow-400 transition-colors flex-shrink-0"
          data-testid={`button-add-favorite-${trip.id}`}
        >
          {addFavoriteMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
