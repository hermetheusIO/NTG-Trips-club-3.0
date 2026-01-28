import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Image as ImageIcon, Check } from "lucide-react";
import type { MediaAsset } from "@shared/schema";

interface ImageUploaderProps {
  onUploadComplete: (asset: MediaAsset | null) => void;
  category?: string;
  currentImageUrl?: string;
  className?: string;
}

export function ImageUploader({ 
  onUploadComplete, 
  category = "general",
  currentImageUrl,
  className = ""
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("category", category);

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
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/media"] });
      onUploadComplete(asset);
    }
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas imagens");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onUploadComplete(null);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        data-testid="input-image-upload"
      />

      <AnimatePresence mode="wait">
        {preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10"
          >
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              data-testid="img-preview"
            />
            
            {uploadMutation.isPending && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-white/70">Otimizando imagem...</p>
                </div>
              </div>
            )}

            {uploadMutation.isSuccess && (
              <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            <button
              onClick={clearImage}
              className="absolute top-2 left-2 bg-black/70 hover:bg-black rounded-full p-1.5 transition-colors"
              data-testid="button-clear-image"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              aspect-video rounded-lg border-2 border-dashed cursor-pointer
              flex flex-col items-center justify-center gap-3
              transition-all duration-200
              ${isDragging 
                ? "border-yellow-400 bg-yellow-400/10" 
                : "border-white/20 bg-white/5 hover:border-yellow-400/50 hover:bg-white/10"
              }
            `}
            data-testid="dropzone-image"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-10 h-10 text-yellow-400 animate-spin" />
                <p className="text-sm text-white/70">A carregar...</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                  {isDragging ? (
                    <ImageIcon className="w-7 h-7 text-yellow-400" />
                  ) : (
                    <Upload className="w-7 h-7 text-white/50" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/70">
                    {isDragging ? "Solte a imagem aqui" : "Arraste ou clique para carregar"}
                  </p>
                  <p className="text-xs text-white/40 mt-1">PNG, JPG até 10MB</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {uploadMutation.isError && (
        <p className="text-sm text-red-400 mt-2" data-testid="text-upload-error">
          {uploadMutation.error.message}
        </p>
      )}
    </div>
  );
}
