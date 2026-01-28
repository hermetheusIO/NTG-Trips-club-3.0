import { 
  type Lead, type InsertLead, leads,
  type Experience, type InsertExperience, experiences,
  type Trip, type InsertTrip, trips,
  type Conversation, type Message, conversations, messages,
  type AdminUser, adminUsers,
  type MediaAsset, type InsertMediaAsset, mediaAssets,
  type MediaAssetVariant, type InsertMediaAssetVariant, mediaAssetVariants,
  type ExperienceGallery, type InsertExperienceGallery, experienceGallery,
  type TripGallery, type InsertTripGallery, tripGallery,
  type PageLayout, type InsertPageLayout, pageLayouts,
  type TripAlbum, type InsertTripAlbum, tripAlbums,
  type TripAlbumPhoto, type InsertTripAlbumPhoto, tripAlbumPhotos,
  type PhotoPrintOffer, type InsertPhotoPrintOffer, photoPrintOffers,
  type UserProfile, type InsertUserProfile, userProfiles,
  type TripFavorite, type InsertTripFavorite, tripFavorites,
  type TripVote, type InsertTripVote, tripVotes,
  type CreditTransaction, type InsertCreditTransaction, creditTransactions,
  PROPOSAL_STATUS
} from "@shared/schema";
import { db } from "./db";
import { desc, eq, asc, and } from "drizzle-orm";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export interface IStorage {
  // Lead operations
  createLead(lead: InsertLead): Promise<Lead>;
  getLeadById(id: string): Promise<Lead | undefined>;
  getAllLeads(limit?: number): Promise<Lead[]>;
  
  // KPI operations
  getLeadStats(): Promise<{
    totalLeads: number;
    bySegment: { segment: string; count: number }[];
    byCountry: { country: string; count: number }[];
    recentLeads: Lead[];
  }>;
  
  // Experience operations
  createExperience(exp: InsertExperience): Promise<Experience>;
  updateExperience(id: number, exp: Partial<InsertExperience>): Promise<Experience | undefined>;
  deleteExperience(id: number): Promise<void>;
  getExperienceById(id: number): Promise<Experience | undefined>;
  getAllExperiences(publishedOnly?: boolean): Promise<Experience[]>;
  
  // Trip operations
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<void>;
  getTripById(id: number): Promise<Trip | undefined>;
  getAllTrips(publishedOnly?: boolean): Promise<Trip[]>;
  
  // Admin user operations
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  validateAdminCredentials(email: string, password: string): Promise<AdminUser | null>;
  ensureDefaultAdmins(): Promise<void>;
  
  // Media asset operations
  createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset>;
  getMediaAssetById(id: number): Promise<MediaAsset | undefined>;
  getAllMediaAssets(category?: string): Promise<MediaAsset[]>;
  deleteMediaAsset(id: number): Promise<void>;
  
  // Gallery operations
  addToExperienceGallery(item: InsertExperienceGallery): Promise<ExperienceGallery>;
  getExperienceGallery(experienceId: number): Promise<(ExperienceGallery & { mediaAsset: MediaAsset })[]>;
  updateExperienceGalleryOrder(items: { id: number; displayOrder: number }[]): Promise<void>;
  removeFromExperienceGallery(id: number): Promise<void>;
  
  addToTripGallery(item: InsertTripGallery): Promise<TripGallery>;
  getTripGallery(tripId: number): Promise<(TripGallery & { mediaAsset: MediaAsset })[]>;
  updateTripGalleryOrder(items: { id: number; displayOrder: number }[]): Promise<void>;
  removeFromTripGallery(id: number): Promise<void>;
  
  // Page layout operations
  createPageLayout(layout: InsertPageLayout): Promise<PageLayout>;
  getPageLayout(entityType: string, entityId: number): Promise<PageLayout | undefined>;
  updatePageLayout(id: number, layout: Partial<InsertPageLayout>): Promise<PageLayout | undefined>;
  
  // Detail page data
  getExperienceWithGallery(slug: string): Promise<{ experience: Experience; gallery: (ExperienceGallery & { mediaAsset: MediaAsset })[]; layout: PageLayout | undefined } | undefined>;
  getTripWithGallery(slug: string): Promise<{ trip: Trip; gallery: (TripGallery & { mediaAsset: MediaAsset })[]; layout: PageLayout | undefined } | undefined>;
  
  // Media variant operations
  createMediaAssetVariant(variant: InsertMediaAssetVariant): Promise<MediaAssetVariant>;
  createMediaAssetVariants(variants: InsertMediaAssetVariant[]): Promise<MediaAssetVariant[]>;
  getMediaAssetVariants(mediaAssetId: number): Promise<MediaAssetVariant[]>;
  getMediaAssetWithVariants(id: number): Promise<{ asset: MediaAsset; variants: MediaAssetVariant[] } | undefined>;
  
  // Trip album operations
  createTripAlbum(album: InsertTripAlbum): Promise<TripAlbum>;
  updateTripAlbum(id: number, album: Partial<InsertTripAlbum>): Promise<TripAlbum | undefined>;
  deleteTripAlbum(id: number): Promise<void>;
  getTripAlbumById(id: number): Promise<TripAlbum | undefined>;
  getTripAlbumByTripId(tripId: number): Promise<TripAlbum | undefined>;
  getPublicTripAlbums(): Promise<TripAlbum[]>;
  getAllTripAlbums(): Promise<(TripAlbum & { trip?: Trip; photos: (TripAlbumPhoto & { asset?: MediaAsset })[] })[]>;
  
  // Trip album photo operations
  addPhotoToAlbum(photo: InsertTripAlbumPhoto): Promise<TripAlbumPhoto>;
  getAlbumPhotos(albumId: number): Promise<(TripAlbumPhoto & { mediaAsset: MediaAsset; variants: MediaAssetVariant[] })[]>;
  updateAlbumPhotoOrder(items: { id: number; displayOrder: number }[]): Promise<void>;
  removePhotoFromAlbum(id: number): Promise<void>;
  
  // Print offer operations
  createPrintOffer(offer: InsertPhotoPrintOffer): Promise<PhotoPrintOffer>;
  getPrintOffersByPhoto(albumPhotoId: number): Promise<PhotoPrintOffer[]>;
  getDefaultPrintOffers(): Promise<PhotoPrintOffer[]>;
  updatePrintOffer(id: number, offer: Partial<InsertPhotoPrintOffer>): Promise<PhotoPrintOffer | undefined>;
  deletePrintOffer(id: number): Promise<void>;
  
  // User profile operations
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getUserProfileByUserId(userId: string): Promise<UserProfile | undefined>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;
  
  // Trip favorites operations
  addTripFavorite(favorite: InsertTripFavorite): Promise<TripFavorite>;
  removeTripFavorite(userId: string, tripId: number): Promise<void>;
  getUserFavorites(userId: string): Promise<(TripFavorite & { trip: Trip })[]>;
  isTripFavorited(userId: string, tripId: number): Promise<boolean>;
  getTripFavoriteCount(tripId: number): Promise<number>;
  
  // Proposal operations for admin
  getPendingProposals(): Promise<Trip[]>;
  updateProposalStatus(tripId: number, status: string): Promise<Trip | undefined>;
  
  // === Proposal Lifecycle ===
  getProposalsByStatus(status: string): Promise<Trip[]>;
  approveProposal(tripId: number, adminNotes?: string): Promise<Trip | undefined>;
  scheduleProposal(tripId: number): Promise<Trip | undefined>;
  archiveProposal(tripId: number, reason?: string): Promise<Trip | undefined>;
  evaluateViability(tripId: number): Promise<{ isViable: boolean; votes: number; interested: number; required: number }>;
  
  // === Creator Rewards ===
  addCreatorReward(userId: string, tripId: number, amountCents: number, description: string): Promise<CreditTransaction>;
  getUserCredits(userId: string): Promise<number>;
  getUserCreditHistory(userId: string): Promise<CreditTransaction[]>;
  useCredits(userId: string, amountCents: number, bookingId: number, description: string): Promise<CreditTransaction>;
  
  // === Proposal Voting with user votes ===
  getUserVotes(userId: string): Promise<(TripVote & { trip: Trip })[]>;
}

export class DatabaseStorage implements IStorage {
  // Lead operations
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values([insertLead]).returning();
    return lead;
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async getAllLeads(limit: number = 100): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(limit);
  }

  // KPI operations
  async getLeadStats() {
    const allLeads = await this.getAllLeads(1000);
    
    const segmentCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    
    for (const lead of allLeads) {
      segmentCounts[lead.segmentPrimary] = (segmentCounts[lead.segmentPrimary] || 0) + 1;
      countryCounts[lead.countryName] = (countryCounts[lead.countryName] || 0) + 1;
    }

    return {
      totalLeads: allLeads.length,
      bySegment: Object.entries(segmentCounts).map(([segment, count]) => ({ segment, count })),
      byCountry: Object.entries(countryCounts).map(([country, count]) => ({ country, count })),
      recentLeads: allLeads.slice(0, 10)
    };
  }

  // Experience operations
  async createExperience(exp: InsertExperience): Promise<Experience> {
    const [experience] = await db.insert(experiences).values([exp]).returning();
    return experience;
  }

  async updateExperience(id: number, exp: Partial<InsertExperience>): Promise<Experience | undefined> {
    const [updated] = await db
      .update(experiences)
      .set({ ...exp, updatedAt: new Date() })
      .where(eq(experiences.id, id))
      .returning();
    return updated;
  }

  async deleteExperience(id: number): Promise<void> {
    await db.delete(experiences).where(eq(experiences.id, id));
  }

  async getExperienceById(id: number): Promise<Experience | undefined> {
    const [exp] = await db.select().from(experiences).where(eq(experiences.id, id));
    return exp;
  }

  async getAllExperiences(publishedOnly: boolean = false): Promise<Experience[]> {
    if (publishedOnly) {
      return await db
        .select()
        .from(experiences)
        .where(eq(experiences.isPublished, true))
        .orderBy(desc(experiences.createdAt));
    }
    return await db.select().from(experiences).orderBy(desc(experiences.createdAt));
  }

  // Trip operations
  async createTrip(trip: InsertTrip): Promise<Trip> {
    const [newTrip] = await db.insert(trips).values([trip]).returning();
    return newTrip;
  }

  async updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    const [updated] = await db
      .update(trips)
      .set({ ...trip, updatedAt: new Date() })
      .where(eq(trips.id, id))
      .returning();
    return updated;
  }

  async deleteTrip(id: number): Promise<void> {
    await db.delete(trips).where(eq(trips.id, id));
  }

  async getTripById(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip;
  }

  async getAllTrips(publishedOnly: boolean = false): Promise<Trip[]> {
    if (publishedOnly) {
      return await db
        .select()
        .from(trips)
        .where(eq(trips.isPublished, true))
        .orderBy(desc(trips.createdAt));
    }
    return await db.select().from(trips).orderBy(desc(trips.createdAt));
  }

  // Admin user operations
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase()));
    return admin;
  }

  async validateAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
    const admin = await this.getAdminByEmail(email);
    if (!admin) return null;
    
    const passwordHash = hashPassword(password);
    if (admin.passwordHash !== passwordHash) return null;
    
    return admin;
  }

  async ensureDefaultAdmins(): Promise<void> {
    const defaultAdmins = [
      { email: "diegolima@hermetheus.io", password: "Gui@1123" },
      { email: "guianaoturistico@gmail.com", password: "Gui@1123" }
    ];

    for (const admin of defaultAdmins) {
      const existing = await this.getAdminByEmail(admin.email);
      if (!existing) {
        await db.insert(adminUsers).values({
          email: admin.email.toLowerCase(),
          passwordHash: hashPassword(admin.password)
        });
        console.log(`Created admin user: ${admin.email}`);
      }
    }
  }

  // Media asset operations
  async createMediaAsset(asset: InsertMediaAsset): Promise<MediaAsset> {
    const [mediaAsset] = await db.insert(mediaAssets).values([asset]).returning();
    return mediaAsset;
  }

  async getMediaAssetById(id: number): Promise<MediaAsset | undefined> {
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id));
    return asset;
  }

  async getAllMediaAssets(category?: string): Promise<MediaAsset[]> {
    if (category) {
      return await db
        .select()
        .from(mediaAssets)
        .where(eq(mediaAssets.category, category))
        .orderBy(desc(mediaAssets.createdAt));
    }
    return await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  }

  async deleteMediaAsset(id: number): Promise<void> {
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
  }

  // Gallery operations
  async addToExperienceGallery(item: InsertExperienceGallery): Promise<ExperienceGallery> {
    const [gallery] = await db.insert(experienceGallery).values([item]).returning();
    return gallery;
  }

  async getExperienceGallery(experienceId: number): Promise<(ExperienceGallery & { mediaAsset: MediaAsset })[]> {
    const results = await db
      .select()
      .from(experienceGallery)
      .innerJoin(mediaAssets, eq(experienceGallery.mediaAssetId, mediaAssets.id))
      .where(eq(experienceGallery.experienceId, experienceId))
      .orderBy(asc(experienceGallery.displayOrder));
    
    return results.map(r => ({
      ...r.experience_gallery,
      mediaAsset: r.media_assets
    }));
  }

  async updateExperienceGalleryOrder(items: { id: number; displayOrder: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(experienceGallery)
        .set({ displayOrder: item.displayOrder })
        .where(eq(experienceGallery.id, item.id));
    }
  }

  async removeFromExperienceGallery(id: number): Promise<void> {
    await db.delete(experienceGallery).where(eq(experienceGallery.id, id));
  }

  async addToTripGallery(item: InsertTripGallery): Promise<TripGallery> {
    const [gallery] = await db.insert(tripGallery).values([item]).returning();
    return gallery;
  }

  async getTripGallery(tripId: number): Promise<(TripGallery & { mediaAsset: MediaAsset })[]> {
    const results = await db
      .select()
      .from(tripGallery)
      .innerJoin(mediaAssets, eq(tripGallery.mediaAssetId, mediaAssets.id))
      .where(eq(tripGallery.tripId, tripId))
      .orderBy(asc(tripGallery.displayOrder));
    
    return results.map(r => ({
      ...r.trip_gallery,
      mediaAsset: r.media_assets
    }));
  }

  async updateTripGalleryOrder(items: { id: number; displayOrder: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(tripGallery)
        .set({ displayOrder: item.displayOrder })
        .where(eq(tripGallery.id, item.id));
    }
  }

  async removeFromTripGallery(id: number): Promise<void> {
    await db.delete(tripGallery).where(eq(tripGallery.id, id));
  }

  // Page layout operations
  async createPageLayout(layout: InsertPageLayout): Promise<PageLayout> {
    const [pageLayout] = await db.insert(pageLayouts).values([layout]).returning();
    return pageLayout;
  }

  async getPageLayout(entityType: string, entityId: number): Promise<PageLayout | undefined> {
    const [layout] = await db
      .select()
      .from(pageLayouts)
      .where(and(eq(pageLayouts.entityType, entityType), eq(pageLayouts.entityId, entityId)))
      .orderBy(desc(pageLayouts.layoutVersion))
      .limit(1);
    return layout;
  }

  async updatePageLayout(id: number, layout: Partial<InsertPageLayout>): Promise<PageLayout | undefined> {
    const [updated] = await db
      .update(pageLayouts)
      .set({ ...layout, updatedAt: new Date() })
      .where(eq(pageLayouts.id, id))
      .returning();
    return updated;
  }

  // Detail page data
  async getExperienceWithGallery(slug: string): Promise<{ experience: Experience; gallery: (ExperienceGallery & { mediaAsset: MediaAsset })[]; layout: PageLayout | undefined } | undefined> {
    const [experience] = await db.select().from(experiences).where(eq(experiences.slug, slug));
    if (!experience) return undefined;
    
    const gallery = await this.getExperienceGallery(experience.id);
    const layout = await this.getPageLayout("experience", experience.id);
    
    return { experience, gallery, layout };
  }

  async getTripWithGallery(slug: string): Promise<{ trip: Trip; gallery: (TripGallery & { mediaAsset: MediaAsset })[]; layout: PageLayout | undefined } | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.slug, slug));
    if (!trip) return undefined;
    
    const gallery = await this.getTripGallery(trip.id);
    const layout = await this.getPageLayout("trip", trip.id);
    
    return { trip, gallery, layout };
  }

  // Media variant operations
  async createMediaAssetVariant(variant: InsertMediaAssetVariant): Promise<MediaAssetVariant> {
    const [created] = await db.insert(mediaAssetVariants).values([variant]).returning();
    return created;
  }

  async createMediaAssetVariants(variants: InsertMediaAssetVariant[]): Promise<MediaAssetVariant[]> {
    if (variants.length === 0) return [];
    const created = await db.insert(mediaAssetVariants).values(variants).returning();
    return created;
  }

  async getMediaAssetVariants(mediaAssetId: number): Promise<MediaAssetVariant[]> {
    return await db
      .select()
      .from(mediaAssetVariants)
      .where(eq(mediaAssetVariants.mediaAssetId, mediaAssetId));
  }

  async getMediaAssetWithVariants(id: number): Promise<{ asset: MediaAsset; variants: MediaAssetVariant[] } | undefined> {
    const asset = await this.getMediaAssetById(id);
    if (!asset) return undefined;
    const variants = await this.getMediaAssetVariants(id);
    return { asset, variants };
  }

  // Trip album operations
  async createTripAlbum(album: InsertTripAlbum): Promise<TripAlbum> {
    const [created] = await db.insert(tripAlbums).values([album]).returning();
    return created;
  }

  async updateTripAlbum(id: number, album: Partial<InsertTripAlbum>): Promise<TripAlbum | undefined> {
    const [updated] = await db
      .update(tripAlbums)
      .set(album)
      .where(eq(tripAlbums.id, id))
      .returning();
    return updated;
  }

  async deleteTripAlbum(id: number): Promise<void> {
    await db.delete(tripAlbums).where(eq(tripAlbums.id, id));
  }

  async getTripAlbumById(id: number): Promise<TripAlbum | undefined> {
    const [album] = await db.select().from(tripAlbums).where(eq(tripAlbums.id, id));
    return album;
  }

  async getTripAlbumByTripId(tripId: number): Promise<TripAlbum | undefined> {
    const [album] = await db.select().from(tripAlbums).where(eq(tripAlbums.tripId, tripId));
    return album;
  }

  async getPublicTripAlbums(): Promise<TripAlbum[]> {
    return await db
      .select()
      .from(tripAlbums)
      .where(eq(tripAlbums.isPublic, true))
      .orderBy(desc(tripAlbums.createdAt));
  }

  async getAllTripAlbums(): Promise<(TripAlbum & { trip?: Trip; photos: (TripAlbumPhoto & { asset?: MediaAsset })[] })[]> {
    const albumsData = await db
      .select()
      .from(tripAlbums)
      .leftJoin(trips, eq(tripAlbums.tripId, trips.id))
      .orderBy(desc(tripAlbums.createdAt));
    
    const result: (TripAlbum & { trip?: Trip; photos: (TripAlbumPhoto & { asset?: MediaAsset })[] })[] = [];
    
    for (const row of albumsData) {
      const photos = await db
        .select()
        .from(tripAlbumPhotos)
        .leftJoin(mediaAssets, eq(tripAlbumPhotos.mediaAssetId, mediaAssets.id))
        .where(eq(tripAlbumPhotos.albumId, row.trip_albums.id))
        .orderBy(asc(tripAlbumPhotos.displayOrder));
      
      result.push({
        ...row.trip_albums,
        trip: row.trips || undefined,
        photos: photos.map(p => ({
          ...p.trip_album_photos,
          asset: p.media_assets || undefined
        }))
      });
    }
    
    return result;
  }

  // Trip album photo operations
  async addPhotoToAlbum(photo: InsertTripAlbumPhoto): Promise<TripAlbumPhoto> {
    const [created] = await db.insert(tripAlbumPhotos).values([photo]).returning();
    return created;
  }

  async getAlbumPhotos(albumId: number): Promise<(TripAlbumPhoto & { mediaAsset: MediaAsset; variants: MediaAssetVariant[] })[]> {
    const photos = await db
      .select()
      .from(tripAlbumPhotos)
      .innerJoin(mediaAssets, eq(tripAlbumPhotos.mediaAssetId, mediaAssets.id))
      .where(eq(tripAlbumPhotos.albumId, albumId))
      .orderBy(asc(tripAlbumPhotos.displayOrder));
    
    const result: (TripAlbumPhoto & { mediaAsset: MediaAsset; variants: MediaAssetVariant[] })[] = [];
    for (const p of photos) {
      const variants = await this.getMediaAssetVariants(p.media_assets.id);
      result.push({
        ...p.trip_album_photos,
        mediaAsset: p.media_assets,
        variants
      });
    }
    return result;
  }

  async updateAlbumPhotoOrder(items: { id: number; displayOrder: number }[]): Promise<void> {
    for (const item of items) {
      await db.update(tripAlbumPhotos)
        .set({ displayOrder: item.displayOrder })
        .where(eq(tripAlbumPhotos.id, item.id));
    }
  }

  async removePhotoFromAlbum(id: number): Promise<void> {
    await db.delete(tripAlbumPhotos).where(eq(tripAlbumPhotos.id, id));
  }

  // Print offer operations
  async createPrintOffer(offer: InsertPhotoPrintOffer): Promise<PhotoPrintOffer> {
    const [created] = await db.insert(photoPrintOffers).values([offer]).returning();
    return created;
  }

  async getPrintOffersByPhoto(albumPhotoId: number): Promise<PhotoPrintOffer[]> {
    return await db
      .select()
      .from(photoPrintOffers)
      .where(eq(photoPrintOffers.albumPhotoId, albumPhotoId));
  }

  async getDefaultPrintOffers(): Promise<PhotoPrintOffer[]> {
    return await db
      .select()
      .from(photoPrintOffers)
      .where(eq(photoPrintOffers.isActive, true));
  }

  async updatePrintOffer(id: number, offer: Partial<InsertPhotoPrintOffer>): Promise<PhotoPrintOffer | undefined> {
    const [updated] = await db
      .update(photoPrintOffers)
      .set(offer)
      .where(eq(photoPrintOffers.id, id))
      .returning();
    return updated;
  }

  async deletePrintOffer(id: number): Promise<void> {
    await db.delete(photoPrintOffers).where(eq(photoPrintOffers.id, id));
  }
  
  // User profile operations
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values([profile]).returning();
    return created;
  }
  
  async getUserProfileByUserId(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }
  
  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(userProfiles.userId, userId))
      .returning();
    return updated;
  }
  
  // Trip favorites operations
  async addTripFavorite(favorite: InsertTripFavorite): Promise<TripFavorite> {
    const [created] = await db.insert(tripFavorites).values([favorite]).returning();
    return created;
  }
  
  async removeTripFavorite(userId: string, tripId: number): Promise<void> {
    await db.delete(tripFavorites).where(
      and(eq(tripFavorites.userId, userId), eq(tripFavorites.tripId, tripId))
    );
  }
  
  async getUserFavorites(userId: string): Promise<(TripFavorite & { trip: Trip })[]> {
    const results = await db
      .select()
      .from(tripFavorites)
      .innerJoin(trips, eq(tripFavorites.tripId, trips.id))
      .where(eq(tripFavorites.userId, userId))
      .orderBy(desc(tripFavorites.createdAt));
    
    return results.map(r => ({
      ...r.trip_favorites,
      trip: r.trips
    }));
  }
  
  async isTripFavorited(userId: string, tripId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(tripFavorites)
      .where(and(eq(tripFavorites.userId, userId), eq(tripFavorites.tripId, tripId)));
    return !!result;
  }
  
  async getTripFavoriteCount(tripId: number): Promise<number> {
    const results = await db
      .select()
      .from(tripFavorites)
      .where(eq(tripFavorites.tripId, tripId));
    return results.length;
  }
  
  // === NTG Trips Club: Proposals ===
  
  async getClubProposals(): Promise<Trip[]> {
    return db
      .select()
      .from(trips)
      .where(eq(trips.isPublished, true))
      .orderBy(desc(trips.createdAt));
  }
  
  async getProposalBySlug(slug: string): Promise<Trip | undefined> {
    const [trip] = await db
      .select()
      .from(trips)
      .where(eq(trips.slug, slug));
    return trip;
  }
  
  // === NTG Trips Club: Voting ===
  
  async addVote(userId: string, tripId: number): Promise<TripVote> {
    const [vote] = await db.insert(tripVotes).values([{ userId, tripId }]).returning();
    return vote;
  }
  
  async removeVote(userId: string, tripId: number): Promise<void> {
    await db.delete(tripVotes).where(
      and(eq(tripVotes.userId, userId), eq(tripVotes.tripId, tripId))
    );
  }
  
  async hasVoted(userId: string, tripId: number): Promise<boolean> {
    const [vote] = await db
      .select()
      .from(tripVotes)
      .where(and(eq(tripVotes.userId, userId), eq(tripVotes.tripId, tripId)));
    return !!vote;
  }
  
  async getVoteCount(tripId: number): Promise<number> {
    const results = await db
      .select()
      .from(tripVotes)
      .where(eq(tripVotes.tripId, tripId));
    return results.length;
  }
  
  // === NTG Trips Club: Interest with visibility ===
  
  async addInterest(data: { userId: string; tripId: number; publicVisibility?: string; note?: string }): Promise<TripFavorite> {
    const [interest] = await db.insert(tripFavorites).values([{
      userId: data.userId,
      tripId: data.tripId,
      interestLevel: "interested",
      publicVisibility: data.publicVisibility || "anonymous",
      note: data.note
    }]).returning();
    return interest;
  }
  
  async updateInterestVisibility(userId: string, tripId: number, publicVisibility: string): Promise<void> {
    await db
      .update(tripFavorites)
      .set({ publicVisibility })
      .where(and(eq(tripFavorites.userId, userId), eq(tripFavorites.tripId, tripId)));
  }
  
  async getInterestList(tripId: number): Promise<{ userId: string; publicVisibility: string | null; note: string | null; createdAt: Date }[]> {
    return db
      .select({
        userId: tripFavorites.userId,
        publicVisibility: tripFavorites.publicVisibility,
        note: tripFavorites.note,
        createdAt: tripFavorites.createdAt
      })
      .from(tripFavorites)
      .where(eq(tripFavorites.tripId, tripId))
      .orderBy(desc(tripFavorites.createdAt));
  }
  
  // === NTG Trips Club: Combined stats ===
  
  async getProposalStats(tripId: number): Promise<{ votes: number; interested: number }> {
    const [votes, interested] = await Promise.all([
      this.getVoteCount(tripId),
      this.getTripFavoriteCount(tripId)
    ]);
    return { votes, interested };
  }
  
  // === Admin: Pending Proposals ===
  
  async getPendingProposals(): Promise<Trip[]> {
    return db
      .select()
      .from(trips)
      .where(eq(trips.proposalStatus, "pending_review"))
      .orderBy(desc(trips.createdAt));
  }
  
  async updateProposalStatus(tripId: number, status: string): Promise<Trip | undefined> {
    const updateData: Record<string, any> = { 
      proposalStatus: status, 
      updatedAt: new Date(),
      statusChangedAt: new Date()
    };
    
    if (status === "voting") {
      updateData.isPublished = true;
      updateData.reviewedAt = new Date();
    }
    
    const [updated] = await db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, tripId))
      .returning();
    return updated;
  }
  
  // === Proposal Lifecycle ===
  
  async getProposalsByStatus(status: string): Promise<Trip[]> {
    return db
      .select()
      .from(trips)
      .where(eq(trips.proposalStatus, status))
      .orderBy(desc(trips.createdAt));
  }
  
  async approveProposal(tripId: number, adminNotes?: string): Promise<Trip | undefined> {
    const updateData: Record<string, any> = { 
      proposalStatus: PROPOSAL_STATUS.VOTING,
      isPublished: true,
      reviewedAt: new Date(),
      statusChangedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    
    const [updated] = await db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, tripId))
      .returning();
    return updated;
  }
  
  async scheduleProposal(tripId: number): Promise<Trip | undefined> {
    const trip = await this.getTripById(tripId);
    if (!trip) return undefined;
    
    const updateData: Record<string, any> = { 
      proposalStatus: PROPOSAL_STATUS.SCHEDULED,
      scheduledAt: new Date(),
      statusChangedAt: new Date(),
      updatedAt: new Date()
    };
    
    const [updated] = await db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, tripId))
      .returning();
    
    // If this is a member-created trip, pay the creator reward
    if (updated && updated.sourceType === "member" && updated.createdByUserId && !updated.rewardPaidAt) {
      const rewardAmount = updated.creatorRewardCents || 2000;
      await this.addCreatorReward(
        updated.createdByUserId,
        tripId,
        rewardAmount,
        `Recompensa por criar o roteiro "${updated.title}"`
      );
      
      // Mark reward as paid
      await db
        .update(trips)
        .set({ rewardPaidAt: new Date() })
        .where(eq(trips.id, tripId));
    }
    
    return updated;
  }
  
  async archiveProposal(tripId: number, reason?: string): Promise<Trip | undefined> {
    const updateData: Record<string, any> = { 
      proposalStatus: PROPOSAL_STATUS.ARCHIVED,
      isPublished: false,
      statusChangedAt: new Date(),
      updatedAt: new Date()
    };
    
    if (reason) {
      updateData.adminNotes = reason;
    }
    
    const [updated] = await db
      .update(trips)
      .set(updateData)
      .where(eq(trips.id, tripId))
      .returning();
    return updated;
  }
  
  async evaluateViability(tripId: number): Promise<{ isViable: boolean; votes: number; interested: number; required: number }> {
    const trip = await this.getTripById(tripId);
    if (!trip) {
      return { isViable: false, votes: 0, interested: 0, required: 10 };
    }
    
    const stats = await this.getProposalStats(tripId);
    const viabilityRule = trip.viabilityRule || { min_interested: 10, min_votes: 5 };
    const required = viabilityRule.min_interested || 10;
    
    // A proposal is viable if it has enough votes AND interested users
    const hasEnoughVotes = stats.votes >= (viabilityRule.min_votes || 5);
    const hasEnoughInterested = stats.interested >= required;
    const isViable = hasEnoughVotes && hasEnoughInterested;
    
    // Auto-update status if viable and currently in voting
    if (isViable && trip.proposalStatus === PROPOSAL_STATUS.VOTING) {
      await db
        .update(trips)
        .set({ 
          proposalStatus: PROPOSAL_STATUS.READY_TO_SCHEDULE,
          statusChangedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(trips.id, tripId));
    }
    
    return { isViable, votes: stats.votes, interested: stats.interested, required };
  }
  
  // === Creator Rewards ===
  
  async addCreatorReward(userId: string, tripId: number, amountCents: number, description: string): Promise<CreditTransaction> {
    // Create the transaction
    const [transaction] = await db.insert(creditTransactions).values([{
      userId,
      amountCents,
      type: "creator_reward",
      referenceType: "trip",
      referenceId: tripId,
      description
    }]).returning();
    
    // Update user's credit balance
    const profile = await this.getUserProfileByUserId(userId);
    if (profile) {
      await this.updateUserProfile(userId, {
        travelCreditCents: (profile.travelCreditCents || 0) + amountCents
      });
    }
    
    return transaction;
  }
  
  async getUserCredits(userId: string): Promise<number> {
    const profile = await this.getUserProfileByUserId(userId);
    return profile?.travelCreditCents || 0;
  }
  
  async getUserCreditHistory(userId: string): Promise<CreditTransaction[]> {
    return db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }
  
  async useCredits(userId: string, amountCents: number, bookingId: number, description: string): Promise<CreditTransaction> {
    // Create the transaction (negative amount)
    const [transaction] = await db.insert(creditTransactions).values([{
      userId,
      amountCents: -amountCents,
      type: "booking_used",
      referenceType: "booking",
      referenceId: bookingId,
      description
    }]).returning();
    
    // Update user's credit balance
    const profile = await this.getUserProfileByUserId(userId);
    if (profile) {
      await this.updateUserProfile(userId, {
        travelCreditCents: Math.max(0, (profile.travelCreditCents || 0) - amountCents)
      });
    }
    
    return transaction;
  }
  
  // === User Votes ===
  
  async getUserVotes(userId: string): Promise<(TripVote & { trip: Trip })[]> {
    const results = await db
      .select()
      .from(tripVotes)
      .innerJoin(trips, eq(tripVotes.tripId, trips.id))
      .where(eq(tripVotes.userId, userId))
      .orderBy(desc(tripVotes.createdAt));
    
    return results.map(r => ({
      ...r.trip_votes,
      trip: r.trips
    }));
  }
}

export const storage = new DatabaseStorage();
