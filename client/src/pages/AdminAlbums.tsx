import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, X, Save, Camera,
  BarChart3, Loader2, LogOut, Image, Upload, Check
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";
import type { Trip, TripAlbum, TripAlbumPhoto, MediaAsset } from "@shared/schema";

interface AlbumWithPhotos extends TripAlbum {
  photos: (TripAlbumPhoto & { asset?: MediaAsset })[];
  trip?: Trip;
}

export default function AdminAlbums() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumWithPhotos | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<number | "">("");
  const [albumTitle, setAlbumTitle] = useState("");
  const [albumDescription, setAlbumDescription] = useState("");
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [currentAlbumForUpload, setCurrentAlbumForUpload] = useState<AlbumWithPhotos | null>(null);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });

  const { data: trips, isLoading: loadingTrips } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const { data: albums, isLoading: loadingAlbums } = useQuery<AlbumWithPhotos[]>({
    queryKey: ["/api/admin/albums"],
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (data: { tripId: number; title: string; description: string }) => {
      return apiRequest("POST", "/api/admin/albums", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
      closeModal();
    }
  });

  const updateAlbumMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<{ title: string; description: string; isPublic: boolean }> }) => {
      return apiRequest("PUT", `/api/admin/albums/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
      closeModal();
    }
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/albums/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
    }
  });

  const addPhotoMutation = useMutation({
    mutationFn: async ({ albumId, mediaAssetId }: { albumId: number; mediaAssetId: number }) => {
      return apiRequest("POST", `/api/admin/albums/${albumId}/photos`, { mediaAssetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
    }
  });

  const removePhotoMutation = useMutation({
    mutationFn: async (photoId: number) => {
      return apiRequest("DELETE", `/api/admin/albums/photos/${photoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/albums"] });
    }
  });

  const openCreateModal = () => {
    setEditingAlbum(null);
    setSelectedTripId("");
    setAlbumTitle("");
    setAlbumDescription("");
    setShowModal(true);
  };

  const openEditModal = (album: AlbumWithPhotos) => {
    setEditingAlbum(album);
    setSelectedTripId(album.tripId);
    setAlbumTitle(album.title);
    setAlbumDescription(album.description || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAlbum(null);
  };

  const handleSubmit = () => {
    if (!selectedTripId) return;
    
    if (editingAlbum) {
      updateAlbumMutation.mutate({ 
        id: editingAlbum.id, 
        data: { title: albumTitle, description: albumDescription }
      });
    } else {
      createAlbumMutation.mutate({
        tripId: Number(selectedTripId),
        title: albumTitle,
        description: albumDescription
      });
    }
  };

  const openUploadSection = (album: AlbumWithPhotos) => {
    setCurrentAlbumForUpload(album);
    setShowUploadSection(true);
  };

  const handlePhotoUploaded = (asset: MediaAsset | null) => {
    if (currentAlbumForUpload && asset) {
      addPhotoMutation.mutate({ albumId: currentAlbumForUpload.id, mediaAssetId: asset.id });
    }
  };

  const togglePublished = (album: AlbumWithPhotos) => {
    updateAlbumMutation.mutate({ 
      id: album.id, 
      data: { isPublic: !album.isPublic }
    });
  };

  if (loadingTrips || loadingAlbums) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" data-testid="admin-albums-page">
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">
              <BarChart3 className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-primary">Álbuns de Viagem</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              data-testid="button-create-album"
            >
              <Plus className="w-4 h-4" />
              Novo Álbum
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {albums && albums.length > 0 ? (
          <div className="grid gap-6">
            {albums.map((album) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6"
                data-testid={`album-card-${album.id}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{album.title}</h3>
                    <p className="text-gray-400 text-sm">
                      {album.trip?.title || "Viagem não encontrada"} • {album.photos?.length || 0} fotos
                    </p>
                    {album.description && (
                      <p className="text-gray-500 text-sm mt-1">{album.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePublished(album)}
                      className={`p-2 rounded-lg transition-colors ${
                        album.isPublic 
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" 
                          : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                      }`}
                      title={album.isPublic ? "Publicado" : "Rascunho"}
                      data-testid={`button-toggle-publish-${album.id}`}
                    >
                      {album.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openUploadSection(album)}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Adicionar fotos"
                      data-testid={`button-add-photos-${album.id}`}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(album)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      data-testid={`button-edit-album-${album.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAlbumMutation.mutate(album.id)}
                      className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      data-testid={`button-delete-album-${album.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {album.photos && album.photos.length > 0 && (
                  <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 mt-4">
                    {album.photos.slice(0, 10).map((photo) => (
                      <div 
                        key={photo.id} 
                        className="relative aspect-square group"
                        data-testid={`photo-thumbnail-${photo.id}`}
                      >
                        <img
                          src={photo.asset?.thumbnailUrl || photo.asset?.optimizedUrl || ""}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removePhotoMutation.mutate(photo.id)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg"
                          data-testid={`button-remove-photo-${photo.id}`}
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                    {album.photos.length > 10 && (
                      <div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">+{album.photos.length - 10}</span>
                      </div>
                    )}
                  </div>
                )}

                {album.isPublic && album.trip && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Link 
                      href={`/viagens/${album.trip.slug}/album`}
                      className="text-primary text-sm hover:underline"
                    >
                      Ver álbum público →
                    </Link>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Image className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">Nenhum álbum criado</h2>
            <p className="text-gray-500 mb-6">Crie álbuns para as viagens realizadas</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 bg-primary text-black px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              data-testid="button-create-first-album"
            >
              <Plus className="w-5 h-5" />
              Criar Primeiro Álbum
            </button>
          </div>
        )}
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold">
                  {editingAlbum ? "Editar Álbum" : "Novo Álbum"}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Viagem</label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                    disabled={!!editingAlbum}
                    data-testid="select-trip"
                  >
                    <option value="">Selecione uma viagem</option>
                    {trips?.map((trip) => (
                      <option key={trip.id} value={trip.id}>{trip.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Título do Álbum</label>
                  <input
                    type="text"
                    value={albumTitle}
                    onChange={(e) => setAlbumTitle(e.target.value)}
                    placeholder="Ex: Fotos da viagem - Dezembro 2025"
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                    data-testid="input-album-title"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Descrição (opcional)</label>
                  <textarea
                    value={albumDescription}
                    onChange={(e) => setAlbumDescription(e.target.value)}
                    placeholder="Uma breve descrição do álbum..."
                    rows={3}
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-primary resize-none"
                    data-testid="input-album-description"
                  />
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-white/10">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedTripId || !albumTitle.trim() || createAlbumMutation.isPending || updateAlbumMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  data-testid="button-save-album"
                >
                  {(createAlbumMutation.isPending || updateAlbumMutation.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadSection && currentAlbumForUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setShowUploadSection(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-semibold">
                  Adicionar Fotos: {currentAlbumForUpload.title}
                </h2>
                <button onClick={() => setShowUploadSection(false)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <ImageUploader
                  onUploadComplete={handlePhotoUploaded}
                  category="album"
                />

                {addPhotoMutation.isPending && (
                  <div className="flex items-center gap-2 text-primary mt-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adicionando foto ao álbum...</span>
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm text-gray-400 mb-3">Fotos no álbum ({currentAlbumForUpload.photos?.length || 0})</h3>
                  {currentAlbumForUpload.photos && currentAlbumForUpload.photos.length > 0 ? (
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {currentAlbumForUpload.photos.map((photo) => (
                        <div 
                          key={photo.id} 
                          className="relative aspect-square group"
                        >
                          <img
                            src={photo.asset?.thumbnailUrl || photo.asset?.optimizedUrl || ""}
                            alt=""
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removePhotoMutation.mutate(photo.id)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma foto adicionada ainda</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-4 border-t border-white/10">
                <button
                  onClick={() => setShowUploadSection(false)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-black px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  data-testid="button-done-upload"
                >
                  <Check className="w-4 h-4" />
                  Concluído
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
