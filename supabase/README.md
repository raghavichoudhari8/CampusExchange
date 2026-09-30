# Supabase Database & Migrations Setup

This directory contains database migrations, Row Level Security (RLS) policies, and seed data for **CampusSwap**.

## Migrations Overview

1. `migrations/001_initial_schema.sql`
   - Defines PostgreSQL tables: `profiles`, `allowed_domains`, `campuses`, `categories`, `listings`, `listing_images`, `contact_details` (encrypted), `contact_requests`, `wanted_posts`, `reports`, `audit_logs`, `notifications`.
   - Creates enums, indexes, and foreign keys.

2. `migrations/002_rls_policies.sql`
   - Enables RLS on all 12 tables.
   - Enforces institutional student verification checks (`is_verified = true` and `is_banned = false`).
   - Ensures contact details are strictly isolated: **only** the seller or a buyer with an `approved` request can read contact info.
   - Unverified users can only browse active listings.

3. `migrations/003_seed_data.sql`
   - Whitelisted domains: `.edu`, `.ac.in`, `.edu.in`, `iitb.ac.in`, `mit.edu`, `stanford.edu`, `berkeley.edu`, `bits-pilani.ac.in`.
   - Campuses: Tech Hub, Powai, North Quad, South Medical.
   - Categories and subcategories for Electronics, Subscriptions, Room Essentials, Furniture, Academics.
   - Demo students, admin, and sample campus listings.

## Applying Migrations to Supabase

### Option A: Using Supabase Dashboard (SQL Editor)
1. Navigate to your Supabase project -> **SQL Editor**.
2. Copy and paste `migrations/001_initial_schema.sql` and click **Run**.
3. Copy and paste `migrations/002_rls_policies.sql` and click **Run**.
4. Copy and paste `migrations/003_seed_data.sql` and click **Run**.

### Option B: Using Supabase CLI
```bash
supabase db push
# or
supabase migration up
```
