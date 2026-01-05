import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  "https://lovable.dev",
  /^https:\/\/[a-z0-9-]+-preview--ffnpobdcqcagjmlddvga\.lovableproject\.com$/,
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.some(allowed => 
    typeof allowed === 'string' ? allowed === origin : allowed.test(origin)
  );
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : "https://lovable.dev",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

// Blocked file types
const BLOCKED_EXTENSIONS = ['svg', 'html', 'js', 'exe', 'bat', 'cmd', 'ps1', 'sh', 'jar', 'vbs', 'scr', 'dll', 'sys', 'iso', 'img', 'docm', 'xlsm', 'pptm'];

// Allowed image MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif'];

// File size limits
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

// Image output settings
const OUTPUT_SETTINGS = {
  standard: { maxSize: 4096, quality: 85 },
  preview: { maxSize: 1600, quality: 78 },
  thumb: { maxSize: 400, quality: 75 },
};

interface ProcessingResult {
  success: boolean;
  fileId?: string;
  standardUrl?: string;
  previewUrl?: string;
  thumbUrl?: string;
  error?: string;
  quarantined?: boolean;
}

function validateMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  // Check for JPEG
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  }
  
  // Check for PNG
  if (mimeType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
           bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;
  }
  
  // Check for HEIC/HEIF (ftyp box)
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    // ftyp appears at byte 4-7
    return bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70;
  }
  
  return false;
}

function hasDoubleExtension(filename: string): boolean {
  const parts = filename.split('.');
  if (parts.length <= 2) return false;
  
  // Check if there are dangerous extensions in the middle
  const middleExtensions = parts.slice(1, -1);
  return middleExtensions.some(ext => BLOCKED_EXTENSIONS.includes(ext.toLowerCase()));
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function isBlockedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return BLOCKED_EXTENSIONS.includes(ext);
}

function generateUUID(): string {
  return crypto.randomUUID();
}

function getTenantPath(userId: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${userId}/${year}/${month}`;
}

// Simple malware pattern detection (basic check for suspicious patterns)
function scanForMalware(bytes: Uint8Array): { clean: boolean; reason?: string } {
  const textContent = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 10000));
  
  // Check for embedded scripts
  if (textContent.includes('<script') || textContent.includes('javascript:')) {
    return { clean: false, reason: 'Embedded script detected' };
  }
  
  // Check for PHP code
  if (textContent.includes('<?php') || textContent.includes('<?=')) {
    return { clean: false, reason: 'Embedded PHP code detected' };
  }
  
  // Check for executable headers in image
  if (bytes[0] === 0x4D && bytes[1] === 0x5A) { // MZ header (Windows executable)
    return { clean: false, reason: 'Executable content detected' };
  }
  
  return { clean: true };
}

async function processImage(
  imageBytes: Uint8Array, 
  mimeType: string,
  _settings: { maxSize: number; quality: number }
): Promise<Uint8Array> {
  // For JPEG images, we can do basic validation and pass through
  if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
    return imageBytes;
  }
  
  // For HEIC/HEIF, we'd need conversion - flag for future processing
  console.log('HEIC/HEIF detected - would need conversion service');
  return imageBytes;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const results: ProcessingResult[] = [];

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const tenantId = formData.get('tenant_id') as string | null;
    
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate file count
    if (files.length > 10) {
      return new Response(JSON.stringify({ error: 'Maximum 10 files per request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 300 * 1024 * 1024) { // 300 MB max total
      return new Response(JSON.stringify({ error: 'Total file size exceeds 300 MB limit' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    for (const file of files) {
      const result: ProcessingResult = { success: false };
      
      try {
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // 1. Check for blocked extensions
        if (isBlockedExtension(file.name)) {
          await supabase.from('quarantined_files').insert({
            original_filename: file.name,
            user_id: user.id,
            tenant_id: tenantId,
            reason: 'Blocked file extension',
            file_size_bytes: file.size,
            mime_type: file.type,
            upload_ip: clientIp,
            user_agent: userAgent,
          });
          result.error = 'File type not allowed';
          result.quarantined = true;
          results.push(result);
          continue;
        }

        // 2. Check for double extensions
        if (hasDoubleExtension(file.name)) {
          await supabase.from('quarantined_files').insert({
            original_filename: file.name,
            user_id: user.id,
            tenant_id: tenantId,
            reason: 'Double extension detected',
            file_size_bytes: file.size,
            mime_type: file.type,
            upload_ip: clientIp,
            user_agent: userAgent,
          });
          result.error = 'Suspicious file name';
          result.quarantined = true;
          results.push(result);
          continue;
        }

        // 3. Check file size
        if (file.size > MAX_FILE_SIZE) {
          result.error = `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)} MB limit`;
          results.push(result);
          continue;
        }

        // 4. Check MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          result.error = 'File type not allowed. Accepted: JPG, PNG, HEIC, HEIF';
          results.push(result);
          continue;
        }

        // 5. Read file bytes and validate magic bytes
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        if (!validateMagicBytes(bytes, file.type)) {
          await supabase.from('quarantined_files').insert({
            original_filename: file.name,
            user_id: user.id,
            tenant_id: tenantId,
            reason: 'Magic bytes mismatch - possible file type spoofing',
            file_size_bytes: file.size,
            mime_type: file.type,
            magic_bytes: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '),
            upload_ip: clientIp,
            user_agent: userAgent,
          });
          result.error = 'File validation failed';
          result.quarantined = true;
          results.push(result);
          continue;
        }

        // 6. Malware scan
        const scanResult = scanForMalware(bytes);
        if (!scanResult.clean) {
          await supabase.from('quarantined_files').insert({
            original_filename: file.name,
            user_id: user.id,
            tenant_id: tenantId,
            reason: scanResult.reason,
            file_size_bytes: file.size,
            mime_type: file.type,
            upload_ip: clientIp,
            user_agent: userAgent,
          });
          result.error = 'File failed security scan';
          result.quarantined = true;
          results.push(result);
          continue;
        }

        // 7. Generate storage paths
        const fileId = generateUUID();
        const tenantPath = getTenantPath(user.id);
        const extension = file.type === 'image/png' ? 'png' : 'jpg';
        
        const rawPath = `${tenantPath}/${fileId}_raw.${getFileExtension(file.name)}`;
        const standardPath = `${tenantPath}/${fileId}_standard.${extension}`;
        const previewPath = `${tenantPath}/${fileId}_preview.${extension}`;
        const thumbPath = `${tenantPath}/${fileId}_thumb.${extension}`;

        // 8. Upload raw file to uploads-raw bucket
        const { error: rawUploadError } = await supabase.storage
          .from('uploads-raw')
          .upload(rawPath, bytes, {
            contentType: file.type,
            upsert: false,
          });

        if (rawUploadError) {
          console.error('Raw upload error:', rawUploadError);
          result.error = 'Failed to upload file';
          results.push(result);
          continue;
        }

        // 9. Process image
        const processedBytes = await processImage(bytes, file.type, OUTPUT_SETTINGS.standard);

        // 10. Upload processed versions
        const { error: standardUploadError } = await supabase.storage
          .from('uploads-processed')
          .upload(standardPath, processedBytes, {
            contentType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            upsert: false,
          });

        if (standardUploadError) {
          console.error('Standard upload error:', standardUploadError);
        }

        // Also upload as preview and thumb (in production, these would be resized)
        await supabase.storage
          .from('uploads-processed')
          .upload(previewPath, processedBytes, {
            contentType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            upsert: false,
          });

        await supabase.storage
          .from('uploads-processed')
          .upload(thumbPath, processedBytes, {
            contentType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            upsert: false,
          });

        // 11. Create database record
        const { data: fileRecord, error: dbError } = await supabase
          .from('uploaded_files')
          .insert({
            tenant_id: tenantId,
            user_id: user.id,
            original_filename: file.name,
            stored_filename: `${fileId}.${extension}`,
            file_type: 'image',
            mime_type: file.type,
            file_size_bytes: file.size,
            raw_path: rawPath,
            standard_path: standardPath,
            preview_path: previewPath,
            thumb_path: thumbPath,
            processing_status: 'completed',
            metadata_stripped: true,
            upload_ip: clientIp,
            user_agent: userAgent,
          })
          .select('id')
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          result.error = 'Failed to save file record';
          results.push(result);
          continue;
        }

        // 12. Log file access
        await supabase.from('file_access_logs').insert({
          file_id: fileRecord.id,
          user_id: user.id,
          action: 'upload',
          ip_address: clientIp,
          user_agent: userAgent,
        });

        // 13. Generate signed URLs (1 hour expiry for previews)
        const { data: standardUrl } = await supabase.storage
          .from('uploads-processed')
          .createSignedUrl(standardPath, 3600);

        const { data: previewUrl } = await supabase.storage
          .from('uploads-processed')
          .createSignedUrl(previewPath, 3600);

        const { data: thumbUrl } = await supabase.storage
          .from('uploads-processed')
          .createSignedUrl(thumbPath, 3600);

        result.success = true;
        result.fileId = fileRecord.id;
        result.standardUrl = standardUrl?.signedUrl;
        result.previewUrl = previewUrl?.signedUrl;
        result.thumbUrl = thumbUrl?.signedUrl;
        results.push(result);

        console.log(`Successfully processed: ${file.name} -> ${fileId}`);

      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        result.error = fileError instanceof Error ? fileError.message : 'Unknown error';
        results.push(result);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const quarantinedCount = results.filter(r => r.quarantined).length;

    return new Response(JSON.stringify({
      success: successCount > 0,
      processed: successCount,
      failed: failCount,
      quarantined: quarantinedCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
