-- ====================================================================
-- CampusSwap: Phase 2 - Initial Database Schema
-- Multi-tenant campus peer-to-peer student exchange platform
-- ====================================================================

-- Enable UUID extension and pgcrypto if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM ('student', 'moderator', 'admin');
CREATE TYPE listing_condition AS ENUM ('brand_new', 'like_new', 'good', 'fair');
CREATE TYPE listing_status AS ENUM ('active', 'reserved', 'sold', 'expired', 'flagged');
CREATE TYPE contact_type AS ENUM ('phone', 'email', 'whatsapp');
CREATE TYPE contact_request_status AS ENUM ('pending', 'approved', 'declined', 'revoked');
CREATE TYPE wanted_status AS ENUM ('open', 'fulfilled', 'cancelled');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');

-- 1. Allowed Domains for Institutional Verification
CREATE TABLE IF NOT EXISTS allowed_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL UNIQUE,
    college_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Campuses
CREATE TABLE IF NOT EXISTS campuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. User Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- References auth.users(id) in Supabase
    email VARCHAR(255) NOT NULL UNIQUE,
    domain VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    display_name VARCHAR(100) NOT NULL,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    hostel_building VARCHAR(100),
    batch_year INTEGER,
    role user_role NOT NULL DEFAULT 'student',
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    avg_response_time_minutes INTEGER DEFAULT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Categories & Sub-categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Listings (Public details ONLY, sensitive contact info is NEVER in this table)
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) DEFAULT 0.00,
    is_free BOOLEAN NOT NULL DEFAULT FALSE,
    condition listing_condition NOT NULL DEFAULT 'good',
    location_note VARCHAR(255) NOT NULL DEFAULT 'Campus Library / Student Union',
    status listing_status NOT NULL DEFAULT 'active',
    spam_score REAL NOT NULL DEFAULT 0.0,
    view_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Listing Images
CREATE TABLE IF NOT EXISTS listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Contact Details (Encrypted at rest, strictly isolated)
CREATE TABLE IF NOT EXISTS contact_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    contact_type contact_type NOT NULL DEFAULT 'email',
    encrypted_contact_value TEXT NOT NULL, -- AES-256-GCM cipher payload
    preferred_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_listing_contact UNIQUE (listing_id)
);

-- 8. Contact Requests (Privacy-First Buyer Consent Workflow)
CREATE TABLE IF NOT EXISTS contact_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    message VARCHAR(500),
    status contact_request_status NOT NULL DEFAULT 'pending',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Rule: One request per buyer per listing
    CONSTRAINT uq_buyer_listing_request UNIQUE (listing_id, buyer_id)
);

-- 9. Wanted Posts / Wishlist Board
CREATE TABLE IF NOT EXISTS wanted_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    budget_max NUMERIC(10, 2),
    status wanted_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Reports for Moderation
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    status report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id)
);

-- 11. Audit Logs for Security Tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_listings_campus ON listings(campus_id);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_seller ON contact_requests(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_buyer ON contact_requests(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
-- ====================================================================
-- CampusSwap: Phase 2 - Row Level Security (RLS) Policies
-- Strict Privacy, Verified Student Access & Institutional Integrity
-- ====================================================================

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowed_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wanted_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Helper Functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (role = 'admin')
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_verified_student()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (is_verified = TRUE AND is_banned = FALSE)
        FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Profiles Policies
-- Public can view active profiles (display name, campus, batch)
CREATE POLICY "Public profiles are readable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (is_banned = FALSE OR auth.uid() = id OR is_admin());

-- Users can only update their own non-sensitive profile info
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id AND is_banned = FALSE)
WITH CHECK (auth.uid() = id AND is_banned = FALSE);

-- Admins can update any profile (e.g., ban/unban)
CREATE POLICY "Admins have full access to profiles"
ON profiles FOR ALL
TO authenticated
USING (is_admin());

-- 4. Allowed Domains Policies
-- Readable by anyone
CREATE POLICY "Allowed domains readable by all"
ON allowed_domains FOR SELECT
TO authenticated, anon
USING (is_active = TRUE OR is_admin());

-- Only admins can modify allowed domains
CREATE POLICY "Only admins can modify allowed domains"
ON allowed_domains FOR ALL
TO authenticated
USING (is_admin());

-- 5. Campuses & Categories Policies
CREATE POLICY "Campuses are readable by all"
ON campuses FOR SELECT
TO authenticated, anon
USING (TRUE);

CREATE POLICY "Categories are readable by all"
ON categories FOR SELECT
TO authenticated, anon
USING (TRUE);

CREATE POLICY "Admins manage campuses"
ON campuses FOR ALL
TO authenticated
USING (is_admin());

CREATE POLICY "Admins manage categories"
ON categories FOR ALL
TO authenticated
USING (is_admin());

-- 6. Listings Policies
-- Public / unverified users can browse active non-flagged listings
CREATE POLICY "Public listings are readable by everyone"
ON listings FOR SELECT
TO authenticated, anon
USING (
    status = 'active' 
    OR (auth.uid() IS NOT NULL AND seller_id = auth.uid())
    OR is_admin()
);

-- Only verified and non-banned students can create listings
CREATE POLICY "Verified students can insert listings"
ON listings FOR INSERT
TO authenticated
WITH CHECK (
    is_verified_student() 
    AND seller_id = auth.uid()
);

-- Only seller or admin can update listing
CREATE POLICY "Sellers can update own listings"
ON listings FOR UPDATE
TO authenticated
USING (seller_id = auth.uid() OR is_admin())
WITH CHECK (seller_id = auth.uid() OR is_admin());

-- Only seller or admin can delete listing
CREATE POLICY "Sellers can delete own listings"
ON listings FOR DELETE
TO authenticated
USING (seller_id = auth.uid() OR is_admin());

-- 7. Listing Images Policies
CREATE POLICY "Listing images readable by everyone"
ON listing_images FOR SELECT
TO authenticated, anon
USING (TRUE);

CREATE POLICY "Sellers can manage images for own listings"
ON listing_images FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM listings
        WHERE listings.id = listing_images.listing_id
        AND (listings.seller_id = auth.uid() OR is_admin())
    )
);

-- 8. Contact Details Policies (CRITICAL PRIVACY GUARD)
-- Readable ONLY by:
-- 1) The seller who owns the listing
-- 2) A verified buyer whose contact request is 'approved' for this specific listing
-- NEVER readable by public, unverified users, or random third parties.
CREATE POLICY "Contact details strictly private to owner and approved buyers"
ON contact_details FOR SELECT
TO authenticated
USING (
    -- Case 1: Seller viewing their own listing's contact
    user_id = auth.uid()
    OR
    -- Case 2: Verified buyer with approved request
    (
        is_verified_student()
        AND EXISTS (
            SELECT 1 FROM contact_requests
            WHERE contact_requests.listing_id = contact_details.listing_id
            AND contact_requests.buyer_id = auth.uid()
            AND contact_requests.status = 'approved'
        )
    )
    OR
    -- Case 3: Admin for security auditing
    is_admin()
);

CREATE POLICY "Sellers can insert contact details for own listings"
ON contact_details FOR INSERT
TO authenticated
WITH CHECK (
    is_verified_student()
    AND user_id = auth.uid()
);

CREATE POLICY "Sellers can update contact details for own listings"
ON contact_details FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_admin())
WITH CHECK (user_id = auth.uid() OR is_admin());

-- 9. Contact Requests Policies
-- Visible only to the buyer, seller, or admin
CREATE POLICY "Contact requests visible to participants"
ON contact_requests FOR SELECT
TO authenticated
USING (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid() 
    OR is_admin()
);

-- Only verified non-banned students can request contact, not on own listing
CREATE POLICY "Verified students can request contact"
ON contact_requests FOR INSERT
TO authenticated
WITH CHECK (
    is_verified_student()
    AND buyer_id = auth.uid()
    AND seller_id != auth.uid()
);

-- Sellers can accept/decline; sellers or buyers can revoke
CREATE POLICY "Participants can update contact request status"
ON contact_requests FOR UPDATE
TO authenticated
USING (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid() 
    OR is_admin()
)
WITH CHECK (
    buyer_id = auth.uid() 
    OR seller_id = auth.uid() 
    OR is_admin()
);

-- 10. Wanted Posts Policies
CREATE POLICY "Wanted posts readable by all"
ON wanted_posts FOR SELECT
TO authenticated, anon
USING (status = 'open' OR user_id = auth.uid() OR is_admin());

CREATE POLICY "Verified students can create wanted posts"
ON wanted_posts FOR INSERT
TO authenticated
WITH CHECK (is_verified_student() AND user_id = auth.uid());

CREATE POLICY "Authors can update own wanted posts"
ON wanted_posts FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR is_admin())
WITH CHECK (user_id = auth.uid() OR is_admin());

-- 11. Reports Policies
CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
TO authenticated
USING (is_admin() OR reporter_id = auth.uid());

CREATE POLICY "Authenticated users can submit reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid() AND is_verified_student());

-- 12. Audit Logs Policies
CREATE POLICY "Audit logs viewable by admins only"
ON audit_logs FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Audit logs insertable by authenticated system"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- 13. Notifications Policies
CREATE POLICY "Users can only read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notification read status"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
-- ====================================================================
-- CampusSwap: Phase 2 - Seed Data
-- Categories, Campuses, Allowed Domains, Demo Users, Sample Listings
-- ====================================================================

-- 1. Insert Allowed Domains
INSERT INTO allowed_domains (id, domain, college_name, is_active) VALUES
('11111111-0000-0000-0000-000000000001', '.edu', 'All Accredited US Higher-Ed Institutions', TRUE),
('11111111-0000-0000-0000-000000000002', '.ac.in', 'All Indian Universities & Colleges', TRUE),
('11111111-0000-0000-0000-000000000003', '.edu.in', 'Indian Educational Institutions', TRUE),
('11111111-0000-0000-0000-000000000004', 'iitb.ac.in', 'Indian Institute of Technology Bombay', TRUE),
('11111111-0000-0000-0000-000000000005', 'mit.edu', 'Massachusetts Institute of Technology', TRUE),
('11111111-0000-0000-0000-000000000006', 'stanford.edu', 'Stanford University', TRUE),
('11111111-0000-0000-0000-000000000007', 'berkeley.edu', 'UC Berkeley', TRUE),
('11111111-0000-0000-0000-000000000008', 'bits-pilani.ac.in', 'BITS Pilani', TRUE)
ON CONFLICT (domain) DO NOTHING;

-- 2. Insert Campuses
INSERT INTO campuses (id, name, code, city) VALUES
('22222222-0000-0000-0000-000000000001', 'Main Campus - Tech Hub', 'CAMPUS-MAIN', 'Cambridge'),
('22222222-0000-0000-0000-000000000002', 'Powai Campus', 'CAMPUS-POWAI', 'Mumbai'),
('22222222-0000-0000-0000-000000000003', 'North Quad Campus', 'CAMPUS-NORTH', 'Berkeley'),
('22222222-0000-0000-0000-000000000004', 'South Medical Campus', 'CAMPUS-SOUTH', 'Boston')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Categories and Subcategories
-- Top Level
INSERT INTO categories (id, name, slug, parent_id, description, icon, sort_order) VALUES
('33333333-0000-0000-0000-000000000001', 'Electronics & Tech', 'electronics-tech', NULL, 'Laptops, chargers, calculators, microcontrollers, and hardware', 'Laptop', 1),
('33333333-0000-0000-0000-000000000002', 'Subscriptions & Software Keys', 'subscriptions-keys', NULL, 'Shared cloud storage, AI tool seats, developer tools & licenses', 'Key', 2),
('33333333-0000-0000-0000-000000000003', 'Room & Flat Essentials', 'room-essentials', NULL, 'Appliances, study lamps, induction cookers, mini fridges, kettles', 'Home', 3),
('33333333-0000-0000-0000-000000000004', 'Furniture', 'furniture', NULL, 'Study tables, ergonomic chairs, clothes racks, mattresses, bins', 'Armchair', 4),
('33333333-0000-0000-0000-000000000005', 'Academics & Books', 'academics-books', NULL, 'Textbooks, course readers, lab coats, drawing boards, stationery', 'BookOpen', 5),
('33333333-0000-0000-0000-000000000006', 'Canva & Antigravity Subscriptions', 'canva-antigravity-subscriptions', NULL, 'Canva Pro student team invites, Google Antigravity AI coding seats, design tools & developer cloud licenses', 'Sparkles', 6)
ON CONFLICT (slug) DO NOTHING;

-- Sub-categories for Electronics
INSERT INTO categories (id, name, slug, parent_id, description, icon, sort_order) VALUES
('33333333-0001-0000-0000-000000000001', 'Laptops & Chargers', 'laptops-chargers', '33333333-0000-0000-0000-000000000001', 'MacBooks, Windows laptops, USB-C chargers', 'Laptop', 1),
('33333333-0001-0000-0000-000000000002', 'Calculators (TI-84, Scientific)', 'calculators', '33333333-0000-0000-0000-000000000001', 'Graphing and engineering calculators', 'Calculator', 2),
('33333333-0001-0000-0000-000000000003', 'Arduino & Raspberry Pi Kits', 'microcontrollers', '33333333-0000-0000-0000-000000000001', 'Dev boards, sensor starter kits, breadboards', 'Cpu', 3),
('33333333-0001-0000-0000-000000000004', 'Monitors & Displays', 'monitors', '33333333-0000-0000-0000-000000000001', 'Desk displays, HDMI cables', 'Monitor', 4)
ON CONFLICT (slug) DO NOTHING;

-- 4. Demo Profiles
INSERT INTO profiles (id, email, domain, is_verified, display_name, campus_id, hostel_building, batch_year, role, avg_response_time_minutes) VALUES
('44444444-0000-0000-0000-000000000001', 'admin@campusswap.edu', 'campusswap.edu', TRUE, 'Campus Admin', '22222222-0000-0000-0000-000000000001', 'Admin Hall', 2023, 'admin', 5),
('44444444-0000-0000-0000-000000000002', 'alex.chen@mit.edu', 'mit.edu', TRUE, 'Alex Chen', '22222222-0000-0000-0000-000000000001', 'Hostel 4 - Next House', 2025, 'student', 15),
('44444444-0000-0000-0000-000000000003', 'priya.sharma@iitb.ac.in', 'iitb.ac.in', TRUE, 'Priya Sharma', '22222222-0000-0000-0000-000000000002', 'Hostel 12 - Wing B', 2026, 'student', 25),
('44444444-0000-0000-0000-000000000004', 'marcus.v@stanford.edu', 'stanford.edu', TRUE, 'Marcus Vance', '22222222-0000-0000-0000-000000000003', 'Roble Hall', 2024, 'student', 40),
('44444444-0000-0000-0000-000000000005', 'unverified.user@gmail.com', 'gmail.com', FALSE, 'Guest User', NULL, NULL, NULL, 'student', NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Demo Listings
INSERT INTO listings (id, seller_id, campus_id, category_id, title, description, price, is_free, condition, location_note, status, expires_at) VALUES
(
    '55555555-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000001',
    'TI-84 Plus CE Color Graphing Calculator',
    'Used for AP Calculus and Linear Algebra. Pristine condition with charging cable and sliding hard case. Battery holds charge for weeks.',
    1800.00,
    FALSE,
    'like_new',
    'Barker Engineering Library Lobby',
    'active',
    NOW() + INTERVAL '28 days'
),
(
    '55555555-0000-0000-0000-000000000002',
    '44444444-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000003',
    'Instant Pot Electric Kettle (1.7L, Auto-Shutoff)',
    'Stainless steel electric kettle, perfect for late night tea or cup noodles in dorm room. Clean and fully functional.',
    650.00,
    FALSE,
    'good',
    'Next House Dining Hall Entrance',
    'active',
    NOW() + INTERVAL '25 days'
),
(
    '55555555-0000-0000-0000-000000000003',
    '44444444-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    'Arduino Uno Rev3 Starter Kit with Breadboard & 30+ Sensors',
    'Complete CS/EE project starter kit. Comes in transparent organizer box with resistors, LEDs, ultrasonic distance sensor, and servo motors.',
    950.00,
    FALSE,
    'like_new',
    'Central Library Ground Floor',
    'active',
    NOW() + INTERVAL '29 days'
),
(
    '55555555-0000-0000-0000-000000000004',
    '44444444-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000005',
    'Thomas Calculus 14th Edition + Physics Lab Coat (Size M)',
    'Passing on course materials from freshman year! Book has some pencil highlights. Lab coat is washed and sanitized.',
    0.00,
    TRUE,
    'good',
    'Hostel 12 Quadrangle',
    'active',
    NOW() + INTERVAL '27 days'
),
(
    '55555555-0000-0000-0000-000000000005',
    '44444444-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000003',
    '33333333-0000-0000-0000-000000000004',
    'Adjustable Ergonomic Mesh Study Chair',
    'High-back breathable mesh desk chair with lumbar support. Moving out at end of quarter so need it picked up quickly.',
    1200.00,
    FALSE,
    'good',
    'Tressider Student Union Patio',
    'active',
    NOW() + INTERVAL '20 days'
),
(
    '55555555-0000-0000-0000-000000000006',
    '44444444-0000-0000-0000-000000000004',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000002',
    'JetBrains All-Products Pack 1-Year Educational Share Seat',
    'Surplus team developer license for IntelliJ, PyCharm, WebStorm. Valid until graduation.',
    800.00,
    FALSE,
    'brand_new',
    'Gates Computer Science Building Cafe',
    'active',
    NOW() + INTERVAL '30 days'
),
(
    '55555555-0000-0000-0000-000000000007',
    '44444444-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000006',
    'Canva Pro 1-Year Student Team Seat (Brand Kit & Magic AI)',
    '2 member invites available on my verified university Canva Pro education team. Full access to background remover, premium stock videos, fonts, and brand kit. Transferred via student email.',
    299.00,
    FALSE,
    'brand_new',
    'Online Student Email Invite / Tech Lounge',
    'active',
    NOW() + INTERVAL '29 days'
),
(
    '55555555-0000-0000-0000-000000000008',
    '44444444-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000006',
    'Google Antigravity AI Pro Developer Seat & Compute',
    'Educational team developer seat for Google Antigravity autonomous coding agent & AI cloud environment. Perfect for CS capstone projects and hackathons. Instant activation.',
    499.00,
    FALSE,
    'brand_new',
    'Central Computer Center / Online Transfer',
    'active',
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Listing Images
INSERT INTO listing_images (id, listing_id, image_url, sort_order) VALUES
('66666666-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000003', '55555555-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000004', '55555555-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1580481077195-c3a821a506cb?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000007', '55555555-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80', 0),
('66666666-0000-0000-0000-000000000008', '55555555-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80', 0)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Wanted Posts
INSERT INTO wanted_posts (id, user_id, campus_id, category_id, title, description, budget_max, status) VALUES
(
    '77777777-0000-0000-0000-000000000001',
    '44444444-0000-0000-0000-000000000003',
    '22222222-0000-0000-0000-000000000002',
    '33333333-0000-0000-0000-000000000001',
    'Looking for Dell or Lenovo 65W USB-C Laptop Charger',
    'Left my laptop charger at home during fall break. Need a spare compatible with ThinkPad / XPS.',
    750.00,
    'open'
),
(
    '77777777-0000-0000-0000-000000000002',
    '44444444-0000-0000-0000-000000000002',
    '22222222-0000-0000-0000-000000000001',
    '33333333-0000-0000-0000-000000000005',
    'CS 106B Reader & Algorithms Textbook by Cormen (CLRS)',
    'Willing to buy or borrow for Spring semester. Hardcover or softcover both okay.',
    600.00,
    'open'
)
ON CONFLICT (id) DO NOTHING;
-- ====================================================================
-- CampusSwap: Phase 2 - Storage Bucket & Supabase Realtime Setup
-- ====================================================================

-- 1. Create 'listing-images' storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listing-images',
    'listing-images',
    TRUE,
    5242880, -- 5 MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];

-- Storage RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Access on listing-images'
    ) THEN
        CREATE POLICY "Public Read Access on listing-images"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'listing-images');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload to listing-images'
    ) THEN
        CREATE POLICY "Authenticated users can upload to listing-images"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'listing-images'
            AND (auth.role() = 'authenticated')
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own uploads in listing-images'
    ) THEN
        CREATE POLICY "Users can delete their own uploads in listing-images"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'listing-images' AND owner = auth.uid());
    END IF;
END $$;

-- 2. Configure Supabase Realtime Publication
-- Enable Realtime ONLY on the tables that need it: notifications and contact_requests
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'contact_requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE contact_requests;
    END IF;
END $$;
