import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SchoolData {
  nces_id: string | null
  name: string
  state: string | null
  city: string | null
  address: string | null
  zip: string | null
  phone: string | null
  website: string | null
  level: string | null
  school_type: string | null
  operational_status: string | null
  district_nces_id: string | null
  county: string | null
  latitude: number | null
  longitude: number | null
  school_year: string | null
  sy_status: string | null
  charter_status: string | null
  magnet_status: string | null
  virtual_status: string | null
  title1_status: string | null
}

interface BatchRequest {
  historyId: string
  schools: SchoolData[]
  districts: { nces_id: string; name: string; state: string; state_name: string }[]
  batchIndex: number
  totalBatches: number
  isLastBatch: boolean
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

    const body: BatchRequest = await req.json()
    const { historyId, schools, districts, batchIndex, totalBatches, isLastBatch } = body

    console.log(`[Batch ${batchIndex + 1}/${totalBatches}] Processing ${schools.length} schools, ${districts.length} districts`)

    // Check if import was cancelled
    const { data: currentHistory } = await supabase
      .from('import_history')
      .select('status')
      .eq('id', historyId)
      .maybeSingle()
    
    if (currentHistory?.status === 'cancelled') {
      console.log('[Batch] Import was cancelled')
      return new Response(JSON.stringify({ success: false, cancelled: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Upsert districts if provided
    if (districts.length > 0) {
      const { error: districtError } = await supabase
        .from('districts')
        .upsert(districts, { onConflict: 'nces_id' })
      
      if (districtError) {
        console.error('District upsert error:', districtError)
      }
    }

    // Get all districts for mapping
    const { data: allDistricts } = await supabase
      .from('districts')
      .select('id, nces_id')
    
    const districtIdMap = new Map(allDistricts?.map((d: any) => [d.nces_id, d.id]) || [])

    // Insert schools
    let inserted = 0
    let errors = 0
    const statusCounts: Record<string, number> = {}
    const stateCounts: Record<string, number> = {}

    const BATCH_SIZE = 250
    for (let i = 0; i < schools.length; i += BATCH_SIZE) {
      const batch = schools.slice(i, i + BATCH_SIZE)
      
      // Track counts
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
        console.error(`School batch error:`, schoolError.message)
        errors += batch.length
      } else {
        inserted += batch.length
      }
    }

    // Update history with progress
    const { data: history } = await supabase
      .from('import_history')
      .select('rows_inserted, districts_processed, status_breakdown, state_breakdown')
      .eq('id', historyId)
      .maybeSingle()

    const cumulativeInserted = (history?.rows_inserted || 0) + inserted
    const cumulativeDistricts = (history?.districts_processed || 0) + districts.length
    
    // Merge status/state breakdowns
    const existingStatus = (history?.status_breakdown as Record<string, number>) || {}
    const existingState = (history?.state_breakdown as Record<string, number>) || {}
    
    for (const [k, v] of Object.entries(statusCounts)) {
      existingStatus[k] = (existingStatus[k] || 0) + v
    }
    for (const [k, v] of Object.entries(stateCounts)) {
      existingState[k] = (existingState[k] || 0) + v
    }

    const updateData: any = {
      rows_inserted: cumulativeInserted,
      districts_processed: cumulativeDistricts,
      status_breakdown: existingStatus,
      state_breakdown: existingState,
    }

    if (isLastBatch) {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
    }

    await supabase
      .from('import_history')
      .update(updateData)
      .eq('id', historyId)

    console.log(`[Batch ${batchIndex + 1}/${totalBatches}] Inserted ${inserted} schools`)

    return new Response(JSON.stringify({
      success: true,
      inserted,
      errors,
      cumulativeInserted,
      isLastBatch
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Batch import error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
