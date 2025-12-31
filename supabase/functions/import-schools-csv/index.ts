import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SchoolRow {
  nces_id: string
  name: string
  state: string
  city: string
  address: string
  zip: string
  phone: string
  website: string
  level: string
  school_type: string
  operational_status: string
  district_nces_id: string
  district_name: string
  state_name: string
  county?: string
  latitude?: number
  longitude?: number
}

// Parse scientific notation like 2.91107E+11 to full integer string
function parseScientificNotation(value: string): string {
  if (!value) return ''
  const trimmed = value.trim().replace(/^"|"$/g, '')
  
  // Match scientific notation like 2.91107E+11 or 2.91107e+11
  const match = trimmed.match(/^(\d+\.?\d*)E\+(\d+)$/i)
  if (match) {
    const base = parseFloat(match[1])
    const exp = parseInt(match[2])
    return Math.round(base * Math.pow(10, exp)).toString()
  }
  return trimmed
}

// Detect if CSV is headerless (Part 2 format starts with year like "2024-2025")
function detectHeaderlessCSV(firstLine: string): boolean {
  const trimmed = firstLine.trim()
  // Part 2 format starts with school year like "2024-2025"
  return /^\d{4}-\d{4}/.test(trimmed) || /^"\d{4}-\d{4}"/.test(trimmed)
}

// De-duplicate rows by NCES ID (later entries win)
function deduplicateByNcesId(rows: SchoolRow[]): { unique: SchoolRow[]; duplicatesRemoved: number } {
  const uniqueMap = new Map<string, SchoolRow>()
  for (const row of rows) {
    if (row.nces_id) {
      uniqueMap.set(row.nces_id, row)
    }
  }
  const unique = Array.from(uniqueMap.values())
  return {
    unique,
    duplicatesRemoved: rows.length - unique.length
  }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())
  
  return values
}

// Clean value by removing surrounding quotes
function cleanValue(val: string | undefined): string {
  if (!val) return ''
  return val.trim().replace(/^"|"$/g, '')
}

// Map columns by position for headerless Part 2 format
function mapPositionalColumns(values: string[]): SchoolRow | null {
  // Part 2 column positions (0-indexed based on NCES format):
  // 0=School Year, 1=FIPST, 2=State Name, 3=State Abbrev, 4=School Name, 5=District Name
  // 9=LEA ID (district NCES), 11=NCES School ID (may be scientific notation)
  // 16=City, 18=ZIP, 20=Street Address, 27=Phone, 28=Website
  // 31=Operational Status, 35=School Type, 62=School Level
  
  const ncesIdRaw = values[11] || ''
  const ncesId = parseScientificNotation(ncesIdRaw)
  const name = cleanValue(values[4])
  
  if (!ncesId || !name) return null
  
  const districtNcesRaw = values[9] || ''
  const districtNces = parseScientificNotation(districtNcesRaw)
  
  return {
    nces_id: ncesId,
    name: name,
    state: cleanValue(values[3]),
    state_name: cleanValue(values[2]),
    city: cleanValue(values[16]),
    address: cleanValue(values[20]),
    zip: cleanValue(values[18]),
    phone: cleanValue(values[27]),
    website: cleanValue(values[28]),
    level: cleanValue(values[62]),
    school_type: cleanValue(values[35]),
    operational_status: cleanValue(values[31]),
    district_nces_id: districtNces,
    district_name: cleanValue(values[5]),
    county: cleanValue(values[14]),
    latitude: parseFloat(cleanValue(values[22])) || undefined,
    longitude: parseFloat(cleanValue(values[23])) || undefined,
  }
}

// Parse CSV with headers (Part 1 format)
function parseCSVWithHeaders(csvText: string): SchoolRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = parseCSVLine(lines[0])
  const rows: SchoolRow[] = []
  
  // Build header index map (case-insensitive, trim quotes)
  const headerMap: Record<string, number> = {}
  headers.forEach((h, i) => {
    headerMap[cleanValue(h).toUpperCase()] = i
  })
  
  const getValue = (values: string[], key: string): string => {
    const idx = headerMap[key]
    return idx !== undefined ? cleanValue(values[idx]) : ''
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < 10) continue
    
    const ncesId = parseScientificNotation(getValue(values, 'NCESSCH') || getValue(values, 'NCES_ID') || getValue(values, 'SCHOOLID'))
    const name = getValue(values, 'SCH_NAME') || getValue(values, 'SCHOOL_NAME') || getValue(values, 'NAME')
    
    if (!ncesId || !name) continue
    
    rows.push({
      nces_id: ncesId,
      name,
      state: getValue(values, 'ST') || getValue(values, 'STATE'),
      state_name: getValue(values, 'STATENAME') || getValue(values, 'STATE_NAME'),
      city: getValue(values, 'LCITY') || getValue(values, 'CITY'),
      address: getValue(values, 'LSTREET1') || getValue(values, 'ADDRESS'),
      zip: getValue(values, 'LZIP') || getValue(values, 'ZIP'),
      phone: getValue(values, 'PHONE'),
      website: getValue(values, 'WEBSITE'),
      level: getValue(values, 'LEVEL') || getValue(values, 'SCH_LEVEL') || getValue(values, 'SCHOOL_LEVEL'),
      school_type: getValue(values, 'SCH_TYPE_TEXT') || getValue(values, 'SCH_TYPE') || getValue(values, 'SCHOOL_TYPE') || getValue(values, 'CHARTER_TEXT'),
      operational_status: getValue(values, 'SY_STATUS_TEXT') || getValue(values, 'OPERATIONAL_STATUS') || getValue(values, 'STATUS'),
      district_nces_id: parseScientificNotation(getValue(values, 'LEAID') || getValue(values, 'LEA_ID') || getValue(values, 'DISTRICT_ID')),
      district_name: getValue(values, 'LEA_NAME') || getValue(values, 'DISTRICT_NAME'),
      county: getValue(values, 'CNTY') || getValue(values, 'COUNTY'),
      latitude: parseFloat(getValue(values, 'LAT')) || undefined,
      longitude: parseFloat(getValue(values, 'LON')) || undefined,
    })
  }
  
  return rows
}

// Parse headerless CSV (Part 2 format)
function parseCSVWithoutHeaders(csvText: string): { rows: SchoolRow[]; scientificNotationFixed: number } {
  const lines = csvText.split('\n').filter(line => line.trim())
  const rows: SchoolRow[] = []
  let scientificNotationFixed = 0
  
  for (const line of lines) {
    const values = parseCSVLine(line)
    const row = mapPositionalColumns(values)
    
    if (row) {
      // Check if we fixed scientific notation
      const rawNces = values[11] || ''
      if (/E\+/i.test(rawNces)) {
        scientificNotationFixed++
      }
      rows.push(row)
    }
  }
  
  return { rows, scientificNotationFixed }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user has system_admin role
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
    
    const isAdmin = roles?.some(r => r.role === 'system_admin' || r.role === 'superadmin')
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing CSV file: ${file.name}, size: ${file.size}`)

    const csvText = await file.text()
    console.log(`CSV text loaded, parsing...`)
    
    // Detect format and parse accordingly
    const firstLine = csvText.split('\n')[0] || ''
    const isHeaderless = detectHeaderlessCSV(firstLine)
    
    let schools: SchoolRow[]
    let scientificNotationFixed = 0
    
    if (isHeaderless) {
      console.log('Detected headerless CSV (Part 2 format), using positional mapping...')
      const result = parseCSVWithoutHeaders(csvText)
      schools = result.rows
      scientificNotationFixed = result.scientificNotationFixed
      console.log(`Fixed ${scientificNotationFixed} scientific notation NCES IDs`)
    } else {
      console.log('Detected CSV with headers (Part 1 format)...')
      schools = parseCSVWithHeaders(csvText)
    }
    
    console.log(`Parsed ${schools.length} schools`)

    if (schools.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid school data found in CSV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // De-duplicate all schools by NCES ID
    const { unique: uniqueSchools, duplicatesRemoved: totalDuplicates } = deduplicateByNcesId(schools)
    console.log(`De-duplicated: ${uniqueSchools.length} unique schools, ${totalDuplicates} duplicates removed`)

    // Extract and upsert districts first
    const districtMap = new Map<string, { name: string, state: string, state_name: string }>()
    for (const row of uniqueSchools) {
      if (row.district_nces_id && !districtMap.has(row.district_nces_id)) {
        districtMap.set(row.district_nces_id, {
          name: row.district_name,
          state: row.state,
          state_name: row.state_name
        })
      }
    }

    console.log(`Upserting ${districtMap.size} unique districts...`)
    
    const districtData = Array.from(districtMap.entries()).map(([nces_id, data]) => ({
      nces_id,
      name: data.name,
      state: data.state,
      state_name: data.state_name
    }))

    // Upsert districts in batches
    const DISTRICT_BATCH_SIZE = 500
    let districtsProcessed = 0
    for (let i = 0; i < districtData.length; i += DISTRICT_BATCH_SIZE) {
      const batch = districtData.slice(i, i + DISTRICT_BATCH_SIZE)
      const { error: districtError } = await supabase
        .from('districts')
        .upsert(batch, { onConflict: 'nces_id' })
      
      if (districtError) {
        console.error(`District batch error:`, districtError)
      } else {
        districtsProcessed += batch.length
      }
    }

    // Get all districts for mapping
    const { data: districts } = await supabase
      .from('districts')
      .select('id, nces_id')
    
    const districtIdMap = new Map(districts?.map(d => [d.nces_id, d.id]) || [])

    // Prepare and upsert schools in batches with deduplication per batch
    const SCHOOL_BATCH_SIZE = 500
    let inserted = 0
    let errors = 0

    for (let i = 0; i < uniqueSchools.length; i += SCHOOL_BATCH_SIZE) {
      const batch = uniqueSchools.slice(i, i + SCHOOL_BATCH_SIZE)
      
      // De-duplicate within batch to prevent "ON CONFLICT DO UPDATE cannot affect row a second time"
      const { unique: uniqueBatch } = deduplicateByNcesId(batch)
      
      const schoolData = uniqueBatch.map(row => ({
        nces_id: row.nces_id,
        name: row.name,
        state: row.state,
        city: row.city,
        address: row.address,
        zip: row.zip,
        phone: row.phone || null,
        website: row.website || null,
        level: row.level || null,
        school_type: row.school_type || null,
        operational_status: row.operational_status || null,
        district_id: districtIdMap.get(row.district_nces_id) || null,
        county: row.county || null,
        latitude: row.latitude || null,
        longitude: row.longitude || null,
      }))
      
      const { error: schoolError } = await supabase
        .from('schools')
        .upsert(schoolData, { onConflict: 'nces_id' })
      
      if (schoolError) {
        console.error(`School batch ${Math.floor(i / SCHOOL_BATCH_SIZE) + 1} error:`, schoolError)
        errors += uniqueBatch.length
      } else {
        inserted += uniqueBatch.length
      }
      
      if ((i + SCHOOL_BATCH_SIZE) % 5000 === 0 || i + SCHOOL_BATCH_SIZE >= uniqueSchools.length) {
        console.log(`Progress: ${Math.min(i + SCHOOL_BATCH_SIZE, uniqueSchools.length)}/${uniqueSchools.length} schools`)
      }
    }

    const result = {
      success: true,
      totalRows: schools.length,
      uniqueSchools: uniqueSchools.length,
      duplicatesRemoved: totalDuplicates,
      scientificNotationFixed,
      districtsProcessed,
      schoolsInserted: inserted,
      errors,
      format: isHeaderless ? 'headerless (Part 2)' : 'with headers (Part 1)',
    }

    console.log(`Import complete:`, result)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Import error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
