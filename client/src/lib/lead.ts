// Type Definitions for Lead Data

export type CountryCode = "BR" | "PT" | "ES" | "FR" | "DE" | "UK" | "US" | "OTHER";

export type TimeBucket = "curto" | "medio" | "longo" | "estadia";
export type PartyType = "solo" | "casal" | "grupo" | "familia";
export type InterestType = "classicos" | "oculto" | "gastronomia" | "gratis" | "experiencias_pagas";
export type GuidanceStyle = "rapido" | "contexto" | "guiado" | "conversa";
export type AgeRange = "18_25" | "26_35" | "36_50" | "51_plus";
export type Segment = "TOURIST_PREMIUM" | "DAYTRIP_PT" | "LOCAL_CURIOUS" | "EXPLORER_AUTONOMOUS" | "GENERAL";

export interface LeadIdentity {
  firstName: string;
  countryCode: CountryCode;
  countryName: string;
  ageRange: AgeRange;
}

export interface LeadContext {
  timeBucket: TimeBucket;
  partyType: PartyType;
  guidanceStyle: GuidanceStyle;
}

export interface LeadData {
  leadId: string;
  createdAt: string;
  source: "qr" | "ads" | "organic";
  language: "pt" | "en" | "es" | "zh";
  identity: LeadIdentity;
  context: LeadContext;
  interests: InterestType[];
  tags: string[];
  segmentPrimary: Segment;
  segmentRulesApplied: string[];
  teresaModeSuggestions: string[];
  whatsapp: {
    to: string;
    prefilledMessage: string;
  };
}

export interface LeadState {
  country?: { code: CountryCode; name: string };
  timeBucket?: TimeBucket;
  partyType?: PartyType;
  interests: InterestType[];
  guidanceStyle?: GuidanceStyle;
  firstName?: string;
  ageRange?: AgeRange;
}

// Logic Functions

export function generateLeadId(): string {
  return crypto.randomUUID();
}

export function buildTags(state: LeadState): string[] {
  const tags: string[] = [];
  
  if (state.country) {
    tags.push(`pais:${state.country.code}`);
    tags.push(state.country.code === "PT" ? "perfil:nacional" : "perfil:internacional");
  }
  
  if (state.timeBucket) tags.push(`tempo:${state.timeBucket}`);
  if (state.partyType) tags.push(`companhia:${state.partyType}`);
  
  state.interests.forEach(i => tags.push(`interesse:${i}`));
  
  if (state.guidanceStyle) tags.push(`estilo:${state.guidanceStyle}`);
  if (state.ageRange) tags.push(`idade:${state.ageRange}`);
  
  return tags;
}

export function computeSegment(state: LeadState): { segment: Segment; rules: string[] } {
  const rules: string[] = [];
  let segment: Segment = "GENERAL";

  const isInternational = state.country?.code !== "PT";
  const isPremiumTime = ["medio", "longo", "estadia"].includes(state.timeBucket || "");
  const isDeepStyle = ["contexto", "guiado", "conversa"].includes(state.guidanceStyle || "");
  const wantsPaid = state.interests.includes("experiencias_pagas");
  const wantsFree = state.interests.includes("gratis");
  const wantsHidden = state.interests.includes("oculto");
  const wantsGastro = state.interests.includes("gastronomia");

  if (isInternational && isPremiumTime && isDeepStyle) {
    segment = "TOURIST_PREMIUM";
    rules.push("intl_premium_time_deep_style");
  } else if (!isInternational && isPremiumTime && wantsPaid) {
    segment = "DAYTRIP_PT";
    rules.push("pt_premium_time_paid");
  } else if (!isInternational && state.timeBucket === "curto" && (wantsGastro || wantsHidden)) {
    segment = "LOCAL_CURIOUS";
    rules.push("pt_short_curious");
  } else if (state.guidanceStyle === "rapido" && wantsFree) {
    segment = "EXPLORER_AUTONOMOUS";
    rules.push("quick_free");
  }

  return { segment, rules };
}

export function buildTeresaBrief(lead: LeadData): string {
  const i = lead.identity;
  const c = lead.context;
  
  // Mapping for human readable values
  const interestMap: Record<InterestType, string> = {
    classicos: "Clássicos",
    oculto: "Segredos",
    gastronomia: "Comer/Beber",
    gratis: "Passeios Free",
    experiencias_pagas: "Experiências"
  };

  const styleMap: Record<GuidanceStyle, string> = {
    rapido: "Dicas rápidas",
    contexto: "Com história",
    guiado: "Passo a passo",
    conversa: "Conversar"
  };

  const timeMap: Record<TimeBucket, string> = {
    curto: "1-2h",
    medio: "Meio dia",
    longo: "Dia inteiro",
    estadia: "Dias"
  };

  const partyMap: Record<PartyType, string> = {
    solo: "Solo",
    casal: "Casal",
    grupo: "Amigos",
    familia: "Família"
  };

  const interestsList = lead.interests.map(int => interestMap[int]).join(", ");
  
  return `Olá Teresa! Sou ${i.firstName}. Lead #${lead.leadId.slice(0, 4)}...
Contexto:
- País: ${i.countryName}
- Tempo: ${timeMap[c.timeBucket]}
- Companhia: ${partyMap[c.partyType]}
- Interesses: ${interestsList}
- Estilo: ${styleMap[c.guidanceStyle]}
- Faixa etária: ${i.ageRange.replace("_", "-")}

Pode me sugerir um plano e opções (pins/gastro/experiências) para hoje?`;
}

export function generateLeadJSON(state: LeadState): LeadData {
  const leadId = generateLeadId();
  const tags = buildTags(state);
  const { segment, rules } = computeSegment(state);
  
  const suggestions: string[] = [];
  if (state.interests.includes("gastronomia")) suggestions.push("gastro");
  if (state.interests.includes("oculto")) suggestions.push("pins");
  if (state.interests.includes("experiencias_pagas")) suggestions.push("experiencias");

  const identity: LeadIdentity = {
    firstName: state.firstName || "Visitante",
    countryCode: state.country?.code || "OTHER",
    countryName: state.country?.name || "Outro",
    ageRange: state.ageRange || "26_35"
  };

  const context: LeadContext = {
    timeBucket: state.timeBucket || "medio",
    partyType: state.partyType || "solo",
    guidanceStyle: state.guidanceStyle || "rapido"
  };

  const partialLead: Partial<LeadData> = {
    leadId,
    createdAt: new Date().toISOString(),
    source: "organic",
    language: "pt", // Defaulting to PT for this prototype
    identity,
    context,
    interests: state.interests,
    tags,
    segmentPrimary: segment,
    segmentRulesApplied: rules,
    teresaModeSuggestions: suggestions,
  };

  // 2nd pass to generate message using the lead data itself
  const fullLead = partialLead as LeadData; // Cast for brief generation
  const message = buildTeresaBrief(fullLead);

  fullLead.whatsapp = {
    to: "+351931358278",
    prefilledMessage: encodeURIComponent(message)
  };

  return fullLead;
}
