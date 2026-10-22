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
