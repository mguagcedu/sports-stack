-- Create private storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('uploads-raw', 'uploads-raw', false, 262144000),
  ('uploads-processed', 'uploads-processed', false, 262144000)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads-raw bucket
CREATE POLICY "Users can upload to raw bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads-raw');

CREATE POLICY "Users can view own raw files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploads-raw' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own raw files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'uploads-raw' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for uploads-processed bucket
CREATE POLICY "Users can view own processed files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'uploads-processed' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service can manage processed files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'uploads-processed');