import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

interface ExtractedEvent {
  name: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  venue_name?: string;
  venue_address?: string;
}

// Helper to convert file to base64
async function fileToBase64(file: Uint8Array, mimeType: string): Promise<string> {
  const base64 = btoa(String.fromCharCode(...file));
  return `data:${mimeType};base64,${base64}`;
}

// Helper to detect mime type from magic bytes
function detectMimeType(bytes: Uint8Array): string {
  // PDF: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }
  // DOCX/XLSX/PPTX (ZIP format)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  // DOC (older Word)
  if (bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0) {
    return 'application/msword';
  }
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }
  // JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }
  return 'application/octet-stream';
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    let imageBase64: string | undefined;
    let url: string | undefined;
    let text: string | undefined;
    let documentBase64: string | undefined;
    let documentType: string | undefined;

    // Handle multipart form data for file uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      url = formData.get('url') as string | null || undefined;
      text = formData.get('text') as string | null || undefined;

      if (file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const mimeType = file.type || detectMimeType(bytes);
        
        console.log('Received file:', file.name, 'type:', mimeType, 'size:', bytes.length);
        
        if (mimeType.startsWith('image/')) {
          imageBase64 = await fileToBase64(bytes, mimeType);
        } else {
          documentBase64 = await fileToBase64(bytes, mimeType);
          documentType = mimeType;
        }
      }
    } else {
      // Handle JSON body
      const body = await req.json();
      imageBase64 = body.imageBase64;
      url = body.url;
      text = body.text;
      documentBase64 = body.documentBase64;
      documentType = body.documentType;
    }

    const prompt = `You are a schedule extraction assistant. Extract all events/games from the provided schedule and return them as a JSON array.

For each event, extract:
- name: The event name (e.g., "vs Lincoln High" or "Basketball Practice")
- event_type: One of "game", "practice", "tournament", or "meeting"
- start_time: ISO 8601 datetime string (use current year 2026 if not specified, assume reasonable times if only date given)
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
      console.log('Processing image...');
      content = [
        { type: "text", text: prompt },
        { 
          type: "image_url", 
          image_url: { 
            url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
          } 
        }
      ];
    } else if (documentBase64) {
      // For documents (PDF, Word, etc.), include as image since Gemini can process them
      console.log('Processing document of type:', documentType);
      content = [
        { type: "text", text: `${prompt}\n\nThis is a document file. Please extract any schedule or event information from it.` },
        { 
          type: "image_url", 
          image_url: { url: documentBase64 } 
        }
      ];
    } else if (text) {
      console.log('Processing text input...');
      content = [
        { type: "text", text: `${prompt}\n\nSchedule text:\n${text}` }
      ];
    } else if (url) {
      console.log('Processing URL:', url);
      // Try to fetch the URL content
      try {
        const urlResponse = await fetch(url);
        const urlContentType = urlResponse.headers.get('content-type') || '';
        
        if (urlContentType.startsWith('image/')) {
          // Direct image URL
          const imageBytes = new Uint8Array(await urlResponse.arrayBuffer());
          const base64 = await fileToBase64(imageBytes, urlContentType.split(';')[0]);
          content = [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: base64 } }
          ];
        } else if (urlContentType.includes('text/html')) {
          // HTML page - extract text content
          const htmlText = await urlResponse.text();
          // Simple HTML to text conversion
          const textContent = htmlText
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 10000); // Limit to 10k chars
          
          content = [
            { type: "text", text: `${prompt}\n\nWebpage content from ${url}:\n${textContent}` }
          ];
        } else if (urlContentType.includes('application/pdf') || urlContentType.includes('application/')) {
          // Document from URL
          const docBytes = new Uint8Array(await urlResponse.arrayBuffer());
          const base64 = await fileToBase64(docBytes, urlContentType.split(';')[0]);
          content = [
            { type: "text", text: `${prompt}\n\nDocument from URL: ${url}` },
            { type: "image_url", image_url: { url: base64 } }
          ];
        } else {
          // Plain text or other
          const textContent = await urlResponse.text();
          content = [
            { type: "text", text: `${prompt}\n\nContent from ${url}:\n${textContent.slice(0, 10000)}` }
          ];
        }
      } catch (fetchError) {
        console.error('Error fetching URL:', fetchError);
        // Fallback: just ask AI about the URL
        content = [
          { type: "text", text: `${prompt}\n\nPlease note: I could not fetch the URL directly. The URL provided was: ${url}\n\nIf you have any knowledge about this URL or can infer schedule information, please provide it. Otherwise, return {"events": []}.` }
        ];
      }
    } else {
      throw new Error("No schedule content provided. Please upload an image, document, paste text, or provide a URL.");
    }

    console.log('Sending request to AI...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI processing failed. Please try again or use a different format.`);
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

    console.log("Extracted events:", events.length);

    return new Response(
      JSON.stringify({ events, raw: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error occurred";
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    return new Response(
      JSON.stringify({ error: message, events: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
