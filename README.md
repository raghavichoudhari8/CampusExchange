# CampusSwap — P2P Student Exchange Platform

A privacy-first peer-to-peer campus marketplace designed exclusively for verified college students to sell, give away, or share unused items and digital subscriptions.

**DISCOVERY LAYER ONLY**: No payment gateways, no transaction fees, and zero payment middleman. Handoffs happen offline and in-person between students in well-lit campus hubs. Sensitive personal information (phone numbers, personal emails, UPI IDs) is **never publicly exposed** and is encrypted with AES-256-GCM.

---

## 🏛️ System Architecture

```
+--------------------------------------------------------------------------+
|                        Frontend: Next.js (App Router)                    |
|  - Mobile-first responsive UI, Tailwind CSS, Lucide icons                |
|  - Real-time WebSocket hook (auto-reconnect, per-user channels)          |
|  - Public Browse (/marketplace), Wanted Board (/wanted), Post Item       |
|  - SellerConsentModal for real-time buyer interest alerts                |
|  - Seller/Buyer Dashboards (/dashboard) & Admin RBAC Portal (/admin)     |
+------------------------------------+-------------------------------------+
                                     | REST API / WebSockets
                                     v
+------------------------------------+-------------------------------------+
|                        Backend: Python + FastAPI                         |
|  - Domain verification (.edu, .ac.in, whitelist matching)                |
|  - Privacy Guard: Contact Details AES-256-GCM encryption & decryption    |
|  - Public Listings CRUD & Meilisearch Index Sync (public fields only)     |
|  - Privacy-First Consent Workflow (Request -> Pending -> Approve/Revoke) |
|  - Realtime WebSockets Manager (user-isolated notification channels)    |
|  - Transactional Emails via Resend (with local dry-run preview fallback) |
|  - AI/ML Pipeline: Scikit-learn category prediction & scam moderation    |
|  - 30-Day Listing Auto-Expiry Job & Audit Logging                        |
+------------------------------------+-------------------------------------+
                                     | PostgreSQL / Supabase REST
                                     v
+------------------------------------+-------------------------------------+
|                  Database & Storage: Supabase (PostgreSQL)               |
|  - Tables: profiles, allowed_domains, campuses, categories, listings,    |
|            listing_images, contact_details (encrypted), contact_requests,|
|            wanted_posts, reports, audit_logs                             |
|  - Row Level Security (RLS) enforcing strict privacy isolation           |
+--------------------------------------------------------------------------+
```

---

## 🛠️ Tech Stack

| Component | Technology | Rationale |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), React, TypeScript | SSR, modern server components, performant mobile-first UI |
| **Styling & Icons** | Tailwind CSS, Lucide Icons | Clean campus design system, accessible UI icons |
| **Backend API** | Python, FastAPI, Uvicorn, Pydantic v2 | High-performance asynchronous REST & native WebSockets |
| **Database & Auth** | Supabase (PostgreSQL + RLS, Supabase Auth) | Enterprise-grade SQL, strict RLS privacy policies, Google OAuth |
| **Encryption** | AES-256-GCM (Python `cryptography`) | Authenticated encryption at rest for sensitive contact fields |
| **AI / Machine Learning** | Scikit-learn (TF-IDF + MultinomialNB) | Category prediction and prohibited items/scam moderation |
| **Fulltext Search** | Meilisearch (v1.9) with smart fallback | Fast typo-tolerant full-text search without contact leakage |
| **Transactional Email** | Resend API | Clean developer email API with local dry-run console fallback |
| **Realtime** | FastAPI WebSockets | Per-user event channels for seller consent alerts & approvals |

---

## 🔒 Privacy-First Contact Flow

```
+---------------+                +---------------+                +---------------+
| Verified Buyer|                |    FastAPI    |                |Verified Seller|
+-------+-------+                +-------+-------+                +-------+-------+
        |                                |                                |
        | Express Interest (Short Note)  |                                |
        |------------------------------->|                                |
        |                                | Store pending contact_request  |
        |                                | Push WebSocket event           |
        |                                | Dispatch Resend Email          |
        |                                |------------------------------->|
        |                                |                                |
        |                                |   Seller Consent Modal Pops Up |
        |                                |   Reviews Buyer's Trust Badges |
        |                                |                                |
        |                                |  Seller Accepts Request        |
        |                                |<-------------------------------|
        |                                |                                |
        |                                | Decrypts Contact Server-Side   |
        | WebSocket Event & Email        | Writes to Audit Log            |
        |<-------------------------------|                                |
        |                                |                                |
        | Unlocks Phone/WhatsApp/Email   |                                |
        | Arranges Public Campus Meetup  |                                |
```

1. **Public Listing Data ONLY**: title, category, condition, price (or "Free"), general meeting area (e.g. "Library Lobby"), seller display name, seller badges, photos.
2. **NEVER Public**: Phone numbers, personal emails, WhatsApp links, UPI IDs.
3. **Consent-Gated Reveal**: Plaintext contact details are returned **only** to the approved buyer via authenticated endpoints, and can be revoked by the seller at any time.

---

## 📋 API Contract Table

| Method | Endpoint | Auth Required | Privacy / Scope | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/check-domain` | Public | Public | Verifies if an email domain is on institutional whitelist |
| `POST` | `/api/v1/auth/login-demo` | Public | Public | Quick 1-click persona login (Verified Student, Guest, Admin) |
| `GET` | `/api/v1/auth/me` | User | Authenticated | Returns current student profile and trust badges |
| `POST` | `/api/v1/auth/onboarding` | User | Authenticated | Updates display name, campus micro-hub, hostel, batch year |
| `GET` | `/api/v1/auth/campuses` | Public | Public | List of campuses and micro-hubs |
| `GET` | `/api/v1/listings` | Optional | Public (Zero Contact) | Browse listings with category, price, condition, search filters |
| `GET` | `/api/v1/listings/{id}` | Optional | Private conditional | Detailed view. Reveals contact **only** if seller or approved buyer |
| `POST` | `/api/v1/listings` | Verified Student | AES-256-GCM Encrypted | Creates listing. Encrypts contact info into separate table |
| `PATCH`| `/api/v1/listings/{id}/status`| Owner / Admin | Owner | Toggles status (`active`, `reserved`, `sold`) |
| `POST` | `/api/v1/listings/{id}/renew` | Owner / Admin | Owner | Extends listing expiry by 30 days |
| `POST` | `/api/v1/contacts/request` | Verified Student | Private | Creates pending contact request, pushes WebSocket & email |
| `GET` | `/api/v1/contacts/my-requests`| Verified Student | Buyer Only | Returns buyer's requests with unlocked contact info if approved |
| `GET` | `/api/v1/contacts/seller-requests` | Verified Student | Seller Only | Returns incoming requests queue for seller's items |
| `POST` | `/api/v1/contacts/request/{id}/respond` | Seller / Admin | Owner / Admin | Accepts (`approve`), declines (`decline`), or revokes access |
| `GET` | `/api/v1/wanted` | Public | Public | Browse wanted posts on campus wishlist board |
| `POST` | `/api/v1/wanted` | Verified Student | Authenticated | Creates a new wanted request post |
| `POST` | `/api/v1/ml/categorize` | Public | Public | Returns AI category suggestion and confidence |
| `POST` | `/api/v1/ml/check-spam` | Public | Public | Evaluates prohibited content score (weapons, drugs, scams) |
| `GET` | `/api/v1/admin/stats` | Admin | Admin RBAC | Platform security and activity metrics |
| `GET` | `/api/v1/admin/flagged-listings` | Admin | Admin RBAC | Moderation queue for ML-flagged items |
| `POST` | `/api/v1/admin/listings/{id}/moderate` | Admin | Admin RBAC | Approves or deletes flagged listing |
| `POST` | `/api/v1/admin/users/{id}/ban` | Admin | Admin RBAC | Bans or unbans a user account across all services |
| `WS` | `/api/v1/ws?token=...` | User Token | Authenticated | Real-time WebSocket connection for live request notifications |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose for containerized stack

### 1. Clone & Setup Environment
```bash
git clone <repo-url>
cd CEP

# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Run Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000`
Interactive Swagger Docs at `http://localhost:8000/docs`

### 3. Run Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 4. Run with Docker Compose
```bash
docker-compose up --build
```
Spins up:
- Next.js frontend (`:3000`)
- FastAPI backend (`:8000`)
- Meilisearch instance (`:7700`)

---

## 🧪 Running Tests

The test suite covers privacy isolation, AES-256-GCM encryption, institutional domain verification, contact consent workflow, ML scoring, and Admin RBAC:

```bash
cd backend
python -m pytest tests/ -v
```

---

## 🗄️ Database Setup (Supabase)

To apply the database schema, RLS policies, and seed data to Supabase:
1. Copy `supabase/migrations/001_initial_schema.sql` into the Supabase SQL Editor and execute.
2. Copy `supabase/migrations/002_rls_policies.sql` and execute.
3. Copy `supabase/migrations/003_seed_data.sql` and execute.
Detailed instructions can be found in `supabase/README.md`.
