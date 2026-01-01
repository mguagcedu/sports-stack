-- Add new fields to equipment_items for lifecycle tracking and non-returnable items
ALTER TABLE public.equipment_items 
ADD COLUMN IF NOT EXISTS received_date date,
ADD COLUMN IF NOT EXISTS lifecycle_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_returnable boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS non_returnable_reason text,
ADD COLUMN IF NOT EXISTS recertification_due_date date,
ADD COLUMN IF NOT EXISTS last_recertification_date date,
ADD COLUMN IF NOT EXISTS recertification_interval_months integer,
ADD COLUMN IF NOT EXISTS our_cost numeric,
ADD COLUMN IF NOT EXISTS retail_price numeric,
ADD COLUMN IF NOT EXISTS assigned_value numeric;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_items_lifecycle_status ON equipment_items(lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_equipment_items_recertification_due ON equipment_items(recertification_due_date);

-- Create table for equipment lifecycle logs (received, issued, returned, recertified, etc.)
CREATE TABLE IF NOT EXISTS public.equipment_lifecycle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_item_id uuid REFERENCES equipment_items(id) NOT NULL,
  action_type text NOT NULL, -- received, issued, returned, recertified, retired, damaged, repaired
  action_date timestamp with time zone DEFAULT now(),
  performed_by_user_id uuid,
  notes text,
  old_status text,
  new_status text,
  document_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on lifecycle logs
ALTER TABLE public.equipment_lifecycle_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for lifecycle logs
CREATE POLICY "Authenticated users can view lifecycle logs"
  ON equipment_lifecycle_logs FOR SELECT
  USING (true);

CREATE POLICY "Users with equipment access can insert lifecycle logs"
  ON equipment_lifecycle_logs FOR INSERT
  WITH CHECK (has_equipment_access(auth.uid()));

-- Create table for equipment documents/files (recertification certs, receipts, etc.)
CREATE TABLE IF NOT EXISTS public.equipment_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_item_id uuid REFERENCES equipment_items(id) NOT NULL,
  document_type text NOT NULL, -- receipt, recertification_cert, warranty, photo, manual
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size_bytes bigint,
  mime_type text,
  description text,
  uploaded_by_user_id uuid,
  valid_from date,
  valid_until date,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on equipment documents
ALTER TABLE public.equipment_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipment documents
CREATE POLICY "Authenticated users can view equipment documents"
  ON equipment_documents FOR SELECT
  USING (true);

CREATE POLICY "Users with equipment access can manage documents"
  ON equipment_documents FOR ALL
  USING (has_equipment_access(auth.uid()));

-- Add index for equipment documents
CREATE INDEX IF NOT EXISTS idx_equipment_documents_item ON equipment_documents(equipment_item_id);

-- Add SKU prefix settings for auto-generation
CREATE TABLE IF NOT EXISTS public.equipment_sku_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid,
  school_id uuid,
  category text NOT NULL,
  prefix text NOT NULL,
  next_number integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(organization_id, school_id, category)
);

-- Enable RLS on SKU settings
ALTER TABLE public.equipment_sku_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view SKU settings"
  ON equipment_sku_settings FOR SELECT
  USING (true);

CREATE POLICY "Equipment managers can manage SKU settings"
  ON equipment_sku_settings FOR ALL
  USING (has_equipment_access(auth.uid()));