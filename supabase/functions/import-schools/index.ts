import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchoolRow {
  NCESSCH: string;
  LEAID: string;
  SCH_NAME: string;
  ST: string;
  LSTREET1: string;
  LCITY: string;
  LZIP: string;
  PHONE: string;
  WEBSITE: string;
  SCH_TYPE_TEXT: string;
  LEVEL: string;
  SY_STATUS_TEXT: string;
  LAT: string;
  LON: string;
  CNTY: string;
}

function parseCSV(csvText: string): SchoolRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  console.log('CSV Headers found:', headers.slice(0, 20).join(', '));
  
  const rows: SchoolRow[] = [];
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
        values.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/"/g, ''));
    
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row as unknown as SchoolRow);
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
    
    console.log(`Parsed ${rows.length} schools from CSV`);
    if (rows.length > 0) {
      console.log('Sample row:', JSON.stringify(rows[0]).slice(0, 500));
    }

    // Get all district NCES IDs for mapping
    const { data: districts } = await supabase
      .from('districts')
      .select('id, nces_id');
    
    const districtMap = new Map<string, string>();
    districts?.forEach(d => districtMap.set(d.nces_id, d.id));
    console.log(`Loaded ${districtMap.size} districts for mapping`);

    let inserted = 0;
    let skipped = 0;
    let errors: string[] = [];
    const batchSize = 500;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const schools = batch.map(row => {
        const districtId = districtMap.get(row.LEAID) || null;
        
        return {
          nces_id: row.NCESSCH,
          district_id: districtId,
          name: row.SCH_NAME,
          state: row.ST,
          address: row.LSTREET1 || null,
          city: row.LCITY || null,
          zip: row.LZIP || null,
          phone: row.PHONE || null,
          website: row.WEBSITE || null,
          school_type: row.SCH_TYPE_TEXT || 'public',
          level: row.LEVEL || null,
          operational_status: row.SY_STATUS_TEXT || 'active',
          latitude: row.LAT ? parseFloat(row.LAT) : null,
          longitude: row.LON ? parseFloat(row.LON) : null,
          county: row.CNTY || null,
        };
      }).filter(s => s.nces_id && s.name);

      if (schools.length === 0) {
        skipped += batch.length;
        continue;
      }

      const { data, error } = await supabase
        .from('schools')
        .upsert(schools, { 
          onConflict: 'nces_id',
          ignoreDuplicates: false 
        })
        .select('id');

      if (error) {
        console.error(`Batch ${Math.floor(i / batchSize)} error:`, error);
        errors.push(`Batch ${Math.floor(i / batchSize)}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }

      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      total: rows.length,
      inserted,
      skipped,
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
