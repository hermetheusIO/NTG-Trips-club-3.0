import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, X, Loader2, GripVertical, Plus, Trash2 } from "lucide-react";
import type { MediaAsset, ExperienceGallery, TripGallery } from "@shared/schema";

export type GalleryItem = (ExperienceGallery | TripGallery) & { mediaAsset: MediaAsset };

interface GalleryUploaderProps {
  entityType: "experience" | "trip";
  entityId: number;
  gallery: GalleryItem[];
  onGalleryChange: (gallery: GalleryItem[]) => void;
}

export function GalleryUploader({ 
  entityType,
  entityId,
  gallery,
  onGalleryChange
}: GalleryUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", entityType);

      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Falha ao fazer upload");
      }

      return response.json() as Promise<MediaAsset>;
    }
  });

  const addToGalleryMutation = useMutation({
    mutationFn: async ({ mediaAssetId, displayOrder }: { mediaAssetId: number; displayOrder: number }) => {
      const endpoint = entityType === "experience" 
        ? `/api/admin/experiences/${entityId}/gallery`
        : `/api/admin/trips/${entityId}/gallery`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaAssetId, displayOrder }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Falha ao adicionar à galeria");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${entityType}s/${entityId}/gallery`] });
    }
  });

  const removeFromGalleryMutation = useMutation({
    mutationFn: async (galleryItemId: number) => {
      const endpoint = `/api/admin/gallery/${entityType}/${galleryItemId}`;
      
      const response = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Falha ao remover da galeria");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${entityType}s/${entityId}/gallery`] });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: { id: number; displayOrder: number }[]) => {
      const endpoint = entityType === "experience"
        ? `/api/admin/experiences/${entityId}/gallery/reorder`
        : `/api/admin/trips/${entityId}/gallery/reorder`;

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Falha ao reordenar galeria");
      }

      return response.json();
    }
  });

  const handleFilesSelect = async (files: FileList) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    setUploadingCount(validFiles.length);

    for (let i = 0; i < validFiles.length; i++) {
      try {
        const asset = await uploadMutation.mutateAsync(validFiles[i]);
        const galleryItem = await addToGalleryMutation.mutateAsync({
          mediaAssetId: asset.id,
          displayOrder: gallery.length + i
        });
        
        const newItem: GalleryItem = {
          ...galleryItem,
          mediaAsset: asset
        } as GalleryItem;

        onGalleryChange([...gallery, newItem]);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }

    setUploadingCount(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const handleRemove = async (item: GalleryItem) => {
    try {
      await removeFromGalleryMutation.mutateAsync(item.id);
      onGalleryChange(gallery.filter(g => g.id !== item.id));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  };

  const handleReorder = (newOrder: GalleryItem[]) => {
    const updatedGallery = newOrder.map((item, index) => ({
      ...item,
      displayOrder: index
    }));
    
    onGalleryChange(updatedGallery);
    
    reorderMutation.mutate(
      updatedGallery.map(item => ({ id: item.id, displayOrder: item.displayOrder }))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/80">
          Galeria de Fotos ({gallery.length})
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-sm text-yellow-400 hover:text-yellow-300"
          data-testid="button-add-gallery-photos"
        >
          <Plus className="w-4 h-4" />
          Adicionar fotos
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
        className="hidden"
        data-testid="input-gallery-upload"
      />

      {gallery.length > 0 ? (
        <Reorder.Group
          axis="y"
          values={gallery}
          onReorder={handleReorder}
          className="space-y-2"
        >
          <AnimatePresence>
            {gallery.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                className="flex items-center gap-3 bg-white/5 rounded-lg p-2 border border-white/10"
              >
                <div className="cursor-grab active:cursor-grabbing text-white/30 hover:text-white/50">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="w-16 h-12 rounded overflow-hidden bg-white/10 flex-shrink-0">
                  <img
                    src={item.mediaAsset.thumbnailUrl || item.mediaAsset.optimizedUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 truncate">
                    {item.mediaAsset.originalName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  disabled={removeFromGalleryMutation.isPending}
                  className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
                  data-testid={`button-remove-gallery-${item.id}`}
                >
                  {removeFromGalleryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : null}

      <motion.div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`
          rounded-lg border-2 border-dashed cursor-pointer p-6
          flex flex-col items-center justify-center gap-2
          transition-all duration-200
          ${isDragging 
            ? "border-yellow-400 bg-yellow-400/10" 
            : "border-white/20 bg-white/5 hover:border-yellow-400/50 hover:bg-white/10"
          }
        `}
        data-testid="dropzone-gallery"
      >
        {uploadingCount > 0 ? (
          <>
            <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            <p className="text-sm text-white/70">
              A carregar {uploadingCount} {uploadingCount === 1 ? 'foto' : 'fotos'}...
            </p>
          </>
        ) : (
          <>
            <Upload className={`w-8 h-8 ${isDragging ? "text-yellow-400" : "text-white/40"}`} />
            <p className="text-sm text-white/70 text-center">
              {isDragging ? "Solte as imagens aqui" : "Arraste fotos ou clique para adicionar"}
            </p>
            <p className="text-xs text-white/40">Pode selecionar múltiplas fotos</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
