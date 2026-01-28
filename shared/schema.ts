import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Lead qualification data from the wizard form
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Source tracking
  source: varchar("source", { length: 50 }).notNull().default("organic"),
  language: varchar("language", { length: 10 }).notNull().default("pt"),
  
  // Identity
  firstName: text("first_name").notNull(),
  countryCode: varchar("country_code", { length: 10 }).notNull(),
  countryName: text("country_name").notNull(),
  ageRange: varchar("age_range", { length: 20 }).notNull(),
  
  // Context
  timeBucket: varchar("time_bucket", { length: 20 }).notNull(),
  partyType: varchar("party_type", { length: 20 }).notNull(),
  guidanceStyle: varchar("guidance_style", { length: 20 }).notNull(),
  
  // Interests (stored as JSON array)
  interests: jsonb("interests").notNull().$type<string[]>(),
  
  // Segmentation
  tags: jsonb("tags").notNull().$type<string[]>(),
  segmentPrimary: varchar("segment_primary", { length: 50 }).notNull(),
  segmentRules: jsonb("segment_rules").$type<string[]>(),
  
  // Teresa suggestions
  teresaModes: jsonb("teresa_modes").$type<string[]>(),
  
  // WhatsApp data
  whatsappMessage: text("whatsapp_message"),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Experiences table for NTG curated experiences
export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Content
  title: text("title").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description"),
  
  // Details
  price: varchar("price", { length: 50 }),
  duration: varchar("duration", { length: 50 }),
  category: varchar("category", { length: 50 }).notNull(),
  
  // Media
  heroImage: text("hero_image"),
  icon: varchar("icon", { length: 50 }),
  
  // Status
  isPublished: boolean("is_published").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  
  // Tags for filtering
  tags: jsonb("tags").$type<string[]>().default([]),
});

export const insertExperienceSchema = createInsertSchema(experiences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experiences.$inferSelect;

// Stop structure for Teresa Creator
export interface TripStop {
  name: string;
  freeExperience: { label: string; details: string };
  paidExperience: { label: string; details: string };
  effort: "leve" | "moderada";
}

// Itinerary item structure
export interface ItineraryItem {
  time: string;
  label: string;
  details: string;
}

// Trips table for day-trips and curated travel (also serves as Club proposals)
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Content
  title: text("title").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  shortDescription: text("short_description").notNull(),
  longDescription: text("long_description"),
  
  // Details
  price: varchar("price", { length: 50 }),
  duration: varchar("duration", { length: 50 }),
  destination: text("destination").notNull(),
  
  // Media
  heroImage: text("hero_image"),
  icon: varchar("icon", { length: 50 }),
  
  // Status
  isPublished: boolean("is_published").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  
  // Tags for filtering
  tags: jsonb("tags").$type<string[]>().default([]),
  
  // === NTG Trips Club fields ===
  // Source: 'ntg' = created by NTG, 'member' = created by club member
  sourceType: varchar("source_type", { length: 20 }).default("ntg"),
  
  // Creator user ID (for member-created proposals)
  createdByUserId: varchar("created_by_user_id"),
  
  // Proposal status: null = legacy trip, pending_review/voting/ready_to_schedule/archived = club proposal
  proposalStatus: varchar("proposal_status", { length: 30 }),
  
  // Viability rule (e.g., { "min_interested": 10 })
  viabilityRule: jsonb("viability_rule").$type<{ min_interested?: number; min_votes?: number }>(),
  
  // Price ranges for essential and complete packages
  priceEssentialMin: integer("price_essential_min"),
  priceEssentialMax: integer("price_essential_max"),
  priceCompleteMin: integer("price_complete_min"),
  priceCompleteMax: integer("price_complete_max"),
  
  // Multiple destinations as JSON array
  destinations: jsonb("destinations").$type<string[]>(),
  
  // Trip details
  difficulty: varchar("difficulty", { length: 20 }),
  groupSizeMin: integer("group_size_min"),
  groupSizeMax: integer("group_size_max"),
  startCity: varchar("start_city", { length: 100 }).default("Coimbra"),
  
  // What's included/excluded
  includes: jsonb("includes").$type<string[]>(),
  excludes: jsonb("excludes").$type<string[]>(),
  optionalAddons: jsonb("optional_addons").$type<string[]>(),
  
  // Club benefits text
  clubBenefits: text("club_benefits"),
  
  // === Teresa Creator fields ===
  // Structured stops (1-2 main stops with free/paid experiences)
  stopsJson: jsonb("stops_json").$type<TripStop[]>(),
  
  // Essential itinerary (free experiences only)
  itineraryEssential: jsonb("itinerary_essential").$type<ItineraryItem[]>(),
  
  // Complete itinerary (includes paid experiences)
  itineraryComplete: jsonb("itinerary_complete").$type<ItineraryItem[]>(),
  
  // Capacity
  capacity: integer("capacity").default(10),
  
  // Estimated duration in hours
  durationHoursEst: integer("duration_hours_est"),
  
  // Cover image prompt for AI generation
  coverImagePrompt: text("cover_image_prompt"),
  
  // === Proposal lifecycle timestamps ===
  statusChangedAt: timestamp("status_changed_at"),
  reviewedAt: timestamp("reviewed_at"),
  scheduledAt: timestamp("scheduled_at"),
  
  // Admin notes for proposal review
  adminNotes: text("admin_notes"),
  
  // Reward amount in cents (for creator when proposal becomes real trip)
  creatorRewardCents: integer("creator_reward_cents").default(2000), // Default €20 credit
  rewardPaidAt: timestamp("reward_paid_at"),
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

// Chat models for Gemini integration
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Admin users for authentication
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminUser = typeof adminUsers.$inferSelect;

// Media assets for image storage
export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  filename: text("filename"),
  originalName: text("original_name").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  
  originalUrl: text("original_url").notNull(),
  optimizedUrl: text("optimized_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  
  width: integer("width"),
  height: integer("height"),
  size: integer("size"),
  
  altText: text("alt_text"),
  category: varchar("category", { length: 50 }),
  driveFileId: text("drive_file_id"),
});

export const insertMediaAssetSchema = createInsertSchema(mediaAssets).omit({
  id: true,
  createdAt: true,
});

export type InsertMediaAsset = z.infer<typeof insertMediaAssetSchema>;
export type MediaAsset = typeof mediaAssets.$inferSelect;

// Media asset variants for different aspect ratios
export const mediaAssetVariants = pgTable("media_asset_variants", {
  id: serial("id").primaryKey(),
  mediaAssetId: integer("media_asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  variantType: varchar("variant_type", { length: 20 }).notNull(), // card, hero, gallery, thumbnail, download
  url: text("url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  size: integer("size"),
  format: varchar("format", { length: 20 }).default("jpeg").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMediaAssetVariantSchema = createInsertSchema(mediaAssetVariants).omit({
  id: true,
  createdAt: true,
});

export type InsertMediaAssetVariant = z.infer<typeof insertMediaAssetVariantSchema>;
export type MediaAssetVariant = typeof mediaAssetVariants.$inferSelect;

// Trip albums for permanent photo galleries
export const tripAlbums = pgTable("trip_albums", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  coverMediaAssetId: integer("cover_media_asset_id").references(() => mediaAssets.id),
  eventDate: timestamp("event_date"),
  releasedAt: timestamp("released_at"),
  isPublic: boolean("is_public").default(false).notNull(),
  downloadEnabled: boolean("download_enabled").default(true).notNull(),
  googleDriveFolderId: text("google_drive_folder_id"),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripAlbumSchema = createInsertSchema(tripAlbums).omit({
  id: true,
  createdAt: true,
});

export type InsertTripAlbum = z.infer<typeof insertTripAlbumSchema>;
export type TripAlbum = typeof tripAlbums.$inferSelect;

// Photos within trip albums
export const tripAlbumPhotos = pgTable("trip_album_photos", {
  id: serial("id").primaryKey(),
  albumId: integer("album_id").notNull().references(() => tripAlbums.id, { onDelete: "cascade" }),
  mediaAssetId: integer("media_asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").default(0).notNull(),
  caption: text("caption"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripAlbumPhotoSchema = createInsertSchema(tripAlbumPhotos).omit({
  id: true,
  createdAt: true,
});

export type InsertTripAlbumPhoto = z.infer<typeof insertTripAlbumPhotoSchema>;
export type TripAlbumPhoto = typeof tripAlbumPhotos.$inferSelect;

// Print offers for photo prints/frames
export const photoPrintOffers = pgTable("photo_print_offers", {
  id: serial("id").primaryKey(),
  albumPhotoId: integer("album_photo_id").references(() => tripAlbumPhotos.id, { onDelete: "cascade" }),
  mediaAssetId: integer("media_asset_id").references(() => mediaAssets.id, { onDelete: "cascade" }),
  sizeLabel: varchar("size_label", { length: 50 }).notNull(), // e.g., "20x30cm", "30x40cm"
  widthCm: integer("width_cm").notNull(),
  heightCm: integer("height_cm").notNull(),
  frameType: varchar("frame_type", { length: 50 }), // e.g., "wood", "aluminum", "none"
  priceCents: integer("price_cents").notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhotoPrintOfferSchema = createInsertSchema(photoPrintOffers).omit({
  id: true,
  createdAt: true,
});

export type InsertPhotoPrintOffer = z.infer<typeof insertPhotoPrintOfferSchema>;
export type PhotoPrintOffer = typeof photoPrintOffers.$inferSelect;

// Variant type constants
export const VARIANT_TYPES = {
  CARD: "card",       // 4:3, 800x600
  HERO: "hero",       // 16:9, 1920x1080
  GALLERY: "gallery", // 4:3, 1200x900
  THUMBNAIL: "thumbnail", // 1:1, 400x400
  DOWNLOAD: "download"  // Original optimized
} as const;

export type VariantType = typeof VARIANT_TYPES[keyof typeof VARIANT_TYPES];

// Gallery images for experiences
export const experienceGallery = pgTable("experience_gallery", {
  id: serial("id").primaryKey(),
  experienceId: integer("experience_id").notNull().references(() => experiences.id, { onDelete: "cascade" }),
  mediaAssetId: integer("media_asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0).notNull(),
  blockHint: varchar("block_hint", { length: 50 }),
});

export const insertExperienceGallerySchema = createInsertSchema(experienceGallery).omit({
  id: true,
});

export type InsertExperienceGallery = z.infer<typeof insertExperienceGallerySchema>;
export type ExperienceGallery = typeof experienceGallery.$inferSelect;

// Gallery images for trips
export const tripGallery = pgTable("trip_gallery", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  mediaAssetId: integer("media_asset_id").notNull().references(() => mediaAssets.id, { onDelete: "cascade" }),
  caption: text("caption"),
  displayOrder: integer("display_order").default(0).notNull(),
  blockHint: varchar("block_hint", { length: 50 }),
});

export const insertTripGallerySchema = createInsertSchema(tripGallery).omit({
  id: true,
});

export type InsertTripGallery = z.infer<typeof insertTripGallerySchema>;
export type TripGallery = typeof tripGallery.$inferSelect;

// AI-generated page layouts
export const pageLayouts = pgTable("page_layouts", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  entityType: varchar("entity_type", { length: 20 }).notNull(),
  entityId: integer("entity_id").notNull(),
  
  layoutVersion: integer("layout_version").default(1).notNull(),
  blocks: jsonb("blocks").notNull().$type<PageBlock[]>(),
  
  aiModel: varchar("ai_model", { length: 50 }),
  status: varchar("status", { length: 20 }).default("generated").notNull(),
});

export interface PageBlock {
  type: "hero" | "story" | "highlights" | "gallery" | "itinerary" | "included" | "cta" | "quote" | "info" | "album_link" | "favorite_button" | "interest_meter";
  order: number;
  content: Record<string, unknown>;
  style?: Record<string, unknown>;
}

export const insertPageLayoutSchema = createInsertSchema(pageLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPageLayout = z.infer<typeof insertPageLayoutSchema>;
export type PageLayout = typeof pageLayouts.$inferSelect;

// Re-export auth models
export * from "./models/auth";

// User profiles for Trips Club members with tribe classification and membership
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  
  // Tribe classification from onboarding
  primaryTribe: varchar("primary_tribe", { length: 50 }),
  secondaryTribe: varchar("secondary_tribe", { length: 50 }),
  
  // Onboarding answers
  ritmo: varchar("ritmo", { length: 20 }),
  motivacao: varchar("motivacao", { length: 20 }),
  grupo: varchar("grupo", { length: 20 }),
  planejamento: varchar("planejamento", { length: 20 }),
  social: varchar("social", { length: 20 }),
  contexto: varchar("contexto", { length: 20 }),
  cidadeBase: text("cidade_base"),
  
  // Additional preferences
  preferredTravelType: varchar("preferred_travel_type", { length: 20 }),
  isOnboardingComplete: boolean("is_onboarding_complete").default(false).notNull(),
  
  // === Club Membership fields ===
  membershipTier: varchar("membership_tier", { length: 20 }), // null = free, 'club' = member
  discountPercent: integer("discount_percent").default(0), // e.g., 10, 15
  priorityWindowHours: integer("priority_window_hours").default(0), // e.g., 24, 48
  membershipStartedAt: timestamp("membership_started_at"),
  membershipEndsAt: timestamp("membership_ends_at"),
  
  // === Creator rewards ===
  travelCreditCents: integer("travel_credit_cents").default(0), // Credit earned from created proposals
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Trip favorites/interest tracking (also serves as Club interest list)
export const tripFavorites = pgTable("trip_favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Interest level (interested, very_interested, confirmed)
  interestLevel: varchar("interest_level", { length: 20 }).default("interested").notNull(),
  
  // Optional note (e.g., "prefiro domingo")
  note: text("note"),
  
  // Club: public visibility on interest list (named = show name, anonymous = hide)
  publicVisibility: varchar("public_visibility", { length: 20 }).default("anonymous"),
});

export const insertTripFavoriteSchema = createInsertSchema(tripFavorites).omit({
  id: true,
  createdAt: true,
});

export type InsertTripFavorite = z.infer<typeof insertTripFavoriteSchema>;
export type TripFavorite = typeof tripFavorites.$inferSelect;

// Trip votes for Club proposals (1 vote per user per trip)
export const tripVotes = pgTable("trip_votes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTripVoteSchema = createInsertSchema(tripVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertTripVote = z.infer<typeof insertTripVoteSchema>;
export type TripVote = typeof tripVotes.$inferSelect;

// Trip pledges for payment commitments (MVP without gateway)
export const tripPledges = pgTable("trip_pledges", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  seats: integer("seats").default(1).notNull(),
  amountCents: integer("amount_cents").default(0).notNull(),
  status: varchar("status", { length: 20 }).default("pledged").notNull(), // pledged, confirmed, canceled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTripPledgeSchema = createInsertSchema(tripPledges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTripPledge = z.infer<typeof insertTripPledgeSchema>;
export type TripPledge = typeof tripPledges.$inferSelect;

// Trip instances for scheduled trips with confirmed dates
export const tripInstances = pgTable("trip_instances", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => trips.id, { onDelete: "cascade" }),
  dateStart: timestamp("date_start").notNull(),
  dateEnd: timestamp("date_end"),
  finalPriceEssential: integer("final_price_essential"), // in cents
  finalPriceComplete: integer("final_price_complete"), // in cents
  capacityTotal: integer("capacity_total").default(10).notNull(),
  capacityRemaining: integer("capacity_remaining").default(10).notNull(),
  bookingStatus: varchar("booking_status", { length: 20 }).default("announced").notNull(), // announced, member_priority, public_open, sold_out, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTripInstanceSchema = createInsertSchema(tripInstances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTripInstance = z.infer<typeof insertTripInstanceSchema>;
export type TripInstance = typeof tripInstances.$inferSelect;

// Bookings for trip instances
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tripInstanceId: integer("trip_instance_id").notNull().references(() => tripInstances.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  packageType: varchar("package_type", { length: 20 }).default("essential").notNull(), // essential, complete
  seats: integer("seats").default(1).notNull(),
  totalPriceCents: integer("total_price_cents").notNull(),
  discountAppliedPercent: integer("discount_applied_percent").default(0),
  creditUsedCents: integer("credit_used_cents").default(0),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, paid, canceled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Credit transactions for tracking reward credits
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  amountCents: integer("amount_cents").notNull(), // Positive = credit added, Negative = credit used
  type: varchar("type", { length: 30 }).notNull(), // creator_reward, booking_used, admin_adjustment, expired
  referenceType: varchar("reference_type", { length: 30 }), // trip, booking, admin
  referenceId: integer("reference_id"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;

// Proposal status constants
export const PROPOSAL_STATUS = {
  PENDING_REVIEW: "pending_review",    // Waiting admin validation
  VOTING: "voting",                     // Open for votes
  READY_TO_SCHEDULE: "ready_to_schedule", // Has enough traction
  SCHEDULED: "scheduled",               // Has confirmed date
  ARCHIVED: "archived",                 // Closed/rejected
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];
