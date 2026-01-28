import type { Express, Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { db } from "../db";
import { trips } from "@shared/schema";
import type { TripStop, ItineraryItem } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateTripCoverImage } from "../replit_integrations/image";

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const TERESA_SYSTEM_PROMPT = `Você é a Teresa, criadora de roteiros do NTG Trips Club. Você cria roteiros REALISTAS, simples e executáveis, sempre em bate-volta.

REGRAS INEGOCIÁVEIS:
1) Saída e volta SEMPRE: Coimbra (Portugal).
2) O roteiro deve ter exatamente 1 ou 2 PARADAS PRINCIPAIS. Não mais do que isso.
3) Para cada parada, inclua:
   - 1 experiência GRATUITA
   - 1 experiência PAGA opcional
4) Gere duas versões:
   - ESSENCIAL (económica): apenas experiências gratuitas (sem obrigar gasto)
   - COMPLETA (paga): inclui as experiências pagas opcionais
5) Duração total: 8–12 horas. Com 2 paradas: 10–12h.
6) Logística realista a partir de Coimbra. Evite destinos extremos:
   - 1ª parada preferencialmente até ~2h30 de Coimbra
   - condução total somada ideal <= 5h30
   - se o pedido for longe demais, reduza para 1 parada ou proponha alternativa próxima
7) Ritmo confortável e pausas (café, WC, descanso).
8) PT-PT, claro, sem exageros.
9) Não invente factos garantidos (horários, regras de entrada). Use "normalmente", "em geral".
10) Nunca quebre as regras 1–4.

Agora gere um rascunho seguindo EXATAMENTE o formato JSON exigido. Responda APENAS com o JSON válido, sem markdown, sem explicações antes ou depois.`;

interface TeresaProposalDraft {
  title: string;
  subtitle: string;
  narrativeShort: string;
  startCity: string;
  stops: TripStop[];
  durationHoursEst: number;
  difficulty: "leve" | "moderada";
  priceEstimated: {
    essential: { min: number; max: number };
    complete: { min: number; max: number };
  };
  itinerary: {
    essential: ItineraryItem[];
    complete: ItineraryItem[];
  };
  includes: string[];
  excludes: string[];
  optionalAddOns: Array<{
    name: string;
    description: string;
    priceSuggestion: { min: number; max: number };
  }>;
  tags: string[];
  capacitySuggestion: number;
  viabilityRule: { minInterested: number };
  coverImagePrompt: string;
}

const JSON_FORMAT_INSTRUCTIONS = `
Responda EXATAMENTE neste formato JSON (sem markdown, apenas JSON puro):

{
  "title": "Título criativo do roteiro",
  "subtitle": "Subtítulo descritivo curto",
  "narrativeShort": "Descrição de 2-3 frases sobre a experiência",
  "startCity": "Coimbra",
  "stops": [
    {
      "name": "Nome do destino",
      "freeExperience": { "label": "Nome da experiência gratuita", "details": "Detalhes da experiência" },
      "paidExperience": { "label": "Nome da experiência paga", "details": "Detalhes e preço estimado" },
      "effort": "leve"
    }
  ],
  "durationHoursEst": 10,
  "difficulty": "leve",
  "priceEstimated": {
    "essential": { "min": 0, "max": 0 },
    "complete": { "min": 30, "max": 50 }
  },
  "itinerary": {
    "essential": [
      { "time": "08:00", "label": "Saída de Coimbra", "details": "Ponto de encontro no centro" }
    ],
    "complete": [
      { "time": "08:00", "label": "Saída de Coimbra", "details": "Ponto de encontro no centro" }
    ]
  },
  "includes": ["Acompanhamento NTG", "Curadoria do percurso", "Álbum digital (fotos+vídeos)"],
  "excludes": ["Alimentação", "Entradas/experiências pagas (na Essencial)"],
  "optionalAddOns": [
    { "name": "Sessão individual", "description": "Descrição do add-on", "priceSuggestion": { "min": 50, "max": 80 } }
  ],
  "tags": ["natureza", "cultura"],
  "capacitySuggestion": 10,
  "viabilityRule": { "minInterested": 10 },
  "coverImagePrompt": "Descrição para gerar imagem de capa"
}`;

function validateProposalDraft(draft: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (draft.startCity !== "Coimbra") {
    errors.push("startCity deve ser 'Coimbra'");
  }

  if (!draft.stops || !Array.isArray(draft.stops) || draft.stops.length < 1 || draft.stops.length > 2) {
    errors.push("stops deve ter exatamente 1 ou 2 paradas");
  }

  if (draft.stops) {
    for (let i = 0; i < draft.stops.length; i++) {
      const stop = draft.stops[i];
      if (!stop.freeExperience || !stop.freeExperience.label) {
        errors.push(`Paragem ${i + 1}: falta freeExperience`);
      }
      if (!stop.paidExperience || !stop.paidExperience.label) {
        errors.push(`Paragem ${i + 1}: falta paidExperience`);
      }
    }
  }

  if (typeof draft.durationHoursEst !== "number" || draft.durationHoursEst < 8 || draft.durationHoursEst > 12) {
    errors.push("durationHoursEst deve ser entre 8 e 12 horas");
  }

  if (!draft.itinerary?.essential || draft.itinerary.essential.length === 0) {
    errors.push("itinerary.essential não pode estar vazio");
  }

  if (!draft.itinerary?.complete || draft.itinerary.complete.length === 0) {
    errors.push("itinerary.complete não pode estar vazio");
  }

  const essential = draft.priceEstimated?.essential;
  const complete = draft.priceEstimated?.complete;
  if (essential && typeof essential.min === "number" && typeof essential.max === "number") {
    if (essential.min > essential.max) {
      errors.push("priceEstimated.essential: min não pode ser maior que max");
    }
  }
  if (complete && typeof complete.min === "number" && typeof complete.max === "number") {
    if (complete.min > complete.max) {
      errors.push("priceEstimated.complete: min não pode ser maior que max");
    }
  }

  return { valid: errors.length === 0, errors };
}

async function generateProposalDraft(userMessage: string, retryCount = 0): Promise<TeresaProposalDraft> {
  const prompt = `${TERESA_SYSTEM_PROMPT}

${JSON_FORMAT_INSTRUCTIONS}

Pedido do utilizador: ${userMessage}`;

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const responseText = result.text || "";
  
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Resposta não contém JSON válido");
  }

  let draft: TeresaProposalDraft;
  try {
    draft = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error("Erro ao processar JSON da resposta");
  }

  const validation = validateProposalDraft(draft);
  if (!validation.valid) {
    if (retryCount < 1) {
      const retryPrompt = `${TERESA_SYSTEM_PROMPT}

${JSON_FORMAT_INSTRUCTIONS}

O seu último roteiro violou estas regras: ${validation.errors.join("; ")}. 
Corrija e gere novamente mantendo o mesmo formato JSON.

Pedido original: ${userMessage}`;

      const retryResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: retryPrompt }] }],
      });

      const retryText = retryResult.text || "";
      const retryJsonMatch = retryText.match(/\{[\s\S]*\}/);
      if (!retryJsonMatch) {
        throw new Error("Resposta de retry não contém JSON válido");
      }

      try {
        draft = JSON.parse(retryJsonMatch[0]);
        const retryValidation = validateProposalDraft(draft);
        if (!retryValidation.valid) {
          throw new Error(`Validação falhou após retry: ${retryValidation.errors.join(", ")}`);
        }
      } catch (e) {
        throw new Error("Erro ao processar JSON do retry");
      }
    } else {
      throw new Error(`Validação falhou: ${validation.errors.join(", ")}`);
    }
  }

  return draft;
}

export function registerTeresaRoutes(app: Express): void {
  app.post("/api/teresa/proposal-draft", async (req: Request, res: Response) => {
    try {
      const { userMessage, preferences } = req.body;

      if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length < 10) {
        return res.status(400).json({ 
          error: "Por favor, descreva o seu bate-volta ideal com mais detalhes (mínimo 10 caracteres)" 
        });
      }

      let enrichedMessage = userMessage;
      if (preferences) {
        const prefParts: string[] = [];
        if (preferences.budget) prefParts.push(`Orçamento: ${preferences.budget}`);
        if (preferences.style) prefParts.push(`Estilo: ${preferences.style}`);
        if (preferences.mobility) prefParts.push(`Mobilidade: ${preferences.mobility}`);
        if (preferences.audience) prefParts.push(`Público: ${preferences.audience}`);
        if (prefParts.length > 0) {
          enrichedMessage += `\n\nPreferências adicionais: ${prefParts.join(", ")}`;
        }
      }

      const draft = await generateProposalDraft(enrichedMessage);

      res.json({ success: true, draft });
    } catch (error: any) {
      console.error("Teresa proposal-draft error:", error);
      res.status(500).json({ 
        error: "Erro ao gerar roteiro. Por favor, tente novamente.",
        details: error.message 
      });
    }
  });

  app.post("/api/teresa/save-proposal", async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: "Precisa estar autenticado para salvar propostas" });
      }

      const { draft } = req.body;
      if (!draft) {
        return res.status(400).json({ error: "Draft é obrigatório" });
      }

      const validation = validateProposalDraft(draft);
      if (!validation.valid) {
        return res.status(400).json({ error: "Draft inválido", details: validation.errors });
      }

      const slug = draft.title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 80)
        + "-" + Date.now().toString(36);

      const destinations = draft.stops.map((s: TripStop) => s.name);

      const [newTrip] = await db.insert(trips).values({
        title: draft.title,
        slug,
        shortDescription: draft.narrativeShort || draft.subtitle,
        longDescription: null,
        destination: destinations.join(", "),
        duration: `${draft.durationHoursEst}h`,
        difficulty: draft.difficulty,
        startCity: "Coimbra",
        sourceType: "member",
        createdByUserId: user.id,
        proposalStatus: "pending_review",
        stopsJson: draft.stops,
        itineraryEssential: draft.itinerary.essential,
        itineraryComplete: draft.itinerary.complete,
        priceEssentialMin: draft.priceEstimated.essential.min,
        priceEssentialMax: draft.priceEstimated.essential.max,
        priceCompleteMin: draft.priceEstimated.complete.min,
        priceCompleteMax: draft.priceEstimated.complete.max,
        includes: draft.includes,
        excludes: draft.excludes,
        optionalAddons: draft.optionalAddOns?.map((a: any) => a.name) || [],
        tags: draft.tags,
        capacity: draft.capacitySuggestion || 10,
        viabilityRule: draft.viabilityRule,
        durationHoursEst: draft.durationHoursEst,
        coverImagePrompt: draft.coverImagePrompt,
        isPublished: false,
        isFeatured: false,
      }).returning();

      res.json({ success: true, trip: newTrip });
    } catch (error: any) {
      console.error("Teresa save-proposal error:", error);
      res.status(500).json({ 
        error: "Erro ao guardar proposta",
        details: error.message 
      });
    }
  });

  app.post("/api/teresa/generate-cover", async (req: Request, res: Response) => {
    try {
      const { tripId } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: "tripId é obrigatório" });
      }

      const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }

      if (!trip.coverImagePrompt) {
        return res.status(400).json({ 
          error: "Proposta sem prompt de imagem. Por favor, regere a proposta com a Teresa." 
        });
      }

      const destinations = trip.stopsJson?.map((s: TripStop) => s.name) || [trip.destination];

      console.log(`Generating cover image for trip ${tripId}: "${trip.title}"`);
      
      const { base64, mimeType } = await generateTripCoverImage(
        trip.coverImagePrompt,
        trip.title,
        destinations
      );

      const dataUrl = `data:${mimeType};base64,${base64}`;

      await db.update(trips)
        .set({ heroImage: dataUrl, updatedAt: new Date() })
        .where(eq(trips.id, tripId));

      console.log(`Cover image generated and saved for trip ${tripId}`);

      res.json({ 
        success: true, 
        heroImage: dataUrl,
        message: "Imagem de capa gerada com sucesso"
      });
    } catch (error: any) {
      console.error("Teresa generate-cover error:", error);
      res.status(500).json({ 
        error: "Erro ao gerar imagem de capa",
        details: error.message 
      });
    }
  });

  app.post("/api/teresa/regenerate-cover", async (req: Request, res: Response) => {
    try {
      const { tripId, customPrompt } = req.body;

      if (!tripId) {
        return res.status(400).json({ error: "tripId é obrigatório" });
      }

      const [trip] = await db.select().from(trips).where(eq(trips.id, tripId));
      if (!trip) {
        return res.status(404).json({ error: "Viagem não encontrada" });
      }

      const prompt = customPrompt || trip.coverImagePrompt;
      if (!prompt) {
        return res.status(400).json({ 
          error: "Sem prompt disponível. Forneça um customPrompt ou regere a proposta." 
        });
      }

      const destinations = trip.stopsJson?.map((s: TripStop) => s.name) || [trip.destination];

      console.log(`Regenerating cover image for trip ${tripId}: "${trip.title}"`);
      
      const { base64, mimeType } = await generateTripCoverImage(
        prompt,
        trip.title,
        destinations
      );

      const dataUrl = `data:${mimeType};base64,${base64}`;

      const updateData: any = { heroImage: dataUrl, updatedAt: new Date() };
      if (customPrompt) {
        updateData.coverImagePrompt = customPrompt;
      }

      await db.update(trips)
        .set(updateData)
        .where(eq(trips.id, tripId));

      console.log(`Cover image regenerated for trip ${tripId}`);

      res.json({ 
        success: true, 
        heroImage: dataUrl,
        message: "Imagem de capa regenerada com sucesso"
      });
    } catch (error: any) {
      console.error("Teresa regenerate-cover error:", error);
      res.status(500).json({ 
        error: "Erro ao regenerar imagem de capa",
        details: error.message 
      });
    }
  });
}
