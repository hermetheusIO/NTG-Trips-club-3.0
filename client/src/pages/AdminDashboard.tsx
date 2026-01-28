import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { 
  Users, TrendingUp, Globe, Clock, BarChart3, 
  Sparkles, Map, CalendarDays, ChevronRight, Plus, LogOut,
  FileText, Check, Archive, Loader2, ImagePlus, RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Trip } from "@shared/schema";

interface KPIStats {
  totalLeads: number;
  bySegment: { segment: string; count: number }[];
  byCountry: { country: string; count: number }[];
  recentLeads: any[];
}

const segmentLabels: Record<string, string> = {
  TOURIST_PREMIUM: "Turista Premium",
  DAYTRIP_PT: "Daytrip Portugal",
  LOCAL_CURIOUS: "Local Curioso",
  EXPLORER_AUTONOMOUS: "Explorador Autônomo",
  GENERAL: "Geral"
};

const segmentColors: Record<string, string> = {
  TOURIST_PREMIUM: "bg-amber-500",
  DAYTRIP_PT: "bg-blue-500",
  LOCAL_CURIOUS: "bg-purple-500",
  EXPLORER_AUTONOMOUS: "bg-green-500",
  GENERAL: "bg-gray-500"
};

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading } = useQuery<KPIStats>({
    queryKey: ["/api/admin/kpis"],
  });

  const { data: pendingProposals = [] } = useQuery<Trip[]>({
    queryKey: ["/api/admin/proposals/pending"],
  });

  const [generatingImageFor, setGeneratingImageFor] = useState<number | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/admin/proposals/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proposals/pending"] });
    },
  });

  const generateCoverMutation = useMutation({
    mutationFn: async (tripId: number) => {
      setGeneratingImageFor(tripId);
      return apiRequest("POST", "/api/teresa/generate-cover", { tripId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proposals/pending"] });
      setGeneratingImageFor(null);
    },
    onError: () => {
      setGeneratingImageFor(null);
    },
  });

  const approveWithImageMutation = useMutation({
    mutationFn: async (tripId: number) => {
      setGeneratingImageFor(tripId);
      await apiRequest("POST", "/api/teresa/generate-cover", { tripId });
      return apiRequest("PATCH", `/api/admin/proposals/${tripId}/status`, { status: "approved" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/proposals/pending"] });
      setGeneratingImageFor(null);
    },
    onError: () => {
      setGeneratingImageFor(null);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-primary">A carregar...</div>
      </div>
    );
  }

  const maxSegmentCount = Math.max(...(stats?.bySegment.map(s => s.count) || [1]));

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold">NTG Admin</h1>
              <p className="text-xs text-white/50">Painel de Controlo</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <button data-testid="link-back-to-site" className="text-sm text-white/60 hover:text-white transition-colors">
                Voltar ao Site
              </button>
            </Link>
            <button 
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
              className="flex items-center gap-2 text-sm text-white/40 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            <Link href="/admin">
              <button data-testid="nav-dashboard" className="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary">
                Dashboard
              </button>
            </Link>
            <Link href="/admin/experiences">
              <button data-testid="nav-experiences" className="px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors">
                Experiências
              </button>
            </Link>
            <Link href="/admin/trips">
              <button data-testid="nav-trips" className="px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors">
                Viagens
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-white/60 text-sm">Total Leads</span>
            </div>
            <p data-testid="kpi-total-leads" className="text-4xl font-bold text-primary">{stats?.totalLeads || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white/70" />
              </div>
              <span className="text-white/60 text-sm">Países</span>
            </div>
            <p data-testid="kpi-countries" className="text-4xl font-bold">{stats?.byCountry.length || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white/70" />
              </div>
              <span className="text-white/60 text-sm">Segmentos</span>
            </div>
            <p className="text-4xl font-bold">{stats?.bySegment.length || 0}</p>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Segment Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Por Segmento
            </h3>
            <div className="space-y-3">
              {stats?.bySegment.map((seg, idx) => (
                <div key={seg.segment}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{segmentLabels[seg.segment] || seg.segment}</span>
                    <span className="font-medium">{seg.count}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(seg.count / maxSegmentCount) * 100}%` }}
                      transition={{ delay: 0.4 + idx * 0.1, duration: 0.5 }}
                      className={`h-full ${segmentColors[seg.segment] || 'bg-gray-500'} rounded-full`}
                    />
                  </div>
                </div>
              ))}
              {(!stats?.bySegment || stats.bySegment.length === 0) && (
                <p className="text-white/40 text-sm text-center py-4">Sem dados ainda</p>
              )}
            </div>
          </motion.div>

          {/* Country Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Por País
            </h3>
            <div className="space-y-2">
              {stats?.byCountry.slice(0, 6).map((country) => (
                <div key={country.country} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-white/70">{country.country}</span>
                  <span className="text-primary font-medium">{country.count}</span>
                </div>
              ))}
              {(!stats?.byCountry || stats.byCountry.length === 0) && (
                <p className="text-white/40 text-sm text-center py-4">Sem dados ainda</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Leads Recentes
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-left">
                  <th className="pb-3 font-medium">Nome</th>
                  <th className="pb-3 font-medium">País</th>
                  <th className="pb-3 font-medium">Segmento</th>
                  <th className="pb-3 font-medium">Tempo</th>
                  <th className="pb-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-white/5">
                    <td className="py-3 font-medium">{lead.firstName}</td>
                    <td className="py-3 text-white/70">{lead.countryName}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${segmentColors[lead.segmentPrimary]} text-white`}>
                        {segmentLabels[lead.segmentPrimary] || lead.segmentPrimary}
                      </span>
                    </td>
                    <td className="py-3 text-white/70">{lead.timeBucket}</td>
                    <td className="py-3 text-white/50">
                      {new Date(lead.createdAt).toLocaleDateString('pt-PT')}
                    </td>
                  </tr>
                ))}
                {(!stats?.recentLeads || stats.recentLeads.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/40">
                      Nenhum lead registado ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Pending Proposals */}
        {pendingProposals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gradient-to-br from-yellow-400/10 to-transparent border border-yellow-400/20 rounded-2xl p-6 mt-8"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-yellow-400" />
              Propostas Pendentes ({pendingProposals.length})
            </h3>
            <div className="space-y-3">
              {pendingProposals.map((proposal) => (
                <div key={proposal.id} className="bg-black/30 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate" data-testid={`proposal-title-${proposal.id}`}>
                        {proposal.title}
                      </h4>
                      <p className="text-sm text-white/50 truncate">{proposal.destination}</p>
                      <p className="text-xs text-white/30 mt-1">
                        Criado: {new Date(proposal.createdAt).toLocaleDateString('pt-PT')}
                      </p>
                    </div>
                    {proposal.heroImage && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={proposal.heroImage} 
                          alt={proposal.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => approveWithImageMutation.mutate(proposal.id)}
                      disabled={generatingImageFor === proposal.id || updateStatusMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-primary/20 to-emerald-500/20 hover:from-primary/30 hover:to-emerald-500/30 text-primary rounded-lg transition-colors disabled:opacity-50 text-sm"
                      data-testid={`button-approve-with-image-${proposal.id}`}
                      title="Gerar imagem e aprovar"
                    >
                      {generatingImageFor === proposal.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          A gerar...
                        </>
                      ) : (
                        <>
                          <ImagePlus className="w-4 h-4" />
                          Gerar Capa + Aprovar
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "approved" })}
                      disabled={updateStatusMutation.isPending || generatingImageFor === proposal.id}
                      className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                      data-testid={`button-approve-${proposal.id}`}
                      title="Aprovar sem imagem"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: proposal.id, status: "archived" })}
                      disabled={updateStatusMutation.isPending || generatingImageFor === proposal.id}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white/60 rounded-lg transition-colors disabled:opacity-50"
                      data-testid={`button-archive-${proposal.id}`}
                      title="Arquivar"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Link href="/admin/experiences">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-left transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Gerir Experiências</h3>
                    <p className="text-sm text-white/50">Criar e editar experiências NTG</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-primary transition-colors" />
              </div>
            </motion.button>
          </Link>

          <Link href="/admin/trips">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 text-left transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <Map className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Gerir Viagens</h3>
                    <p className="text-sm text-white/50">Criar e editar day-trips</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-primary transition-colors" />
              </div>
            </motion.button>
          </Link>
        </div>
      </main>
    </div>
  );
}
