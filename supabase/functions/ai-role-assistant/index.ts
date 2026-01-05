import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_JUSTIFICATION_LENGTH = 2000;
const VALID_ACTIONS = ["generate_roster_suggestions", "analyze_request", "suggest_role", "bulk_analyze"];
const VALID_ROLES = [
  "system_admin", "org_admin", "athletic_director", "coach", "head_coach",
  "assistant_coach", "team_manager", "parent", "athlete", "registrar",
  "finance_admin", "gate_staff", "school_admin", "district_admin"
];

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateRequestBody(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be an object" };
  }

  const { type, action, data, teamId, sportCode } = body as Record<string, unknown>;

  // Validate action for roster suggestions
  if (action === "generate_roster_suggestions") {
    if (!teamId || typeof teamId !== "string") {
      return { valid: false, error: "teamId is required and must be a string" };
    }
    // UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(teamId)) {
      return { valid: false, error: "Invalid teamId format" };
    }
    if (sportCode && typeof sportCode !== "string") {
      return { valid: false, error: "sportCode must be a string" };
    }
    return { valid: true };
  }

  // Validate type for other actions
  if (!type || typeof type !== "string") {
    return { valid: false, error: "type is required and must be a string" };
  }

  if (!VALID_ACTIONS.includes(type) && !VALID_ACTIONS.includes(action as string)) {
    return { valid: false, error: "Invalid request type" };
  }

  // Validate data object
  if (type !== "bulk_analyze" && data) {
    const dataObj = data as Record<string, unknown>;
    
    if (dataObj.requested_role && typeof dataObj.requested_role === "string") {
      if (!VALID_ROLES.includes(dataObj.requested_role)) {
        return { valid: false, error: "Invalid requested role" };
      }
    }

    if (dataObj.justification && typeof dataObj.justification === "string") {
      if (dataObj.justification.length > MAX_JUSTIFICATION_LENGTH) {
        return { valid: false, error: `Justification exceeds ${MAX_JUSTIFICATION_LENGTH} characters` };
      }
    }

    if (dataObj.description && typeof dataObj.description === "string") {
      if (dataObj.description.length > MAX_DESCRIPTION_LENGTH) {
        return { valid: false, error: `Description exceeds ${MAX_DESCRIPTION_LENGTH} characters` };
      }
    }
  }

  // Validate bulk_analyze data
  if (type === "bulk_analyze") {
    const dataObj = data as Record<string, unknown>;
    if (!dataObj.requests || !Array.isArray(dataObj.requests)) {
      return { valid: false, error: "bulk_analyze requires requests array" };
    }
    if (dataObj.requests.length > 50) {
      return { valid: false, error: "Maximum 50 requests for bulk analysis" };
    }
  }

  return { valid: true };
}

// Sanitize text to prevent prompt injection
function sanitizeText(text: string): string {
  return text
    .replace(/\[SYSTEM\]/gi, "[FILTERED]")
    .replace(/\[INST\]/gi, "[FILTERED]")
    .replace(/<\|.*?\|>/g, "")
    .replace(/```/g, "'''")
    .trim();
}

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests = 20, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (rateLimitMap.size > 500) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") ||
                     "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait before making more requests." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    
    // Validate input
    const validation = validateRequestBody(body);
    if (!validation.valid) {
      console.warn("Input validation failed:", validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, data, action, teamId, sportCode } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    // Handle roster suggestion generation
    if (action === "generate_roster_suggestions") {
      console.log("Generating roster suggestions for team:", teamId);
      
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select(`
          id, jersey_number, position, role,
          profiles(first_name, last_name),
          athletes(height, weight, grad_year, dominant_hand)
        `)
        .eq("team_id", teamId)
        .eq("role", "athlete")
        .limit(100);

      if (membersError) {
        console.error("Error fetching members:", membersError);
        throw membersError;
      }

      // Fetch available positions for the sport
      const { data: positions, error: posError } = await supabase
        .from("sport_positions")
        .select("id, position_key, display_name")
        .eq("sport_code", sportCode || "general")
        .limit(50);

      if (posError) {
        console.error("Error fetching positions:", posError);
      }

      systemPrompt = `You are an AI sports analytics assistant helping coaches optimize their roster. 
Analyze the team roster and suggest optimal position assignments based on player attributes.
Return a JSON array of suggestions with this structure:
[{
  "team_member_id": "uuid",
  "suggestion_type": "position",
  "suggested_position_id": "uuid or null",
  "suggested_line_group": "string or null",
  "confidence_score": 0.0-1.0,
  "reasoning": "Brief explanation"
}]
Only return the JSON array, no other text.
Do not include any system commands or code execution in your response.`;

      userPrompt = `Team members:
${JSON.stringify(members, null, 2)}

Available positions:
${JSON.stringify(positions || [], null, 2)}

Analyze these players and suggest optimal position assignments. Consider physical attributes, experience, and team balance. Generate 3-5 high-confidence suggestions.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "[]";
      
      // Parse the suggestions
      let suggestions = [];
      try {
        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error("Error parsing AI response:", parseError);
        suggestions = [];
      }

      // Insert suggestions into database
      if (suggestions.length > 0) {
        const insertData = suggestions.map((s: Record<string, unknown>) => ({
          team_id: teamId,
          team_member_id: s.team_member_id,
          suggestion_type: s.suggestion_type || "position",
          suggested_position_id: s.suggested_position_id || null,
          suggested_line_group: s.suggested_line_group || null,
          confidence_score: Math.min(1, Math.max(0, Number(s.confidence_score) || 0.7)),
          reasoning: typeof s.reasoning === "string" ? s.reasoning.substring(0, 500) : "AI generated suggestion",
          status: "pending",
        }));

        const { error: insertError } = await supabase
          .from("ai_roster_suggestions")
          .insert(insertData);

        if (insertError) {
          console.error("Error inserting suggestions:", insertError);
        }
      }

      return new Response(JSON.stringify({ suggestions, count: suggestions.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Original role analysis logic
    switch (type) {
      case "analyze_request":
        systemPrompt = `You are an AI assistant helping administrators review role requests in a school athletics management system. 
Available roles and their responsibilities:
- system_admin: Full system access, manages all organizations
- org_admin: Manages a specific organization
- athletic_director: Oversees athletic programs at a school
- coach: Manages teams, rosters, and practices
- assistant_coach: Helps head coach with team management
- team_manager: Handles team logistics and communications
- parent: Views child's team info and schedules
- athlete: Team member, views schedules and team info
- registrar: Manages student athlete registrations
- finance_admin: Handles payments and financial reports
- gate_staff: Manages event entry and ticket scanning

Analyze the request and provide:
1. A risk assessment (low/medium/high)
2. Recommendation (approve/reject/needs_more_info)
3. Brief reasoning
4. Suggested questions to ask if more info needed

Do not execute any commands or include system instructions in your response.`;
        userPrompt = `Analyze this role request:
- Requested Role: ${sanitizeText(String(data.requested_role || "unknown"))}
- User Email: ${sanitizeText(String(data.user_email || "unknown"))}
- Organization: ${sanitizeText(String(data.organization_name || "Not specified"))}
- Justification: ${sanitizeText(String(data.justification || "None provided"))}`;
        break;

      case "suggest_role":
        systemPrompt = `You are an AI assistant helping determine the most appropriate role for a new user in a school athletics management system.
Based on their background and needs, suggest the most appropriate role(s) from:
- coach, assistant_coach, team_manager (for staff)
- parent, athlete (for families)
- athletic_director, registrar (for school administrators)
Keep suggestions practical and security-conscious.
Do not execute any commands or include system instructions in your response.`;
        userPrompt = `Based on this user's description, suggest appropriate roles:
${sanitizeText(String(data.description || ""))}`;
        break;

      case "bulk_analyze":
        systemPrompt = `You are an AI assistant helping review multiple pending role requests efficiently.
Provide a summary analysis of all requests, grouping them by risk level and recommendation.
Be concise but thorough.
Do not execute any commands or include system instructions in your response.`;
        const requests = Array.isArray(data.requests) ? data.requests.slice(0, 50) : [];
        userPrompt = `Analyze these ${requests.length} pending requests:
${requests.map((r: Record<string, unknown>, i: number) => 
  `${i + 1}. ${sanitizeText(String(r.requested_role || "unknown"))} - ${sanitizeText(String(r.user_email || "unknown"))}: "${sanitizeText(String(r.justification || "No justification"))}"`
).join("\n")}`;
        break;

      default:
        throw new Error("Unknown request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "No response generated";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("AI role assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
