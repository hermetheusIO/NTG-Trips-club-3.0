import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ArrowRight, MapPin, Users, Loader2, ArrowLeft, Vote, 
  Heart, HeartOff, Star, ThumbsUp, Eye, ChevronRight, Lock, Sparkles,
  Clock, CheckCircle2, Calendar, Rocket
} from "lucide-react";
import type { Trip } from "@shared/schema";
import Footer from "@/components/Footer";

type ProposalWithStats = Trip & { 
  stats: { votes: number; interested: number } 
};

type ViabilityData = {
  isViable: boolean;
  votes: number;
  interested: number;
  required: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending_review: { label: "Em análise", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Clock },
  voting: { label: "Em votação", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Vote },
  ready_to_schedule: { label: "Quase a abrir!", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: Rocket },
  scheduled: { label: "Confirmado", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Calendar },
  archived: { label: "Arquivado", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30", icon: CheckCircle2 },
};

export default function ClubProposals() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: proposals = [], isLoading } = useQuery<ProposalWithStats[]>({
    queryKey: ["/api/proposals"],
    queryFn: async () => {
      const res = await fetch("/api/proposals");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="p-6 border-b border-white/10 sticky top-0 bg-black/80 backdrop-blur-lg z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/trips-club/member">
            <div className="flex items-center gap-2 text-white/60 hover:text-white transition-colors cursor-pointer" data-testid="link-back">
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </div>
          </Link>
          <Link href="/trips-club">
            <div className="text-yellow-400 font-black text-xl cursor-pointer" data-testid="link-logo">NTG Trips Club</div>
          </Link>
          <div className="w-20" />
        </div>
      </header>

      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-2">
              <Vote className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-black text-white" data-testid="text-page-title">
                Propostas de Roteiros
              </h1>
            </div>
            <p className="text-white/60 text-lg">
              Vote e manifeste interesse nos roteiros que mais te agradam. Quanto mais votos, maior a chance de acontecer!
            </p>
          </motion.div>

          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border border-yellow-400/20 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">Junta-te ao NTG Trips Club</h3>
                  <p className="text-white/60 text-sm mb-4">
                    Como membro, podes votar nas propostas, manifestar interesse e até criar os teus próprios roteiros 
                    com descontos exclusivos de 50-100% quando a viagem se realiza.
                  </p>
                  <a 
                    href="/api/login"
                    className="inline-flex items-center gap-2 bg-yellow-400 text-black font-bold px-5 py-2.5 rounded-full hover:bg-yellow-300 transition-colors"
                    data-testid="button-join-club"
                  >
                    Entrar / Registar
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-20">
              <Star className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Sem propostas ainda</h2>
              <p className="text-white/50">
                Novas propostas de roteiros aparecerão aqui em breve.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {proposals.map((proposal, index) => (
                <ProposalCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  index={index}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer variant="full" />
    </div>
  );
}

function ProposalCard({ 
  proposal, 
  index,
  isAuthenticated
}: { 
  proposal: ProposalWithStats; 
  index: number;
  isAuthenticated: boolean;
}) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  const { data: voteStatus } = useQuery<{ voted: boolean }>({
    queryKey: ["/api/proposals", proposal.id, "voted"],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${proposal.id}/voted`, { credentials: "include" });
      if (!res.ok) return { voted: false };
      return res.json();
    },
    enabled: isAuthenticated,
  });
  
  const { data: viability } = useQuery<ViabilityData>({
    queryKey: ["/api/proposals", proposal.id, "viability"],
    queryFn: async () => {
      const res = await fetch(`/api/proposals/${proposal.id}/viability`);
      if (!res.ok) return { isViable: false, votes: 0, interested: 0, required: 10 };
      return res.json();
    },
  });

  const voteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/proposals/${proposal.id}/vote`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals", proposal.id, "voted"] });
    },
  });

  const unvoteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/proposals/${proposal.id}/vote`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove vote");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals", proposal.id, "voted"] });
    },
  });

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    setIsVoting(true);
    try {
      if (voteStatus?.voted) {
        await unvoteMutation.mutateAsync();
      } else {
        await voteMutation.mutateAsync();
      }
    } finally {
      setIsVoting(false);
    }
  };

  const hasVoted = voteStatus?.voted || false;
  const required = viability?.required || 10;
  const currentInterested = viability?.interested || proposal.stats.interested;
  const viabilityPercent = Math.min(100, Math.round((currentInterested / required) * 100));
  const status = proposal.proposalStatus || "voting";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.voting;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/10 hover:border-yellow-400/30 transition-all group"
      data-testid={`card-proposal-${proposal.id}`}
    >
      <div className="flex flex-col md:flex-row">
        {proposal.heroImage && (
          <div className="w-full md:w-48 h-48 md:h-auto flex-shrink-0 relative">
            <img 
              src={proposal.heroImage} 
              alt={proposal.title || ""} 
              className="w-full h-full object-cover"
            />
            <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${statusConfig.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </div>
          </div>
        )}
        
        <div className="p-6 flex-1">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white group-hover:text-yellow-400 transition-colors" data-testid={`text-proposal-title-${proposal.id}`}>
                  {proposal.title}
                </h2>
                {!proposal.heroImage && (
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 border ${statusConfig.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                  </div>
                )}
              </div>
              {proposal.destination && (
                <div className="flex items-center gap-1.5 text-white/50 text-sm mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{proposal.destination}</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-white/60 mb-4 line-clamp-2">{proposal.shortDescription}</p>
          
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-white/50">
                {viability?.isViable ? "Pronto para abrir!" : `${currentInterested}/${required} interessados`}
              </span>
              <span className={`font-medium ${viability?.isViable ? "text-green-400" : "text-yellow-400"}`}>
                {viabilityPercent}%
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full rounded-full ${
                  viability?.isViable 
                    ? "bg-gradient-to-r from-green-400 to-emerald-500" 
                    : "bg-gradient-to-r from-yellow-400 to-amber-500"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${viabilityPercent}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
              />
            </div>
            {viability?.isViable && status === "voting" && (
              <p className="text-green-400/80 text-xs mt-1.5">
                Este roteiro tem tração suficiente e pode ser agendado em breve!
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-white/50" data-testid={`text-votes-${proposal.id}`}>
                <ThumbsUp className="w-4 h-4" />
                <span className="font-medium">{proposal.stats.votes}</span>
                <span className="text-sm">votos</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/50" data-testid={`text-interested-${proposal.id}`}>
                <Users className="w-4 h-4" />
                <span className="font-medium">{proposal.stats.interested}</span>
                <span className="text-sm">interessados</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleVote}
                disabled={isVoting}
                className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${
                  hasVoted
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 text-white hover:bg-yellow-400 hover:text-black"
                }`}
                data-testid={`button-vote-${proposal.id}`}
              >
                {isVoting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : hasVoted ? (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    Votado
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    Votar
                  </>
                )}
              </button>
              
              <Link href={`/viagem/${proposal.slug}`}>
                <div 
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  data-testid={`link-details-${proposal.id}`}
                >
                  <ChevronRight className="w-5 h-5 text-white/50" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
