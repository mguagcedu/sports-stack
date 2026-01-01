-- Add branding columns to schools table
ALTER TABLE public.schools
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS primary_color text,
ADD COLUMN IF NOT EXISTS secondary_color text,
ADD COLUMN IF NOT EXISTS accent_color text,
ADD COLUMN IF NOT EXISTS text_on_primary text DEFAULT 'white',
ADD COLUMN IF NOT EXISTS theme_source text DEFAULT 'manual';

-- Add sport_icon_key to sport_types for icon-based rendering
ALTER TABLE public.sport_types
ADD COLUMN IF NOT EXISTS sport_icon_key text;

-- Create a storage bucket for school logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('school-logos', 'school-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
CREATE POLICY "Users can upload school logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'school-logos' AND auth.role() = 'authenticated');

-- Allow public read access to logos
CREATE POLICY "School logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'school-logos');

-- Allow users to update/delete their uploads
CREATE POLICY "Users can update school logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'school-logos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete school logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'school-logos' AND auth.role() = 'authenticated');