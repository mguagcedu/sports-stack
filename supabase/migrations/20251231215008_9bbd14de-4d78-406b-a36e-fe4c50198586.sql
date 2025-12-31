-- Create import_history table to track all import operations
CREATE TABLE public.import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint,
  import_type text NOT NULL DEFAULT 'schools',
  status text NOT NULL DEFAULT 'pending',
  
  -- Record counts
  total_rows integer,
  rows_inserted integer,
  rows_skipped integer,
  districts_processed integer,
  
  -- Timing
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  
  -- Error tracking
  error_message text,
  
  -- Detailed breakdowns (JSON)
  status_breakdown jsonb,
  state_breakdown jsonb,
  
  -- Metadata
  format text,
  expected_total integer,
  matches_expected boolean,
  
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own import history"
  ON public.import_history FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Users can insert own import history"
  ON public.import_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own import history"
  ON public.import_history FOR UPDATE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'system_admin'::app_role));

-- Indexes for faster queries
CREATE INDEX idx_import_history_user_id ON public.import_history(user_id);
CREATE INDEX idx_import_history_created_at ON public.import_history(created_at DESC);