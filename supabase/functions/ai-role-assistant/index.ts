import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

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
4. Suggested questions to ask if more info needed`;
        userPrompt = `Analyze this role request:
- Requested Role: ${data.requested_role}
- User Email: ${data.user_email}
- Organization: ${data.organization_name || "Not specified"}
- Justification: ${data.justification || "None provided"}`;
        break;

      case "suggest_role":
        systemPrompt = `You are an AI assistant helping determine the most appropriate role for a new user in a school athletics management system.
Based on their background and needs, suggest the most appropriate role(s) from:
- coach, assistant_coach, team_manager (for staff)
- parent, athlete (for families)
- athletic_director, registrar (for school administrators)
Keep suggestions practical and security-conscious.`;
        userPrompt = `Based on this user's description, suggest appropriate roles:
${data.description}`;
        break;

      case "bulk_analyze":
        systemPrompt = `You are an AI assistant helping review multiple pending role requests efficiently.
Provide a summary analysis of all requests, grouping them by risk level and recommendation.
Be concise but thorough.`;
        userPrompt = `Analyze these ${data.requests.length} pending requests:
${data.requests.map((r: any, i: number) => `${i + 1}. ${r.requested_role} - ${r.user_email}: "${r.justification || 'No justification'}"`).join("\n")}`;
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
