# CampusSwap — P2P Student Exchange Platform
## Implementation & Verification Plan

### Architecture Overview
CampusSwap is a discovery-only peer-to-peer marketplace exclusively for verified college students. Sensitive contact info (phone, email, WhatsApp, UPI) is encrypted at rest and never exposed publicly. Buyers request contact via an authenticated, privacy-preserving workflow, and sellers grant consent per request.

```
+--------------------------------------------------------------------------+
|                             Frontend (Next.js)                           |
|  - Mobile-first responsive UI, Tailwind CSS, Lucide icons                |
|  - Landing, Marketplace, Detail, Request Flow, Dashboards, Wanted, Admin |
|  - Realtime WebSockets notification hook, Auth State (Supabase / Mock)   |
+------------------------------------+-------------------------------------+
                                     | REST / WebSockets
                                     v
+------------------------------------+-------------------------------------+
|                             Backend (FastAPI)                            |
|  - Domain verification (.edu, .ac.in, whitelist)                         |
|  - Privacy Guard: Contact Details AES-256-GCM / pgcrypto                 |
|  - Listings CRUD & Filtering + Meilisearch Index Sync                    |
|  - Consent Workflow (Contact Requests, Approval, Revocation)             |
|  - Realtime WebSocket Server (User channels)                             |
|  - Resend Email Service (Transactional alerts)                           |
|  - ML Pipeline: Categorization + Prohibited Content / Spam detection     |
|  - 30-Day Listing Expiry Service + Audit Logging                         |
+------------------------------------+-------------------------------------+
                                     | SQL / Supabase REST
                                     v
+------------------------------------+-------------------------------------+
|                      Supabase (PostgreSQL + RLS + Storage)               |
|  - Tables: users/profiles, allowed_domains, campuses, categories,        |
|            listings, listing_images, contact_details (encrypted),        |
|            contact_requests, wanted_posts, reports, audit_logs           |
|  - RLS Policies: strict privacy isolation, verified-only mutations       |
+--------------------------------------------------------------------------+
```

---

## Phase Checklist

- [x] **Phase 1: Repo Scaffolding, Docker-Compose & Environment Setup**
  - [x] Initialize directory layout: `/frontend`, `/backend`, `/supabase`, `.github`
  - [x] Configure `docker-compose.yml` (FastAPI backend, Meilisearch, Mock/Supabase services)
  - [x] Setup `.env.example` templates for root, backend, and frontend
  - [x] Create Python requirements and verify backend dependencies
  - [x] Initialize Next.js frontend with Tailwind CSS, Lucide Icons, TypeScript
  - [x] *Verification*: Verify directory layout, environment configs, and frontend/backend dependencies

- [x] **Phase 2: Database Schema, Row Level Security (RLS) & Seed Data**
  - [x] Create `001_initial_schema.sql` (campuses, categories, profiles, listings, listing_images, contact_details, contact_requests, wanted_posts, reports, audit_logs)
  - [x] Create `002_rls_policies.sql` (strict unverified blocking, contact_details isolation, role claims, banned user denial)
  - [x] Create `003_seed_data.sql` (allowed domains: `.edu`, `.ac.in`, `.edu.in`, categories, campuses, demo students & listings)
  - [x] Build Supabase/PostgreSQL client helper and fallback SQLite/in-memory adapter for rapid end-to-end testing
  - [x] *Verification*: Validate SQL migration syntax, schema definitions, and RLS constraint rules

- [x] **Phase 3: Auth & College-Domain Verification**
  - [x] FastAPI JWT token decoder and Supabase Auth validator
  - [x] Institutional domain verification dependency: whitelist checks against allowed domains
  - [x] Profile onboarding endpoint (display name, campus, hostel/building, batch year)
  - [x] Frontend Auth Provider (`useAuth`) with Google OAuth and demo/dev login switcher
  - [x] Institutional verification banner & `/onboarding` UI screen
  - [x] *Verification*: Unit test domain verification (accepts `@college.edu`, `@iit.ac.in`; rejects `@gmail.com`); test onboarding API

- [x] **Phase 4: Listings CRUD, Image Upload, Marketplace Browse & Search/Filters**
  - [x] Backend Listings endpoints (list, get, create, update, delete, status toggle)
  - [x] Strict Public Privacy Guard: ensure phone/email/UPI are NEVER present in listing response schemas
  - [x] Image upload endpoint with Supabase Storage integration & local/base64 fallback
  - [x] Meilisearch indexing service with automatic fallback search engine (regex/SQL fulltext)
  - [x] Frontend `/marketplace` browse grid with search bar, category filters, price slider, condition tags, micro-hub filters
  - [x] Frontend `/listing/[id]` detail view with photo gallery, seller badges, description, and safety alert
  - [x] Frontend `/listing/new` creation page with ML category suggestion and image uploader
  - [x] *Verification*: Verify listing creation, ensure zero contact leaks in API responses, verify filters and search

- [x] **Phase 5: Privacy-First Contact Flow, Encryption, WebSockets & Resend Emails**
  - [x] Contact details table with AES-256-GCM encryption & secure decryption
  - [x] Contact request workflow: Express Interest -> Pending -> Approve / Decline / Revoke
  - [x] Realtime WebSocket manager in FastAPI (channels per user) with auto-reconnection in Next.js hook
  - [x] Resend transactional email integration (with dry-run/preview fallback)
  - [x] Audit logging for every contact request creation, approval, and revocation
  - [x] Frontend `SellerConsentModal` and interactive buyer contact reveal card
  - [x] Rate-limiting per user per day for contact requests
  - [x] *Verification*: Test buyer cannot view contact until approved; test seller approval unlocks contact; test revocation; test audit logs

- [x] **Phase 6: Seller/Buyer Dashboards, Wanted Wishlist Board, Badges & Expiry**
  - [x] Frontend `/dashboard` with tabs:
    - *Seller*: Active / Pending / Sold listings, incoming contact requests (Approve / Reject), status toggle
    - *Buyer*: My Requests (Pending / Approved / Declined with contact view)
  - [x] Wanted / Wishlist Board (`/wanted`): Post wanted items (e.g., Arduino kit for CS101), browse campus requests
  - [x] Trust Badges: Verified Student, Batch year, Hostel resident, Quick Responder
  - [x] Campus Micro-Hub priority ranking in listings
  - [x] 30-day listing auto-expiry scheduled job with renewal endpoint
  - [x] *Verification*: Test dashboard state toggles, wanted post creation, badge calculations, and expiry job

- [x] **Phase 7: AI/ML Auto-Categorization & Spam/Prohibited Content Detection**
  - [x] Scikit-learn TF-IDF + LogisticRegression / MultinomialNB classifier for 5 core categories
  - [x] Content moderation / Spam & Prohibited Item detector (scams, weapons, off-platform payment solicitation, pirated keys)
  - [x] Dataset generator with synthetic campus listings & prohibited samples
  - [x] Training script and serializable model pipeline with fallback rules
  - [x] Integration into listing creation: auto-suggest category, flag high-risk listings to `flagged` status
  - [x] *Verification*: Run test predictions on clean vs spam/prohibited descriptions; verify flagged listings hold from public browse

- [x] **Phase 8: Admin Moderation Panel (RBAC)**
  - [x] Role-Based Access Control (Admin role enforcement)
  - [x] Admin router in FastAPI:
    - Flagged / Reported listings queue (Approve / Delete)
    - Allowed domains management (Add / Remove institutional domains)
    - User management (Ban / Unban)
    - Audit logs viewer
  - [x] Frontend `/admin` portal with security stats, moderation queue, domain editor, and user ban toggle
  - [x] *Verification*: Test admin access checks; ban a user and ensure all actions are blocked; approve flagged listing

- [x] **Phase 9: Comprehensive Tests, CI/CD, Deployment Configs & Documentation**
  - [x] Pytest test suite: domain verification, privacy isolation, encryption, contact workflow, ML scoring
  - [x] GitHub Actions CI workflow (`.github/workflows/ci.yml`) for linting, tests, and build check
  - [x] Dockerfiles for backend and frontend production builds
  - [x] Security checklist and encryption key rotation documentation
  - [x] Full `README.md` with architecture diagrams, API contract table, and quickstart commands
  - [x] Final end-to-end smoke verification

- [x] **Phase 10: Frontend UI/UX Enhancement & Interactive Polish**
  - [x] Floating Interactive Toast Notification Context (`Toast.tsx`, `useToast` with `showSuccess`, `showError`, `showInfo`, `showWarning`)
  - [x] Quick Persona Switcher in Navbar with real-time toast feedback and institutional domain indicators
  - [x] Homepage Hero enhancements: live interactive search bar with trending campus tags, stats ticker (4,800+ Students, 0% Fees, AES-256 Privacy), 3-step interactive timeline, and category link cards
  - [x] Marketplace enhancements: quick shortcut chips (Free Giveaways, Under $20, Tech, Textbooks), client-side multi-sort, active filter dismissible tags bar, skeleton loading states
  - [x] ItemCard enhancements: zoom hover effect, price badge gradient animation, view count pill, campus location icon, smooth shadow micro-interactions
  - [x] Listing Detail page enhancements: Share Listing clipboard copy toast, Copy Contact button with toast, Safe Campus Meetup Protocol checklist, related campus items grid
  - [x] New Listing page enhancements: safe campus meeting spots preset chips, real-time safety validation shield, character count limits, toast notifications
  - [x] Dashboard enhancements: status filtering tabs (All, Active, Sold, Expired), safe offline meetup guidelines in unlocked contacts, copy contact toast
  - [x] Wishlist / Wanted board enhancements: live search, category filter chips, 'I Have This Item' CTA, toast notifications
  - [x] Clean TypeScript verification (`npx tsc --noEmit` exited 0) and 13 backend pytest tests passing
  - [x] Pushed to GitHub repository `https://github.com/raghavichoudhari8/CampusExchange.git`

