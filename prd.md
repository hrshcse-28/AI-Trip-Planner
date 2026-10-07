# AI Trip Planner — Product Requirements Document (PRD)

> **Version:** 1.0 &nbsp;|&nbsp; **Date:** 2026-10-04 &nbsp;|&nbsp; **Status:** Draft — awaiting approval

---

## 1. Product Overview

**AI Trip Planner** is a full-stack web application that lets users describe a trip (destination, dates, budget, interests) and receive an AI-generated, day-by-day itinerary. Users can save, edit, and manage multiple trips from a personal dashboard.

### 1.1 Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Frontend | React 19, Vite 8, TypeScript, TailwindCSS 3, Leaflet, Recharts, Radix UI | ✅ Complete |
| Backend API | Node.js, Express 4, TypeScript, Prisma 7, PostgreSQL | ✅ Complete |
| AI Service | Python, FastAPI, Pydantic, Google Gemini LLM | ✅ Complete |
| Database | PostgreSQL (via Prisma Postgres local & pg adapter) | ✅ Complete |
| Infra | Docker Compose & dev daemons | ✅ Complete |

---

## 2. Current State Audit

### 2.1 What's Done (Phase 0 — Scaffolding)

| Area | Details |
|---|---|
| **Frontend routing** | 8 routes wired: `/`, `/login`, `/register`, `/dashboard`, `/create-trip`, `/my-trips`, `/trip/:id`, `/profile` |
| **UI components** | `Navbar`, `Footer`, `TripCard`, `DestinationCard`, `ActivityCard`, plus shadcn/ui primitives (`Button`, `Card`, `Input`, `Label`, `Dialog`) |
| **Page shells** | All 8 pages render with hardcoded mock data — no API calls, no auth guards |
| **Backend** | Single Express server with `/api/health` endpoint; Prisma installed but **schema is empty** |
| **AI Service** | Single FastAPI server with `/health` endpoint; **no LLM integration** |
| **Docker Compose** | Three-service orchestration defined (backend:3000, ai-service:8000, frontend:5173) |

### 2.2 Key Gaps

- ❌ No database schema / models
- ❌ No authentication (JWT / sessions)
- ❌ No real API endpoints (CRUD)
- ❌ No LLM integration in ai-service
- ❌ No frontend state management or API calls
- ❌ No route protection (auth guards)
- ❌ No form validation wired to backend
- ❌ No error handling / loading states (beyond a mock spinner)

---

## 3. Remaining Phases

### Phase 1 — Database Schema & Prisma Models
### Phase 2 — Authentication (Register / Login / JWT)
### Phase 3 — Backend CRUD APIs (Trips & Itineraries)
### Phase 4 — AI Service LLM Integration
### Phase 5 — Frontend Integration (State, API Calls, Auth Guards)
### Phase 6 — Polish, Error Handling & UX Enhancements

---

## 4. Phase 1 — Database Schema & Prisma Models

### 4.1 Data Model

```mermaid
erDiagram
    USER ||--o{ TRIP : creates
    TRIP ||--o{ DAY : contains
    DAY ||--o{ ACTIVITY : has

    USER {
        string id PK
        string email UK
        string name
        string passwordHash
        string bio
        string avatarUrl
        datetime createdAt
        datetime updatedAt
    }

    TRIP {
        string id PK
        string userId FK
        string title
        string destination
        string budgetLevel
        string interests
        int durationDays
        date startDate
        date endDate
        string coverImageUrl
        string status
        datetime createdAt
        datetime updatedAt
    }

    DAY {
        string id PK
        string tripId FK
        int dayNumber
        date date
        string summary
    }

    ACTIVITY {
        string id PK
        string dayId FK
        int sortOrder
        string time
        string title
        string description
        string location
        float latitude
        float longitude
        string category
        boolean isCompleted
    }
```

### 4.2 Prisma Schema Definition

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  passwordHash String
  bio          String?
  avatarUrl    String?
  trips        Trip[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Trip {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title         String
  destination   String
  budgetLevel   String   @default("moderate")
  interests     String?
  durationDays  Int
  startDate     DateTime?
  endDate       DateTime?
  coverImageUrl String?
  status        String   @default("draft")  // draft | generated | archived
  days          Day[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Day {
  id         String     @id @default(cuid())
  tripId     String
  trip       Trip       @relation(fields: [tripId], references: [id], onDelete: Cascade)
  dayNumber  Int
  date       DateTime?
  summary    String?
  activities Activity[]
}

model Activity {
  id          String   @id @default(cuid())
  dayId       String
  day         Day      @relation(fields: [dayId], references: [id], onDelete: Cascade)
  sortOrder   Int      @default(0)
  time        String
  title       String
  description String
  location    String
  latitude    Float?
  longitude   Float?
  category    String?  // food | sightseeing | transport | shopping | nature
  isCompleted Boolean  @default(false)
}
```

### 4.3 Deliverables

- [x] Update [schema.prisma](file:///c:/Users/kasau/AI%20Trip%20Planner/backend/prisma/schema.prisma) with the above models
- [x] Run `npx prisma migrate dev --name init` to create initial migration
- [x] Run `npx prisma generate` to generate Prisma Client

---

## 5. Phase 2 — Authentication

### 5.1 Strategy

| Aspect | Choice |
|---|---|
| Method | Email + password with **bcrypt** hashing |
| Token | **JWT** (access token: 1h, refresh token: 7d) |
| Storage | Access token in memory / context; refresh token in httpOnly cookie |
| Middleware | Express middleware that verifies JWT and attaches `req.user` |

### 5.2 Backend API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Create user account |
| `POST` | `/api/auth/login` | ❌ | Authenticate, return tokens |
| `POST` | `/api/auth/refresh` | 🍪 Cookie | Refresh access token |
| `POST` | `/api/auth/logout` | ✅ | Invalidate refresh token |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |

### 5.3 Request / Response Contracts

**POST `/api/auth/register`**
```json
// Request
{ "name": "John Doe", "email": "john@example.com", "password": "securePass123" }

// Response 201
{ "user": { "id": "clx...", "name": "John Doe", "email": "john@example.com" }, "accessToken": "eyJ..." }
```

**POST `/api/auth/login`**
```json
// Request
{ "email": "john@example.com", "password": "securePass123" }

// Response 200
{ "user": { "id": "clx...", "name": "John Doe", "email": "john@example.com" }, "accessToken": "eyJ..." }
```

### 5.4 Deliverables

- [x] Install `bcryptjs`, `jsonwebtoken`, `@types/bcryptjs`, `@types/jsonwebtoken`
- [x] Create `src/middleware/auth.ts` — JWT verification middleware
- [x] Create `src/routes/auth.ts` — register, login, refresh, logout, me
- [x] Create `src/lib/prisma.ts` — shared Prisma client instance with `@prisma/adapter-pg`
- [x] Add `JWT_SECRET` and `JWT_REFRESH_SECRET` to `.env`
- [x] Wire routes into [index.ts](file:///c:/Users/kasau/AI%20Trip%20Planner/backend/src/index.ts)

---

## 6. Phase 3 — Backend CRUD APIs

### 6.1 Trip Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/trips` | ✅ | Create a new trip (draft) |
| `GET` | `/api/trips` | ✅ | List all trips for current user |
| `GET` | `/api/trips/:id` | ✅ | Get trip with days & activities |
| `PUT` | `/api/trips/:id` | ✅ | Update trip metadata |
| `DELETE` | `/api/trips/:id` | ✅ | Delete a trip (cascade) |

### 6.2 Itinerary Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/trips/:id/generate` | ✅ | Send trip params to AI service, save result |
| `POST` | `/api/trips/:tripId/days/:dayId/activities` | ✅ | Add custom activity |
| `DELETE` | `/api/trips/:tripId/activities/:activityId` | ✅ | Remove activity |
| `PATCH` | `/api/trips/:tripId/activities/:activityId/complete` | ✅ | Toggle activity completion |

### 6.3 User Profile Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `PUT` | `/api/users/me` | ✅ | Update name, bio, avatar |

### 6.4 Deliverables

- [x] Create `src/routes/trips.ts` — all trip CRUD + generate proxy
- [x] Create `src/routes/users.ts` — profile update
- [x] Create `src/services/aiService.ts` — HTTP client to call the Python AI service
- [x] Add input validation with `zod`

---

## 7. Phase 4 — AI Service (LLM Integration)

### 7.1 Architecture

```
Frontend → Backend (POST /api/trips/:id/generate)
                ↓
         Backend calls AI Service (POST /generate-itinerary)
                ↓
         AI Service → Google Gemini API (or OpenAI)
                ↓
         Structured JSON itinerary returned
                ↓
         Backend saves Days + Activities to DB
                ↓
         Response returned to Frontend
```

### 7.2 AI Service Endpoint

**POST `/generate-itinerary`**

```json
// Request
{
  "destination": "Rome, Italy",
  "duration_days": 5,
  "budget_level": "moderate",
  "interests": "history, food, art",
  "travelers": 2
}

// Response 200
{
  "title": "5 Days in Rome",
  "cover_image_query": "Rome Colosseum sunset",
  "days": [
    {
      "day_number": 1,
      "summary": "Exploring Ancient Rome",
      "activities": [
        {
          "sort_order": 1,
          "time": "09:00 AM",
          "title": "Colosseum Guided Tour",
          "description": "...",
          "location": "Piazza del Colosseo, 1",
          "latitude": 41.8902,
          "longitude": 12.4922,
          "category": "sightseeing"
        }
      ]
    }
  ]
}
```

### 7.3 Prompt Engineering

The AI service will use structured output / function calling to guarantee JSON conformance. The system prompt will:
1. Act as a professional travel planner
2. Generate realistic, location-accurate activities with real addresses
3. Include a mix of categories (food, sightseeing, nature, shopping, culture)
4. Respect the budget level (cheaper restaurants for "budget", Michelin-star for "luxury")
5. Include latitude/longitude for map pins
6. Return valid JSON matching the Pydantic response model

### 7.4 Deliverables

- [x] Install `google-generativeai` + `python-dotenv` in ai-service
- [x] Create `schemas.py` — Pydantic request/response models
- [x] Create `llm_service.py` — LLM client with structured output & curated fallback generator
- [x] Create `main.py` — `/generate-itinerary` endpoint with CORS & validation
- [x] Add error handling for rate limits, timeouts, malformed responses

---

## 8. Phase 5 — Frontend Integration

### 8.1 State Management

| Concern | Solution |
|---|---|
| Auth state | React Context (`AuthContext`) with `user`, `accessToken`, `login()`, `logout()`, `register()`, `refreshUser()` |
| API layer | Centralized `src/lib/api.ts` using `fetch` with auth header injection |
| Trip data | Fetched per-page with live mutation & optimistic updates |

### 8.2 Auth Integration

| File | Changes |
|---|---|
| [Login.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/pages/Login.tsx) | Wire form to `POST /api/auth/login`, store token in context, redirect |
| [Register.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/pages/Register.tsx) | Wire form to `POST /api/auth/register`, store token, redirect |
| [Navbar.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/components/Navbar.tsx) | Conditionally show Sign In/Up vs. user avatar + Sign Out based on auth state |
| [Profile.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/pages/Profile.tsx) | Load user from `GET /api/auth/me`, save with `PUT /api/users/me` |
| [App.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/App.tsx) | Wrap with `AuthProvider`, add `ProtectedRoute` wrapper for `/dashboard`, `/create-trip`, `/my-trips`, `/trip/:id`, `/profile` |

### 8.3 Trip Flow Integration

| File | Changes |
|---|---|
| [CreateTrip.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/pages/CreateTrip.tsx) | `POST /api/trips` to create draft, then `POST /api/trips/:id/generate` to generate itinerary. Show real loading state with streaming feedback |
| [Dashboard.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/pages/Dashboard.tsx) | Fetch user's trips from `GET /api/trips`, stats overview |
| [MyTrips.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/pages/MyTrips.tsx) | Fetch from `GET /api/trips`, delete functionality with confirmation |
| [TripDetails.tsx](file:///c:/Users/kasau/AI%20Trip%20Planner/frontend/src/pages/TripDetails.tsx) | Fetch from `GET /api/trips/:id`, render real days/activities, completion toggling, custom activity addition, map, budget chart, and calendar export |

### 8.4 Deliverables

- [x] Create `AuthContext` + `AuthProvider`
- [x] Create `api.ts` helper
- [x] Create `ProtectedRoute` component
- [x] Define TypeScript types matching Prisma models
- [x] Rewire all pages to use real APIs
- [x] Add proper loading skeletons and error banners

---

## 9. Phase 6 — Polish & Advanced Features

### 9.1 Deliverables

- [x] Add toast notification system (`ToastContext`)
- [x] Add skeleton loaders
- [x] Integrate interactive Leaflet map into TripDetails with numbered pins and route polylines
- [x] View modes: Timeline, Split View, Interactive Map, Budget & Expenses, Packing & Climate
- [x] Recharts budget breakdown chart with daily targets
- [x] Packing checklist with destination climate forecast and local persistence
- [x] Add custom activity modal dialog (`AddActivityDialog`)
- [x] Export to iCalendar (.ics) for Apple/Google Calendar
- [x] Mobile responsiveness and accessibility pass

---

## 10. Implementation Order & Effort Estimates

| # | Phase | Effort | Dependencies |
|---|---|---|---|
| 1 | Database Schema & Migrations | ~30 min | None |
| 2 | Authentication APIs | ~1.5 hrs | Phase 1 |
| 3 | Backend CRUD APIs | ~2 hrs | Phase 1, 2 |
| 4 | AI Service LLM Integration | ~1.5 hrs | None (parallel) |
| 5 | Frontend Integration | ~3 hrs | Phase 2, 3, 4 |
| 6 | Polish & UX | ~2 hrs | Phase 5 |

> **Total estimated effort: ~10.5 hours**

```mermaid
gantt
    title Implementation Roadmap
    dateFormat  HH:mm
    axisFormat  %H:%M

    section Backend
    Phase 1 - DB Schema         :p1, 00:00, 30m
    Phase 2 - Auth APIs         :p2, after p1, 90m
    Phase 3 - CRUD APIs         :p3, after p2, 120m

    section AI Service
    Phase 4 - LLM Integration   :p4, 00:00, 90m

    section Frontend
    Phase 5 - Integration       :p5, after p3, 180m
    Phase 6 - Polish            :p6, after p5, 120m
```

---

## 11. Environment Variables (Complete)

### Backend (`backend/.env`)
```env
DATABASE_URL="prisma+postgres://..."
PORT=3000
JWT_SECRET="your-jwt-secret-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"
AI_SERVICE_URL="http://localhost:8000"
```

### AI Service (`ai-service/.env`)
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=8000
HOST=0.0.0.0
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
```

---

## 12. Advanced Phases (Completed)

| Phase | Title | Deliverables | Status |
|---|---|---|---|
| **Phase 7** | Real-time AI Concierge Copilot | Context-aware chat with trip destination context, quick suggestion chips, slide-out drawer (`TripAiConcierge.tsx`, `/api/trips/:id/chat`, `/chat`) | ✅ Complete |
| **Phase 8** | Public Sharing & Forking | Public trip route (`/share/:id`, `GET /api/trips/public/:id`), one-click trip cloning (`POST /api/trips/:id/fork`), iCalendar `.ics` export | ✅ Complete |
| **Phase 9** | Real-time Budget Analytics | Recharts donut chart, 10-currency real-time converter, live Trip Expense Logger with persistent local storage | ✅ Complete |
| **Phase 10** | Print-Ready Offline Travel Dossier | `@media print` paper-optimized layout, emergency numbers directory, daily checklist, handwritten notes template (`TripOfflineDossier.tsx`) | ✅ Complete |
| **Phase 11** | Real-Time Weather Radar | Open-Meteo satellite integration, 7-day forecast cards, °C/°F toggle, UV index ratings, dynamic activity advisories (`TripWeatherForecast.tsx`, `/api/trips/:id/weather`) | ✅ Complete |
| **Phase 12** | Flights, Stays & Logistics Hub | `Booking` Prisma model, flight & hotel manager, PNR confirmation code 1-click copy, cost summary (`TripLogisticsHub.tsx`, `/api/trips/:tripId/bookings`) | ✅ Complete |
| **Phase 13** | Multi-Traveler Companions Hub | `Collaborator` Prisma model, co-traveler invite system (editor/viewer roles), group party cost splitting calculator (`TripCollaboratorsHub.tsx`, `/api/trips/:tripId/collaborators`) | ✅ Complete |
| **Phase 14** | Interactive Activity Reordering | Dynamic Move Up & Move Down schedule shifting, database transaction order persistence (`/api/trips/:tripId/activities/reorder`, `ActivityCard.tsx`) | ✅ Complete |
| **Phase 15** | AI Destination Culture Guide | Destination customs, Dos & Don'ts etiquette, local phrasebook with audio pronunciation & copy, scam alerts, dining customs (`TripCultureGuide.tsx`, `/api/trips/:id/culture`) | ✅ Complete |
| **Phase 16** | Travel Memoir & Photo Journal | `JournalEntry` Prisma model, photo preview logbook, 1-5 star ratings, day filtering, note authoring modal (`TripJournalHub.tsx`, `/api/trips/:tripId/journal`) | ✅ Complete |
| **Phase 17** | AI Day Schedule Optimizer | Re-balances day activity start times with realistic travel buffers from 09:00 AM onwards (`/api/trips/:tripId/days/:dayId/optimize`) | ✅ Complete |
| **Phase 18** | Carbon Footprint & Eco-Pact | Flight emissions, hotel footprint, transit mode comparisons, destination green tips, carbon neutral tree offset pledge (`TripEcoEstimator.tsx`) | ✅ Complete |
| **Phase 19** | AI Landmark Audio Tour Guide | Web Speech Synthesis TTS player, animated audio waveform, speed controls, destination trivia facts, full transcripts (`TripAudioGuide.tsx`, `/api/trips/:id/audio-guide`) | ✅ Complete |
| **Phase 20** | Chrono-Jetlag & Timezone Clock | Live dual-clocks (Origin vs Destination), day/night indicators, 3-phase chronotherapy circadian adjustment plan (`TripJetlagOptimizer.tsx`) | ✅ Complete |
| **Phase 21** | Trip Metadata & Cover Photo Customizer | Edit Trip modal, custom cover image URL with scenic presets, budget & date modifications (`EditTripDialog.tsx`, `PUT /api/trips/:id`) | ✅ Complete |
| **Phase 22** | Airline Baggage Weight Optimizer | Carry-on (7kg) & Checked (23kg) limits, live weight progress gauge, overweight fee warnings, category weight distribution (`TripLuggageOptimizer.tsx`) | ✅ Complete |

---

## 13. Success Criteria

- [x] A new user can register, log in, and see their empty dashboard
- [x] A logged-in user can fill in trip details and receive an AI-generated multi-day itinerary
- [x] The itinerary is persisted and visible on Dashboard and My Trips
- [x] Users can view trip details with a day-by-day activity timeline
- [x] Users can mark activities as completed
- [x] Users can update their profile information
- [x] Protected routes redirect unauthenticated users to login
- [x] The app handles errors gracefully with user-friendly messages
- [x] Interactive Leaflet maps show numbered pins and route lines
- [x] Real-time AI Concierge provides in-depth travel guidance
- [x] Public read-only trip URLs can be shared and cloned with one click
- [x] Live multi-day satellite weather with dynamic travel advisories
- [x] Flights, accommodations, and reservations hub with confirmation code copying
- [x] Printable offline travel dossier with local emergency contacts
- [x] Multi-traveler companion invitations with party cost splitting
- [x] Interactive activity schedule reordering
- [x] Local cultural customs, etiquette, phrasebook, and scam prevention guide
- [x] Travel memoir journal entries with photo attachments and ratings
- [x] 1-click AI schedule re-balancer and time optimizer
- [x] Carbon footprint eco-score and offset pledges
- [x] Voice narration audio tour guide with animated waveforms and speed controls
- [x] Live dual-clock timezone synchronizer and circadian jetlag recovery planner
- [x] Modal trip metadata editor with custom scenic cover image photo picker
- [x] Airline baggage weight calculator with overweight fee protection
- [x] "Surprise Me!" destination inspiration engine and quick-pick destination chips

---

## 14. Project Completion Forecast & Delivery Schedule

### 14.1 Status Summary: 100% Complete & Zero Gaps Remaining

As of **October 4, 2026**, **all 22 development phases are 100% implemented, tested, and operational locally**:
- Frontend build passes with **0 TypeScript and 0 bundler errors** (`npm run build` exiting code 0).
- Backend TypeScript APIs are connected and live on port 3000.
- AI Service is running on port 8000 with Google Gemini LLM integration + fallback.
- PostgreSQL database contains all models (`User`, `Trip`, `Day`, `Activity`, `Booking`, `Collaborator`, `JournalEntry`).

### 14.2 Release Timeline to Production 1.0

```mermaid
gantt
    title AI Trip Planner — Production Launch Roadmap
    dateFormat  YYYY-MM-DD
    section Core & Advanced Features
    Phases 1-6 (Core Platform)         :done, p1, 2026-10-01, 2026-10-04
    Phases 7-15 (Interactive Hubs)      :done, p2, 2026-10-04, 2026-10-04
    Phases 16-22 (Memoir, Audio, Luggage):done, p3, 2026-10-04, 2026-10-04
    section Cloud Deployment & Launch
    Cloud DB Migration (Supabase/Neon) :active, d1, 2026-10-05, 1d
    Docker/Vercel/Render Deployment    :d2, after d1, 1d
    Domain SSL, CDN & Production 1.0   :d3, after d2, 1d
```

| Milestone | Target Date | Scope / Deliverables | Status |
|---|---|---|---|
| **v0.9 Beta (Local Feature-Complete)** | **October 4, 2026 (Today)** | All 22 feature phases fully functional: Auth, AI generation, maps, budget, weather, logistics, concierge, culture, journal, reordering, day optimizer, eco-tracker, audio tour guide, jetlag clock, trip editor, luggage optimizer, and surprise destination engine | **100% Completed** |
| **Cloud Database Migration** | **October 5, 2026** | Migrate local PostgreSQL to managed cloud instance (e.g. Supabase, Neon, or Railway PostgreSQL) | Ready for deployment |
| **Cloud Hosting & Containers** | **October 6, 2026** | Deploy backend & AI service (Docker/Render/Fly.io) + frontend (Vercel/Netlify) | 1 day estimated |
| **v1.0 Production General Availability (GA)** | **October 7, 2026** | Custom domain configuration, SSL certificate, CDN edge caching, and end-user launch | Ready on schedule |



