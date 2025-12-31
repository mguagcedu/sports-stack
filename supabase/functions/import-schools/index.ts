import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SchoolRow {
  NCESSCH: string;
  LEAID: string;
  LEA_NAME: string;
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

// Column name mapping for flexible parsing
const columnMappings: Record<string, keyof SchoolRow> = {
  'NCESSCH': 'NCESSCH',
  'NCES_ID': 'NCESSCH',
  'SCHOOL_ID': 'NCESSCH',
  'LEAID': 'LEAID',
  'LEA_ID': 'LEAID',
  'DISTRICT_ID': 'LEAID',
  'LEA_NAME': 'LEA_NAME',
  'DISTRICT_NAME': 'LEA_NAME',
  'SCH_NAME': 'SCH_NAME',
  'SCHOOL_NAME': 'SCH_NAME',
  'NAME': 'SCH_NAME',
  'ST': 'ST',
  'STATE': 'ST',
  'LSTREET1': 'LSTREET1',
  'ADDRESS': 'LSTREET1',
  'STREET': 'LSTREET1',
  'LCITY': 'LCITY',
  'CITY': 'LCITY',
  'LZIP': 'LZIP',
  'ZIP': 'LZIP',
  'ZIPCODE': 'LZIP',
  'PHONE': 'PHONE',
  'TELEPHONE': 'PHONE',
  'WEBSITE': 'WEBSITE',
  'WEB': 'WEBSITE',
  'URL': 'WEBSITE',
  'SCH_TYPE_TEXT': 'SCH_TYPE_TEXT',
  'SCHOOL_TYPE': 'SCH_TYPE_TEXT',
  'TYPE': 'SCH_TYPE_TEXT',
  'LEVEL': 'LEVEL',
  'SCHOOL_LEVEL': 'LEVEL',
  'SY_STATUS_TEXT': 'SY_STATUS_TEXT',
  'STATUS': 'SY_STATUS_TEXT',
  'OPERATIONAL_STATUS': 'SY_STATUS_TEXT',
  'LAT': 'LAT',
  'LATITUDE': 'LAT',
  'LON': 'LON',
  'LONGITUDE': 'LON',
  'LNG': 'LON',
  'CNTY': 'CNTY',
  'COUNTY': 'CNTY',
};

function normalizeColumnName(name: string): string {
  return name.toUpperCase().trim().replace(/[^A-Z0-9_]/g, '');
}

function mapHeaders(headers: string[]): Record<number, keyof SchoolRow> {
  const mapping: Record<number, keyof SchoolRow> = {};
  headers.forEach((header, index) => {
    const normalized = normalizeColumnName(header);
    if (columnMappings[normalized]) {
      mapping[index] = columnMappings[normalized];
    }
  });
  return mapping;
}

function parseCSV(csvText: string): SchoolRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const headerMapping = mapHeaders(headers);
  
  console.log('CSV Headers found:', headers.slice(0, 20).join(', '));
  console.log('Mapped columns:', Object.values(headerMapping).join(', '));
  
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
    
    const row: Partial<SchoolRow> = {};
    Object.entries(headerMapping).forEach(([indexStr, field]) => {
      const index = parseInt(indexStr);
      row[field] = values[index] || '';
    });
    
    rows.push(row as SchoolRow);
  }
  
  return rows;
}

function parseExcel(buffer: ArrayBuffer): SchoolRow[] {
  console.log('Parsing Excel file...');
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Get raw data as array of arrays
  const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
  
  if (rawData.length < 2) {
    console.log('Excel file has no data rows');
    return [];
  }
  
  const headers = (rawData[0] as string[]).map(h => String(h || ''));
  const headerMapping = mapHeaders(headers);
  
  console.log('Excel Headers found:', headers.slice(0, 20).join(', '));
  console.log('Mapped columns:', Object.values(headerMapping).join(', '));
  
  const rows: SchoolRow[] = [];
  for (let i = 1; i < rawData.length; i++) {
    const rowData = rawData[i] as string[];
    if (!rowData || rowData.length === 0) continue;
    
    const row: Partial<SchoolRow> = {};
    Object.entries(headerMapping).forEach(([indexStr, field]) => {
      const index = parseInt(indexStr);
      row[field] = String(rowData[index] || '');
    });
    
    // Skip empty rows
    if (!row.NCESSCH && !row.SCH_NAME) continue;
    
    rows.push(row as SchoolRow);
  }
  
  return rows;
}

async function extractAndUpsertDistricts(
  supabase: any,
  rows: SchoolRow[]
): Promise<Map<string, string>> {
  console.log('Extracting unique districts from school data...');
  
  // Extract unique districts
  const districtData = new Map<string, { name: string; state: string }>();
  rows.forEach(row => {
    if (row.LEAID && !districtData.has(row.LEAID)) {
      districtData.set(row.LEAID, {
        name: row.LEA_NAME || `District ${row.LEAID}`,
        state: row.ST || '',
      });
    }
  });
  
  console.log(`Found ${districtData.size} unique districts in school data`);
  
  if (districtData.size === 0) {
    return new Map();
  }
  
  // Upsert districts in batches
  const batchSize = 500;
  const districtEntries = Array.from(districtData.entries());
  
  for (let i = 0; i < districtEntries.length; i += batchSize) {
    const batch = districtEntries.slice(i, i + batchSize);
    const districts = batch.map(([ncesId, data]) => ({
      nces_id: ncesId,
      name: data.name,
      state: data.state,
    }));
    
    const { error } = await supabase
      .from('districts')
      .upsert(districts, { 
        onConflict: 'nces_id',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`District batch ${Math.floor(i / batchSize)} error:`, error);
    } else {
      console.log(`Upserted district batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(districtEntries.length / batchSize)}`);
    }
  }
  
  // Fetch all districts to build the mapping
  const { data: allDistricts } = await supabase
    .from('districts')
    .select('id, nces_id');
  
  const districtMap = new Map<string, string>();
  (allDistricts as { id: string; nces_id: string }[] | null)?.forEach(d => districtMap.set(d.nces_id, d.id));
  
  console.log(`District mapping complete: ${districtMap.size} districts available`);
  return districtMap;
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

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${isExcel ? 'Excel' : 'CSV'}`);

    let rows: SchoolRow[];
    
    if (isExcel) {
      const buffer = await file.arrayBuffer();
      rows = parseExcel(buffer);
    } else {
      const csvText = await file.text();
      rows = parseCSV(csvText);
    }
    
    console.log(`Parsed ${rows.length} schools from ${isExcel ? 'Excel' : 'CSV'}`);
    if (rows.length > 0) {
      console.log('Sample row:', JSON.stringify(rows[0]).slice(0, 500));
    }

    // Auto-extract and upsert districts from school data
    const districtMap = await extractAndUpsertDistricts(supabase, rows);
    const districtsCreated = districtMap.size;

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
      districtsCreated,
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
