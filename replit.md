# NonTourist Guide (NTG) - Coimbra Web Application

## Overview

This is a full-stack web application for NonTourist Guide (NTG), a company offering authentic tourism experiences in Coimbra, Portugal. The app serves as a digital concierge that qualifies visitors through an interactive wizard form, connects them with "Teresa" (an AI-powered local guide via WhatsApp), and showcases curated experiences and day trips.

The application is designed for QR code-based discovery, optimized for mobile-first usage with a dark premium aesthetic featuring gold accents.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS v4 with custom dark theme (black backgrounds, gold/yellow accents)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **State Management**: React Query for server state, useReducer for local form state
- **Animations**: Framer Motion for smooth page transitions and micro-interactions

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under `/api/*` prefix
- **Build Process**: Custom esbuild script that bundles server with selective dependency bundling for cold start optimization

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Storage Pattern**: Repository pattern via `server/storage.ts` with interface-based abstraction

### Key Data Models
- **Leads**: Visitor qualification data from wizard form (country, time, interests, segmentation)
- **Experiences**: Curated local experiences with pricing and categories
- **Trips**: Day-trip packages departing from Coimbra (also serves as Club proposals with proposalStatus field)
- **TripVotes**: User votes on Club proposals (1 vote per user per trip)
- **TripFavorites**: User interest tracking with publicVisibility option (anonymous/named)
- **UserProfiles**: Member profiles with tribe classification and membership tier/benefits
- **Conversations/Messages**: Chat history for AI interactions

### AI Integration
- **Provider**: Google Gemini via Replit AI Integrations (no external API key required)
- **Models Used**: 
  - gemini-2.5-flash for content generation
  - gemini-3-pro-image-preview (Nano Banana Pro) for high-quality trip cover images
  - gemini-2.5-flash-image (Nano Banana) for fast image generation
- **Features**: Content generation for experiences/trips, batch processing utilities, chat functionality, AI trip cover generation with NTG branding

### Application Flow
1. Landing page (`/` or `/coimbra`) with three main CTAs
2. Wizard form (`/coimbra/conhecer/form`) - 7-step Typeform-like qualification
3. Lead submission generates WhatsApp message for Teresa
4. Additional pages for experiences, trips, and digital content
5. Admin dashboard for lead analytics and content management

### NTG Trips Club Features
- **Proposals Feed** (`/trips-club/propostas`): Vote on upcoming trip proposals with visual status badges
- **Voting System**: Authenticated users can vote on proposals; vote count determines viability
- **Interest Tracking**: Users can manifest interest with visibility options (anonymous/named)
- **Member Area** (`/minha-conta`): Dashboard showing favorites, votes, credits balance, and proposal links
- **Credit System**: Members earn credits when their proposals become real trips (credit_transactions table)
- **Membership Tiers**: Support for member benefits (discountPercent, priorityWindowHours)
- **Tiered Access**: Non-members see teaser info only; members get full trip details, itineraries, and interaction features
- **Teresa Creator** (`/trips-club/criar`): Members can propose trip ideas; Teresa AI generates complete itineraries with Essencial/Completa tiers
- **AI Cover Images**: Admin can generate NTG-branded cover images using Nano Banana Pro with consistent visual identity

### Proposal Lifecycle
Proposals follow a structured lifecycle managed via the Admin dashboard:
1. **pending_review**: New proposal awaiting admin review
2. **voting**: Approved for public voting, appears in proposals feed
3. **scheduled**: Confirmed trip with scheduled date
4. **completed**: Trip happened successfully (triggers creator credit reward)
5. **archived**: Rejected or cancelled proposal

Admin can manage proposals via `/admin/trips` with approve/archive/schedule actions.

## External Dependencies

### Database
- PostgreSQL database (provisioned via Replit)
- Connection via `DATABASE_URL` environment variable

### AI Services
- Replit AI Integrations for Gemini access
- Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`

### Third-Party Integrations
- WhatsApp Business (planned integration for Teresa chatbot)
- No external payment processing currently implemented

### Key NPM Dependencies
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@google/genai`: Gemini AI client
- `@tanstack/react-query`: Server state management
- `framer-motion`: Animations
- `wouter`: Client-side routing
- Full shadcn/ui component suite with Radix primitives