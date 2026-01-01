-- Create notifications table for storing user notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  category TEXT,
  reference_type TEXT,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Add date_of_birth to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- System/Admins can insert notifications
CREATE POLICY "Authenticated users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);