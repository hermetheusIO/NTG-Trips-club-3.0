import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  Sparkles,
  MapPin,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react";
import type { Trip, MediaAsset, TripGallery, PageBlock } from "@shared/schema";
import { BlockRenderer } from "@/components/BlockRenderer";
import { useAuth } from "@/hooks/use-auth";

interface TripDetailData {
  trip: Trip;
  gallery: (TripGallery & { mediaAsset: MediaAsset })[];
  layout?: { blocks: PageBlock[] };
}

const sampleItinerary = [
  {
    time: "08:00",
    title: "Ponto de encontro",
    description: "Saída de Coimbra em direção ao destino",
    icon: "flag",
  },
  {
    time: "09:30",
    title: "Primeira paragem",
    description: "Vista panorâmica e tempo para fotografias",
    icon: "camera",
  },
  {
    time: "11:00",
    title: "Visita cultural",
    description: "Exploração guiada do local histórico",
    icon: "star",
  },
  {
    time: "13:00",
    title: "Almoço",
    description: "Refeição tradicional em restaurante local",
    icon: "food",
  },
  {
    time: "15:00",
    title: "Caminhada na natureza",
    description: "Percurso leve com paisagens deslumbrantes",
    icon: "mountain",
  },
  {
    time: "17:30",
    title: "Regresso",
    description: "Viagem de volta a Coimbra",
    icon: "sunset",
  },
];

const sampleIncluded = [
  "Transporte em carrinha confortável",
  "Guia local especializado",
  "Seguro de viagem",
  "Água durante o percurso",
];

const sampleNotIncluded = [
  "Almoço (sugestões serão dadas)",
  "Despesas pessoais",
  "Entradas em monumentos (quando aplicável)",
];

interface TripTeaser {
  id: number;
  slug: string;
  title: string;
  shortDescription: string;
  heroImage: string | null;
  destination: string;
  duration: string | null;
  difficulty: string | null;
  tags: string[];
  priceEssentialMin: number | null;
  priceEssentialMax: number | null;
  stopsCount?: number;
}

export default function TripDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading, error } = useQuery<TripDetailData>({
    queryKey: [`/api/trips/${slug}/detail`],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${slug}/detail`, {
        credentials: "include",
      });
      if (res.status === 401) {
        throw new Error("AUTH_REQUIRED");
      }
      if (!res.ok) throw new Error("Viagem não encontrada");
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: teaser, isLoading: teaserLoading } = useQuery<TripTeaser>({
    queryKey: [`/api/trips/public`, slug],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${slug}/teaser`);
      if (!res.ok) throw new Error("Viagem não encontrada");
      return res.json();
    },
    enabled: !isAuthenticated || error?.message === "AUTH_REQUIRED",
  });

  if (isLoading || authLoading || teaserLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if ((!isAuthenticated || error?.message === "AUTH_REQUIRED") && teaser) {
    return <TripTeaserView teaser={teaser} />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/70 text-center">Viagem não encontrada</p>
        <Link href="/viagens">
          <div className="text-yellow-400 hover:text-yellow-300 flex items-center gap-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Ver todas as viagens
          </div>
        </Link>
      </div>
    );
  }

  const { trip, gallery, layout } = data;
  const heroImage = trip.heroImage || gallery[0]?.mediaAsset.optimizedUrl;

  const defaultBlocks: PageBlock[] = [
    { type: "hero", order: 1, content: { showPrice: true } },
    { type: "interest_meter", order: 2, content: {} },
    { type: "favorite_button", order: 3, content: {} },
    { type: "story", order: 4, content: {} },
    { type: "itinerary", order: 5, content: { items: sampleItinerary } },
    { type: "highlights", order: 6, content: { items: [] } },
    {
      type: "included",
      order: 7,
      content: { included: sampleIncluded, notIncluded: sampleNotIncluded },
    },
    { type: "gallery", order: 8, content: { layout: "grid" } },
    { type: "album_link", order: 9, content: {} },
    { type: "info", order: 10, content: {} },
    { type: "cta", order: 11, content: { style: "sticky" } },
  ];

  const blocks = layout?.blocks || defaultBlocks;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black"
    >
      <BlockRenderer
        blocks={blocks}
        data={{
          type: "trip",
          title: trip.title,
          shortDescription: trip.shortDescription,
          longDescription: trip.longDescription,
          price: trip.price,
          duration: trip.duration,
          destination: trip.destination,
          heroImage,
          gallery: gallery.map((g) => ({
            url: g.mediaAsset.optimizedUrl,
            thumbnail: g.mediaAsset.thumbnailUrl,
            caption: g.caption,
          })),
          tags: trip.tags || [],
        }}
      />
    </motion.div>
  );
}

function TripTeaserView({ teaser }: { teaser: TripTeaser }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-black"
    >
      <div className="relative h-[50vh] min-h-[300px]">
        {teaser.heroImage ? (
          <img
            src={teaser.heroImage}
            alt={teaser.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <Link href="/viagens">
          <div
            className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white cursor-pointer z-10"
            data-testid="link-back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </div>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-4xl mx-auto">
            <h1
              className="text-3xl md:text-4xl font-black text-white mb-2"
              data-testid="text-title"
            >
              {teaser.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm">
              {teaser.destination && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{teaser.destination}</span>
                </div>
              )}
              {teaser.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{teaser.duration}</span>
                </div>
              )}
              {teaser.stopsCount && teaser.stopsCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{teaser.stopsCount} paragem(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/70 text-lg mb-8"
            data-testid="text-description"
          >
            {teaser.shortDescription}
          </motion.p>

          {teaser.priceEssentialMin && teaser.priceEssentialMax && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8"
            >
              <p className="text-white/50 text-sm mb-1">
                Preço estimado (Essencial)
              </p>
              <p className="text-2xl font-bold text-yellow-400">
                €{teaser.priceEssentialMin}–{teaser.priceEssentialMax}
              </p>
            </motion.div>
          )}

          {teaser.tags && teaser.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2 mb-10"
            >
              {teaser.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-400/10 to-amber-500/10 border border-yellow-400/30 rounded-2xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-yellow-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Conteúdo exclusivo para membros
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Junta-te ao NTG Trips Club para ver o roteiro completo, itinerário
              detalhado, votar nas propostas e criar os teus próprios
              bate-voltas com descontos de até 100%.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/api/login"
                className="inline-flex items-center justify-center gap-2 bg-yellow-400 text-black font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition-colors"
                data-testid="button-join-club"
              >
                <Sparkles className="w-5 h-5" />
                Entrar / Registar
              </a>
              <Link href="/trips-club">
                <div
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-medium px-8 py-3 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
                  data-testid="link-learn-more"
                >
                  Saber mais
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
