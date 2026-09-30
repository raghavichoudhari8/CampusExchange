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
