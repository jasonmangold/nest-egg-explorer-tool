
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompleteLeadPayload {
  leadId: string;
  score: number;
  quality: 'Cold' | 'Warm' | 'Hot' | 'Premium';
  timestamp: string;
  pageMetrics: {
    timeOnPage: number;
    scrollDepth: number;
    bounced: boolean;
  };
  financialProfile: {
    currentSavings: number;
    monthlySpending: number;
    safeWithdrawalAmount: number;
    retirementViability: 'Sustainable' | 'Needs Adjustment';
  };
  engagementData: {
    calculatorInteractions: number;
    pdfDownloaded: boolean;
    podcastEngagement: number;
    contactAttempted: boolean;
  };
  enhancedEngagement: {
    findTimeClicked: boolean;
    contactMeClicked: boolean;
    calculateButtonClicks: number;
    exportResultsClicked: boolean;
    exportAfterCalculate: boolean;
    listenNowClicked: boolean;
    readReportClicks: number;
    podcastListenTime: number;
    inputChangesBeforeCalculate: number;
    scrolledPast75: boolean;
    tooltipInteractions: number;
    educationalContentClicks: number;
    sessionActiveTime: number;
    returnVisits: number;
    quickBounce: boolean;
    closedPlayerEarly: boolean;
  };
  contactInfo?: {
    firstName: string;
    email: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: CompleteLeadPayload = await req.json();
    console.log('📤 Received enhanced lead payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.leadId || typeof payload.score !== 'number' || !payload.quality) {
      console.error('❌ Missing required fields:', { 
        leadId: payload.leadId, 
        score: payload.score, 
        quality: payload.quality 
      });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: leadId, score, quality' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map the enhanced payload to database structure
    const leadData = {
      lead_id: payload.leadId,
      timestamp: payload.timestamp,
      score: payload.score,
      quality: payload.quality,
      
      // Page Metrics
      time_on_page: payload.pageMetrics?.timeOnPage || 0,
      scroll_depth: payload.pageMetrics?.scrollDepth || 0,
      bounced: payload.pageMetrics?.bounced || false,
      
      // Financial Profile
      current_savings: payload.financialProfile?.currentSavings || 0,
      monthly_spending: payload.financialProfile?.monthlySpending || 0,
      safe_withdrawal_amount: payload.financialProfile?.safeWithdrawalAmount || 0,
      retirement_viability: payload.financialProfile?.retirementViability || 'Needs Adjustment',
      
      // Legacy Engagement Data
      calculator_interactions: payload.engagementData?.calculatorInteractions || 0,
      pdf_downloaded: payload.engagementData?.pdfDownloaded || false,
      podcast_engagement: payload.engagementData?.podcastEngagement || 0,
      contact_attempted: payload.engagementData?.contactAttempted || false,
      
      // Enhanced Engagement Tracking
      find_a_time_clicks: payload.enhancedEngagement?.findTimeClicked ? 1 : 0,
      contact_me_clicks: payload.enhancedEngagement?.contactMeClicked ? 1 : 0,
      calculate_button_clicks: payload.enhancedEngagement?.calculateButtonClicks || 0,
      export_results_clicks: payload.enhancedEngagement?.exportResultsClicked ? 1 : 0,
      export_after_calculate: payload.enhancedEngagement?.exportAfterCalculate || false,
      listen_now_clicks: payload.enhancedEngagement?.listenNowClicked ? 1 : 0,
      read_report_clicks: payload.enhancedEngagement?.readReportClicks || 0,
      read_report_unique_clicks: payload.enhancedEngagement?.readReportClicks || 0,
      podcast_listen_time: payload.enhancedEngagement?.podcastListenTime || 0,
      input_changes_before_calculate: payload.enhancedEngagement?.inputChangesBeforeCalculate || 0,
      scrolled_past_75: payload.enhancedEngagement?.scrolledPast75 || false,
      tooltip_interactions: payload.enhancedEngagement?.tooltipInteractions || 0,
      educational_content_clicks: payload.enhancedEngagement?.educationalContentClicks || 0,
      session_active_time: payload.enhancedEngagement?.sessionActiveTime || 0,
      return_visits: payload.enhancedEngagement?.returnVisits || 0,
      quick_bounce: payload.enhancedEngagement?.quickBounce || false,
      closed_player_early: payload.enhancedEngagement?.closedPlayerEarly || false,
      
      // Contact Info
      first_name: payload.contactInfo?.firstName || 'Unknown',
      email: payload.contactInfo?.email || 'unknown@example.com',
      
      // Additional fields with defaults
      engagement_score: payload.score,
      advisor_notes: 'Auto-generated from enhanced tracker',
      follow_up_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
      status: 'new',
      assigned_advisor: 'Unassigned'
    };

    console.log('💾 Prepared enhanced lead data for upsert:', JSON.stringify(leadData, null, 2));

    // Perform UPSERT operation
    const { data, error } = await supabaseClient
      .from('leads')
      .upsert(leadData, { 
        onConflict: 'lead_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Database error details:', JSON.stringify(error, null, 2));
      console.error('❌ Lead data sent:', JSON.stringify(leadData, null, 2));
      return new Response(
        JSON.stringify({ error: `Database error: ${error.message}`, details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Enhanced lead data upserted successfully:', JSON.stringify(data, null, 2));

    return new Response(
      JSON.stringify({ success: true, data, message: 'Enhanced lead tracking data processed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Function error:', JSON.stringify(error, null, 2));
    return new Response(
      JSON.stringify({ error: error.message, details: error }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
