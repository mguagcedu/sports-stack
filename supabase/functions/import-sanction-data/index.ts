import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// All 51 state codes
const stateCodes = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL',
  'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME',
  'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI',
  'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// All 67 sport codes
const sportCodes = [
  'football_11_man', 'football_8_man', 'football_6_man', 'flag_football_girls',
  'cross_country_boys', 'cross_country_girls', 'soccer_boys', 'soccer_girls',
  'volleyball_girls_indoor', 'field_hockey_girls', 'tennis_boys_fall', 'tennis_girls_fall',
  'golf_girls_fall', 'water_polo_boys_fall', 'water_polo_girls_fall', 'cheer_sideline',
  'cheer_competitive', 'basketball_boys', 'basketball_girls', 'wrestling_boys',
  'wrestling_girls', 'swim_dive_boys', 'swim_dive_girls', 'bowling_boys',
  'bowling_girls', 'ice_hockey_boys', 'ice_hockey_girls', 'gymnastics_boys',
  'gymnastics_girls', 'indoor_track_boys', 'indoor_track_girls', 'dance_competitive',
  'baseball', 'softball', 'track_field_boys', 'track_field_girls',
  'lacrosse_boys', 'lacrosse_girls', 'golf_boys_spring', 'golf_girls_spring',
  'tennis_boys_spring', 'tennis_girls_spring', 'volleyball_boys', 'beach_volleyball_girls',
  'water_polo_boys_spring', 'water_polo_girls_spring', 'esports', 'archery',
  'bass_fishing', 'disc_golf', 'rifle', 'clay_target',
  'powerlifting', 'weightlifting', 'rugby_boys', 'rugby_girls',
  'ultimate_boys', 'ultimate_girls', 'ski_alpine', 'ski_nordic',
  'snowboarding', 'mountain_biking', 'cricket_boys', 'cricket_girls',
  'badminton', 'table_tennis', 'squash'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting state-sport sanction matrix import...');
    console.log(`States: ${stateCodes.length}, Sports: ${sportCodes.length}`);
    console.log(`Expected rows: ${stateCodes.length * sportCodes.length}`);

    // Check how many already exist
    const { count: existingCount } = await supabase
      .from('state_sport_sanction')
      .select('*', { count: 'exact', head: true });

    console.log(`Existing rows: ${existingCount}`);

    if (existingCount && existingCount >= stateCodes.length * sportCodes.length) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Sanction matrix already fully populated',
        existing: existingCount,
        expected: stateCodes.length * sportCodes.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate all combinations
    const sanctions = [];
    for (const stateCode of stateCodes) {
      for (const sportCode of sportCodes) {
        sanctions.push({
          state_code: stateCode,
          sport_code: sportCode,
          sanctioned: null,
          rules_url: null,
          season_override: null,
          last_verified_date: null
        });
      }
    }

    console.log(`Generated ${sanctions.length} sanction records`);

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < sanctions.length; i += batchSize) {
      const batch = sanctions.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('state_sport_sanction')
        .upsert(batch, { 
          onConflict: 'state_code,sport_code',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        skipped += batch.length;
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sanctions.length / batchSize)}`);
      }
    }

    // Verify final count
    const { count: finalCount } = await supabase
      .from('state_sport_sanction')
      .select('*', { count: 'exact', head: true });

    console.log('Import complete!');
    console.log(`Final count: ${finalCount}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'State-sport sanction matrix import complete',
      total_generated: sanctions.length,
      inserted: inserted,
      skipped: skipped,
      final_count: finalCount,
      states: stateCodes.length,
      sports: sportCodes.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
