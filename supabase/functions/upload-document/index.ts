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

// File type configurations with size limits
const FILE_CONFIGS: Record<string, { maxSize: number; mimeTypes: string[]; magicBytes?: number[][] }> = {
  // Documents
  pdf: { 
    maxSize: 25 * 1024 * 1024, 
    mimeTypes: ['application/pdf'],
    magicBytes: [[0x25, 0x50, 0x44, 0x46]] // %PDF
  },
  docx: { 
    maxSize: 25 * 1024 * 1024, 
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    magicBytes: [[0x50, 0x4B, 0x03, 0x04]] // PK (ZIP format)
  },
  xlsx: { 
    maxSize: 25 * 1024 * 1024, 
    mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    magicBytes: [[0x50, 0x4B, 0x03, 0x04]]
  },
  pptx: { 
    maxSize: 25 * 1024 * 1024, 
    mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    magicBytes: [[0x50, 0x4B, 0x03, 0x04]]
  },
  txt: { maxSize: 25 * 1024 * 1024, mimeTypes: ['text/plain'] },
  rtf: { 
    maxSize: 25 * 1024 * 1024, 
    mimeTypes: ['application/rtf', 'text/rtf'],
    magicBytes: [[0x7B, 0x5C, 0x72, 0x74, 0x66]] // {\rtf
  },
  
  // CSV (larger limit)
  csv: { maxSize: 50 * 1024 * 1024, mimeTypes: ['text/csv', 'application/csv'] },
  
  // Images
  jpg: { 
    maxSize: 15 * 1024 * 1024, 
    mimeTypes: ['image/jpeg'],
    magicBytes: [[0xFF, 0xD8, 0xFF]]
  },
  jpeg: { 
    maxSize: 15 * 1024 * 1024, 
    mimeTypes: ['image/jpeg'],
    magicBytes: [[0xFF, 0xD8, 0xFF]]
  },
  png: { 
    maxSize: 15 * 1024 * 1024, 
    mimeTypes: ['image/png'],
    magicBytes: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]]
  },
  tif: { 
    maxSize: 15 * 1024 * 1024, 
    mimeTypes: ['image/tiff'],
    magicBytes: [[0x49, 0x49, 0x2A, 0x00], [0x4D, 0x4D, 0x00, 0x2A]] // Little/Big endian
  },
  tiff: { 
    maxSize: 15 * 1024 * 1024, 
    mimeTypes: ['image/tiff'],
    magicBytes: [[0x49, 0x49, 0x2A, 0x00], [0x4D, 0x4D, 0x00, 0x2A]]
  },
  heic: { maxSize: 15 * 1024 * 1024, mimeTypes: ['image/heic'] },
  heif: { maxSize: 15 * 1024 * 1024, mimeTypes: ['image/heif'] },
  
  // Audio
  mp3: { 
    maxSize: 50 * 1024 * 1024, 
    mimeTypes: ['audio/mpeg', 'audio/mp3'],
    magicBytes: [[0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0x49, 0x44, 0x33]] // Various MP3 headers
  },
  wav: { 
    maxSize: 50 * 1024 * 1024, 
    mimeTypes: ['audio/wav', 'audio/wave'],
    magicBytes: [[0x52, 0x49, 0x46, 0x46]] // RIFF
  },
  
  // Video
  mp4: { 
    maxSize: 250 * 1024 * 1024, 
    mimeTypes: ['video/mp4'],
    magicBytes: [[0x00, 0x00, 0x00]] // ftyp at offset 4
  },
  
  // Archives
  zip: { 
    maxSize: 100 * 1024 * 1024, 
    mimeTypes: ['application/zip', 'application/x-zip-compressed'],
    magicBytes: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06], [0x50, 0x4B, 0x07, 0x08]]
  },
  
  // Data formats
  json: { maxSize: 10 * 1024 * 1024, mimeTypes: ['application/json', 'text/json'] },
  xml: { maxSize: 10 * 1024 * 1024, mimeTypes: ['application/xml', 'text/xml'] },
};

// Blocked file extensions
const BLOCKED_EXTENSIONS = [
  'svg', 'html', 'htm', 'js', 'mjs', 'cjs',
  'exe', 'bat', 'cmd', 'ps1', 'sh', 'bash',
  'jar', 'vbs', 'scr', 'dll', 'sys',
  'iso', 'img', 'dmg',
  'docm', 'xlsm', 'pptm', // Macro-enabled Office files
  'php', 'asp', 'aspx', 'jsp', 'py', 'rb', 'pl',
];

interface ProcessingResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
  quarantined?: boolean;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

function hasDoubleExtension(filename: string): boolean {
  const parts = filename.split('.');
  if (parts.length <= 2) return false;
  
  const middleExtensions = parts.slice(1, -1);
  return middleExtensions.some(ext => BLOCKED_EXTENSIONS.includes(ext.toLowerCase()));
}

function isBlockedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  return BLOCKED_EXTENSIONS.includes(ext);
}

function validateMagicBytes(bytes: Uint8Array, extension: string): boolean {
  const config = FILE_CONFIGS[extension];
  if (!config?.magicBytes) return true; // No magic bytes defined, skip check
  
  return config.magicBytes.some(pattern => {
    return pattern.every((byte, index) => bytes[index] === byte);
  });
}

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
  
  // Check for executable headers
  if (bytes[0] === 0x4D && bytes[1] === 0x5A) {
    return { clean: false, reason: 'Executable content detected' };
  }
  
  // Check for PowerShell
  if (textContent.includes('powershell') || textContent.includes('Invoke-Expression')) {
    return { clean: false, reason: 'PowerShell content detected' };
  }
  
  return { clean: true };
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

    // Validate total size (300 MB max)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 300 * 1024 * 1024) {
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
        const extension = getFileExtension(file.name);
        console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}, ext: ${extension}`);

        // 1. Check for blocked extensions
        if (isBlockedExtension(file.name)) {
          await supabase.from('quarantined_files').insert({
            original_filename: file.name,
            user_id: user.id,
            tenant_id: tenantId,
            reason: `Blocked file extension: ${extension}`,
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

        // 3. Check if extension is allowed
        const config = FILE_CONFIGS[extension];
        if (!config) {
          result.error = `File type not supported: ${extension}`;
          results.push(result);
          continue;
        }

        // 4. Check file size against type-specific limit
        if (file.size > config.maxSize) {
          result.error = `File size exceeds ${Math.round(config.maxSize / (1024 * 1024))} MB limit for ${extension} files`;
          results.push(result);
          continue;
        }

        // 5. Validate MIME type
        if (!config.mimeTypes.includes(file.type) && file.type !== 'application/octet-stream') {
          console.log(`MIME type mismatch: expected ${config.mimeTypes.join('/')}, got ${file.type}`);
          // Allow with warning - browser MIME detection isn't always accurate
        }

        // 6. Read file and validate magic bytes
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        if (!validateMagicBytes(bytes, extension)) {
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

        // 7. Malware scan (skip for binary formats like images, audio, video)
        const skipMalwareScan = ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'heic', 'heif', 'mp3', 'wav', 'mp4', 'zip'].includes(extension);
        if (!skipMalwareScan) {
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
        }

        // 8. Generate storage path
        const fileId = generateUUID();
        const tenantPath = getTenantPath(user.id);
        const storedPath = `${tenantPath}/${fileId}.${extension}`;

        // 9. Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('uploads-processed')
          .upload(storedPath, bytes, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          result.error = 'Failed to upload file';
          results.push(result);
          continue;
        }

        // 10. Determine file type category
        let fileType = 'document';
        if (['jpg', 'jpeg', 'png', 'tif', 'tiff', 'heic', 'heif'].includes(extension)) {
          fileType = 'image';
        } else if (['mp3', 'wav'].includes(extension)) {
          fileType = 'audio';
        } else if (['mp4'].includes(extension)) {
          fileType = 'video';
        } else if (['zip'].includes(extension)) {
          fileType = 'archive';
        } else if (['json', 'xml', 'csv'].includes(extension)) {
          fileType = 'data';
        }

        // 11. Create database record
        const { data: fileRecord, error: dbError } = await supabase
          .from('uploaded_files')
          .insert({
            tenant_id: tenantId,
            user_id: user.id,
            original_filename: file.name,
            stored_filename: `${fileId}.${extension}`,
            file_type: fileType,
            mime_type: file.type,
            file_size_bytes: file.size,
            standard_path: storedPath,
            processing_status: 'completed',
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

        // 13. Generate signed URL (4 hours for documents)
        const { data: signedUrl } = await supabase.storage
          .from('uploads-processed')
          .createSignedUrl(storedPath, 14400);

        result.success = true;
        result.fileId = fileRecord.id;
        result.url = signedUrl?.signedUrl;
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
