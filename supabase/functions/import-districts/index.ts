import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DistrictRow {
  LEAID: string;
  ST_LEAID: string;
  LEA_NAME: string;
  ST: string;
  STATENAME: string;
  LSTREET1: string;
  LCITY: string;
  LZIP: string;
  LZIP4: string;
  PHONE: string;
  WEBSITE: string;
  LEA_TYPE: string;
  LEA_TYPE_TEXT: string;
  CHARTER_LEA: string;
  SY_STATUS: string;
  SY_STATUS_TEXT: string;
  GSLO: string;
  GSHI: string;
  OPERATIONAL_SCHOOLS: string;
}

function parseCSV(csvText: string): DistrictRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const rows: DistrictRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Handle quoted fields with commas
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as unknown as DistrictRow);
  }
  
  return rows;
}

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

    // Verify user is system_admin
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

    // Check if user is system_admin
    const { data: hasRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'system_admin'
    });

    if (!hasRole) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`);

    const csvText = await file.text();
    const rows = parseCSV(csvText);
    
    console.log(`Parsed ${rows.length} districts from CSV`);

    let inserted = 0;
    let updated = 0;
    let errors: string[] = [];
    const batchSize = 500;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const districts = batch.map(row => ({
        nces_id: row.LEAID,
        state_lea_id: row.ST_LEAID,
        name: row.LEA_NAME,
        state: row.ST,
        state_name: row.STATENAME,
        address: row.LSTREET1,
        city: row.LCITY,
        zip: row.LZIP,
        zip4: row.LZIP4,
        phone: row.PHONE,
        website: row.WEBSITE,
        lea_type: row.LEA_TYPE,
        lea_type_text: row.LEA_TYPE_TEXT,
        charter_lea: row.CHARTER_LEA,
        operational_status: row.SY_STATUS,
        operational_status_text: row.SY_STATUS_TEXT,
        lowest_grade: row.GSLO,
        highest_grade: row.GSHI,
        operational_schools: parseInt(row.OPERATIONAL_SCHOOLS) || 0,
      }));

      const { data, error } = await supabase
        .from('districts')
        .upsert(districts, { 
          onConflict: 'nces_id',
          ignoreDuplicates: false 
        })
        .select('id');

      if (error) {
        console.error(`Batch ${i / batchSize} error:`, error);
        errors.push(`Batch ${i / batchSize}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      total: rows.length,
      inserted,
      updated,
      errors: errors.length > 0 ? errors : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
