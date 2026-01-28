import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Euro, MapPin, MessageCircle, Share2, ChevronDown, X, ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon, Heart, Loader2, Users, Coffee, Utensils, Camera, Mountain, Sunrise, Sunset, Star, Flag, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PageBlock } from "@shared/schema";

interface GalleryImage {
  url: string;
  thumbnail?: string | null;
  caption?: string | null;
}

interface ItineraryStop {
  time: string;
  title: string;
  description?: string;
  icon?: string;
}

interface BlockData {
  type: "experience" | "trip";
  title: string;
  shortDescription: string;
  longDescription?: string | null;
  price?: string | null;
  duration?: string | null;
  category?: string;
  destination?: string;
  heroImage?: string;
  gallery: GalleryImage[];
  tags: string[];
  slug?: string;
  itinerary?: ItineraryStop[];
  includedItems?: string[];
  notIncludedItems?: string[];
  importantInfo?: string[];
}

interface BlockRendererProps {
  blocks: PageBlock[];
  data: BlockData;
}

export function BlockRenderer({ blocks, data }: BlockRendererProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col">
      {sortedBlocks.map((block, index) => (
        <BlockComponent key={`${block.type}-${index}`} block={block} data={data} />
      ))}
    </div>
  );
}

function BlockComponent({ block, data }: { block: PageBlock; data: BlockData }) {
  switch (block.type) {
    case "hero":
      return <HeroBlock data={data} content={block.content} />;
    case "story":
      return <StoryBlock data={data} content={block.content} />;
    case "highlights":
      return <HighlightsBlock data={data} content={block.content} />;
    case "itinerary":
      return <ItineraryBlock data={data} content={block.content} />;
    case "included":
      return <IncludedBlock data={data} content={block.content} />;
    case "gallery":
      return <GalleryBlock data={data} content={block.content} />;
    case "info":
      return <InfoBlock data={data} content={block.content} />;
    case "cta":
      return <CTABlock data={data} content={block.content} />;
    case "album_link":
      return <AlbumLinkBlock data={data} />;
    case "favorite_button":
      return <FavoriteButtonBlock data={data} />;
    case "interest_meter":
      return <InterestMeterBlock data={data} />;
    default:
      return null;
  }
}

function AlbumLinkBlock({ data }: { data: BlockData }) {
  const slug = window.location.pathname.split('/').pop();
  
  return (
    <section className="px-8 py-12 bg-black">
      <div className="max-w-2xl mx-auto">
        <Link href={`/viagens/${slug}/album`}>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-900 border border-white/10 hover:border-yellow-400/50 transition-all group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-yellow-400 flex items-center justify-center flex-shrink-0 group-hover:rotate-3 transition-transform">
              <ImageIcon className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-[10px] uppercase tracking-widest font-black text-yellow-400">Exclusivo</span>
              </div>
              <h3 className="text-xl font-bold text-white">Ver Álbum Completo</h3>
              <p className="text-white/50 text-sm">Aceda a todas as fotos desta viagem em alta qualidade.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
          </motion.div>
        </Link>
      </div>
    </section>
  );
}

function HeroBlock({ data, content }: { data: BlockData; content: Record<string, unknown> }) {
  const overlayOpacity = (content.overlayOpacity as number) || 0.4;
  const showPrice = content.showPrice !== false;

  const handleShare = async () => {
    const shareData = {
      title: data.title,
      text: data.shortDescription,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="relative h-[85vh] min-h-[500px]" data-testid="block-hero">
      {data.heroImage && (
        <img
          src={data.heroImage}
          alt={data.title}
          className="absolute inset-0 w-full h-full object-cover"
          data-testid="img-hero"
        />
      )}
      
      <div 
        className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"
        style={{ opacity: overlayOpacity + 0.3 }}
      />
      
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <Link href={data.type === "experience" ? "/experiencias" : "/viagens"}>
          <div className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 cursor-pointer" data-testid="button-back">
            <ArrowLeft className="w-6 h-6" />
          </div>
        </Link>
        <button 
          onClick={handleShare}
          className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white border border-white/10"
          data-testid="button-share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {data.category && (
            <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400 text-black text-[10px] uppercase tracking-widest font-bold mb-4">
              {data.category}
            </span>
          )}
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-[1.1]" data-testid="text-title">
            {data.title}
          </h1>
          
          <p className="text-white/90 text-xl mb-8 leading-relaxed max-w-xl">
            {data.shortDescription}
          </p>

          <div className="flex items-center gap-6 flex-wrap">
            {data.duration && (
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Duração</p>
                  <p className="text-sm font-medium">{data.duration}</p>
                </div>
              </div>
            )}
            {data.destination && (
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/10">
                  <MapPin className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Local</p>
                  <p className="text-sm font-medium">{data.destination}</p>
                </div>
              </div>
            )}
            {showPrice && data.price && (
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <Euro className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Preço</p>
                  <p className="text-sm font-bold text-yellow-400">{data.price}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
        <ChevronDown className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

function StoryBlock({ data }: { data: BlockData; content: Record<string, unknown> }) {
  if (!data.longDescription) return null;

  const paragraphs = data.longDescription.split('\n\n').filter(p => p.trim());

  return (
    <section className="px-8 py-16 bg-black" data-testid="block-story">
      <div className="max-w-2xl mx-auto space-y-8">
        {paragraphs.map((paragraph, index) => (
          <motion.p 
            key={index} 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-white/80 text-lg leading-relaxed first-letter:text-4xl first-letter:font-bold first-letter:text-yellow-400 first-letter:mr-2 first-letter:float-left"
          >
            {paragraph}
          </motion.p>
        ))}
      </div>
    </section>
  );
}

function HighlightsBlock({ data, content }: { data: BlockData; content: Record<string, unknown> }) {
  const items = (content.items as string[]) || [];
  
  const renderList = (displayItems: string[]) => (
    <section className="px-8 py-16 bg-zinc-950" data-testid="block-highlights">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Destaques</h2>
        </div>
        <div className="grid gap-4">
          {displayItems.map((item, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5"
            >
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-white/80 font-medium">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );

  if (items.length === 0) {
    const extractedHighlights = extractHighlights(data.longDescription || "");
    if (extractedHighlights.length === 0) return null;
    return renderList(extractedHighlights);
  }

  return renderList(items);
}

function extractHighlights(text: string): string[] {
  const lines = text.split('\n');
  const highlights: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
      highlights.push(trimmed.substring(1).trim());
    }
  }
  
  return highlights.slice(0, 5);
}

function GalleryBlock({ data, content }: { data: BlockData; content: Record<string, unknown> }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const layout = (content.layout as string) || "grid";
  const maxImages = (content.maxImages as number) || 6;
  
  const images = data.gallery.slice(0, maxImages);
  
  if (images.length === 0) return null;

  return (
    <>
      <section className="px-6 py-8 bg-black" data-testid="block-gallery">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-white mb-4">Galeria</h2>
          
          <div className={`grid gap-2 ${
            layout === "masonry" 
              ? "grid-cols-2 md:grid-cols-3" 
              : "grid-cols-2 md:grid-cols-3"
          }`}>
            {images.map((image, index) => (
              <motion.button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative overflow-hidden rounded-lg aspect-square ${
                  layout === "masonry" && index === 0 ? "col-span-2 row-span-2 aspect-auto" : ""
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid={`button-gallery-${index}`}
              >
                <img
                  src={image.thumbnail || image.url}
                  alt={image.caption || `Foto ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {selectedIndex !== null && (
        <LightboxModal
          images={images}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onPrev={() => setSelectedIndex(prev => prev! > 0 ? prev! - 1 : images.length - 1)}
          onNext={() => setSelectedIndex(prev => prev! < images.length - 1 ? prev! + 1 : 0)}
        />
      )}
    </>
  );
}

function LightboxModal({ 
  images, 
  currentIndex, 
  onClose, 
  onPrev, 
  onNext 
}: { 
  images: GalleryImage[]; 
  currentIndex: number; 
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const currentImage = images[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10"
        data-testid="button-close-lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            data-testid="button-prev-image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
            data-testid="button-next-image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      <img
        src={currentImage.url}
        alt={currentImage.caption || ""}
        className="max-w-full max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {currentImage.caption && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/80 text-sm bg-black/50 inline-block px-4 py-2 rounded-full">
            {currentImage.caption}
          </p>
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
        {images.map((_, index) => (
          <span
            key={index}
            className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-yellow-400" : "bg-white/30"}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function InfoBlock({ data }: { data: BlockData; content: Record<string, unknown> }) {
  return (
    <section className="px-8 py-16 bg-black" data-testid="block-info">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">Informações Úteis</h2>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.duration && (
            <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">Duração</p>
              <p className="text-white font-bold">{data.duration}</p>
            </div>
          )}
          
          {data.price && (
            <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
                <Euro className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">Preço</p>
              <p className="text-white font-bold">{data.price}</p>
            </div>
          )}

          {data.destination && (
            <div className="p-6 rounded-3xl bg-zinc-900 border border-white/5 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">Destino</p>
              <p className="text-white font-bold">{data.destination}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CTABlock({ data, content }: { data: BlockData; content: Record<string, unknown> }) {
  const style = (content.style as string) || "default";
  
  const whatsappMessage = encodeURIComponent(
    `Olá Teresa! Vi a ${data.type === "experience" ? "experiência" : "viagem"} "${data.title}" no site e gostaria de saber mais!`
  );
  const whatsappUrl = `https://wa.me/351912345678?text=${whatsappMessage}`;

  if (style === "sticky") {
    return (
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-40 pb-safe" data-testid="block-cta">
        <div className="max-w-2xl mx-auto">
          <motion.a
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-yellow-400/20"
            data-testid="button-whatsapp-cta"
          >
            <MessageCircle className="w-6 h-6 fill-current" />
            Falar com a Teresa
          </motion.a>
        </div>
      </div>
    );
  }

  return (
    <section className="px-8 py-24 bg-black" data-testid="block-cta">
      <div className="max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-12 rounded-[3rem] bg-zinc-950 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-32 h-32 text-yellow-400" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Pronto para a aventura?</h2>
          <p className="text-white/60 text-lg mb-10 max-w-sm mx-auto">
            Fale diretamente com a Teresa para reservar o seu lugar ou tirar qualquer dúvida.
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-yellow-400/20"
            data-testid="button-whatsapp-cta"
          >
            <MessageCircle className="w-6 h-6 fill-current" />
            Falar com a Teresa
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function ItineraryBlock({ data, content }: { data: BlockData; content: Record<string, unknown> }) {
  const items = (content.items as ItineraryStop[]) || data.itinerary || [];
  
  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case "coffee": return Coffee;
      case "food": return Utensils;
      case "camera": return Camera;
      case "mountain": return Mountain;
      case "sunrise": return Sunrise;
      case "sunset": return Sunset;
      case "star": return Star;
      case "flag": return Flag;
      default: return Clock;
    }
  };
  
  if (items.length === 0) return null;

  return (
    <section className="px-8 py-16 bg-zinc-950" data-testid="block-itinerary">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Roteiro do Dia</h2>
        </div>
        
        <div className="relative">
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gradient-to-b from-yellow-400 via-yellow-400/50 to-transparent" />
          
          <div className="space-y-8">
            {items.map((stop, index) => {
              const IconComponent = getIcon(stop.icon);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6"
                  data-testid={`itinerary-stop-${index}`}
                >
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-zinc-900 border border-yellow-400/30 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-yellow-400 text-sm font-bold">{stop.time}</span>
                    </div>
                    <h3 className="text-white font-bold text-lg">{stop.title}</h3>
                    {stop.description && (
                      <p className="text-white/60 text-sm mt-1">{stop.description}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function IncludedBlock({ data, content }: { data: BlockData; content: Record<string, unknown> }) {
  const included = (content.included as string[]) || data.includedItems || [];
  const notIncluded = (content.notIncluded as string[]) || data.notIncludedItems || [];
  
  if (included.length === 0 && notIncluded.length === 0) return null;

  return (
    <section className="px-8 py-16 bg-black" data-testid="block-included">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-8 text-center">O que está incluído</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {included.length > 0 && (
            <div className="p-6 rounded-3xl bg-green-500/10 border border-green-500/20">
              <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Incluído
              </h3>
              <ul className="space-y-3">
                {included.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-white/80">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {notIncluded.length > 0 && (
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <h3 className="text-white/60 font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <X className="w-4 h-4" />
                Não Incluído
              </h3>
              <ul className="space-y-3">
                {notIncluded.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-white/60">
                    <X className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FavoriteButtonBlock({ data }: { data: BlockData }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const slug = data.slug || window.location.pathname.split('/').filter(Boolean).pop();
  
  const { data: tripData } = useQuery({
    queryKey: [`/api/trips/${slug}/detail`],
    enabled: false,
  });
  
  const tripId = (tripData as any)?.trip?.id;
  
  const { data: favorites = [] } = useQuery<any[]>({
    queryKey: ["/api/user/favorites"],
    queryFn: async () => {
      const res = await fetch("/api/user/favorites", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });
  
  const isFavorited = tripId ? favorites.some((f: any) => f.tripId === tripId || f.trip?.id === tripId) : false;

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!tripId) return;
      if (isFavorited) {
        const res = await fetch(`/api/user/favorites/${tripId}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to remove favorite");
      } else {
        const res = await fetch(`/api/user/favorites/${tripId}`, {
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

  const handleClick = () => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  return (
    <section className="px-8 py-8 bg-black" data-testid="block-favorite-button">
      <div className="max-w-2xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          disabled={toggleFavoriteMutation.isPending}
          className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${
            isFavorited
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-white/5 text-white/80 border border-white/10 hover:bg-yellow-400/10 hover:text-yellow-400 hover:border-yellow-400/30"
          }`}
          data-testid="button-toggle-favorite"
        >
          {toggleFavoriteMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              {isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </>
          )}
        </motion.button>
      </div>
    </section>
  );
}

function InterestMeterBlock({ data }: { data: BlockData }) {
  const slug = data.slug || window.location.pathname.split('/').filter(Boolean).pop();
  
  const { data: tripData } = useQuery({
    queryKey: [`/api/trips/${slug}/detail`],
    enabled: false,
  });
  
  const tripId = (tripData as any)?.trip?.id;
  
  const { data: countData } = useQuery({
    queryKey: [`/api/trips/${tripId}/favorite-count`],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/favorite-count`);
      if (!res.ok) return { count: 0 };
      return res.json();
    },
    enabled: !!tripId,
  });
  
  const count = countData?.count || 0;
  
  if (count === 0) return null;

  return (
    <section className="px-8 py-6 bg-black" data-testid="block-interest-meter">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-yellow-400/5 border border-yellow-400/20">
          <Users className="w-5 h-5 text-yellow-400" />
          <span className="text-white/80 text-sm">
            <span className="text-yellow-400 font-bold">{count}</span> pessoa{count > 1 ? "s" : ""} interessada{count > 1 ? "s" : ""} nesta viagem
          </span>
        </div>
      </div>
    </section>
  );
}
