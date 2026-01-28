import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Euro, MapPin, MessageCircle, Share2, ChevronRight } from "lucide-react";
import type { Experience, MediaAsset, ExperienceGallery, PageBlock } from "@shared/schema";
import { BlockRenderer } from "@/components/BlockRenderer";

interface ExperienceDetailData {
  experience: Experience;
  gallery: (ExperienceGallery & { mediaAsset: MediaAsset })[];
  layout?: { blocks: PageBlock[] };
}

export default function ExperienceDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, error } = useQuery<ExperienceDetailData>({
    queryKey: [`/api/experiences/${slug}/detail`],
    queryFn: async () => {
      const res = await fetch(`/api/experiences/${slug}/detail`);
      if (!res.ok) throw new Error("Experiência não encontrada");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/70 text-center">Experiência não encontrada</p>
        <Link href="/experiencias">
          <span className="text-yellow-400 hover:text-yellow-300 flex items-center gap-2 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Ver todas as experiências
          </span>
        </Link>
      </div>
    );
  }

  const { experience, gallery, layout } = data;
  const heroImage = experience.heroImage || gallery[0]?.mediaAsset.optimizedUrl;
  
  const defaultBlocks: PageBlock[] = [
    { type: "hero", order: 1, content: { showPrice: true } },
    { type: "story", order: 2, content: {} },
    { type: "highlights", order: 3, content: { items: [] } },
    { type: "gallery", order: 4, content: { layout: "grid" } },
    { type: "info", order: 5, content: {} },
    { type: "cta", order: 6, content: { style: "sticky" } }
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
          type: "experience",
          title: experience.title,
          shortDescription: experience.shortDescription,
          longDescription: experience.longDescription,
          price: experience.price,
          duration: experience.duration,
          category: experience.category,
          heroImage,
          gallery: gallery.map(g => ({
            url: g.mediaAsset.optimizedUrl,
            thumbnail: g.mediaAsset.thumbnailUrl,
            caption: g.caption
          })),
          tags: experience.tags || []
        }}
      />
    </motion.div>
  );
}
