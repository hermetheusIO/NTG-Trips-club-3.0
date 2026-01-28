import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertExperienceSchema, insertTripSchema, insertMediaAssetSchema, insertUserProfileSchema } from "@shared/schema";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import sharp from "sharp";
import { registerObjectStorageRoutes, ObjectStorageService, objectStorageClient } from "./replit_integrations/object_storage";
import { listDriveFolders, listFolderImages, downloadFileBuffer, createDriveFolder } from "./googleDrive";
import { registerTeresaRoutes } from "./routes/teresa";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const objectStorageService = new ObjectStorageService();

// Middleware to protect admin routes
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

// Gemini AI client for content generation (using Replit AI Integrations - no API key needed)
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY!,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ LEADS API ============
  
  app.post("/api/leads", async (req, res) => {
    try {
      const validated = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validated);
      res.status(201).json(lead);
    } catch (error: any) {
      console.error("Error creating lead:", error);
      res.status(400).json({ 
        error: "Falha ao salvar lead", 
        details: error.message 
      });
    }
  });

  app.get("/api/leads", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const leads = await storage.getAllLeads(limit);
      res.json(leads);
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ 
        error: "Falha ao buscar leads", 
        details: error.message 
      });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead não encontrado" });
      }
      res.json(lead);
    } catch (error: any) {
      console.error("Error fetching lead:", error);
      res.status(500).json({ 
        error: "Falha ao buscar lead", 
        details: error.message 
      });
    }
  });

  // ============ AUTH API ============

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email e senha são obrigatórios" });
      }
      
      const admin = await storage.validateAdminCredentials(email, password);
      
      if (!admin) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }
      
      req.session.adminId = admin.id;
      req.session.adminEmail = admin.email;
      
      // Force session save before sending response
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Erro ao salvar sessão" });
        }
        res.json({ 
          success: true, 
          admin: { id: admin.id, email: admin.email } 
        });
      });
    } catch (error: any) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.adminId) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({ 
      authenticated: true, 
      admin: { 
        id: req.session.adminId, 
        email: req.session.adminEmail 
      } 
    });
  });

  // ============ USER PROFILE API ============
  // Legacy endpoints redirect to /api/user-profile

  app.get("/api/user/profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      const profile = await storage.getUserProfileByUserId(userId);
      res.json(profile || null);
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Falha ao buscar perfil" });
    }
  });

  app.post("/api/user/profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      // Validate input with Zod schema
      const validationResult = insertUserProfileSchema.safeParse({
        ...req.body,
        userId,
        isOnboardingComplete: true,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Dados de perfil inválidos", 
          details: validationResult.error.flatten().fieldErrors 
        });
      }
      
      const profileData = validationResult.data;
      const existingProfile = await storage.getUserProfileByUserId(userId);
      
      if (existingProfile) {
        const updated = await storage.updateUserProfile(userId, profileData);
        return res.json(updated);
      } else {
        const created = await storage.createUserProfile(profileData);
        return res.status(201).json(created);
      }
    } catch (error: any) {
      console.error("Error saving user profile:", error);
      res.status(500).json({ error: "Falha ao salvar perfil" });
    }
  });

  // ============ TRIP FAVORITES API ============

  app.get("/api/user/favorites", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error: any) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Falha ao buscar favoritos" });
    }
  });

  app.post("/api/user/favorites/:tripId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      const tripId = parseInt(req.params.tripId);
      
      const exists = await storage.isTripFavorited(userId, tripId);
      if (exists) {
        return res.status(400).json({ error: "Trip já está nos favoritos" });
      }
      
      const favorite = await storage.addTripFavorite({
        userId,
        tripId,
        interestLevel: req.body.interestLevel || "interested"
      });
      res.status(201).json(favorite);
    } catch (error: any) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ error: "Falha ao adicionar favorito" });
    }
  });

  app.delete("/api/user/favorites/:tripId", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      const tripId = parseInt(req.params.tripId);
      await storage.removeTripFavorite(userId, tripId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ error: "Falha ao remover favorito" });
    }
  });

  app.get("/api/trips/:tripId/favorite-count", async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const count = await storage.getTripFavoriteCount(tripId);
      res.json({ count });
    } catch (error: any) {
      console.error("Error fetching favorite count:", error);
      res.status(500).json({ error: "Falha ao buscar contagem" });
    }
  });

  // ============ NTG TRIPS CLUB API ============

  // Get current user's profile
  app.get("/api/user-profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const profile = await storage.getUserProfileByUserId(userId);
      if (!profile) {
        return res.json({ exists: false });
      }
      
      res.json({ exists: true, profile });
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Falha ao buscar perfil" });
    }
  });

  // Create or update user profile (onboarding)
  app.post("/api/user-profile", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Faça login para salvar seu perfil" });
      }
      
      // Validate input with Zod schema
      const validationResult = insertUserProfileSchema.safeParse({
        ...req.body,
        userId,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Dados de perfil inválidos", 
          details: validationResult.error.flatten().fieldErrors 
        });
      }
      
      const profileData = validationResult.data;
      const existingProfile = await storage.getUserProfileByUserId(userId);
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateUserProfile(userId, profileData);
      } else {
        profile = await storage.createUserProfile(profileData);
      }
      
      res.status(existingProfile ? 200 : 201).json({ success: true, profile });
    } catch (error: any) {
      console.error("Error saving user profile:", error);
      res.status(500).json({ error: "Falha ao salvar perfil" });
    }
  });

  // Get all proposals with stats
  app.get("/api/proposals", async (req, res) => {
    try {
      const proposals = await storage.getClubProposals();
      const userId = (req as any).user?.claims?.sub;
      
      const proposalsWithStats = await Promise.all(
        proposals.map(async (p) => {
          const stats = await storage.getProposalStats(p.id);
          if (!userId) {
            return {
              id: p.id,
              slug: p.slug,
              title: p.title,
              shortDescription: p.shortDescription,
              heroImage: p.heroImage,
              destination: p.destination,
              duration: p.duration,
              difficulty: p.difficulty,
              tags: p.tags,
              priceEssentialMin: p.priceEssentialMin,
              priceEssentialMax: p.priceEssentialMax,
              proposalStatus: p.proposalStatus,
              isFeatured: p.isFeatured,
              stats,
            };
          }
          return { ...p, stats };
        })
      );
      res.json(proposalsWithStats);
    } catch (error: any) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ error: "Falha ao buscar propostas" });
    }
  });

  // Get single proposal by slug
  app.get("/api/proposals/:slug", async (req, res) => {
    try {
      const proposal = await storage.getProposalBySlug(req.params.slug);
      if (!proposal) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      const stats = await storage.getProposalStats(proposal.id);
      const userId = (req as any).user?.claims?.sub;
      
      if (!userId) {
        const teaser = {
          id: proposal.id,
          slug: proposal.slug,
          title: proposal.title,
          shortDescription: proposal.shortDescription,
          heroImage: proposal.heroImage,
          destination: proposal.destination,
          duration: proposal.duration,
          difficulty: proposal.difficulty,
          tags: proposal.tags,
          priceEssentialMin: proposal.priceEssentialMin,
          priceEssentialMax: proposal.priceEssentialMax,
          proposalStatus: proposal.proposalStatus,
          isFeatured: proposal.isFeatured,
          stopsCount: proposal.stopsJson?.length || 0,
          stats,
        };
        return res.json(teaser);
      }
      
      const interestList = await storage.getInterestList(proposal.id);
      res.json({ ...proposal, stats, interestList });
    } catch (error: any) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ error: "Falha ao buscar proposta" });
    }
  });

  // Vote on proposal
  app.post("/api/proposals/:id/vote", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Precisa estar autenticado para votar" });
      }
      const tripId = parseInt(req.params.id);
      
      const hasVoted = await storage.hasVoted(userId, tripId);
      if (hasVoted) {
        return res.status(400).json({ error: "Já votou nesta proposta" });
      }
      
      const vote = await storage.addVote(userId, tripId);
      const stats = await storage.getProposalStats(tripId);
      res.status(201).json({ vote, stats });
    } catch (error: any) {
      console.error("Error voting:", error);
      res.status(500).json({ error: "Falha ao votar" });
    }
  });

  // Remove vote
  app.delete("/api/proposals/:id/vote", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      const tripId = parseInt(req.params.id);
      await storage.removeVote(userId, tripId);
      const stats = await storage.getProposalStats(tripId);
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error("Error removing vote:", error);
      res.status(500).json({ error: "Falha ao remover voto" });
    }
  });

  // Check if user voted
  app.get("/api/proposals/:id/voted", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ voted: false });
      }
      const tripId = parseInt(req.params.id);
      const voted = await storage.hasVoted(userId, tripId);
      res.json({ voted });
    } catch (error: any) {
      console.error("Error checking vote:", error);
      res.status(500).json({ error: "Falha ao verificar voto" });
    }
  });

  // Add interest with visibility option
  app.post("/api/proposals/:id/interest", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Precisa estar autenticado para manifestar interesse" });
      }
      const tripId = parseInt(req.params.id);
      
      const hasInterest = await storage.isTripFavorited(userId, tripId);
      if (hasInterest) {
        // Update visibility if already interested
        if (req.body.publicVisibility) {
          await storage.updateInterestVisibility(userId, tripId, req.body.publicVisibility);
        }
        const stats = await storage.getProposalStats(tripId);
        return res.json({ updated: true, stats });
      }
      
      const interest = await storage.addInterest({
        userId,
        tripId,
        publicVisibility: req.body.publicVisibility || "anonymous",
        note: req.body.note
      });
      const stats = await storage.getProposalStats(tripId);
      res.status(201).json({ interest, stats });
    } catch (error: any) {
      console.error("Error adding interest:", error);
      res.status(500).json({ error: "Falha ao manifestar interesse" });
    }
  });

  // Remove interest
  app.delete("/api/proposals/:id/interest", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      const tripId = parseInt(req.params.id);
      await storage.removeTripFavorite(userId, tripId);
      const stats = await storage.getProposalStats(tripId);
      res.json({ success: true, stats });
    } catch (error: any) {
      console.error("Error removing interest:", error);
      res.status(500).json({ error: "Falha ao remover interesse" });
    }
  });

  // Get proposal stats (public)
  app.get("/api/proposals/:id/stats", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const stats = await storage.getProposalStats(tripId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Falha ao buscar estatísticas" });
    }
  });

  // ============ TERESA AI TRIP CREATOR API ============

  // Zod schemas for Teresa AI draft response validation
  const itineraryItemSchema = z.object({
    time: z.string(),
    label: z.string(),
    details: z.string(),
  });

  const optionalAddOnSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    priceSuggestion: z.object({ min: z.number(), max: z.number() }).optional(),
  });

  const teresaDraftSchema = z.object({
    title: z.string().min(5, "Título muito curto"),
    subtitle: z.string().optional(),
    narrativeShort: z.string().min(10, "Descrição muito curta"),
    startCity: z.string().default("Coimbra"),
    stops: z.array(z.object({
      name: z.string(),
      description: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
    })).default([]),
    durationHoursEst: z.number().min(1).max(24).default(10),
    difficulty: z.enum(["leve", "moderada"]).default("leve"),
    priceEstimated: z.object({
      essential: z.object({ min: z.number(), max: z.number() }),
      complete: z.object({ min: z.number(), max: z.number() }),
    }).optional(),
    itinerary: z.object({
      essential: z.array(itineraryItemSchema).default([]),
      complete: z.array(itineraryItemSchema).default([]),
    }).optional(),
    includes: z.array(z.string()).default([]),
    excludes: z.array(z.string()).default([]),
    optionalAddOns: z.array(optionalAddOnSchema).default([]),
    tags: z.array(z.string()).default([]),
    capacitySuggestion: z.number().min(2).max(20).default(8),
    viabilityRule: z.object({ min_interested: z.number() }).optional(),
    coverImagePrompt: z.string().optional(),
  });

  // Generate proposal draft from user message
  app.post("/api/teresa/proposal-draft", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Precisa estar autenticado para criar propostas" });
      }

      const { userMessage } = req.body;
      if (!userMessage || userMessage.trim().length < 10) {
        return res.status(400).json({ error: "Descreva a sua ideia de viagem com mais detalhes" });
      }

      const teresaPrompt = `Você é Teresa, a guia local da NonTourist Guide (NTG) em Coimbra, Portugal.
Um membro do Trips Club pediu para criar uma proposta de bate-volta/day-trip.

PEDIDO DO MEMBRO:
"${userMessage}"

REGRAS:
1. Todas as viagens partem de Coimbra
2. Crie um roteiro realista com experiências gratuitas e pagas
3. Use conhecimento real de Portugal
4. Preços em euros, realistas para Portugal
5. Dificuldade: "leve" ou "moderada"
6. Duração em horas (8-14h típico para day-trip)

Responda com JSON válido contendo:
{
  "title": "Título criativo e descritivo",
  "subtitle": "Subtítulo curto e evocativo",
  "narrativeShort": "Descrição de 2-3 frases no tom Teresa",
  "startCity": "Coimbra",
  "stops": [{"name": "Local", "description": "Breve descrição", "lat": 40.0, "lng": -8.0}],
  "durationHoursEst": 10,
  "difficulty": "leve",
  "priceEstimated": {
    "essential": {"min": 25, "max": 40},
    "complete": {"min": 55, "max": 80}
  },
  "itinerary": {
    "essential": [{"time": "08:00", "label": "Partida de Coimbra", "details": "Ponto de encontro e início da jornada"}],
    "complete": [{"time": "08:00", "label": "Partida de Coimbra", "details": "Ponto de encontro e início da jornada"}]
  },
  "includes": ["Transporte em carrinha", "Guia local Teresa"],
  "excludes": ["Refeições", "Entradas não mencionadas"],
  "optionalAddOns": [{"name": "Almoço tradicional", "description": "...", "priceSuggestion": {"min": 15, "max": 25}}],
  "tags": ["natureza", "gastronomia"],
  "capacitySuggestion": 8,
  "viabilityRule": {"min_interested": 4},
  "coverImagePrompt": "Descrição para gerar imagem de capa"
}

Responda APENAS com JSON válido, sem markdown.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: teresaPrompt }] }],
      });

      const text = response.text || "";
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      
      try {
        const rawDraft = JSON.parse(cleanJson);
        
        // Validate with Zod schema
        const validationResult = teresaDraftSchema.safeParse(rawDraft);
        if (!validationResult.success) {
          console.warn("[Teresa] Draft validation failed - LLM output incomplete");
          return res.status(422).json({ 
            error: "A Teresa gerou um roteiro incompleto. Tente novamente com mais detalhes.",
            retryable: true
          });
        }
        
        res.json({ success: true, draft: validationResult.data });
      } catch (parseError) {
        console.error("Failed to parse Teresa response:", text);
        res.status(500).json({ error: "A Teresa não conseguiu gerar um roteiro válido. Tente novamente." });
      }
    } catch (error: any) {
      console.error("Error generating proposal draft:", error);
      res.status(500).json({ error: "Falha ao gerar proposta", details: error.message });
    }
  });

  // Save proposal draft as pending_review
  app.post("/api/teresa/save-proposal", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Precisa estar autenticado" });
      }

      const { draft } = req.body;
      
      // Validate draft with Zod schema
      const validationResult = teresaDraftSchema.safeParse(draft);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Proposta inválida", 
          details: validationResult.error.flatten().fieldErrors 
        });
      }
      
      const validDraft = validationResult.data;

      // Generate slug from title
      const slug = validDraft.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        + "-" + Date.now().toString(36);

      const tripData = {
        slug,
        title: validDraft.title,
        shortDescription: validDraft.narrativeShort || validDraft.subtitle || "",
        longDescription: validDraft.narrativeShort,
        destination: validDraft.stops.map((s) => s.name).join(", ") || "Portugal",
        duration: `${validDraft.durationHoursEst}h`,
        heroImage: null,
        difficulty: validDraft.difficulty,
        priceEssentialMin: validDraft.priceEstimated?.essential?.min || null,
        priceEssentialMax: validDraft.priceEstimated?.essential?.max || null,
        priceCompleteMin: validDraft.priceEstimated?.complete?.min || null,
        priceCompleteMax: validDraft.priceEstimated?.complete?.max || null,
        includes: validDraft.includes,
        excludes: validDraft.excludes,
        destinations: validDraft.stops.map(s => s.name),
        itineraryEssential: validDraft.itinerary?.essential || [],
        itineraryComplete: validDraft.itinerary?.complete || [],
        optionalAddons: validDraft.optionalAddOns.map(a => a.name),
        tags: validDraft.tags,
        capacity: validDraft.capacitySuggestion,
        durationHoursEst: validDraft.durationHoursEst,
        coverImagePrompt: validDraft.coverImagePrompt,
        proposalStatus: "pending_review",
        createdByUserId: userId,
        sourceType: "member",
        startCity: validDraft.startCity || "Coimbra",
        viabilityRule: validDraft.viabilityRule || { min_interested: 4 },
        isPublished: false,
        isFeatured: false,
      };

      const trip = await storage.createTrip(tripData);
      res.status(201).json({ success: true, trip, redirectTo: "/minha-conta" });
    } catch (error: any) {
      console.error("Error saving proposal:", error);
      res.status(500).json({ error: "Falha ao guardar proposta" });
    }
  });

  // ============ ADMIN KPIs API ============

  app.get("/api/admin/kpis", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getLeadStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching KPIs:", error);
      res.status(500).json({ error: "Falha ao buscar KPIs" });
    }
  });

  // ============ EXPERIENCES API ============

  app.get("/api/experiences", async (req, res) => {
    try {
      const publishedOnly = req.query.published === "true";
      const experiences = await storage.getAllExperiences(publishedOnly);
      res.json(experiences);
    } catch (error: any) {
      console.error("Error fetching experiences:", error);
      res.status(500).json({ error: "Falha ao buscar experiências" });
    }
  });

  app.get("/api/experiences/:id", async (req, res) => {
    try {
      const experience = await storage.getExperienceById(parseInt(req.params.id));
      if (!experience) {
        return res.status(404).json({ error: "Experiência não encontrada" });
      }
      res.json(experience);
    } catch (error: any) {
      console.error("Error fetching experience:", error);
      res.status(500).json({ error: "Falha ao buscar experiência" });
    }
  });

  app.post("/api/admin/experiences", requireAdmin, async (req, res) => {
    try {
      const validated = insertExperienceSchema.parse(req.body);
      const experience = await storage.createExperience(validated);

      // Auto-create Google Drive folder
      try {
        const folderName = `Experience: ${experience.title}`;
        const folder = await createDriveFolder(folderName);
        console.log(`Created Drive folder for experience: ${folder.id}`);
        // We could store this folder ID if we add a column to experiences, 
        // but for now we'll just log it or return it. 
        // Actually, the user asked for it to be a repository.
      } catch (driveError) {
        console.error("Failed to create Drive folder for experience:", driveError);
      }

      res.status(201).json(experience);
    } catch (error: any) {
      console.error("Error creating experience:", error);
      res.status(400).json({ error: "Falha ao criar experiência", details: error.message });
    }
  });

  app.put("/api/admin/experiences/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateExperience(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Experiência não encontrada" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating experience:", error);
      res.status(400).json({ error: "Falha ao atualizar experiência" });
    }
  });

  app.delete("/api/admin/experiences/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteExperience(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting experience:", error);
      res.status(500).json({ error: "Falha ao deletar experiência" });
    }
  });

  // ============ TRIPS API ============

  // Public teaser endpoint - returns limited info for non-members
  app.get("/api/trips/public", async (req, res) => {
    try {
      const trips = await storage.getAllTrips(true); // published only
      const teasers = trips.map(trip => ({
        id: trip.id,
        slug: trip.slug,
        title: trip.title,
        shortDescription: trip.shortDescription,
        heroImage: trip.heroImage,
        destination: trip.destination,
        duration: trip.duration,
        difficulty: trip.difficulty,
        tags: trip.tags,
        priceEssentialMin: trip.priceEssentialMin,
        priceEssentialMax: trip.priceEssentialMax,
        proposalStatus: trip.proposalStatus,
        isFeatured: trip.isFeatured,
      }));
      res.json(teasers);
    } catch (error: any) {
      console.error("Error fetching public trips:", error);
      res.status(500).json({ error: "Falha ao buscar viagens" });
    }
  });

  // Public teaser for single trip - limited info for non-members
  app.get("/api/trips/public/:id", async (req, res) => {
    try {
      const trip = await storage.getTripById(parseInt(req.params.id));
      if (!trip || !trip.isPublished) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }
      const teaser = {
        id: trip.id,
        slug: trip.slug,
        title: trip.title,
        shortDescription: trip.shortDescription,
        heroImage: trip.heroImage,
        destination: trip.destination,
        duration: trip.duration,
        difficulty: trip.difficulty,
        tags: trip.tags,
        priceEssentialMin: trip.priceEssentialMin,
        priceEssentialMax: trip.priceEssentialMax,
        proposalStatus: trip.proposalStatus,
        isFeatured: trip.isFeatured,
        stopsCount: trip.stopsJson?.length || 0,
      };
      res.json(teaser);
    } catch (error: any) {
      console.error("Error fetching public trip:", error);
      res.status(500).json({ error: "Falha ao buscar viagem" });
    }
  });

  app.get("/api/trips", async (req, res) => {
    try {
      const publishedOnly = req.query.published === "true";
      const trips = await storage.getAllTrips(publishedOnly);
      const userId = (req as any).user?.claims?.sub;
      
      if (!userId) {
        const teasers = trips.map(trip => ({
          id: trip.id,
          slug: trip.slug,
          title: trip.title,
          shortDescription: trip.shortDescription,
          heroImage: trip.heroImage,
          destination: trip.destination,
          duration: trip.duration,
          difficulty: trip.difficulty,
          tags: trip.tags,
          priceEssentialMin: trip.priceEssentialMin,
          priceEssentialMax: trip.priceEssentialMax,
          proposalStatus: trip.proposalStatus,
          isFeatured: trip.isFeatured,
          isPublished: trip.isPublished,
        }));
        return res.json(teasers);
      }
      
      res.json(trips);
    } catch (error: any) {
      console.error("Error fetching trips:", error);
      res.status(500).json({ error: "Falha ao buscar viagens" });
    }
  });

  app.get("/api/trips/:id", async (req, res) => {
    try {
      const trip = await storage.getTripById(parseInt(req.params.id));
      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }
      
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        const teaser = {
          id: trip.id,
          slug: trip.slug,
          title: trip.title,
          shortDescription: trip.shortDescription,
          heroImage: trip.heroImage,
          destination: trip.destination,
          duration: trip.duration,
          difficulty: trip.difficulty,
          tags: trip.tags,
          priceEssentialMin: trip.priceEssentialMin,
          priceEssentialMax: trip.priceEssentialMax,
          proposalStatus: trip.proposalStatus,
          isFeatured: trip.isFeatured,
          isPublished: trip.isPublished,
          stopsCount: trip.stopsJson?.length || 0,
        };
        return res.json(teaser);
      }
      
      res.json(trip);
    } catch (error: any) {
      console.error("Error fetching trip:", error);
      res.status(500).json({ error: "Falha ao buscar viagem" });
    }
  });

  app.post("/api/admin/trips", requireAdmin, async (req, res) => {
    try {
      const validated = insertTripSchema.parse(req.body);
      const trip = await storage.createTrip(validated);

      // Auto-create Google Drive folder and link it to an album
      try {
        const folderName = `Trip: ${trip.title}`;
        const folder = await createDriveFolder(folderName);
        
        await storage.createTripAlbum({
          tripId: trip.id,
          title: `Álbum: ${trip.title}`,
          googleDriveFolderId: folder.id,
          isPublic: false,
          downloadEnabled: true,
          coverMediaAssetId: null,
          description: null,
          eventDate: null,
          releasedAt: null
        });
        
        console.log(`Created Drive folder and linked album for trip: ${folder.id}`);
      } catch (driveError) {
        console.error("Failed to create Drive folder for trip:", driveError);
      }

      res.status(201).json(trip);
    } catch (error: any) {
      console.error("Error creating trip:", error);
      res.status(400).json({ error: "Falha ao criar viagem", details: error.message });
    }
  });

  app.put("/api/admin/trips/:id", requireAdmin, async (req, res) => {
    try {
      const updated = await storage.updateTrip(parseInt(req.params.id), req.body);
      if (!updated) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating trip:", error);
      res.status(400).json({ error: "Falha ao atualizar viagem" });
    }
  });

  app.delete("/api/admin/trips/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTrip(parseInt(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      console.error("Error deleting trip:", error);
      res.status(500).json({ error: "Falha ao deletar viagem" });
    }
  });

  // ============ AI CONTENT GENERATION ============

  app.post("/api/admin/ai/generate-content", requireAdmin, async (req, res) => {
    try {
      const { type, rawNotes, category } = req.body;
      
      const brandPrompt = `Você é Teresa, a voz da marca NonTourist Guide (NTG) em Coimbra, Portugal.

PERSONALIDADE DA MARCA:
- Tom: Autêntico, local, íntimo, premium mas acessível
- Voz: Como uma amiga local que conhece os segredos da cidade
- Estilo: Direto, com pitadas de humor sutil, sem clichês turísticos
- Nunca usar: "mágico", "encantador", "pitoresco", "imperdível"
- Sempre usar: Linguagem real, referências locais, insider knowledge

CONTEXTO:
Você está criando conteúdo para ${type === 'experience' ? 'uma experiência' : 'uma viagem/day-trip'}.

NOTAS DO ADMIN:
${rawNotes}

${category ? `CATEGORIA: ${category}` : ''}

TAREFA:
Gere um JSON com exatamente estes campos:
{
  "title": "Título curto e impactante (máx 60 chars)",
  "shortDescription": "Descrição de 1-2 frases que capture a essência (máx 150 chars)",
  "longDescription": "Descrição completa em 2-3 parágrafos, com detalhes práticos e tom da Teresa",
  "suggestedIcon": "Nome de ícone Lucide (ex: Utensils, Map, Compass, TreePine, Wine, Camera, Music, Star)",
  "suggestedTags": ["array", "de", "tags", "relevantes"],
  "suggestedSlug": "slug-url-amigavel"
}

Responda APENAS com o JSON, sem markdown ou texto adicional.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: brandPrompt }] }],
      });

      const text = response.text || "";
      
      // Try to parse JSON from response
      let parsed;
      try {
        // Remove potential markdown code blocks
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanText);
      } catch {
        parsed = { 
          title: "", 
          shortDescription: text.slice(0, 150), 
          longDescription: text,
          suggestedIcon: "Star",
          suggestedTags: [],
          suggestedSlug: ""
        };
      }

      res.json(parsed);
    } catch (error: any) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ error: "Falha ao gerar conteúdo com IA", details: error.message });
    }
  });

  // ============ MEDIA UPLOAD API ============
  
  registerObjectStorageRoutes(app);

  // Variant configurations for different aspect ratios
  // fit: "cover" crops to fill, "inside" preserves aspect ratio within bounds
  const VARIANT_CONFIGS = [
    { type: "card", width: 800, height: 600, quality: 85, fit: "cover" as const },      // 4:3
    { type: "hero", width: 1920, height: 1080, quality: 90, fit: "cover" as const },    // 16:9
    { type: "gallery", width: 1200, height: 900, quality: 85, fit: "cover" as const },  // 4:3
    { type: "thumbnail", width: 400, height: 400, quality: 75, fit: "cover" as const }, // 1:1
    { type: "download", width: 2400, height: 1800, quality: 92, fit: "inside" as const } // Preserve original aspect
  ];

  app.post("/api/admin/media/upload", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhuma imagem enviada" });
      }

      const { category, altText } = req.body;
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;

      if (!mimeType.startsWith("image/")) {
        return res.status(400).json({ error: "Apenas imagens são permitidas" });
      }

      const image = sharp(req.file.buffer);
      const metadata = await image.metadata();

      // Upload original
      const originalUploadUrl = await objectStorageService.getObjectEntityUploadURL();
      await fetch(originalUploadUrl, {
        method: "PUT",
        body: req.file.buffer,
        headers: { "Content-Type": mimeType }
      });
      const originalPath = objectStorageService.normalizeObjectEntityPath(originalUploadUrl);

      // Generate optimized version (main display)
      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();

      const optimizedUploadUrl = await objectStorageService.getObjectEntityUploadURL();
      await fetch(optimizedUploadUrl, {
        method: "PUT",
        body: optimizedBuffer,
        headers: { "Content-Type": "image/jpeg" }
      });
      const optimizedPath = objectStorageService.normalizeObjectEntityPath(optimizedUploadUrl);

      // Generate thumbnail (legacy compatibility)
      const thumbnailBuffer = await sharp(req.file.buffer)
        .resize(400, 300, { fit: "cover" })
        .jpeg({ quality: 75 })
        .toBuffer();

      const thumbnailUploadUrl = await objectStorageService.getObjectEntityUploadURL();
      await fetch(thumbnailUploadUrl, {
        method: "PUT",
        body: thumbnailBuffer,
        headers: { "Content-Type": "image/jpeg" }
      });
      const thumbnailPath = objectStorageService.normalizeObjectEntityPath(thumbnailUploadUrl);

      // Create main asset
      const assetData = {
        originalName,
        mimeType,
        originalUrl: originalPath,
        optimizedUrl: optimizedPath,
        thumbnailUrl: thumbnailPath,
        width: metadata.width || null,
        height: metadata.height || null,
        size: req.file.size,
        altText: altText || null,
        category: category || "general"
      };

      const validated = insertMediaAssetSchema.parse(assetData);
      const mediaAsset = await storage.createMediaAsset(validated);

      // Generate and upload all variants
      const variantData: { type: string; url: string; width: number; height: number; size: number }[] = [];
      
      for (const config of VARIANT_CONFIGS) {
        const variantBuffer = await sharp(req.file.buffer)
          .resize(config.width, config.height, { 
            fit: config.fit,
            position: "center",
            withoutEnlargement: config.fit === "inside"
          })
          .jpeg({ quality: config.quality, progressive: true })
          .toBuffer();

        const variantUploadUrl = await objectStorageService.getObjectEntityUploadURL();
        await fetch(variantUploadUrl, {
          method: "PUT",
          body: variantBuffer,
          headers: { "Content-Type": "image/jpeg" }
        });
        const variantPath = objectStorageService.normalizeObjectEntityPath(variantUploadUrl);

        variantData.push({
          type: config.type,
          url: variantPath,
          width: config.width,
          height: config.height,
          size: variantBuffer.length
        });
      }

      // Save variants to database
      const variantsToInsert = variantData.map(v => ({
        mediaAssetId: mediaAsset.id,
        variantType: v.type,
        url: v.url,
        width: v.width,
        height: v.height,
        size: v.size,
        format: "jpeg"
      }));

      const variants = await storage.createMediaAssetVariants(variantsToInsert);

      res.json({ ...mediaAsset, variants });
    } catch (error: any) {
      console.error("Error uploading media:", error);
      res.status(500).json({ error: "Falha ao fazer upload da imagem", details: error.message });
    }
  });

  app.get("/api/admin/media", requireAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const assets = await storage.getAllMediaAssets(category);
      res.json(assets);
    } catch (error: any) {
      console.error("Error fetching media:", error);
      res.status(500).json({ error: "Falha ao buscar imagens" });
    }
  });

  app.delete("/api/admin/media/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMediaAsset(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting media:", error);
      res.status(500).json({ error: "Falha ao apagar imagem" });
    }
  });

  // ============ GALLERY API ============

  // Experience gallery
  app.get("/api/admin/experiences/:id/gallery", requireAdmin, async (req, res) => {
    try {
      const gallery = await storage.getExperienceGallery(parseInt(req.params.id));
      res.json(gallery);
    } catch (error: any) {
      console.error("Error fetching experience gallery:", error);
      res.status(500).json({ error: "Falha ao buscar galeria" });
    }
  });

  app.post("/api/admin/experiences/:id/gallery", requireAdmin, async (req, res) => {
    try {
      const experienceId = parseInt(req.params.id);
      const { mediaAssetId, caption, displayOrder, blockHint } = req.body;
      
      const item = await storage.addToExperienceGallery({
        experienceId,
        mediaAssetId,
        caption: caption || null,
        displayOrder: displayOrder || 0,
        blockHint: blockHint || null
      });
      
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error adding to experience gallery:", error);
      res.status(400).json({ error: "Falha ao adicionar à galeria" });
    }
  });

  app.put("/api/admin/experiences/:id/gallery/reorder", requireAdmin, async (req, res) => {
    try {
      const { items } = req.body;
      await storage.updateExperienceGalleryOrder(items);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error reordering gallery:", error);
      res.status(400).json({ error: "Falha ao reordenar galeria" });
    }
  });

  app.delete("/api/admin/gallery/experience/:id", requireAdmin, async (req, res) => {
    try {
      await storage.removeFromExperienceGallery(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing from gallery:", error);
      res.status(500).json({ error: "Falha ao remover da galeria" });
    }
  });

  // Trip gallery
  app.get("/api/admin/trips/:id/gallery", requireAdmin, async (req, res) => {
    try {
      const gallery = await storage.getTripGallery(parseInt(req.params.id));
      res.json(gallery);
    } catch (error: any) {
      console.error("Error fetching trip gallery:", error);
      res.status(500).json({ error: "Falha ao buscar galeria" });
    }
  });

  app.post("/api/admin/trips/:id/gallery", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const { mediaAssetId, caption, displayOrder, blockHint } = req.body;
      
      const item = await storage.addToTripGallery({
        tripId,
        mediaAssetId,
        caption: caption || null,
        displayOrder: displayOrder || 0,
        blockHint: blockHint || null
      });
      
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error adding to trip gallery:", error);
      res.status(400).json({ error: "Falha ao adicionar à galeria" });
    }
  });

  app.put("/api/admin/trips/:id/gallery/reorder", requireAdmin, async (req, res) => {
    try {
      const { items } = req.body;
      await storage.updateTripGalleryOrder(items);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error reordering gallery:", error);
      res.status(400).json({ error: "Falha ao reordenar galeria" });
    }
  });

  app.delete("/api/admin/gallery/trip/:id", requireAdmin, async (req, res) => {
    try {
      await storage.removeFromTripGallery(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing from gallery:", error);
      res.status(500).json({ error: "Falha ao remover da galeria" });
    }
  });

  // ============ TRIP ALBUMS API ============

  // Admin: Get all albums for a trip
  app.get("/api/admin/trips/:tripId/album", requireAdmin, async (req, res) => {
    try {
      const album = await storage.getTripAlbumByTripId(parseInt(req.params.tripId));
      res.json(album || null);
    } catch (error: any) {
      console.error("Error fetching trip album:", error);
      res.status(500).json({ error: "Falha ao buscar álbum" });
    }
  });

  // Admin: Generate AI Trip Cover (placeholder - requires image generation API)
  app.post("/api/admin/trips/:id/generate-image", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const trip = await storage.getTripById(tripId);
      
      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }

      // TODO: Implement actual image generation when API is available
      // For now, return an error indicating the feature is not yet available
      res.status(501).json({ 
        error: "Geração de imagem por IA ainda não disponível",
        message: "Por favor, faça upload manual da imagem de capa"
      });
    } catch (error: any) {
      console.error("Error generating trip image:", error);
      res.status(500).json({ error: "Falha ao gerar imagem", details: error.message });
    }
  });

  // Admin: List all albums with photos
  app.get("/api/admin/albums", requireAdmin, async (req, res) => {
    try {
      const albums = await storage.getAllTripAlbums();
      res.json(albums);
    } catch (error: any) {
      console.error("Error fetching albums:", error);
      res.status(500).json({ error: "Falha ao buscar álbuns" });
    }
  });

  // Admin: Create a new album
  app.post("/api/admin/albums", requireAdmin, async (req, res) => {
    try {
      const { tripId, title, description, eventDate, isPublic, downloadEnabled } = req.body;
      
      if (!tripId) {
        return res.status(400).json({ error: "tripId é obrigatório" });
      }
      
      const album = await storage.createTripAlbum({
        tripId: parseInt(tripId),
        title: title || "Álbum de Fotos",
        description: description || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        isPublic: isPublic || false,
        downloadEnabled: downloadEnabled ?? true,
        coverMediaAssetId: null,
        releasedAt: null
      });
      
      res.status(201).json(album);
    } catch (error: any) {
      console.error("Error creating album:", error);
      res.status(400).json({ error: "Falha ao criar álbum" });
    }
  });

  // Admin: Create album for trip
  app.post("/api/admin/trips/:tripId/album", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.tripId);
      const { title, description, eventDate, isPublic, downloadEnabled } = req.body;
      
      const album = await storage.createTripAlbum({
        tripId,
        title: title || "Álbum de Fotos",
        description: description || null,
        eventDate: eventDate ? new Date(eventDate) : null,
        isPublic: isPublic || false,
        downloadEnabled: downloadEnabled ?? true,
        coverMediaAssetId: null,
        releasedAt: null
      });
      
      res.status(201).json(album);
    } catch (error: any) {
      console.error("Error creating trip album:", error);
      res.status(400).json({ error: "Falha ao criar álbum" });
    }
  });

  // Admin: Update album
  app.put("/api/admin/albums/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, description, eventDate, isPublic, downloadEnabled, coverMediaAssetId, releasedAt } = req.body;
      
      const album = await storage.updateTripAlbum(id, {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(eventDate !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(downloadEnabled !== undefined && { downloadEnabled }),
        ...(coverMediaAssetId !== undefined && { coverMediaAssetId }),
        ...(releasedAt !== undefined && { releasedAt: releasedAt ? new Date(releasedAt) : null })
      });
      
      res.json(album);
    } catch (error: any) {
      console.error("Error updating album:", error);
      res.status(400).json({ error: "Falha ao atualizar álbum" });
    }
  });

  // Admin: Delete album
  app.delete("/api/admin/albums/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteTripAlbum(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting album:", error);
      res.status(500).json({ error: "Falha ao apagar álbum" });
    }
  });

  // Admin: Get album photos
  app.get("/api/admin/albums/:albumId/photos", requireAdmin, async (req, res) => {
    try {
      const photos = await storage.getAlbumPhotos(parseInt(req.params.albumId));
      res.json(photos);
    } catch (error: any) {
      console.error("Error fetching album photos:", error);
      res.status(500).json({ error: "Falha ao buscar fotos" });
    }
  });

  // Admin: Add photo to album
  app.post("/api/admin/albums/:albumId/photos", requireAdmin, async (req, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const { mediaAssetId, caption, displayOrder, isFeatured } = req.body;
      
      const photo = await storage.addPhotoToAlbum({
        albumId,
        mediaAssetId,
        caption: caption || null,
        displayOrder: displayOrder || 0,
        isFeatured: isFeatured || false
      });
      
      res.status(201).json(photo);
    } catch (error: any) {
      console.error("Error adding photo to album:", error);
      res.status(400).json({ error: "Falha ao adicionar foto" });
    }
  });

  // Admin: Update photo order in album
  app.put("/api/admin/albums/:albumId/photos/reorder", requireAdmin, async (req, res) => {
    try {
      const { items } = req.body;
      await storage.updateAlbumPhotoOrder(items);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error reordering photos:", error);
      res.status(400).json({ error: "Falha ao reordenar fotos" });
    }
  });

  // Admin: Remove photo from album
  app.delete("/api/admin/albums/photos/:id", requireAdmin, async (req, res) => {
    try {
      await storage.removePhotoFromAlbum(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing photo:", error);
      res.status(500).json({ error: "Falha ao remover foto" });
    }
  });

  // Public: Get album by trip slug (for public viewing)
  app.get("/api/trips/:slug/album", async (req, res) => {
    try {
      const tripData = await storage.getTripWithGallery(req.params.slug);
      if (!tripData) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }
      
      const album = await storage.getTripAlbumByTripId(tripData.trip.id);
      if (!album || !album.isPublic) {
        return res.status(404).json({ error: "Álbum não disponível" });
      }
      
      const photos = await storage.getAlbumPhotos(album.id);
      res.json({ album, photos, trip: tripData.trip });
    } catch (error: any) {
      console.error("Error fetching public album:", error);
      res.status(500).json({ error: "Falha ao buscar álbum" });
    }
  });

  // Public: Get all public albums
  app.get("/api/albums/public", async (req, res) => {
    try {
      const albums = await storage.getPublicTripAlbums();
      res.json(albums);
    } catch (error: any) {
      console.error("Error fetching public albums:", error);
      res.status(500).json({ error: "Falha ao buscar álbuns" });
    }
  });

  // ============ DETAIL PAGES API ============

  app.get("/api/experiences/:slug/detail", async (req, res) => {
    try {
      const data = await storage.getExperienceWithGallery(req.params.slug);
      if (!data) {
        return res.status(404).json({ error: "Experiência não encontrada" });
      }
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching experience detail:", error);
      res.status(500).json({ error: "Falha ao buscar detalhes" });
    }
  });

  app.get("/api/trips/:slug/detail", async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ 
          error: "Autenticação necessária",
          message: "Detalhes completos disponíveis apenas para membros" 
        });
      }

      const data = await storage.getTripWithGallery(req.params.slug);
      if (!data) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching trip detail:", error);
      res.status(500).json({ error: "Falha ao buscar detalhes" });
    }
  });

  app.get("/api/trips/:slug/teaser", async (req, res) => {
    try {
      const data = await storage.getTripWithGallery(req.params.slug);
      if (!data || !data.trip.isPublished) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }
      const trip = data.trip;
      const teaser = {
        id: trip.id,
        slug: trip.slug,
        title: trip.title,
        shortDescription: trip.shortDescription,
        heroImage: trip.heroImage,
        destination: trip.destination,
        duration: trip.duration,
        difficulty: trip.difficulty,
        tags: trip.tags,
        priceEssentialMin: trip.priceEssentialMin,
        priceEssentialMax: trip.priceEssentialMax,
        proposalStatus: trip.proposalStatus,
        isFeatured: trip.isFeatured,
        stopsCount: trip.stopsJson?.length || 0,
      };
      res.json(teaser);
    } catch (error: any) {
      console.error("Error fetching trip teaser:", error);
      res.status(500).json({ error: "Falha ao buscar resumo" });
    }
  });

  // ============ ADMIN: PROPOSALS MANAGEMENT ============

  app.get("/api/admin/proposals/pending", requireAdmin, async (req, res) => {
    try {
      const proposals = await storage.getPendingProposals();
      res.json(proposals);
    } catch (error: any) {
      console.error("Error fetching pending proposals:", error);
      res.status(500).json({ error: "Falha ao buscar propostas" });
    }
  });

  app.patch("/api/admin/proposals/:id/status", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["approved", "archived", "pending_review"].includes(status)) {
        return res.status(400).json({ error: "Estado inválido" });
      }
      
      const updated = await storage.updateProposalStatus(tripId, status);
      
      if (!updated) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error updating proposal status:", error);
      res.status(500).json({ error: "Falha ao atualizar proposta" });
    }
  });
  
  // Get proposals by status
  app.get("/api/admin/proposals/by-status/:status", requireAdmin, async (req, res) => {
    try {
      const proposals = await storage.getProposalsByStatus(req.params.status);
      res.json(proposals);
    } catch (error: any) {
      console.error("Error fetching proposals by status:", error);
      res.status(500).json({ error: "Falha ao buscar propostas" });
    }
  });
  
  // Approve proposal (moves to voting)
  app.post("/api/admin/proposals/:id/approve", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const { adminNotes } = req.body;
      
      const updated = await storage.approveProposal(tripId, adminNotes);
      
      if (!updated) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error approving proposal:", error);
      res.status(500).json({ error: "Falha ao aprovar proposta" });
    }
  });
  
  // Schedule proposal (creates trip instance)
  app.post("/api/admin/proposals/:id/schedule", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      
      const updated = await storage.scheduleProposal(tripId);
      
      if (!updated) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error scheduling proposal:", error);
      res.status(500).json({ error: "Falha ao agendar proposta" });
    }
  });
  
  // Archive proposal
  app.post("/api/admin/proposals/:id/archive", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const { reason } = req.body;
      
      const updated = await storage.archiveProposal(tripId, reason);
      
      if (!updated) {
        return res.status(404).json({ error: "Proposta não encontrada" });
      }
      
      res.json(updated);
    } catch (error: any) {
      console.error("Error archiving proposal:", error);
      res.status(500).json({ error: "Falha ao arquivar proposta" });
    }
  });
  
  // Evaluate viability
  app.get("/api/admin/proposals/:id/viability", requireAdmin, async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const viability = await storage.evaluateViability(tripId);
      res.json(viability);
    } catch (error: any) {
      console.error("Error evaluating viability:", error);
      res.status(500).json({ error: "Falha ao avaliar viabilidade" });
    }
  });
  
  // ============ USER CREDITS API ============
  
  app.get("/api/user/credits", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const credits = await storage.getUserCredits(userId);
      res.json({ credits });
    } catch (error: any) {
      console.error("Error fetching user credits:", error);
      res.status(500).json({ error: "Falha ao buscar créditos" });
    }
  });
  
  app.get("/api/user/credits/history", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const history = await storage.getUserCreditHistory(userId);
      res.json(history);
    } catch (error: any) {
      console.error("Error fetching credit history:", error);
      res.status(500).json({ error: "Falha ao buscar histórico de créditos" });
    }
  });
  
  app.get("/api/user/votes", async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const votes = await storage.getUserVotes(userId);
      res.json(votes);
    } catch (error: any) {
      console.error("Error fetching user votes:", error);
      res.status(500).json({ error: "Falha ao buscar votos" });
    }
  });
  
  // Public viability check (for progress bar)
  app.get("/api/proposals/:id/viability", async (req, res) => {
    try {
      const tripId = parseInt(req.params.id);
      const viability = await storage.evaluateViability(tripId);
      res.json(viability);
    } catch (error: any) {
      console.error("Error evaluating viability:", error);
      res.status(500).json({ error: "Falha ao avaliar viabilidade" });
    }
  });

  // ============ GOOGLE DRIVE API ============

  app.get("/api/admin/drive/folders", requireAdmin, async (req, res) => {
    try {
      const folders = await listDriveFolders();
      res.json(folders);
    } catch (error: any) {
      console.error("Error listing Drive folders:", error);
      res.status(500).json({ error: "Falha ao listar pastas do Drive", details: error.message });
    }
  });

  app.get("/api/admin/drive/folders/:folderId/images", requireAdmin, async (req, res) => {
    try {
      const images = await listFolderImages(req.params.folderId);
      res.json(images);
    } catch (error: any) {
      console.error("Error listing folder images:", error);
      res.status(500).json({ error: "Falha ao listar imagens", details: error.message });
    }
  });

  app.post("/api/admin/albums/:albumId/sync-drive", requireAdmin, async (req, res) => {
    try {
      const albumId = parseInt(req.params.albumId);
      const album = await storage.getTripAlbumById(albumId);
      
      if (!album) {
        return res.status(404).json({ error: "Álbum não encontrado" });
      }
      
      if (!album.googleDriveFolderId) {
        return res.status(400).json({ error: "Nenhuma pasta do Drive configurada para este álbum" });
      }
      
      const driveImages = await listFolderImages(album.googleDriveFolderId);
      const existingPhotos = await storage.getAlbumPhotos(albumId);
      const existingDriveIds = new Set(
        existingPhotos
          .filter(p => p.mediaAsset.driveFileId)
          .map(p => p.mediaAsset.driveFileId)
      );
      
      let imported = 0;
      
      for (const img of driveImages) {
        if (existingDriveIds.has(img.id)) continue;
        
        try {
          const buffer = await downloadFileBuffer(img.id);
          const timestamp = Date.now();
          const fileName = `drive_${img.id}_${timestamp}.jpg`;
          
          const metadata = await sharp(buffer).metadata();
          const optimized = await sharp(buffer)
            .resize(2400, 1800, { fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
          
          const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
          if (!bucketId) throw new Error("Object storage not configured");
          
          const bucket = objectStorageClient.bucket(bucketId);
          
          const key = `public/album_photos/${fileName}`;
          const file = bucket.file(key);
          await file.save(optimized, { contentType: "image/jpeg" });
          const publicUrl = `https://storage.googleapis.com/${bucketId}/${key}`;
          
          const thumbnail = await sharp(buffer)
            .resize(400, 400, { fit: "cover" })
            .jpeg({ quality: 80 })
            .toBuffer();
          
          const thumbKey = `public/album_photos/thumb_${fileName}`;
          const thumbFile = bucket.file(thumbKey);
          await thumbFile.save(thumbnail, { contentType: "image/jpeg" });
          const thumbUrl = `https://storage.googleapis.com/${bucketId}/${thumbKey}`;
          
          const asset = await storage.createMediaAsset({
            filename: img.name,
            originalName: img.name,
            originalUrl: publicUrl,
            optimizedUrl: publicUrl,
            thumbnailUrl: thumbUrl,
            mimeType: img.mimeType,
            size: optimized.length,
            width: metadata.width || 0,
            height: metadata.height || 0,
            category: "album",
            driveFileId: img.id
          });
          
          await storage.addPhotoToAlbum({
            albumId,
            mediaAssetId: asset.id,
            displayOrder: imported
          });
          
          imported++;
        } catch (err) {
          console.error(`Error importing ${img.name}:`, err);
        }
      }
      
      await storage.updateTripAlbum(albumId, { lastSyncedAt: new Date() });
      
      res.json({ imported, total: driveImages.length });
    } catch (error: any) {
      console.error("Error syncing Drive:", error);
      res.status(500).json({ error: "Falha ao sincronizar com Drive", details: error.message });
    }
  });

  // ============ AI LAYOUT GENERATION ============

  app.post("/api/admin/generate-layout", requireAdmin, async (req, res) => {
    try {
      const { entityType, entityId, title, description, gallery } = req.body;
      
      const layoutPrompt = `Você é um designer de páginas web especializado em turismo premium.

CONTEXTO:
- Tipo: ${entityType === 'experience' ? 'Experiência local' : 'Viagem/Day-trip'}
- Título: ${title}
- Descrição: ${description}
- Quantidade de fotos na galeria: ${gallery?.length || 0}

TAREFA:
Crie um layout de página em blocos otimizado para mobile-first.
Escolha e ordene os blocos mais apropriados para este conteúdo.

BLOCOS DISPONÍVEIS:
- hero: Bloco principal com imagem grande e título
- story: Texto narrativo sobre a experiência (2-3 parágrafos)
- highlights: Lista de 3-5 destaques/benefícios
- gallery: Mosaico de imagens (se houver mais de 2 fotos)
- info: Informações práticas (duração, preço, incluído)
- cta: Call-to-action para reserva/contacto

RESPONDA com JSON:
{
  "blocks": [
    { "type": "hero", "order": 1, "content": { "showPrice": true, "overlayOpacity": 0.4 } },
    { "type": "story", "order": 2, "content": { "paragraphs": 2 } },
    { "type": "highlights", "order": 3, "content": { "items": ["highlight1", "highlight2", "highlight3"] } },
    { "type": "gallery", "order": 4, "content": { "layout": "masonry", "maxImages": 6 } },
    { "type": "info", "order": 5, "content": { "showMap": false } },
    { "type": "cta", "order": 6, "content": { "style": "sticky" } }
  ]
}

Adapte a ordem e os blocos incluídos baseado no conteúdo disponível.
Responda APENAS com JSON válido.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: layoutPrompt }] }],
      });

      const text = response.text || "";
      let parsed;
      
      try {
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanText);
      } catch {
        parsed = {
          blocks: [
            { type: "hero", order: 1, content: { showPrice: true } },
            { type: "story", order: 2, content: {} },
            { type: "highlights", order: 3, content: { items: [] } },
            { type: "gallery", order: 4, content: { layout: "grid" } },
            { type: "info", order: 5, content: {} },
            { type: "cta", order: 6, content: { style: "sticky" } }
          ]
        };
      }

      const existingLayout = await storage.getPageLayout(entityType, entityId);
      
      let layout;
      if (existingLayout) {
        layout = await storage.updatePageLayout(existingLayout.id, {
          blocks: parsed.blocks,
          aiModel: "gemini-2.5-flash",
          layoutVersion: existingLayout.layoutVersion + 1
        });
      } else {
        layout = await storage.createPageLayout({
          entityType,
          entityId,
          blocks: parsed.blocks,
          aiModel: "gemini-2.5-flash",
          status: "generated"
        });
      }

      res.json(layout);
    } catch (error: any) {
      console.error("Error generating layout:", error);
      res.status(500).json({ error: "Falha ao gerar layout", details: error.message });
    }
  });

  // Register Teresa Creator routes
  registerTeresaRoutes(app);

  return httpServer;
}
