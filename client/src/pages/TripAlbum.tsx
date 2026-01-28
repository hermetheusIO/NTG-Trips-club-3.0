import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Download, ShoppingCart, Frame } from "lucide-react";
import { ParallaxGallery } from "@/components/ParallaxGallery";
import type { Trip, TripAlbum as TripAlbumType, TripAlbumPhoto, MediaAsset, MediaAssetVariant, PhotoPrintOffer } from "@shared/schema";

interface AlbumResponse {
  album: TripAlbumType;
  photos: (TripAlbumPhoto & { mediaAsset: MediaAsset; variants: MediaAssetVariant[] })[];
  trip: Trip;
}

interface PrintOfferDisplay {
  sizeLabel: string;
  widthCm: number;
  heightCm: number;
  frameType: string | null;
  priceCents: number;
  currency: string;
}

const defaultPrintOffers: PrintOfferDisplay[] = [
  { sizeLabel: "20x30cm", widthCm: 20, heightCm: 30, frameType: null, priceCents: 2500, currency: "EUR" },
  { sizeLabel: "30x40cm", widthCm: 30, heightCm: 40, frameType: null, priceCents: 4500, currency: "EUR" },
  { sizeLabel: "30x40cm Emoldurado", widthCm: 30, heightCm: 40, frameType: "wood", priceCents: 7500, currency: "EUR" },
  { sizeLabel: "50x70cm", widthCm: 50, heightCm: 70, frameType: null, priceCents: 8500, currency: "EUR" },
  { sizeLabel: "50x70cm Emoldurado", widthCm: 50, heightCm: 70, frameType: "wood", priceCents: 12500, currency: "EUR" },
];

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  return new Intl.DateTimeFormat("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(dateString));
}

export default function TripAlbum() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery<AlbumResponse>({
    queryKey: [`/api/trips/${slug}/album`],
    enabled: !!slug
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Álbum não encontrado</h1>
          <p className="text-white/60 mb-6">Este álbum pode não estar disponível ou ainda não foi publicado.</p>
          <Link href="/coimbra" data-testid="link-back-home">
            <span className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
              Voltar ao início
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const { album, photos, trip } = data;

  const heroUrl = album.coverMediaAssetId 
    ? photos.find(p => p.mediaAssetId === album.coverMediaAssetId)?.variants.find(v => v.variantType === "hero")?.url
    : photos[0]?.variants.find(v => v.variantType === "hero")?.url || photos[0]?.mediaAsset.optimizedUrl;

  const galleryPhotos = photos.map(p => ({
    id: p.id,
    mediaAsset: p.mediaAsset,
    variants: p.variants,
    caption: p.caption,
    isFeatured: p.isFeatured
  }));

  return (
    <div className="min-h-screen bg-black">
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {heroUrl && (
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            src={heroUrl}
            alt={album.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        <div className="absolute top-6 left-6">
          <Link href={`/viagens/${trip.slug}`} data-testid="link-back-trip">
            <span className="flex items-center gap-2 text-white/80 hover:text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
              Voltar à viagem
            </span>
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4" data-testid="text-album-title">
              {album.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-white/70 mb-4">
              {trip.destination && (
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {trip.destination}
                </span>
              )}
              {album.eventDate && (
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {formatDate(album.eventDate as any)}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                {photos.length} fotos
              </span>
            </div>

            {album.description && (
              <p className="text-white/80 text-lg max-w-2xl">{album.description}</p>
            )}
          </motion.div>
        </div>
      </section>

      <ParallaxGallery
        photos={galleryPhotos}
        title="Galeria de Fotos"
        downloadEnabled={album.downloadEnabled}
      />

      <section className="py-16 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Frame className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Leve uma Memória para Casa
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Transforme os seus momentos favoritos em obras de arte. 
              Escolha uma foto e receba um quadro de alta qualidade em casa.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {defaultPrintOffers.map((offer, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-zinc-900 border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-colors"
                data-testid={`print-offer-${idx}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{offer.sizeLabel}</h3>
                    <p className="text-white/50 text-sm">
                      {offer.widthCm} × {offer.heightCm} cm
                      {offer.frameType && " • Moldura em madeira"}
                    </p>
                  </div>
                  {offer.frameType && (
                    <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                      Premium
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(offer.priceCents, offer.currency)}
                  </span>
                  <button
                    onClick={() => {
                      const message = encodeURIComponent(
                        `Olá! Gostaria de encomendar um quadro ${offer.sizeLabel} de uma foto do álbum "${album.title}".`
                      );
                      window.open(`https://wa.me/351969878330?text=${message}`, "_blank");
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-black font-medium rounded-lg transition-colors"
                    data-testid={`button-order-print-${idx}`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Encomendar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-white/50 text-sm">
              Entrega em 5-7 dias úteis • Pagamento seguro • Satisfação garantida
            </p>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 bg-black border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-white/40 text-sm">
            NonTourist Guide © {new Date().getFullYear()} • Todas as fotos são propriedade de NTG
          </p>
        </div>
      </footer>
    </div>
  );
}
