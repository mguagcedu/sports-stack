import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedAthlete {
  name: string;
  grade?: string;
  dob?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_notes?: string;
  physical_date?: string;
  forms_status?: string;
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, image_url, text_content } = await req.json();

    if (!image_base64 && !image_url && !text_content) {
      throw new Error("Please provide image_base64, image_url, or text_content");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare messages based on input type
    const messages: any[] = [
      {
        role: "system",
        content: `You are an expert at extracting athlete registration data from documents. 
Extract all athlete information you can find, including:
- Athlete name (required)
- Grade level
- Date of birth
- Parent/Guardian name
- Parent email
- Parent phone
- Emergency contact name and phone
- Medical notes or conditions
- Physical exam date
- Forms completion status

Return your response as a JSON object with this structure:
{
  "athletes": [
    {
      "name": "Full Name",
      "grade": "11",
      "dob": "2008-05-15",
      "parent_name": "Parent Name",
      "parent_email": "parent@email.com",
      "parent_phone": "555-123-4567",
      "emergency_contact_name": "Emergency Contact",
      "emergency_contact_phone": "555-987-6543",
      "medical_notes": "Any medical notes",
      "physical_date": "2024-08-01",
      "forms_status": "complete",
      "confidence": 0.95
    }
  ],
  "extraction_notes": "Any notes about the extraction, missing data, or uncertainties"
}

Set the confidence score (0-1) based on how clearly the data was readable.
If information is missing, omit that field rather than guessing.
Handle multiple athletes if the document contains a roster or list.`,
      },
    ];

    if (image_base64) {
      // Handle uploaded image/PDF
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: image_base64,
            },
          },
          {
            type: "text",
            text: "Extract all athlete registration data from this image. Return valid JSON only.",
          },
        ],
      });
    } else if (image_url) {
      // Handle URL to image
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: image_url,
            },
          },
          {
            type: "text",
            text: "Extract all athlete registration data from this image. Return valid JSON only.",
          },
        ],
      });
    } else if (text_content) {
      // Handle pasted text
      messages.push({
        role: "user",
        content: `Extract all athlete registration data from this text. Return valid JSON only.

TEXT CONTENT:
${text_content}`,
      });
    }

    console.log("Calling Lovable AI for registration data extraction...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response received, parsing...");

    // Parse the JSON response
    let extractedData;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      
      extractedData = JSON.parse(cleanContent.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse extracted data. The AI response was not valid JSON.");
    }

    // Validate and normalize the response
    const athletes: ExtractedAthlete[] = (extractedData.athletes || []).map((a: any) => ({
      name: a.name || "Unknown",
      grade: a.grade,
      dob: a.dob,
      parent_name: a.parent_name,
      parent_email: a.parent_email,
      parent_phone: a.parent_phone,
      emergency_contact_name: a.emergency_contact_name,
      emergency_contact_phone: a.emergency_contact_phone,
      medical_notes: a.medical_notes,
      physical_date: a.physical_date,
      forms_status: a.forms_status,
      confidence: typeof a.confidence === "number" ? a.confidence : 0.7,
    }));

    const result = {
      athletes,
      source_type: image_base64 || image_url ? "image" : "text",
      extraction_notes: extractedData.extraction_notes,
    };

    console.log(`Successfully extracted ${athletes.length} athlete records`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in extract-registration-data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to extract registration data";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
