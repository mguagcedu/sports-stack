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
  school_year?: string
  sy_status?: string
  charter_status?: string
  magnet_status?: string
  virtual_status?: string
  title1_status?: string
}

// Parse scientific notation like 2.91107E+11 to full integer string
function parseScientificNotation(value: string): string {
  if (!value) return ''
  const trimmed = value.trim().replace(/^"|"$/g, '')
  
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
  return /^\d{4}-\d{4}/.test(trimmed) || /^"\d{4}-\d{4}"/.test(trimmed)
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

function cleanValue(val: string | undefined): string {
  if (!val) return ''
  return val.trim().replace(/^"|"$/g, '')
}

function mapPositionalColumns(values: string[]): SchoolRow | null {
  const ncesIdRaw = values[11] || ''
  const ncesId = parseScientificNotation(ncesIdRaw)
  const name = cleanValue(values[4])
  
  if (!name) return null
  
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
    school_year: cleanValue(values[0]),
    sy_status: cleanValue(values[31]),
    charter_status: cleanValue(values[36]),
    magnet_status: cleanValue(values[37]),
    virtual_status: cleanValue(values[38]),
    title1_status: cleanValue(values[45]),
  }
}

function parseCSVWithHeaders(csvText: string): SchoolRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []
  
  const headers = parseCSVLine(lines[0])
  const rows: SchoolRow[] = []
  
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
    if (values.length < 5) continue
    
    const name = getValue(values, 'SCH_NAME') || getValue(values, 'SCHOOL_NAME') || getValue(values, 'NAME')
    
    if (!name) continue
    
    const ncesId = parseScientificNotation(getValue(values, 'NCESSCH') || getValue(values, 'NCES_ID') || getValue(values, 'SCHOOLID'))
    
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
      school_year: getValue(values, 'SCHOOL_YEAR') || getValue(values, 'SY_YEAR'),
      sy_status: getValue(values, 'SY_STATUS') || getValue(values, 'SY_STATUS_TEXT'),
      charter_status: getValue(values, 'CHARTER') || getValue(values, 'CHARTER_TEXT'),
      magnet_status: getValue(values, 'MAGNET') || getValue(values, 'MAGNET_TEXT'),
      virtual_status: getValue(values, 'VIRTUAL') || getValue(values, 'VIRTUAL_TEXT'),
      title1_status: getValue(values, 'TITLE1_STATUS') || getValue(values, 'TITLE_I_ELIGIBLE'),
    })
  }
  
  return rows
}

function parseCSVWithoutHeaders(csvText: string): { rows: SchoolRow[]; scientificNotationFixed: number } {
  const lines = csvText.split('\n').filter(line => line.trim())
  const rows: SchoolRow[] = []
  let scientificNotationFixed = 0
  
  for (const line of lines) {
    const values = parseCSVLine(line)
    const row = mapPositionalColumns(values)
    
    if (row) {
      const rawNces = values[11] || ''
      if (/E\+/i.test(rawNces)) {
        scientificNotationFixed++
      }
      rows.push(row)
    }
  }
  
  return { rows, scientificNotationFixed }
}

// Background processing function
async function processImportInBackground(
  csvText: string,
  historyId: string,
  supabase: any,
  isHeaderless: boolean
) {
  console.log(`[Background] Starting import processing for history ${historyId}`)
  
  try {
    // Parse CSV
    let schools: SchoolRow[]
    let scientificNotationFixed = 0
    
    if (isHeaderless) {
      console.log('[Background] Parsing headerless CSV...')
      const result = parseCSVWithoutHeaders(csvText)
      schools = result.rows
      scientificNotationFixed = result.scientificNotationFixed
    } else {
      console.log('[Background] Parsing CSV with headers...')
      schools = parseCSVWithHeaders(csvText)
    }
    
    console.log(`[Background] Parsed ${schools.length} schools`)

    // Update history with total rows
    await supabase
      .from('import_history')
      .update({ 
        total_rows: schools.length,
        status: 'processing'
      })
      .eq('id', historyId)

    if (schools.length === 0) {
      await supabase
        .from('import_history')
        .update({
          status: 'failed',
          error_message: 'No valid school data found in CSV',
          completed_at: new Date().toISOString(),
        })
        .eq('id', historyId)
      return
    }

    // Extract and upsert districts
    const districtMap = new Map<string, { name: string, state: string, state_name: string }>()
    for (const row of schools) {
      if (row.district_nces_id && !districtMap.has(row.district_nces_id)) {
        districtMap.set(row.district_nces_id, {
          name: row.district_name,
          state: row.state,
          state_name: row.state_name
        })
      }
    }

    console.log(`[Background] Upserting ${districtMap.size} districts...`)
    
    const districtData = Array.from(districtMap.entries()).map(([nces_id, data]) => ({
      nces_id,
      name: data.name,
      state: data.state,
      state_name: data.state_name
    }))

    const DISTRICT_BATCH_SIZE = 500
    let districtsProcessed = 0
    for (let i = 0; i < districtData.length; i += DISTRICT_BATCH_SIZE) {
      const batch = districtData.slice(i, i + DISTRICT_BATCH_SIZE)
      const { error: districtError } = await supabase
        .from('districts')
        .upsert(batch, { onConflict: 'nces_id' })
      
      if (districtError) {
        console.error(`[Background] District batch error:`, districtError)
      } else {
        districtsProcessed += batch.length
      }
    }

    // Get all districts for mapping
    const { data: districts } = await supabase
      .from('districts')
      .select('id, nces_id')
    
    const districtIdMap = new Map(districts?.map((d: any) => [d.nces_id, d.id]) || [])

    // INSERT schools in batches - smaller batch size to avoid CPU limits
    const SCHOOL_BATCH_SIZE = 250
    let inserted = 0
    let errors = 0
    const statusCounts: Record<string, number> = {}
    const stateCounts: Record<string, number> = {}

    console.log(`[Background] Inserting ${schools.length} schools...`)

    for (let i = 0; i < schools.length; i += SCHOOL_BATCH_SIZE) {
      // Check if cancelled before each batch
      const { data: currentHistory } = await supabase
        .from('import_history')
        .select('status')
        .eq('id', historyId)
        .maybeSingle()
      
      if (currentHistory?.status === 'cancelled') {
        console.log('[Background] Import cancelled by user')
        return
      }

      const batch = schools.slice(i, i + SCHOOL_BATCH_SIZE)
      
      // Track status and state counts
      for (const row of batch) {
        const status = row.sy_status || row.operational_status || 'Unknown'
        statusCounts[status] = (statusCounts[status] || 0) + 1
        
        const state = row.state || 'Unknown'
        stateCounts[state] = (stateCounts[state] || 0) + 1
      }
      
      const schoolData = batch.map(row => ({
        nces_id: row.nces_id || null,
        name: row.name,
        state: row.state || null,
        city: row.city || null,
        address: row.address || null,
        zip: row.zip || null,
        phone: row.phone || null,
        website: row.website || null,
        level: row.level || null,
        school_type: row.school_type || null,
        operational_status: row.operational_status || null,
        district_id: districtIdMap.get(row.district_nces_id) || null,
        county: row.county || null,
        latitude: row.latitude || null,
        longitude: row.longitude || null,
        school_year: row.school_year || null,
        sy_status: row.sy_status || null,
        charter_status: row.charter_status || null,
        magnet_status: row.magnet_status || null,
        virtual_status: row.virtual_status || null,
        title1_status: row.title1_status || null,
        lea_id: row.district_nces_id || null,
      }))
      
      const { error: schoolError } = await supabase
        .from('schools')
        .insert(schoolData)
      
      if (schoolError) {
        console.error(`[Background] School batch error at ${i}:`, schoolError.message)
        errors += batch.length
      } else {
        inserted += batch.length
      }
      
      // Update progress every 5000 schools
      if (inserted % 5000 === 0 || i + SCHOOL_BATCH_SIZE >= schools.length) {
        console.log(`[Background] Progress: ${inserted}/${schools.length} inserted`)
        await supabase
          .from('import_history')
          .update({ 
            rows_inserted: inserted,
            districts_processed: districtsProcessed,
          })
          .eq('id', historyId)
      }
    }

    // Sort state counts for display
    const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])

    // Final update
    console.log(`[Background] Import complete: ${inserted} inserted, ${errors} errors`)
    await supabase
      .from('import_history')
      .update({
        status: 'completed',
        rows_inserted: inserted,
        districts_processed: districtsProcessed,
        completed_at: new Date().toISOString(),
        status_breakdown: statusCounts,
        state_breakdown: Object.fromEntries(sortedStates),
        format: isHeaderless ? 'headerless (Part 2)' : 'with headers (Part 1)',
      })
      .eq('id', historyId)

  } catch (error) {
    console.error('[Background] Import error:', error)
    await supabase
      .from('import_history')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        completed_at: new Date().toISOString(),
      })
      .eq('id', historyId)
  }
}

// Handle shutdown gracefully
addEventListener('beforeunload', (ev: any) => {
  console.log(`[Shutdown] Function shutting down: ${ev.detail?.reason}`)
})

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
    const historyId = formData.get('historyId') as string | null
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!historyId) {
      return new Response(JSON.stringify({ error: 'No historyId provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Processing CSV file: ${file.name}, size: ${file.size}, historyId: ${historyId}`)

    const csvText = await file.text()
    console.log(`CSV text loaded (${csvText.length} chars)`)
    
    // Detect format
    const firstLine = csvText.split('\n')[0] || ''
    const isHeaderless = detectHeaderlessCSV(firstLine)
    
    console.log(`Format detected: ${isHeaderless ? 'headerless' : 'with headers'}`)

    // Update history to show we received the file
    await supabase
      .from('import_history')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', historyId)

    // Process in background using EdgeRuntime.waitUntil
    // @ts-ignore - EdgeRuntime is available in Deno Deploy
    EdgeRuntime.waitUntil(processImportInBackground(csvText, historyId, supabase, isHeaderless))

    // Return immediately
    return new Response(JSON.stringify({ 
      success: true, 
      historyId,
      message: 'Import started. Processing in background...',
      format: isHeaderless ? 'headerless (Part 2)' : 'with headers (Part 1)'
    }), {
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
