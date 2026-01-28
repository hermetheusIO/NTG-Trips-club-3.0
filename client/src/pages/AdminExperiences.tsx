import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit2, Trash2, Eye, EyeOff, Sparkles, X, Save, Wand2, 
  BarChart3, ChevronRight, Loader2, LogOut
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { ImageUploader } from "@/components/ImageUploader";
import type { Experience, InsertExperience, MediaAsset } from "@shared/schema";

const categoryOptions = [
  { value: "gastronomia", label: "Gastronomia" },
  { value: "cultural", label: "Cultural" },
  { value: "aventura", label: "Aventura" },
  { value: "relaxamento", label: "Relaxamento" },
  { value: "noturno", label: "Vida Noturna" },
  { value: "natureza", label: "Natureza" },
];

export default function AdminExperiences() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
    },
  });
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    longDescription: "",
    price: "",
    duration: "",
    category: "cultural",
    heroImage: "",
    icon: "Star",
    isPublished: false,
    isFeatured: false,
    tags: [] as string[]
  });
  
  const [rawNotes, setRawNotes] = useState("");

  const { data: experiences, isLoading } = useQuery<Experience[]>({
    queryKey: ["/api/experiences"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertExperience) => {
      const res = await fetch("/api/admin/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertExperience> }) => {
      const res = await fetch(`/api/admin/experiences/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/experiences/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/experiences"] });
    }
  });

  const generateWithAI = async () => {
    if (!rawNotes.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/admin/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "experience",
          rawNotes,
          category: formData.category
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
    setEditingExp(null);
    setFormData({
      title: "",
      slug: "",
      shortDescription: "",
      longDescription: "",
      price: "",
      duration: "",
      category: "cultural",
      heroImage: "",
      icon: "Star",
      isPublished: false,
      isFeatured: false,
      tags: []
    });
    setRawNotes("");
    setShowModal(true);
  };

  const openEditModal = (exp: Experience) => {
    setEditingExp(exp);
    setFormData({
      title: exp.title,
      slug: exp.slug,
      shortDescription: exp.shortDescription,
      longDescription: exp.longDescription || "",
      price: exp.price || "",
      duration: exp.duration || "",
      category: exp.category,
      heroImage: exp.heroImage || "",
      icon: exp.icon || "Star",
      isPublished: exp.isPublished,
      isFeatured: exp.isFeatured,
      tags: exp.tags || []
    });
    setRawNotes("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingExp(null);
  };

  const handleSubmit = () => {
    if (editingExp) {
      updateMutation.mutate({ id: editingExp.id, data: formData });
    } else {
      createMutation.mutate(formData as InsertExperience);
    }
  };

  const togglePublish = (exp: Experience) => {
    updateMutation.mutate({ id: exp.id, data: { isPublished: !exp.isPublished } });
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
              <p className="text-xs text-white/50">Experiências</p>
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
              <button className="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary">
                Experiências
              </button>
            </Link>
            <Link href="/admin/trips">
              <button className="px-4 py-3 text-sm font-medium text-white/60 hover:text-white transition-colors">
                Viagens
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Experiências</h2>
          <button
            onClick={openCreateModal}
            data-testid="button-create-experience"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Experiência
          </button>
        </div>

        {/* Experiences List */}
        {isLoading ? (
          <div className="text-center py-12 text-white/50">A carregar...</div>
        ) : experiences && experiences.length > 0 ? (
          <div className="grid gap-4">
            {experiences.map((exp) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {exp.heroImage ? (
                    <img src={exp.heroImage} alt={exp.title} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white/30" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-lg">{exp.title}</h3>
                    <p className="text-white/50 text-sm">{exp.shortDescription.slice(0, 80)}...</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{exp.category}</span>
                      {exp.price && <span className="text-xs text-primary">{exp.price}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(exp)}
                    data-testid={`button-toggle-publish-${exp.id}`}
                    className={`p-2 rounded-lg transition-colors ${
                      exp.isPublished ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40"
                    }`}
                    title={exp.isPublished ? "Publicado" : "Rascunho"}
                  >
                    {exp.isPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => openEditModal(exp)}
                    data-testid={`button-edit-experience-${exp.id}`}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Tem certeza que deseja deletar?")) {
                        deleteMutation.mutate(exp.id);
                      }
                    }}
                    data-testid={`button-delete-experience-${exp.id}`}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
            <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/50 mb-4">Nenhuma experiência criada ainda</p>
            <button
              onClick={openCreateModal}
              className="text-primary hover:underline"
            >
              Criar primeira experiência
            </button>
          </div>
        )}
      </main>

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
              <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingExp ? "Editar Experiência" : "Nova Experiência"}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* AI Generation Section */}
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Wand2 className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">Gerar com Teresa IA</span>
                  </div>
                  <textarea
                    value={rawNotes}
                    onChange={(e) => setRawNotes(e.target.value)}
                    placeholder="Descreva a experiência em suas palavras... Ex: 'Tour de vinhos pelo Dão com degustação em 3 quintas, inclui almoço típico, dura o dia todo, preço 89€ por pessoa'"
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
                      <label className="block text-sm text-white/60 mb-1">Categoria</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      >
                        {categoryOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
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
                        placeholder="Ex: 45€"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Duração</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="Ex: 3 horas"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Ícone</label>
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="Star"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Imagem Principal</label>
                    <ImageUploader
                      category="experiences"
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

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-white/60 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-experience"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-bold px-6 py-2 rounded-xl transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {editingExp ? "Guardar" : "Criar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
