import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DistrictRow {
  nces_id: string;
  state_lea_id: string;
  name: string;
  state: string;
  state_name: string;
  address: string;
  city: string;
  zip: string;
  zip4: string;
  phone: string;
  website: string;
  lea_type: string;
  lea_type_text: string;
  charter_lea: string;
  operational_status: string;
  operational_status_text: string;
  lowest_grade: string;
  highest_grade: string;
  operational_schools: number;
}

// Column mapping for flexible header names
const columnMappings: Record<string, keyof DistrictRow> = {
  // NCES ID variations
  'LEAID': 'nces_id',
  'LEA_ID': 'nces_id',
  'NCES_ID': 'nces_id',
  'NCES ID': 'nces_id',
  'DISTRICT_ID': 'nces_id',
  'DISTRICT ID': 'nces_id',
  
  // State LEA ID variations
  'ST_LEAID': 'state_lea_id',
  'STATE_LEA_ID': 'state_lea_id',
  'STATE LEA ID': 'state_lea_id',
  
  // Name variations
  'LEA_NAME': 'name',
  'LEA NAME': 'name',
  'DISTRICT_NAME': 'name',
  'DISTRICT NAME': 'name',
  'NAME': 'name',
  
  // State variations
  'ST': 'state',
  'STATE': 'state',
  'STATE_CODE': 'state',
  
  // State name variations
  'STATENAME': 'state_name',
  'STATE_NAME': 'state_name',
  'STATE NAME': 'state_name',
  
  // Address variations
  'LSTREET1': 'address',
  'STREET': 'address',
  'ADDRESS': 'address',
  'STREET_ADDRESS': 'address',
  
  // City variations
  'LCITY': 'city',
  'CITY': 'city',
  
  // ZIP variations
  'LZIP': 'zip',
  'ZIP': 'zip',
  'ZIPCODE': 'zip',
  'ZIP_CODE': 'zip',
  
  // ZIP4 variations
  'LZIP4': 'zip4',
  'ZIP4': 'zip4',
  
  // Phone variations
  'PHONE': 'phone',
  'TELEPHONE': 'phone',
  
  // Website variations
  'WEBSITE': 'website',
  'URL': 'website',
  'WEB': 'website',
  
  // LEA Type variations
  'LEA_TYPE': 'lea_type',
  'LEA TYPE': 'lea_type',
  'TYPE': 'lea_type',
  
  // LEA Type Text variations
  'LEA_TYPE_TEXT': 'lea_type_text',
  'LEA TYPE TEXT': 'lea_type_text',
  'TYPE_TEXT': 'lea_type_text',
  
  // Charter LEA variations
  'CHARTER_LEA': 'charter_lea',
  'CHARTER LEA': 'charter_lea',
  'CHARTER': 'charter_lea',
  
  // Status variations
  'SY_STATUS': 'operational_status',
  'STATUS': 'operational_status',
  'OPERATIONAL_STATUS': 'operational_status',
  
  // Status Text variations
  'SY_STATUS_TEXT': 'operational_status_text',
  'STATUS_TEXT': 'operational_status_text',
  
  // Grade variations
  'GSLO': 'lowest_grade',
  'LOWEST_GRADE': 'lowest_grade',
  'LOW_GRADE': 'lowest_grade',
  
  'GSHI': 'highest_grade',
  'HIGHEST_GRADE': 'highest_grade',
  'HIGH_GRADE': 'highest_grade',
  
  // Operational schools variations
  'OPERATIONAL_SCHOOLS': 'operational_schools',
  'OPERATIONAL SCHOOLS': 'operational_schools',
  'NUM_SCHOOLS': 'operational_schools',
};

function mapHeaders(headers: string[]): Record<number, keyof DistrictRow> {
  const mapping: Record<number, keyof DistrictRow> = {};
  
  headers.forEach((header, index) => {
    const normalizedHeader = header.trim().toUpperCase().replace(/\s+/g, '_');
    
    // Try exact match first
    if (columnMappings[header.trim().toUpperCase()]) {
      mapping[index] = columnMappings[header.trim().toUpperCase()];
    } else if (columnMappings[normalizedHeader]) {
      mapping[index] = columnMappings[normalizedHeader];
    }
  });
  
  return mapping;
}

function parseCSV(csvText: string): DistrictRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const headerMapping = mapHeaders(headers);
  
  console.log('CSV Headers found:', headers);
  console.log('Header mapping:', headerMapping);
  
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
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    const row: Partial<DistrictRow> = {};
    Object.entries(headerMapping).forEach(([index, field]) => {
      const value = values[parseInt(index)] || '';
      if (field === 'operational_schools') {
        row[field] = parseInt(value) || 0;
      } else {
        (row as Record<string, string | number>)[field] = value;
      }
    });
    
    // Only add rows that have at least an NCES ID
    if (row.nces_id) {
      rows.push(row as DistrictRow);
    }
  }
  
  return rows;
}

function parseExcel(arrayBuffer: ArrayBuffer): DistrictRow[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
  
  if (jsonData.length < 2) {
    console.log('Excel file has insufficient data');
    return [];
  }
  
  const headers = (jsonData[0] as unknown[]).map(h => String(h || '').trim());
  const headerMapping = mapHeaders(headers);
  
  console.log('Excel Headers found:', headers);
  console.log('Header mapping:', headerMapping);
  
  const rows: DistrictRow[] = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i];
    if (!rowData || rowData.length === 0) continue;
    
    const row: Partial<DistrictRow> = {};
    Object.entries(headerMapping).forEach(([index, field]) => {
      const value = rowData[parseInt(index)];
      if (field === 'operational_schools') {
        row[field] = typeof value === 'number' ? value : parseInt(String(value)) || 0;
      } else {
        (row as Record<string, string | number>)[field] = String(value || '');
      }
    });
    
    // Only add rows that have at least an NCES ID
    if (row.nces_id) {
      rows.push(row as DistrictRow);
    }
  }
  
  return rows;
}

function detectFileType(filename: string): 'csv' | 'excel' {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'xlsx' || ext === 'xls') {
    return 'excel';
  }
  return 'csv';
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

    console.log(`Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

    const fileType = detectFileType(file.name);
    let rows: DistrictRow[];

    if (fileType === 'excel') {
      console.log('Parsing as Excel file...');
      const arrayBuffer = await file.arrayBuffer();
      rows = parseExcel(arrayBuffer);
    } else {
      console.log('Parsing as CSV file...');
      const csvText = await file.text();
      rows = parseCSV(csvText);
    }
    
    console.log(`Parsed ${rows.length} districts from ${fileType.toUpperCase()}`);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid district data found. Please ensure the file has columns for NCES ID (LEAID), Name (LEA_NAME), and State (ST).' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    const batchSize = 500;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const districts = batch.map(row => ({
        nces_id: row.nces_id,
        state_lea_id: row.state_lea_id || null,
        name: row.name,
        state: row.state,
        state_name: row.state_name || null,
        address: row.address || null,
        city: row.city || null,
        zip: row.zip || null,
        zip4: row.zip4 || null,
        phone: row.phone || null,
        website: row.website || null,
        lea_type: row.lea_type || null,
        lea_type_text: row.lea_type_text || null,
        charter_lea: row.charter_lea || null,
        operational_status: row.operational_status || null,
        operational_status_text: row.operational_status_text || null,
        lowest_grade: row.lowest_grade || null,
        highest_grade: row.highest_grade || null,
        operational_schools: row.operational_schools || 0,
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
      fileType: fileType.toUpperCase(),
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
