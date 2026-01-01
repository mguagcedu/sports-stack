-- Create registration_forms table for sport-specific forms
CREATE TABLE IF NOT EXISTS public.registration_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_code TEXT,
  form_type TEXT NOT NULL, -- 'general', 'health', 'consent', 'equipment', 'travel', 'media_release', 'emergency_contact'
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '[]'::jsonb, -- Form fields/questions
  is_required BOOLEAN DEFAULT true,
  requires_parent_signature BOOLEAN DEFAULT false,
  requires_coach_signature BOOLEAN DEFAULT false,
  requires_admin_signature BOOLEAN DEFAULT false,
  external_provider TEXT, -- 'finalforms', 'internal'
  external_url TEXT,
  school_id UUID REFERENCES public.schools(id),
  district_id UUID REFERENCES public.districts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create form_submissions table for tracking completed forms
CREATE TABLE IF NOT EXISTS public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES public.registration_forms(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  athlete_user_id UUID NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  responses JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending', -- 'pending', 'submitted', 'approved', 'rejected'
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create digital_signatures table
CREATE TABLE IF NOT EXISTS public.digital_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_submission_id UUID REFERENCES public.form_submissions(id) ON DELETE CASCADE,
  signer_user_id UUID NOT NULL,
  signer_role TEXT NOT NULL, -- 'athlete', 'parent', 'coach', 'assistant_coach', 'admin', 'athletic_director'
  signer_name TEXT NOT NULL,
  signature_data TEXT, -- base64 signature image or typed name
  signature_type TEXT DEFAULT 'typed', -- 'typed', 'drawn'
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registration_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies for registration_forms
CREATE POLICY "Authenticated users can view forms" ON public.registration_forms
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage forms" ON public.registration_forms
  FOR ALL USING (
    has_role(auth.uid(), 'system_admin'::app_role) OR 
    has_role(auth.uid(), 'org_admin'::app_role) OR
    has_role(auth.uid(), 'athletic_director'::app_role)
  );

-- RLS Policies for form_submissions
CREATE POLICY "Users can view their own submissions" ON public.form_submissions
  FOR SELECT USING (
    athlete_user_id = auth.uid() OR
    has_role(auth.uid(), 'system_admin'::app_role) OR
    has_role(auth.uid(), 'org_admin'::app_role) OR
    has_role(auth.uid(), 'coach'::app_role) OR
    has_role(auth.uid(), 'athletic_director'::app_role)
  );

CREATE POLICY "Users can submit forms" ON public.form_submissions
  FOR INSERT WITH CHECK (athlete_user_id = auth.uid());

CREATE POLICY "Users can update their own submissions" ON public.form_submissions
  FOR UPDATE USING (
    athlete_user_id = auth.uid() OR
    has_role(auth.uid(), 'system_admin'::app_role) OR
    has_role(auth.uid(), 'org_admin'::app_role) OR
    has_role(auth.uid(), 'coach'::app_role)
  );

-- RLS Policies for digital_signatures
CREATE POLICY "Users can view signatures on their forms" ON public.digital_signatures
  FOR SELECT USING (
    signer_user_id = auth.uid() OR
    has_role(auth.uid(), 'system_admin'::app_role) OR
    has_role(auth.uid(), 'org_admin'::app_role) OR
    has_role(auth.uid(), 'coach'::app_role)
  );

CREATE POLICY "Users can sign forms" ON public.digital_signatures
  FOR INSERT WITH CHECK (signer_user_id = auth.uid());

-- Seed sport-specific form templates
INSERT INTO public.registration_forms (sport_code, form_type, title, description, is_required, requires_parent_signature, external_provider) VALUES
-- General forms (all sports)
(NULL, 'general', 'Athletic Participation Agreement', 'General agreement for athletic participation including code of conduct and policies', true, true, 'internal'),
(NULL, 'emergency_contact', 'Emergency Contact Information', 'Emergency contact details and medical information', true, true, 'internal'),
(NULL, 'media_release', 'Media Release Form', 'Permission to use athlete photos/videos for promotional purposes', false, true, 'internal'),
(NULL, 'health', 'Physical Examination Form', 'Annual physical examination - REQUIRED via FinalForms', true, true, 'finalforms'),
(NULL, 'health', 'Concussion Awareness Form', 'Acknowledgment of concussion risks and protocols', true, true, 'internal'),

-- Football specific
('football_11_man', 'equipment', 'Football Equipment Agreement', 'Agreement for football equipment checkout including helmets, pads, and uniforms', true, true, 'internal'),
('football_11_man', 'consent', 'Football Risk Acknowledgment', 'Acknowledgment of risks specific to contact football', true, true, 'internal'),
('football_11_man', 'health', 'Heat Acclimatization Protocol', 'Understanding of heat safety protocols for football practice', true, false, 'internal'),

-- Basketball specific
('basketball_boys', 'equipment', 'Basketball Equipment Agreement', 'Agreement for basketball uniforms and equipment', true, true, 'internal'),

-- Baseball specific
('baseball', 'equipment', 'Baseball Equipment Agreement', 'Agreement for baseball equipment including bats, helmets, and gloves', true, true, 'internal'),
('baseball', 'consent', 'Pitch Count Policy Acknowledgment', 'Understanding of pitch count limits and arm safety', true, true, 'internal'),

-- Soccer specific
('soccer_boys', 'equipment', 'Soccer Equipment Agreement', 'Agreement for soccer uniforms and equipment', true, true, 'internal'),

-- Track specific
('track_field', 'consent', 'Track & Field Event Consent', 'Consent for specific events participation', true, true, 'internal'),

-- Travel forms
(NULL, 'travel', 'Travel Consent Form', 'Permission for team travel to away games', false, true, 'internal')
ON CONFLICT DO NOTHING;