import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Download, X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaAsset, MediaAssetVariant } from "@shared/schema";

interface GalleryPhoto {
  id: number;
  mediaAsset: MediaAsset;
  variants: MediaAssetVariant[];
  caption?: string | null;
  isFeatured?: boolean;
}

interface ParallaxGalleryProps {
  photos: GalleryPhoto[];
  title?: string;
  downloadEnabled?: boolean;
  onDownload?: (photo: GalleryPhoto) => void;
}

function getVariantUrl(variants: MediaAssetVariant[], type: string): string | null {
  const variant = variants.find(v => v.variantType === type);
  return variant ? variant.url : null;
}

export function ParallaxGallery({ photos, title, downloadEnabled = true, onDownload }: ParallaxGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -30]);

  const openLightbox = (photo: GalleryPhoto, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const goToPrev = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1;
    setSelectedIndex(newIndex);
    setSelectedPhoto(photos[newIndex]);
  };

  const goToNext = () => {
    const newIndex = selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0;
    setSelectedIndex(newIndex);
    setSelectedPhoto(photos[newIndex]);
  };

  const handleDownload = (photo: GalleryPhoto) => {
    const downloadUrl = getVariantUrl(photo.variants, "download") || photo.mediaAsset.optimizedUrl;
    if (onDownload) {
      onDownload(photo);
    } else {
      window.open(downloadUrl, "_blank");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto, selectedIndex]);

  if (photos.length === 0) return null;

  const featuredPhotos = photos.filter(p => p.isFeatured);
  const regularPhotos = photos.filter(p => !p.isFeatured);

  const column1 = regularPhotos.filter((_, i) => i % 3 === 0);
  const column2 = regularPhotos.filter((_, i) => i % 3 === 1);
  const column3 = regularPhotos.filter((_, i) => i % 3 === 2);

  return (
    <>
      <section ref={containerRef} className="py-16 bg-black overflow-hidden">
        {title && (
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
          >
            {title}
          </motion.h2>
        )}

        {featuredPhotos.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto px-4">
              {featuredPhotos.slice(0, 2).map((photo, idx) => {
                const heroUrl = getVariantUrl(photo.variants, "hero") || photo.mediaAsset.optimizedUrl;
                return (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(photo, photos.indexOf(photo))}
                    data-testid={`featured-photo-${photo.id}`}
                  >
                    <img
                      src={heroUrl}
                      alt={photo.caption || "Foto em destaque"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        {photo.caption && (
                          <p className="text-white text-sm">{photo.caption}</p>
                        )}
                        <ZoomIn className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div style={{ y: y1 }} className="space-y-4">
              {column1.map((photo, idx) => {
                const galleryUrl = getVariantUrl(photo.variants, "gallery") || photo.mediaAsset.optimizedUrl;
                return (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(photo, photos.indexOf(photo))}
                    data-testid={`gallery-photo-${photo.id}`}
                  >
                    <img
                      src={galleryUrl}
                      alt={photo.caption || "Foto da galeria"}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div style={{ y: y2 }} className="space-y-4 mt-8 md:mt-16">
              {column2.map((photo, idx) => {
                const galleryUrl = getVariantUrl(photo.variants, "gallery") || photo.mediaAsset.optimizedUrl;
                return (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(photo, photos.indexOf(photo))}
                    data-testid={`gallery-photo-${photo.id}`}
                  >
                    <img
                      src={galleryUrl}
                      alt={photo.caption || "Foto da galeria"}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <motion.div style={{ y: y3 }} className="space-y-4 mt-4 md:mt-8">
              {column3.map((photo, idx) => {
                const galleryUrl = getVariantUrl(photo.variants, "gallery") || photo.mediaAsset.optimizedUrl;
                return (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => openLightbox(photo, photos.indexOf(photo))}
                    data-testid={`gallery-photo-${photo.id}`}
                  >
                    <img
                      src={galleryUrl}
                      alt={photo.caption || "Foto da galeria"}
                      className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
          data-testid="lightbox-overlay"
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
            data-testid="button-close-lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            data-testid="button-prev-photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            data-testid="button-next-photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div 
            className="max-w-5xl max-h-[80vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getVariantUrl(selectedPhoto.variants, "download") || selectedPhoto.mediaAsset.optimizedUrl}
              alt={selectedPhoto.caption || "Foto"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              data-testid="lightbox-image"
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
              <div className="flex items-center justify-between">
                <div>
                  {selectedPhoto.caption && (
                    <p className="text-white text-lg">{selectedPhoto.caption}</p>
                  )}
                  <p className="text-white/60 text-sm mt-1">
                    {selectedIndex + 1} / {photos.length}
                  </p>
                </div>
                
                {downloadEnabled && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(selectedPhoto); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-black font-medium rounded-lg transition-colors"
                    data-testid="button-download-photo"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default ParallaxGallery;
