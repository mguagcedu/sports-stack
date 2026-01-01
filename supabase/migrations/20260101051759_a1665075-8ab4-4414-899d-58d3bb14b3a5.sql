-- Add pricing columns to equipment_items
ALTER TABLE public.equipment_items 
ADD COLUMN IF NOT EXISTS retail_price numeric,
ADD COLUMN IF NOT EXISTS our_cost numeric,
ADD COLUMN IF NOT EXISTS assigned_value numeric;

-- Create equipment packages for team levels
CREATE TABLE public.equipment_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sport_code text,
  team_level text, -- freshman, jv, varsity
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Package items - what items are in each package
CREATE TABLE public.equipment_package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid REFERENCES public.equipment_packages(id) ON DELETE CASCADE NOT NULL,
  equipment_item_id uuid REFERENCES public.equipment_items(id) ON DELETE CASCADE,
  item_name text NOT NULL, -- fallback if no specific item linked
  category text NOT NULL,
  subcategory text,
  quantity integer DEFAULT 1,
  is_required boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Equipment cart for batch checkouts
CREATE TABLE public.equipment_cart (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL, -- groups items in same checkout session
  created_by_user_id uuid NOT NULL,
  recipient_user_id uuid NOT NULL,
  recipient_team_member_id uuid REFERENCES public.team_members(id),
  team_id uuid REFERENCES public.teams(id),
  equipment_item_id uuid REFERENCES public.equipment_items(id) NOT NULL,
  size_id uuid REFERENCES public.equipment_sizes(id),
  quantity integer DEFAULT 1,
  tracking_code text,
  condition text DEFAULT 'good',
  notes text,
  status text DEFAULT 'pending', -- pending, confirmed, cancelled
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Equipment issuance records - tracks what each person should have vs has
CREATE TABLE public.equipment_issuance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_member_id uuid REFERENCES public.team_members(id),
  team_id uuid REFERENCES public.teams(id),
  package_id uuid REFERENCES public.equipment_packages(id),
  status text DEFAULT 'incomplete', -- incomplete, complete, returned
  issued_by_user_id uuid,
  issued_at timestamptz,
  completed_at timestamptz,
  return_due_date date,
  returned_at timestamptz,
  received_by_user_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Track individual items within an issuance
CREATE TABLE public.equipment_issuance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuance_id uuid REFERENCES public.equipment_issuance(id) ON DELETE CASCADE NOT NULL,
  package_item_id uuid REFERENCES public.equipment_package_items(id),
  equipment_item_id uuid REFERENCES public.equipment_items(id),
  checkout_id uuid REFERENCES public.equipment_checkouts(id),
  size_id uuid REFERENCES public.equipment_sizes(id),
  quantity_expected integer DEFAULT 1,
  quantity_issued integer DEFAULT 0,
  status text DEFAULT 'pending', -- pending, issued, returned, missing
  issued_at timestamptz,
  returned_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.equipment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_package_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_issuance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_issuance_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view equipment packages"
ON public.equipment_packages FOR SELECT
USING (true);

CREATE POLICY "Equipment managers can manage packages"
ON public.equipment_packages FOR ALL
USING (has_equipment_access(auth.uid()));

CREATE POLICY "Authenticated users can view package items"
ON public.equipment_package_items FOR SELECT
USING (true);

CREATE POLICY "Equipment managers can manage package items"
ON public.equipment_package_items FOR ALL
USING (has_equipment_access(auth.uid()));

CREATE POLICY "Users can view their own cart items"
ON public.equipment_cart FOR SELECT
USING (created_by_user_id = auth.uid() OR recipient_user_id = auth.uid() OR has_equipment_access(auth.uid()));

CREATE POLICY "Equipment managers can manage cart"
ON public.equipment_cart FOR ALL
USING (has_equipment_access(auth.uid()) OR created_by_user_id = auth.uid());

CREATE POLICY "Users can view their own issuances"
ON public.equipment_issuance FOR SELECT
USING (user_id = auth.uid() OR has_equipment_access(auth.uid()));

CREATE POLICY "Equipment managers can manage issuances"
ON public.equipment_issuance FOR ALL
USING (has_equipment_access(auth.uid()));

CREATE POLICY "Users can view their issuance items"
ON public.equipment_issuance_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.equipment_issuance ei 
  WHERE ei.id = issuance_id AND (ei.user_id = auth.uid() OR has_equipment_access(auth.uid()))
));

CREATE POLICY "Equipment managers can manage issuance items"
ON public.equipment_issuance_items FOR ALL
USING (has_equipment_access(auth.uid()));

-- Create indexes
CREATE INDEX idx_equipment_cart_session ON public.equipment_cart(session_id);
CREATE INDEX idx_equipment_cart_recipient ON public.equipment_cart(recipient_user_id);
CREATE INDEX idx_equipment_issuance_user ON public.equipment_issuance(user_id);
CREATE INDEX idx_equipment_issuance_team ON public.equipment_issuance(team_id);
CREATE INDEX idx_equipment_package_items_package ON public.equipment_package_items(package_id);

-- Insert default football package for varsity
INSERT INTO public.equipment_packages (name, description, sport_code, team_level, is_default) VALUES
('Football Varsity Full Kit', 'Complete equipment package for varsity football players', 'football', 'varsity', true),
('Football JV Kit', 'Standard equipment for JV football players', 'football', 'jv', true),
('Football Freshman Kit', 'Basic equipment for freshman football players', 'football', 'freshman', true);

-- Add varsity package items (example)
INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required, notes) 
SELECT id, 'Football Helmet', 'protective_gear', 'helmet', 2, true, 'Game and practice helmet'
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Shoulder Pads', 'protective_gear', 'shoulder_pads', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Game Jersey - Home', 'uniforms', 'game_jersey', 2, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Game Jersey - Away', 'uniforms', 'game_jersey', 2, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Practice Jersey', 'uniforms', 'practice_jersey', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Game Pants', 'uniforms', 'game_pants', 2, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Practice Pants', 'uniforms', 'practice_pants', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Game Socks', 'uniforms', 'socks', 2, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Game Belt', 'uniforms', 'belt', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Practice Belt', 'uniforms', 'belt', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Knee Pads', 'protective_gear', 'knee_pads', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Hip Pads', 'protective_gear', 'hip_pads', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';

INSERT INTO public.equipment_package_items (package_id, item_name, category, subcategory, quantity, is_required) 
SELECT id, 'Thigh Pads', 'protective_gear', 'thigh_pads', 1, true
FROM public.equipment_packages WHERE name = 'Football Varsity Full Kit';