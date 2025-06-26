export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      Education: {
        Row: {
          Active: string | null
          Disclosure: boolean | null
          DocumentTitle: string | null
          file_path: string | null
          FINRA: boolean | null
          Folder: string | null
          Format: string | null
          FormNumber: string
          Subfolder: string | null
          Version: number | null
        }
        Insert: {
          Active?: string | null
          Disclosure?: boolean | null
          DocumentTitle?: string | null
          file_path?: string | null
          FINRA?: boolean | null
          Folder?: string | null
          Format?: string | null
          FormNumber: string
          Subfolder?: string | null
          Version?: number | null
        }
        Update: {
          Active?: string | null
          Disclosure?: boolean | null
          DocumentTitle?: string | null
          file_path?: string | null
          FINRA?: boolean | null
          Folder?: string | null
          Format?: string | null
          FormNumber?: string
          Subfolder?: string | null
          Version?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          advisor_notes: string | null
          assigned_advisor: string | null
          bounced: boolean | null
          calculate_button_clicks: number | null
          calculator_interactions: number | null
          closed_player_early: boolean | null
          contact_attempted: boolean | null
          contact_me_clicks: number | null
          created_at: string | null
          current_savings: number | null
          educational_content_clicks: number | null
          email: string | null
          engagement_score: number | null
          export_after_calculate: boolean | null
          export_results_clicks: number | null
          find_a_time_clicks: number | null
          first_name: string | null
          follow_up_date: string | null
          id: string
          input_changes_before_calculate: number | null
          lead_id: string
          listen_now_clicks: number | null
          monthly_spending: number | null
          pdf_downloaded: boolean | null
          podcast_engagement: number | null
          podcast_listen_time: number | null
          quality: string | null
          quick_bounce: boolean | null
          read_report_clicks: number | null
          read_report_unique_clicks: number | null
          retirement_viability: string | null
          return_visits: number | null
          safe_withdrawal_amount: number | null
          score: number | null
          scroll_depth: number | null
          scrolled_past_75: boolean | null
          session_active_time: number | null
          status: string | null
          time_on_page: number | null
          timestamp: string | null
          tooltip_interactions: number | null
          updated_at: string | null
        }
        Insert: {
          advisor_notes?: string | null
          assigned_advisor?: string | null
          bounced?: boolean | null
          calculate_button_clicks?: number | null
          calculator_interactions?: number | null
          closed_player_early?: boolean | null
          contact_attempted?: boolean | null
          contact_me_clicks?: number | null
          created_at?: string | null
          current_savings?: number | null
          educational_content_clicks?: number | null
          email?: string | null
          engagement_score?: number | null
          export_after_calculate?: boolean | null
          export_results_clicks?: number | null
          find_a_time_clicks?: number | null
          first_name?: string | null
          follow_up_date?: string | null
          id?: string
          input_changes_before_calculate?: number | null
          lead_id: string
          listen_now_clicks?: number | null
          monthly_spending?: number | null
          pdf_downloaded?: boolean | null
          podcast_engagement?: number | null
          podcast_listen_time?: number | null
          quality?: string | null
          quick_bounce?: boolean | null
          read_report_clicks?: number | null
          read_report_unique_clicks?: number | null
          retirement_viability?: string | null
          return_visits?: number | null
          safe_withdrawal_amount?: number | null
          score?: number | null
          scroll_depth?: number | null
          scrolled_past_75?: boolean | null
          session_active_time?: number | null
          status?: string | null
          time_on_page?: number | null
          timestamp?: string | null
          tooltip_interactions?: number | null
          updated_at?: string | null
        }
        Update: {
          advisor_notes?: string | null
          assigned_advisor?: string | null
          bounced?: boolean | null
          calculate_button_clicks?: number | null
          calculator_interactions?: number | null
          closed_player_early?: boolean | null
          contact_attempted?: boolean | null
          contact_me_clicks?: number | null
          created_at?: string | null
          current_savings?: number | null
          educational_content_clicks?: number | null
          email?: string | null
          engagement_score?: number | null
          export_after_calculate?: boolean | null
          export_results_clicks?: number | null
          find_a_time_clicks?: number | null
          first_name?: string | null
          follow_up_date?: string | null
          id?: string
          input_changes_before_calculate?: number | null
          lead_id?: string
          listen_now_clicks?: number | null
          monthly_spending?: number | null
          pdf_downloaded?: boolean | null
          podcast_engagement?: number | null
          podcast_listen_time?: number | null
          quality?: string | null
          quick_bounce?: boolean | null
          read_report_clicks?: number | null
          read_report_unique_clicks?: number | null
          retirement_viability?: string | null
          return_visits?: number | null
          safe_withdrawal_amount?: number | null
          score?: number | null
          scroll_depth?: number | null
          scrolled_past_75?: boolean | null
          session_active_time?: number | null
          status?: string | null
          time_on_page?: number | null
          timestamp?: string | null
          tooltip_interactions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
