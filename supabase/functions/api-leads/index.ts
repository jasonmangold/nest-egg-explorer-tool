
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    console.log('📤 Received lead data:', body)

    // Validate required fields
    if (!body.leadId || typeof body.score !== 'number' || !body.quality) {
      console.error('❌ Missing required fields:', { leadId: body.leadId, score: body.score, quality: body.quality })
      return new Response(
        JSON.stringify({ error: 'Missing required fields: leadId, score, quality' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare the data for upsert
    const leadData = {
      lead_id: body.leadId,
      timestamp: new Date().toISOString(),
      score: body.score,
      quality: body.quality,
      time_on_page: body.time_on_page || 0,
      scroll_depth: body.scroll_depth || 0,
      bounced: body.bounced || false,
      current_savings: body.current_savings || 0,
      monthly_spending: body.monthly_spending || 0,
      safe_withdrawal_amount: body.safe_withdrawal_amount || 0,
      retirement_viability: body.retirement_viability || 'Needs Adjustment',
      calculator_interactions: body.calculator_interactions || 0,
      pdf_downloaded: body.pdf_downloaded || false,
      podcast_engagement: body.podcast_engagement || 0,
      contact_attempted: body.contact_attempted || false,
      calculate_button_clicks: body.calculate_button_clicks || 0,
      input_changes_before_calculate: body.input_changes_before_calculate || 0,
      podcast_listen_time: body.podcast_listen_time || 0,
      tooltip_interactions: body.tooltip_interactions || 0,
      educational_content_clicks: body.educational_content_clicks || 0,
      engagement_score: body.engagement_score || body.score || 0,
      first_name: body.first_name || null,
      email: body.email || null,
      find_a_time_clicks: body.find_a_time_clicks || 0,
      contact_me_clicks: body.contact_me_clicks || 0,
      export_results_clicks: body.export_results_clicks || 0,
      listen_now_clicks: body.listen_now_clicks || 0,
      read_report_clicks: body.read_report_clicks || 0,
      read_report_unique_clicks: body.read_report_unique_clicks || 0
    }

    console.log('💾 Prepared lead data for upsert:', leadData)

    // Perform UPSERT operation
    const { data, error } = await supabaseClient
      .from('leads')
      .upsert(leadData, { 
        onConflict: 'lead_id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Database error:', error)
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Lead data upserted successfully:', data)

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
