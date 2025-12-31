import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const body = await req.json();
    const { file_id, type = 'preview' } = body;

    if (!file_id) {
      return new Response(JSON.stringify({ error: 'file_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get file record
    const { data: file, error: fileError } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', file_id)
      .single();

    if (fileError || !file) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check access permissions
    const isOwner = file.user_id === user.id;
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'system_admin' });
    const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { _user_id: user.id });

    // Check tenant access if tenant-scoped
    let hasTenantAccess = false;
    if (file.tenant_id) {
      const { data: hasAccess } = await supabase.rpc('has_org_role', { 
        _user_id: user.id, 
        _org_id: file.tenant_id 
      });
      hasTenantAccess = hasAccess;
    }

    if (!isOwner && !isAdmin && !isSuperadmin && !hasTenantAccess) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine which path to use based on type
    let filePath: string | null = null;
    let expiresIn = 3600; // 1 hour default

    switch (type) {
      case 'standard':
        filePath = file.standard_path;
        expiresIn = 14400; // 4 hours for full downloads
        break;
      case 'preview':
        filePath = file.preview_path || file.standard_path;
        expiresIn = 3600; // 1 hour for previews
        break;
      case 'thumb':
        filePath = file.thumb_path || file.preview_path || file.standard_path;
        expiresIn = 1800; // 30 minutes for thumbnails
        break;
      case 'download':
        filePath = file.standard_path;
        expiresIn = 300; // 5 minutes for download links
        break;
      default:
        filePath = file.standard_path;
    }

    if (!filePath) {
      return new Response(JSON.stringify({ error: 'File path not available' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate signed URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('uploads-processed')
      .createSignedUrl(filePath, expiresIn);

    if (urlError || !signedUrl) {
      console.error('Signed URL error:', urlError);
      return new Response(JSON.stringify({ error: 'Failed to generate URL' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log file access
    await supabase.from('file_access_logs').insert({
      file_id: file_id,
      user_id: user.id,
      action: type === 'download' ? 'download' : 'view',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(JSON.stringify({
      success: true,
      url: signedUrl.signedUrl,
      expires_in: expiresIn,
      file: {
        id: file.id,
        original_filename: file.original_filename,
        file_type: file.file_type,
        mime_type: file.mime_type,
        file_size_bytes: file.file_size_bytes,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Signed URL error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
