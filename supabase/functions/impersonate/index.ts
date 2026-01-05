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

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

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

    // Check if user is superadmin or system_admin
    const { data: isSuperadmin } = await supabase.rpc('is_superadmin', { _user_id: user.id });
    const { data: isSystemAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'system_admin' });

    if (!isSuperadmin && !isSystemAdmin) {
      // Log unauthorized attempt
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        entity_type: 'impersonation',
        action: 'unauthorized_attempt',
        old_data: null,
        new_data: { attempted_at: new Date().toISOString() },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });
      
      return new Response(JSON.stringify({ error: 'Superadmin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, target_user_id, session_id, reason } = body;

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (action === 'start') {
      // Start impersonation session
      if (!target_user_id || !reason) {
        return new Response(JSON.stringify({ error: 'target_user_id and reason are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Cannot impersonate self
      if (target_user_id === user.id) {
        return new Response(JSON.stringify({ error: 'Cannot impersonate yourself' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check target user exists
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .eq('id', target_user_id)
        .single();

      if (!targetUser) {
        return new Response(JSON.stringify({ error: 'Target user not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if another session is already active
      const { data: activeSession } = await supabase
        .from('impersonation_sessions')
        .select('id')
        .eq('superadmin_id', user.id)
        .is('ended_at', null)
        .single();

      if (activeSession) {
        return new Response(JSON.stringify({ error: 'An impersonation session is already active. End it first.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create impersonation session
      const { data: session, error: sessionError } = await supabase
        .from('impersonation_sessions')
        .insert({
          superadmin_id: user.id,
          target_user_id: target_user_id,
          reason: reason,
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return new Response(JSON.stringify({ error: 'Failed to create impersonation session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log to audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        entity_type: 'impersonation',
        entity_id: session.id,
        action: 'start_impersonation',
        old_data: null,
        new_data: {
          target_user_id,
          target_email: targetUser.email,
          reason,
          session_id: session.id,
        },
        ip_address: clientIp,
        user_agent: userAgent,
        impersonator_id: user.id,
        compliance_tags: ['god_mode', 'privileged_access'],
      });

      // Get target user's roles for context
      const { data: targetRoles } = await supabase
        .from('user_roles')
        .select('role, organization_id, district_id, school_id')
        .eq('user_id', target_user_id);

      return new Response(JSON.stringify({
        success: true,
        session_id: session.id,
        target_user: {
          id: targetUser.id,
          email: targetUser.email,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
          roles: targetRoles,
        },
        message: 'Impersonation session started. All actions will be logged.',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'end') {
      // End impersonation session
      if (!session_id) {
        return new Response(JSON.stringify({ error: 'session_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get the session
      const { data: session, error: sessionError } = await supabase
        .from('impersonation_sessions')
        .select('*')
        .eq('id', session_id)
        .eq('superadmin_id', user.id)
        .single();

      if (sessionError || !session) {
        return new Response(JSON.stringify({ error: 'Session not found or unauthorized' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (session.ended_at) {
        return new Response(JSON.stringify({ error: 'Session already ended' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // End the session
      const { error: updateError } = await supabase
        .from('impersonation_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', session_id);

      if (updateError) {
        console.error('Session end error:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to end session' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log to audit log
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        entity_type: 'impersonation',
        entity_id: session_id,
        action: 'end_impersonation',
        old_data: {
          started_at: session.started_at,
          target_user_id: session.target_user_id,
        },
        new_data: {
          ended_at: new Date().toISOString(),
          actions_count: session.actions_count,
        },
        ip_address: clientIp,
        user_agent: userAgent,
        impersonator_id: user.id,
        compliance_tags: ['god_mode', 'privileged_access'],
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Impersonation session ended',
        session: {
          id: session_id,
          started_at: session.started_at,
          ended_at: new Date().toISOString(),
          actions_count: session.actions_count,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'log_action') {
      // Log an action during impersonation
      if (!session_id) {
        return new Response(JSON.stringify({ error: 'session_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { action_type, action_details } = body;

      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        entity_type: action_type || 'impersonated_action',
        action: 'impersonated_action',
        new_data: {
          session_id,
          action_details,
        },
        ip_address: clientIp,
        user_agent: userAgent,
        impersonator_id: user.id,
        session_id: session_id,
        compliance_tags: ['god_mode', 'impersonated'],
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'list_sessions') {
      // List impersonation sessions for admin
      const { data: sessions, error: listError } = await supabase
        .from('impersonation_sessions')
        .select(`
          id,
          target_user_id,
          reason,
          started_at,
          ended_at,
          actions_count
        `)
        .eq('superadmin_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (listError) {
        return new Response(JSON.stringify({ error: 'Failed to list sessions' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        sessions,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use: start, end, log_action, list_sessions' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Impersonation error:', error);
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
