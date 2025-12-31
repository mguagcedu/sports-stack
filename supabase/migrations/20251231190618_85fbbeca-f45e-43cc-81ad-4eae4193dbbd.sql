-- Create districts table for LEA (Local Education Agency) data
CREATE TABLE public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nces_id text UNIQUE NOT NULL,
  state_lea_id text,
  name text NOT NULL,
  state text NOT NULL,
  state_name text,
  address text,
  city text,
  zip text,
  zip4 text,
  phone text,
  website text,
  lea_type text,
  lea_type_text text,
  charter_lea text,
  operational_status text,
  operational_status_text text,
  lowest_grade text,
  highest_grade text,
  operational_schools integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add district_id foreign key to schools table
ALTER TABLE public.schools 
ADD COLUMN district_id uuid REFERENCES public.districts(id);

-- Create indexes for fast lookups
CREATE INDEX idx_districts_state ON public.districts(state);
CREATE INDEX idx_districts_name_search ON public.districts USING gin(to_tsvector('english', name));
CREATE INDEX idx_districts_nces_id ON public.districts(nces_id);
CREATE INDEX idx_schools_district_id ON public.schools(district_id);

-- Enable RLS
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;

-- RLS policies for districts (publicly viewable, admin-managed)
CREATE POLICY "Authenticated users can view districts"
ON public.districts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System admins can manage districts"
ON public.districts FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'system_admin'));

-- Add updated_at trigger
CREATE TRIGGER update_districts_updated_at
BEFORE UPDATE ON public.districts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();