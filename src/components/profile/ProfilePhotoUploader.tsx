import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, Loader2, Upload, X } from 'lucide-react';

interface ProfilePhotoUploaderProps {
  currentPhotoUrl?: string | null;
  userId?: string;
  type?: 'profile' | 'card';
  size?: 'sm' | 'md' | 'lg';
  onUploadComplete?: (url: string) => void;
  className?: string;
}

export function ProfilePhotoUploader({ 
  currentPhotoUrl, 
  userId,
  type = 'profile',
  size = 'md',
  onUploadComplete,
  className 
}: ProfilePhotoUploaderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const targetUserId = userId || user?.id;
  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!targetUserId) throw new Error('No user ID');

      setUploading(true);
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetUserId}/${type}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile with new photo URL
      const updateField = type === 'card' ? 'card_photo_url' : 'photo_url';
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          [updateField]: publicUrl,
          avatar_updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: (url) => {
      toast.success(`${type === 'card' ? 'Card' : 'Profile'} photo updated`);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
      onUploadComplete?.(url);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload photo');
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    uploadMutation.mutate(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = preview || currentPhotoUrl;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-border`}>
          <AvatarImage src={displayUrl || undefined} alt="Photo" />
          <AvatarFallback className="text-2xl">
            <Camera className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        <button
          type="button"
          onClick={handleClick}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </button>

        {/* Preview clear button */}
        {preview && !uploading && (
          <button
            type="button"
            onClick={clearPreview}
            className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-center">
        <Label className="text-sm text-muted-foreground">
          {type === 'card' ? 'Sports Card Photo' : 'Profile Photo'}
        </Label>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClick}
          disabled={uploading}
          className="mt-1"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {displayUrl ? 'Change' : 'Upload'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
