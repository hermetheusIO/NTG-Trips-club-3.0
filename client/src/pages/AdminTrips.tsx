import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Map, X, Save, Wand2, 
  BarChart3, Loader2, Sparkles, LogOut, ImagePlus, FolderOpen, 
  RefreshCw, Images, Cloud, Vote, Check, XCircle, Calendar, ThumbsUp,
  Users, Filter
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";
import type { Trip, InsertTrip, MediaAsset, TripAlbum } from "@shared/schema";

interface DriveFolder {
  id: string;
  name: string;
}

interface AlbumWithPhotos extends TripAlbum {
  photos: { id: number; mediaAssetId: number; asset?: MediaAsset }[];
}

export default function AdminTrips() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "commercial" | "album">("info");
  const [viewFilter, setViewFilter] = useState<"all" | "proposals" | "trips">("all");
  const [showScheduleModal, setShowScheduleModal] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDriveFolder, setSelectedDriveFolder] = useState<string>("");
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    price: "",
    duration: "",
    destination: "",
    heroImage: "",
    icon: "Map",
    isPublished: false,
    isFeatured: false,
    tags: [] as string[]
  });
  
  const [rawNotes, setRawNotes] = useState("");
  
  const { data: driveFolders } = useQuery<DriveFolder[]>({
    queryKey: ["/api/admin/drive/folders"],
    enabled: showModal && activeTab === "album",
  });
  
  const { data: albums } = useQuery<AlbumWithPhotos[]>({
    queryKey: ["/api/admin/albums"],
  });

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTrip) => {
      const res = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTrip> }) => {
      const res = await fetch(`/api/admin/trips/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/trips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    }
  });

  const approveProposalMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const res = await fetch(`/api/admin/proposals/${tripId}/approve`, { 
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to approve proposal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    }
  });

  const rejectProposalMutation = useMutation({
    mutationFn: async ({ tripId, reason }: { tripId: number; reason?: string }) => {
      const res = await fetch(`/api/admin/proposals/${tripId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error("Failed to reject proposal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
    }
  });

  const scheduleProposalMutation = useMutation({
    mutationFn: async ({ tripId }: { tripId: number; scheduledDate: string }) => {
      const res = await fetch(`/api/admin/proposals/${tripId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to schedule trip");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setShowScheduleModal(null);
      setScheduledDate("");
    }
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (data: { tripId: number; title: string; description: string; googleDriveFolderId?: string }) => {
      return apiRequest("POST", "/api/admin/albums", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
    }
  });

  const updateAlbumMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ googleDriveFolderId: string; isPublic: boolean }> }) => {
      return apiRequest("PUT", `/api/admin/albums/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
    }
  });

  const syncDriveMutation = useMutation({
    mutationFn: async (albumId: number) => {
      return apiRequest("POST", `/api/admin/albums/${albumId}/sync-drive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
    }
  });

  const currentAlbum = editingTrip ? albums?.find(a => a.tripId === editingTrip.id) : null;

  const handleSyncDrive = async () => {
    if (!currentAlbum) return;
    setIsSyncing(true);
    try {
      await syncDriveMutation.mutateAsync(currentAlbum.id);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync when album tab is opened for the first time
  useEffect(() => {
    if (activeTab === "album" && currentAlbum?.googleDriveFolderId && !currentAlbum.lastSyncedAt && !isSyncing) {
      handleSyncDrive();
    }
  }, [activeTab, currentAlbum?.id]);

  const handleCreateOrUpdateAlbum = async () => {
    if (!editingTrip || !selectedDriveFolder) return;
    
    if (currentAlbum) {
      await updateAlbumMutation.mutateAsync({
        id: currentAlbum.id,
        data: { googleDriveFolderId: selectedDriveFolder }
      });
    } else {
      await createAlbumMutation.mutateAsync({
        tripId: editingTrip.id,
        title: `Álbum ${editingTrip.title}`,
        description: `Fotos da viagem ${editingTrip.title}`,
        googleDriveFolderId: selectedDriveFolder
      });
    }
  };

  useEffect(() => {
    if (currentAlbum?.googleDriveFolderId) {
      setSelectedDriveFolder(currentAlbum.googleDriveFolderId);
    } else {
      setSelectedDriveFolder("");
    }
  }, [currentAlbum]);

  const generateWithAI = async () => {
    if (!rawNotes.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "trip",
          rawNotes,
          category: "daytrip"
        })
      });
      if (!res.ok) throw new Error("Failed to generate");
      const generated = await res.json();
      setFormData(prev => ({
        ...prev,
        title: generated.title || prev.title,
        shortDescription: generated.shortDescription || prev.shortDescription,
        longDescription: generated.longDescription || prev.longDescription,
        icon: generated.suggestedIcon || prev.icon,
        slug: generated.suggestedSlug || prev.slug,
        tags: generated.suggestedTags || prev.tags
      }));
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const openCreateModal = () => {
    setEditingTrip(null);
    setActiveTab("info");
    setFormData({
      title: "",
      slug: "",
      shortDescription: "",
      longDescription: "",
      price: "",
      duration: "",
      destination: "",
      heroImage: "",
      icon: "Map",
      isPublished: false,
      isFeatured: false,
      tags: []
    });
    setRawNotes("");
    setSelectedDriveFolder("");
    setShowModal(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setActiveTab("info");
    setFormData({
      title: trip.title,
      slug: trip.slug,
      shortDescription: trip.shortDescription,
      longDescription: trip.longDescription || "",
      price: trip.price || "",
      duration: trip.duration || "",
      destination: trip.destination,
      heroImage: trip.heroImage || "",
      icon: trip.icon || "Map",
      isPublished: trip.isPublished,
      isFeatured: trip.isFeatured,
      tags: trip.tags || []
    });
    setRawNotes("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTrip(null);
    setActiveTab("info");
  };

  const handleSubmit = () => {
    if (editingTrip) {
      updateMutation.mutate({ id: editingTrip.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertTrip);
    }
  };

  const togglePublish = (trip: Trip) => {
    updateMutation.mutate({ id: trip.id, data: { isPublished: !trip.isPublished } });
  };

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
              <p className="text-xs text-white/50">Viagens</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="text-sm text-white/60 hover:text-white transition-colors">
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
              <button className="px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors">
                Dashboard
              </button>
            </Link>
            <Link href="/admin/experiences">
              <button className="px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors">
                Experiências
              </button>
            </Link>
            <Link href="/admin/trips">
              <button className="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary">
                Viagens
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with Create Button and Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">Viagens & Day-Trips</h2>
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              <button
                onClick={() => setViewFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewFilter === "all" ? "bg-primary text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setViewFilter("proposals")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewFilter === "proposals" ? "bg-purple-500 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                <Vote className="w-3 h-3" />
                Propostas
              </button>
              <button
                onClick={() => setViewFilter("trips")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  viewFilter === "trips" ? "bg-primary text-black" : "text-white/60 hover:text-white"
                }`}
              >
                Viagens
              </button>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            data-testid="button-create-trip"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Viagem
          </button>
        </div>

        {/* Trips List */}
        {isLoading ? (
          <div className="text-center py-12 text-white/50">A carregar...</div>
        ) : trips && trips.length > 0 ? (
          <div className="grid gap-4">
            {trips
              .filter(trip => {
                if (viewFilter === "proposals") return trip.proposalStatus === "voting" || trip.proposalStatus === "pending_review";
                if (viewFilter === "trips") return !trip.proposalStatus || trip.proposalStatus === "approved" || trip.proposalStatus === "scheduled" || trip.proposalStatus === "completed";
                return true;
              })
              .map((trip) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/5 border rounded-2xl p-5 ${
                  trip.proposalStatus === "voting" || trip.proposalStatus === "pending" 
                    ? "border-purple-500/30" 
                    : "border-white/10"
                }`}
              >
                <div className="flex items-start gap-4">
                  {trip.heroImage ? (
                    <img src={trip.heroImage} alt={trip.title} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Map className="w-6 h-6 text-white/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg truncate">{trip.title}</h3>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {trip.proposalStatus === "voting" && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium flex items-center gap-1">
                            <Vote className="w-3 h-3" />
                            Em votacao
                          </span>
                        )}
                        {trip.proposalStatus === "pending_review" && (
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-medium">
                            Pendente revisao
                          </span>
                        )}
                        {trip.proposalStatus === "approved" && (
                          <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Aprovada
                          </span>
                        )}
                        {trip.proposalStatus === "scheduled" && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Agendada
                          </span>
                        )}
                        {trip.proposalStatus === "archived" && (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs font-medium">
                            Arquivada
                          </span>
                        )}
                        {trip.proposalStatus === "completed" && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Concluida
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-white/50 text-sm line-clamp-1">{trip.shortDescription}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{trip.destination}</span>
                      {trip.price && <span className="text-xs text-primary">{trip.price}</span>}
                      {trip.duration && <span className="text-xs text-white/40">{trip.duration}</span>}
                    </div>
                    
                    {/* Proposal Info */}
                    {trip.proposalStatus && (
                      <div className="mt-2 text-xs text-white/40 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Proposta de membro
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {/* Proposal Actions - pending_review: can approve to voting, or archive */}
                    {trip.proposalStatus === "pending_review" && (
                      <div className="flex items-center gap-1 mb-2">
                        <button
                          onClick={() => approveProposalMutation.mutate(trip.id)}
                          disabled={approveProposalMutation.isPending}
                          className="p-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                          title="Aprovar para votacao"
                          data-testid={`button-approve-proposal-${trip.id}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Motivo do arquivo (opcional):");
                            rejectProposalMutation.mutate({ tripId: trip.id, reason: reason || undefined });
                          }}
                          disabled={rejectProposalMutation.isPending}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Arquivar proposta"
                          data-testid={`button-archive-proposal-${trip.id}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Proposal Actions - voting: can schedule or archive */}
                    {trip.proposalStatus === "voting" && (
                      <div className="flex items-center gap-1 mb-2">
                        <button
                          onClick={() => scheduleProposalMutation.mutate({ tripId: trip.id, scheduledDate: "" })}
                          disabled={scheduleProposalMutation.isPending}
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                          title="Agendar viagem"
                          data-testid={`button-schedule-trip-${trip.id}`}
                        >
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Motivo do arquivo (opcional):");
                            rejectProposalMutation.mutate({ tripId: trip.id, reason: reason || undefined });
                          }}
                          disabled={rejectProposalMutation.isPending}
                          className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Arquivar proposta"
                          data-testid={`button-archive-proposal-${trip.id}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    {/* Approved proposals: can schedule */}
                    {trip.proposalStatus === "approved" && (
                      <button
                        onClick={() => scheduleProposalMutation.mutate({ tripId: trip.id, scheduledDate: "" })}
                        disabled={scheduleProposalMutation.isPending}
                        className="p-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors mb-2"
                        title="Agendar viagem"
                        data-testid={`button-schedule-trip-${trip.id}`}
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Standard Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => togglePublish(trip)}
                        data-testid={`button-toggle-publish-${trip.id}`}
                        className={`p-2 rounded-lg transition-colors ${
                          trip.isPublished ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                        }`}
                        title={trip.isPublished ? "Publicado" : "Rascunho"}
                      >
                        {trip.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(trip)}
                        data-testid={`button-edit-trip-${trip.id}`}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Tem certeza que deseja deletar?")) {
                            deleteMutation.mutate(trip.id);
                          }
                        }}
                        data-testid={`button-delete-trip-${trip.id}`}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <Map className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-4">Nenhuma viagem criada ainda</p>
            <button
              onClick={openCreateModal}
              className="text-primary hover:underline"
            >
              Criar primeira viagem
            </button>
          </div>
        )}
      </main>
      
      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowScheduleModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Agendar Viagem</h3>
              </div>
              
              <p className="text-white/60 text-sm mb-4">
                Escolha a data para esta viagem acontecer.
              </p>
              
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:border-blue-500"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowScheduleModal(null)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (scheduledDate && showScheduleModal) {
                      scheduleProposalMutation.mutate({
                        tripId: showScheduleModal,
                        scheduledDate
                      });
                    }
                  }}
                  disabled={!scheduledDate || scheduleProposalMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/30 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {scheduleProposalMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      Agendar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {editingTrip ? "Editar Viagem" : "Nova Viagem"}
                  </h2>
                  <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {editingTrip && (
                  <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => setActiveTab("info")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "info" ? "bg-primary text-black" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                      Info
                    </button>
                    <button
                      onClick={() => setActiveTab("commercial")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "commercial" ? "bg-primary text-black" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <ImagePlus className="w-4 h-4" />
                      Fotos
                    </button>
                    <button
                      onClick={() => setActiveTab("album")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === "album" ? "bg-primary text-black" : "text-white/60 hover:text-white"
                      }`}
                    >
                      <Cloud className="w-4 h-4" />
                      Álbum
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-6">
                {activeTab === "info" && (
                  <>
                {/* AI Generation Section */}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">Gerar com Teresa IA</span>
                  </div>
                  <textarea
                    value={rawNotes}
                    onChange={(e) => setRawNotes(e.target.value)}
                    placeholder="Descreva a viagem em suas palavras... Ex: 'Day-trip para Serra da Estrela, passando por Seia, visita ao museu do pão, almoço típico, neve no inverno, 75€ por pessoa'"
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={generateWithAI}
                    disabled={isGenerating || !rawNotes.trim()}
                    data-testid="button-generate-ai"
                    className="mt-2 flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/30 text-black font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        A gerar...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Gerar Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Título</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Slug (URL)</label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Destino</label>
                      <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                        placeholder="Ex: Serra da Estrela"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1">Descrição Curta</label>
                    <textarea
                      value={formData.shortDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 resize-none h-20 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-1">Descrição Completa</label>
                    <textarea
                      value={formData.longDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 resize-none h-32 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Preço</label>
                      <input
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="Ex: 75€"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Duração</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="Ex: Dia inteiro"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Ícone</label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="Map"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Imagem Principal</label>
                    <ImageUploader
                      category="trips"
                      currentImageUrl={formData.heroImage || undefined}
                      onUploadComplete={(asset: MediaAsset | null) => {
                        setFormData(prev => ({ ...prev, heroImage: asset?.optimizedUrl || "" }));
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-primary"
                      />
                      <span className="text-sm">Publicar</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                        className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-primary"
                      />
                      <span className="text-sm">Destaque</span>
                    </label>
                  </div>
                </div>
                </>
                )}

                {activeTab === "commercial" && editingTrip && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <ImagePlus className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">Fotos Comerciais</h3>
                      </div>
                      <p className="text-white/60 text-sm mb-4">
                        Adicione fotos para usar no marketing e na página de detalhes da viagem.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-white/60 mb-2">Imagem Principal (Hero)</label>
                          <ImageUploader
                            category="trips"
                            currentImageUrl={formData.heroImage || undefined}
                            onUploadComplete={(asset: MediaAsset | null) => {
                              setFormData(prev => ({ ...prev, heroImage: asset?.optimizedUrl || "" }));
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "album" && editingTrip && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Cloud className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold">Álbum de Viagem</h3>
                      </div>
                      <p className="text-white/60 text-sm mb-4">
                        Conecte uma pasta do Google Drive para importar automaticamente as fotos da viagem.
                      </p>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        <div>
                          <label className="block text-sm text-white/60 mb-2">
                            <FolderOpen className="w-4 h-4 inline mr-2" />
                            Pasta do Google Drive
                          </label>
                          <select
                            value={selectedDriveFolder}
                            onChange={(e) => setSelectedDriveFolder(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
                          >
                            <option value="">Selecione uma pasta...</option>
                            {driveFolders?.map((folder) => (
                              <option key={folder.id} value={folder.id}>
                                {folder.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedDriveFolder && selectedDriveFolder !== currentAlbum?.googleDriveFolderId && (
                          <button
                            onClick={handleCreateOrUpdateAlbum}
                            disabled={createAlbumMutation.isPending || updateAlbumMutation.isPending}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-4 py-3 rounded-xl transition-colors"
                          >
                            <FolderOpen className="w-4 h-4" />
                            {currentAlbum ? "Atualizar Pasta" : "Criar Álbum"}
                          </button>
                        )}

                        {currentAlbum && (
                          <div className="pt-4 border-t border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium">Fotos no Álbum</p>
                                <p className="text-xs text-white/50">
                                  {currentAlbum.photos?.length || 0} fotos importadas
                                </p>
                              </div>
                              <button
                                onClick={handleSyncDrive}
                                disabled={isSyncing || !currentAlbum.googleDriveFolderId}
                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                {isSyncing ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Sincronizando...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="w-4 h-4" />
                                    Sincronizar Drive
                                  </>
                                )}
                              </button>
                            </div>

                            {currentAlbum.photos && currentAlbum.photos.length > 0 && (
                              <div className="grid grid-cols-4 gap-2">
                                {currentAlbum.photos.slice(0, 8).map((photo) => (
                                  <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                                    {photo.asset?.thumbnailUrl ? (
                                      <img 
                                        src={photo.asset.thumbnailUrl} 
                                        alt="" 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Images className="w-6 h-6 text-white/30" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {currentAlbum.lastSyncedAt && (
                              <p className="text-xs text-white/40">
                                Última sincronização: {new Date(currentAlbum.lastSyncedAt).toLocaleString('pt-PT')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  {activeTab === "info" && (
                    <button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || updateMutation.isPending}
                      data-testid="button-save-trip"
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2 rounded-xl transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {editingTrip ? "Guardar" : "Criar"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
