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

function parseCSV(csvText: string): SchoolRow[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  const headers = parseCSVLine(lines[0])
  
  // Column indices
  const ncesIdx = headers.indexOf('NCESSCH')
  const nameIdx = headers.indexOf('SCH_NAME')
  const stateIdx = headers.indexOf('ST')
  const stateNameIdx = headers.indexOf('STATENAME')
  const cityIdx = headers.indexOf('LCITY')
  const addressIdx = headers.indexOf('LSTREET1')
  const zipIdx = headers.indexOf('LZIP')
  const phoneIdx = headers.indexOf('PHONE')
  const websiteIdx = headers.indexOf('WEBSITE')
  const levelIdx = headers.indexOf('LEVEL')
  const schoolTypeIdx = headers.indexOf('SCH_TYPE_TEXT')
  const statusIdx = headers.indexOf('SY_STATUS_TEXT')
  const districtNcesIdx = headers.indexOf('LEAID')
  const districtNameIdx = headers.indexOf('LEA_NAME')
  
  const rows: SchoolRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < 10) continue
    
    const ncesId = values[ncesIdx]?.trim()
    const name = values[nameIdx]?.trim()
    
    if (!ncesId || !name) continue
    
    rows.push({
      nces_id: ncesId,
      name: name,
      state: values[stateIdx]?.trim() || '',
      city: values[cityIdx]?.trim() || '',
      address: values[addressIdx]?.trim() || '',
      zip: values[zipIdx]?.trim() || '',
      phone: values[phoneIdx]?.trim() || '',
      website: values[websiteIdx]?.trim() || '',
      level: values[levelIdx]?.trim() || '',
      school_type: values[schoolTypeIdx]?.trim() || '',
      operational_status: values[statusIdx]?.trim() || '',
      district_nces_id: values[districtNcesIdx]?.trim() || '',
      district_name: values[districtNameIdx]?.trim() || '',
      state_name: values[stateNameIdx]?.trim() || '',
    })
  }
  
  return rows
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

    // Read as text (CSV is text-based, much more memory efficient)
    const csvText = await file.text()
    console.log(`CSV text loaded, parsing...`)
    
    const rows = parseCSV(csvText)
    console.log(`Parsed ${rows.length} schools`)

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid school data found in CSV' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extract and upsert districts first
    const districtMap = new Map<string, { name: string, state: string, state_name: string }>()
    for (const row of rows) {
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
    for (let i = 0; i < districtData.length; i += DISTRICT_BATCH_SIZE) {
      const batch = districtData.slice(i, i + DISTRICT_BATCH_SIZE)
      const { error: districtError } = await supabase
        .from('districts')
        .upsert(batch, { onConflict: 'nces_id' })
      
      if (districtError) {
        console.error(`District batch error:`, districtError)
      }
    }

    // Get all districts for mapping
    const { data: districts } = await supabase
      .from('districts')
      .select('id, nces_id')
    
    const districtIdMap = new Map(districts?.map(d => [d.nces_id, d.id]) || [])

    // Prepare school data
    const schoolData = rows.map(row => ({
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
      district_id: districtIdMap.get(row.district_nces_id) || null
    }))

    // Upsert schools in batches
    const SCHOOL_BATCH_SIZE = 500
    let inserted = 0
    let errors = 0

    for (let i = 0; i < schoolData.length; i += SCHOOL_BATCH_SIZE) {
      const batch = schoolData.slice(i, i + SCHOOL_BATCH_SIZE)
      const { error: schoolError } = await supabase
        .from('schools')
        .upsert(batch, { onConflict: 'nces_id' })
      
      if (schoolError) {
        console.error(`School batch ${i / SCHOOL_BATCH_SIZE + 1} error:`, schoolError)
        errors += batch.length
      } else {
        inserted += batch.length
      }
      
      console.log(`Progress: ${Math.min(i + SCHOOL_BATCH_SIZE, schoolData.length)}/${schoolData.length} schools`)
    }

    const result = {
      success: true,
      totalRows: rows.length,
      districtsProcessed: districtMap.size,
      schoolsInserted: inserted,
      errors: errors
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
