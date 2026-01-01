import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedEvent {
  name: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  venue_name?: string;
  venue_address?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, url, text } = await req.json();

    let prompt = `You are a schedule extraction assistant. Extract all events/games from the provided schedule and return them as a JSON array.

For each event, extract:
- name: The event name (e.g., "vs Lincoln High" or "Basketball Practice")
- event_type: One of "game", "practice", "tournament", or "meeting"
- start_time: ISO 8601 datetime string (use current year if not specified, assume reasonable times if only date given)
- end_time: ISO 8601 datetime string if available
- venue_name: Location/venue name if available
- venue_address: Full address if available

Return ONLY valid JSON in this format:
{
  "events": [
    {
      "name": "vs Lincoln High",
      "event_type": "game",
      "start_time": "2026-01-15T18:00:00",
      "venue_name": "Home Gymnasium"
    }
  ]
}

If no events can be extracted, return {"events": []}`;

    let content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    if (imageBase64) {
      content = [
        { type: "text", text: prompt },
        { 
          type: "image_url", 
          image_url: { 
            url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
          } 
        }
      ];
    } else if (text) {
      content = [
        { type: "text", text: `${prompt}\n\nSchedule text:\n${text}` }
      ];
    } else if (url) {
      // For URLs, try to fetch and include as image
      content = [
        { type: "text", text: `${prompt}\n\nExtract events from this URL: ${url}` }
      ];
    } else {
      throw new Error("No schedule content provided");
    }

    const response = await fetch("https://lovable.ai/api/chat-completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", aiResponse);

    // Parse the JSON from the response
    let events: ExtractedEvent[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        events = parsed.events || [];
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      // Try alternative parsing
      const eventsMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (eventsMatch) {
        events = JSON.parse(eventsMatch[0]);
      }
    }

    // Validate and clean up events
    events = events.filter(e => e.name && e.start_time).map(e => ({
      name: e.name,
      event_type: ["game", "practice", "tournament", "meeting"].includes(e.event_type) ? e.event_type : "game",
      start_time: e.start_time,
      end_time: e.end_time || undefined,
      venue_name: e.venue_name || undefined,
      venue_address: e.venue_address || undefined,
    }));

    console.log("Extracted events:", events);

    return new Response(
      JSON.stringify({ events, raw: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message, events: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
