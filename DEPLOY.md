# CampusSwap Production Deployment Guide (Vercel + Supabase)

This document tracks the end-to-end production deployment checklist for CampusSwap across Vercel (Frontend & Backend), Supabase (Auth, Postgres, Realtime & Storage), Resend (Email), and Meilisearch Cloud.

---

## 📋 Deployment Progress Checklist

- [ ] **Phase 1: Pre-flight Audit & Refactoring**
  - [x] Verify local frontend build (`next build`)
  - [x] Verify local backend tests (`pytest`)
  - [x] Inventory and map all environment variables across services
  - [x] Refactor WebSockets to Supabase Realtime in `frontend/src/hooks/useWebSocket.ts`
  - [x] Lazy-load ML classification pipeline in `backend/app/services/ml_service.py`
  - [x] Add Vercel Cron-secured endpoint (`/api/v1/cron/expiry`) with `CRON_SECRET`
  - [x] Configure `backend/api/index.py` and `backend/vercel.json` for Python serverless
  - [x] Run backend tests after refactoring (16/16 passed)

- [ ] **Phase 2: Production Supabase Setup**
  - [x] Provision production Supabase project (`hepjxowmqzowiqwzkmvi`)
  - [x] Run Supabase migrations (`001`, `002`, `003`, `004` schemas, seed data & storage)
  - [x] Verify Row Level Security (RLS) on all tables (unverified users blocked, contacts shielded)
  - [x] Create `listing-images` storage bucket with public read and authenticated write
  - [x] Enable Supabase Realtime on `notifications` and `contact_requests` tables
  - [x] Generate fresh 32-byte production AES-256-GCM encryption key (Configured in Vercel & .env)

- [x] **Phase 3: Google Cloud OAuth & Supabase Auth URLs**
  - [x] Configure Google Cloud OAuth Client ID & Secret (Google Provider active)
  - [x] Set Authorized Redirect URI in Google Console (`https://hepjxowmqzowiqwzkmvi.supabase.co/auth/v1/callback`)
  - [x] Configure Supabase Auth: Site URL and Redirect URLs (`http://localhost:3001/**`, `https://*.vercel.app/**`)

- [ ] **Phase 4: Search & Transactional Email Setup**
  - [ ] Configure Meilisearch Cloud index with filterable/sortable attributes (public fields only)
  - [ ] Verify Resend domain DNS records and configure sender address (`notifications@yourdomain.com`)
  - [ ] Send test transactional email via Resend

- [ ] **Phase 5: Backend Deployment to Vercel (Python Serverless)**
  - [ ] Configure Vercel Backend project with Root Directory = `backend`
  - [ ] Set all backend environment variables on Vercel
  - [ ] Set CORS to allow production frontend and `*.vercel.app` preview branches
  - [ ] Deploy preview and run smoke tests (health check, public listings, 401 on unauthorized contacts)
  - [ ] Promote backend to Production

- [ ] **Phase 6: Frontend Deployment to Vercel (Next.js)**
  - [ ] Configure Vercel Frontend project with Root Directory = `frontend`
  - [ ] Set frontend environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`)
  - [ ] Deploy preview, verify live API connectivity, and promote to Production
  - [ ] (Optional) Attach custom domain and set DNS records

- [ ] **Phase 7: Cron Jobs & GitHub CI/CD**
  - [ ] Verify Vercel Cron trigger calling `/api/v1/cron/expiry` with `CRON_SECRET`
  - [ ] Set up GitHub Actions CI workflow (linting, type-check, and backend pytest on PRs)

- [ ] **Phase 8: Production Verification (9-Point Test Matrix)**
  - [ ] 1. Non-college Google account: Browse allowed; posting and contact requests blocked
  - [ ] 2. College domain (`.edu` / `.ac.in`): Onboard, post listings with multi-photo upload
  - [ ] 3. Buyer request -> Seller receives Supabase Realtime modal + email notification
  - [ ] 4. Seller approves -> Buyer receives decrypted contact; seller revokes -> access revoked
  - [ ] 5. Zero sensitive contact leaks (phone/email/UPI absent from public responses and search index)
  - [ ] 6. Spam / prohibited listings automatically flagged to admin queue
  - [ ] 7. Admin role enforcement on `/admin` portal
  - [ ] 8. Mobile viewport responsive check + Lighthouse audit
  - [ ] 9. Vercel Cron invocation verified

- [ ] **Phase 9: Production Handover & Runbook**
  - [ ] Document production URLs and env var inventory
  - [ ] Rollback procedures (Vercel Instant Rollback)
  - [ ] Secret rotation guide (Encryption key & Service-role key)
  - [ ] Whitelisting new college domains procedure

---

## 🔑 Environment Variables Inventory & Mapping

| Variable Name | Description | Target Location | Secret? |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of deployed FastAPI backend (e.g., `https://campusswap-backend.vercel.app`) | Vercel Frontend | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL (`https://<project-ref>.supabase.co`) | Vercel Frontend | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Public Key | Vercel Frontend | No |
| `ENVIRONMENT` | Environment mode (`production`) | Vercel Backend | No |
| `CORS_ORIGINS` | Allowed frontend domains (comma-separated, plus regex for previews) | Vercel Backend | No |
| `SUPABASE_URL` | Supabase Project URL (`https://<project-ref>.supabase.co`) | Vercel Backend | No |
| `SUPABASE_KEY` | Supabase Service Role Key (Admin access, bypasses RLS on backend) | Vercel Backend | **YES** |
| `SUPABASE_ANON_KEY` | Supabase Anonymous Public Key | Vercel Backend | No |
| `SUPABASE_JWT_SECRET` | Supabase JWT Secret (Project Settings > API > JWT Secret) | Vercel Backend | **YES** |
| `ENCRYPTION_KEY` | 32-byte base64 key for AES-256-GCM contact encryption | Vercel Backend | **YES** |
| `APP_SECRET_KEY` | Local fallback JWT secret | Vercel Backend | **YES** |
| `CRON_SECRET` | Secret token to authenticate Vercel Cron requests | Vercel Backend | **YES** |
| `RESEND_API_KEY` | Resend API key (`re_...`) | Vercel Backend | **YES** |
| `RESEND_FROM_EMAIL` | Verified sender email (e.g. `notifications@yourdomain.com`) | Vercel Backend | No |
| `MEILISEARCH_URL` | Meilisearch Cloud host URL (`https://ms-....meilisearch.io`) | Vercel Backend | No |
| `MEILISEARCH_MASTER_KEY` | Meilisearch Cloud API / admin key | Vercel Backend | **YES** |

---

## 🏗️ Platform Constraints & Architecture Adaptations

1. **WebSockets to Supabase Realtime**:
   Vercel serverless functions do not sustain persistent WebSocket connections. Real-time buyer/seller consent notifications are powered by Supabase Realtime PostgreSQL changes on `notifications` and `contact_requests`. The frontend `useWebSocket` hook wraps Supabase Realtime directly.
2. **Search Engine**:
   Meilisearch runs on Meilisearch Cloud (or Algolia). Only public fields (`title`, `description`, `category_id`, `campus_id`, `price`, `condition`, `location_note`) are indexed. Phone numbers, emails, and UPI handles are strictly omitted.
3. **Stateless Serverless Backend**:
   FastAPI runs via Vercel Python runtime using `backend/api/index.py` and `backend/vercel.json`. Scikit-learn TF-IDF categorization pipeline is lazily instantiated to ensure instant cold starts without bundle size penalties.
4. **Scheduled Expiry Jobs**:
   Vercel Cron triggers `/api/v1/cron/expiry` daily at 02:00 UTC using a secure `CRON_SECRET` header.
