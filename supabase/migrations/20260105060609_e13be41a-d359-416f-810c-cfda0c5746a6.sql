-- Add RLS policy for login_rate_limits table (it has RLS enabled but no policies)
CREATE POLICY "No public access to rate limits" ON public.login_rate_limits
FOR ALL TO authenticated
USING (false)
WITH CHECK (false);

-- This table should only be accessed via security definer functions