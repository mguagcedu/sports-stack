-- Add enhanced fields to equipment_items table
ALTER TABLE public.equipment_items 
ADD COLUMN IF NOT EXISTS lifecycle_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS condition_status text DEFAULT 'good',
ADD COLUMN IF NOT EXISTS purchase_date date,
ADD COLUMN IF NOT EXISTS last_inspection_date date,
ADD COLUMN IF NOT EXISTS next_inspection_date date,
ADD COLUMN IF NOT EXISTS retirement_date date,
ADD COLUMN IF NOT EXISTS max_lifespan_years integer,
ADD COLUMN IF NOT EXISTS manufacturer text,
ADD COLUMN IF NOT EXISTS model_number text,
ADD COLUMN IF NOT EXISTS serial_number text,
ADD COLUMN IF NOT EXISTS warranty_expiry date,
ADD COLUMN IF NOT EXISTS requires_washing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS code_type text DEFAULT 'qr',
ADD COLUMN IF NOT EXISTS notes text;

-- Add enhanced fields to equipment_checkouts table
ALTER TABLE public.equipment_checkouts 
ADD COLUMN IF NOT EXISTS size_id uuid REFERENCES public.equipment_sizes(id),
ADD COLUMN IF NOT EXISTS wash_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS washed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS washed_by_user_id uuid,
ADD COLUMN IF NOT EXISTS return_notes text,
ADD COLUMN IF NOT EXISTS reusable boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS needs_refurbishment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS refurbishment_notes text;

-- Create equipment_audit_log table
CREATE TABLE IF NOT EXISTS public.equipment_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_item_id uuid REFERENCES public.equipment_items(id),
  checkout_id uuid REFERENCES public.equipment_checkouts(id),
  action_type text NOT NULL,
  action_description text,
  performed_by_user_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit log
CREATE POLICY "Coaches and admins can view equipment audit logs" 
ON public.equipment_audit_log 
FOR SELECT 
USING (
  has_role(auth.uid(), 'system_admin'::app_role) OR 
  has_role(auth.uid(), 'org_admin'::app_role) OR 
  has_role(auth.uid(), 'athletic_director'::app_role) OR 
  has_role(auth.uid(), 'coach'::app_role) OR 
  has_role(auth.uid(), 'team_manager'::app_role)
);

CREATE POLICY "System can insert equipment audit logs" 
ON public.equipment_audit_log 
FOR INSERT 
WITH CHECK (true);

-- Create equipment_categories table for predefined categories
CREATE TABLE IF NOT EXISTS public.equipment_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  description text,
  sport_code text,
  has_sizes boolean DEFAULT false,
  requires_inspection boolean DEFAULT false,
  default_lifespan_years integer,
  icon text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for categories
CREATE POLICY "Authenticated users can view equipment categories" 
ON public.equipment_categories 
FOR SELECT 
USING (true);

CREATE POLICY "System admins can manage equipment categories" 
ON public.equipment_categories 
FOR ALL 
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Insert default equipment categories
INSERT INTO public.equipment_categories (name, code, description, has_sizes, requires_inspection, default_lifespan_years, icon) VALUES
('Football Helmet', 'football_helmet', 'Football protective helmet - requires annual recertification', true, true, 10, 'hard-hat'),
('Football Shoulder Pads', 'football_pads', 'Football shoulder pads', true, true, 5, 'shield'),
('Jersey', 'jersey', 'Team uniform jersey', true, false, 3, 'shirt'),
('Pants', 'pants', 'Team uniform pants', true, false, 3, 'shirt'),
('Shorts', 'shorts', 'Athletic shorts', true, false, 2, 'shirt'),
('Cleats', 'cleats', 'Athletic cleats/shoes', true, false, 1, 'footprints'),
('Practice Jersey', 'practice_jersey', 'Practice/training jersey', true, false, 2, 'shirt'),
('Ball - Football', 'football', 'Football game ball', false, false, 2, 'circle'),
('Ball - Basketball', 'basketball', 'Basketball game ball', false, false, 2, 'circle'),
('Ball - Soccer', 'soccer_ball', 'Soccer game ball', false, false, 2, 'circle'),
('Ball - Baseball', 'baseball', 'Baseball game ball', false, false, 1, 'circle'),
('Ball - Softball', 'softball', 'Softball game ball', false, false, 1, 'circle'),
('Ball - Volleyball', 'volleyball', 'Volleyball game ball', false, false, 2, 'circle'),
('Bat - Baseball', 'baseball_bat', 'Baseball bat', false, true, 3, 'minus'),
('Bat - Softball', 'softball_bat', 'Softball bat', false, true, 3, 'minus'),
('Glove - Baseball', 'baseball_glove', 'Baseball/softball glove', true, false, 5, 'hand'),
('Catcher Gear', 'catcher_gear', 'Complete catcher protective set', true, true, 5, 'shield'),
('Lacrosse Stick', 'lacrosse_stick', 'Lacrosse stick with head', false, false, 3, 'minus'),
('Lacrosse Helmet', 'lacrosse_helmet', 'Lacrosse protective helmet', true, true, 10, 'hard-hat'),
('Hockey Stick', 'hockey_stick', 'Hockey stick', false, false, 1, 'minus'),
('Hockey Pads', 'hockey_pads', 'Hockey protective pads set', true, true, 5, 'shield'),
('Wrestling Singlet', 'wrestling_singlet', 'Wrestling uniform singlet', true, false, 3, 'shirt'),
('Wrestling Headgear', 'wrestling_headgear', 'Wrestling protective headgear', true, true, 5, 'hard-hat'),
('Track Uniform', 'track_uniform', 'Track and field uniform set', true, false, 3, 'shirt'),
('Swimming Suit', 'swim_suit', 'Competitive swimming suit', true, false, 1, 'shirt'),
('Swim Cap', 'swim_cap', 'Swimming cap', true, false, 1, 'circle'),
('Goggles', 'goggles', 'Protective or swim goggles', false, false, 2, 'glasses'),
('Weight Belt', 'weight_belt', 'Weightlifting belt', true, false, 5, 'circle'),
('Training Cones', 'cones', 'Training/practice cones', false, false, 5, 'cone'),
('Training Hurdles', 'hurdles', 'Track hurdles', false, true, 10, 'minus'),
('First Aid Kit', 'first_aid', 'Medical first aid supplies', false, true, 1, 'plus'),
('Water Cooler', 'water_cooler', 'Team water cooler', false, false, 5, 'cup'),
('Equipment Bag', 'equipment_bag', 'Equipment carrying bag', true, false, 5, 'briefcase'),
('Other', 'other', 'Other equipment not categorized', false, false, null, 'package')
ON CONFLICT (code) DO NOTHING;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_equipment_audit_log_item_id ON public.equipment_audit_log(equipment_item_id);
CREATE INDEX IF NOT EXISTS idx_equipment_audit_log_checkout_id ON public.equipment_audit_log(checkout_id);
CREATE INDEX IF NOT EXISTS idx_equipment_audit_log_created_at ON public.equipment_audit_log(created_at DESC);