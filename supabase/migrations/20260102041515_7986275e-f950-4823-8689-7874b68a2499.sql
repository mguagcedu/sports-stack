
-- Create sport_branding table for per-sport logos and colors
CREATE TABLE public.sport_branding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    sport_code TEXT NOT NULL,
    logo_url TEXT,
    primary1_hex TEXT,
    primary2_hex TEXT,
    tertiary_hex_list TEXT[] DEFAULT '{}',
    full_extracted_palette TEXT[] DEFAULT '{}',
    is_locked BOOLEAN DEFAULT false,
    updated_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, sport_code)
);

-- Create team_branding table for per-team logos and colors
CREATE TABLE public.team_branding (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE UNIQUE,
    logo_url TEXT,
    primary1_hex TEXT,
    primary2_hex TEXT,
    tertiary_hex_list TEXT[] DEFAULT '{}',
    full_extracted_palette TEXT[] DEFAULT '{}',
    updated_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add branding columns to schools table if not exists
ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS primary1_hex TEXT,
ADD COLUMN IF NOT EXISTS primary2_hex TEXT,
ADD COLUMN IF NOT EXISTS tertiary_hex_list TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS full_extracted_palette TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS branding_locked BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.sport_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_branding ENABLE ROW LEVEL SECURITY;

-- RLS policies for sport_branding
CREATE POLICY "Anyone can view sport branding"
    ON public.sport_branding FOR SELECT
    USING (true);

CREATE POLICY "Admins and coaches can manage sport branding"
    ON public.sport_branding FOR ALL
    USING (
        has_role(auth.uid(), 'system_admin'::app_role) OR 
        has_role(auth.uid(), 'org_admin'::app_role) OR
        has_role(auth.uid(), 'athletic_director'::app_role) OR
        has_role(auth.uid(), 'coach'::app_role) OR
        has_role(auth.uid(), 'head_coach'::app_role)
    );

-- RLS policies for team_branding
CREATE POLICY "Anyone can view team branding"
    ON public.team_branding FOR SELECT
    USING (true);

CREATE POLICY "Coaches can manage team branding"
    ON public.team_branding FOR ALL
    USING (
        has_role(auth.uid(), 'system_admin'::app_role) OR 
        has_role(auth.uid(), 'org_admin'::app_role) OR
        has_role(auth.uid(), 'athletic_director'::app_role) OR
        has_role(auth.uid(), 'coach'::app_role) OR
        has_role(auth.uid(), 'head_coach'::app_role)
    );

-- Create storage bucket for sport logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sport-logos', 'sport-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for sport-logos bucket
CREATE POLICY "Anyone can view sport logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'sport-logos');

CREATE POLICY "Authenticated users can upload sport logos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'sport-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update sport logos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'sport-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete sport logos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'sport-logos' AND auth.uid() IS NOT NULL);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_sport_branding_updated_at
    BEFORE UPDATE ON public.sport_branding
    FOR EACH ROW
    EXECUTE FUNCTION update_branding_updated_at();

CREATE TRIGGER update_team_branding_updated_at
    BEFORE UPDATE ON public.team_branding
    FOR EACH ROW
    EXECUTE FUNCTION update_branding_updated_at();
