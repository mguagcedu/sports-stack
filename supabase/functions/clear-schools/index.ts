import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // First verify user has system_admin role using their auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} requesting to clear schools`);

    // Check if user has system_admin role
    const { data: hasRole, error: roleError } = await userClient.rpc("has_role", {
      _user_id: user.id,
      _role: "system_admin",
    });

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Failed to verify permissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasRole) {
      console.warn(`User ${user.id} denied: not system_admin`);
      return new Response(
        JSON.stringify({ error: "Forbidden: system_admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client to perform deletion
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get count before deletion
    const { count: beforeCount, error: countError } = await adminClient
      .from("schools")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Count error:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to count schools" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const schoolCount = beforeCount || 0;
    console.log(`Deleting ${schoolCount} schools...`);

    // Delete all schools
    const { error: deleteError } = await adminClient
      .from("schools")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete schools: " + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log to audit_logs
    const { error: auditError } = await adminClient.from("audit_logs").insert({
      action: "clear_all_schools",
      entity_type: "schools",
      user_id: user.id,
      new_data: { deleted_count: schoolCount },
    });

    if (auditError) {
      console.warn("Failed to create audit log:", auditError);
      // Don't fail the operation for audit log errors
    }

    console.log(`Successfully deleted ${schoolCount} schools`);

    return new Response(
      JSON.stringify({
        success: true,
        deletedCount: schoolCount,
        message: `Successfully deleted ${schoolCount.toLocaleString()} schools`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
