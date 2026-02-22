export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_coupons: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          name: string
          quota_per_user: number | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          name: string
          quota_per_user?: number | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          name?: string
          quota_per_user?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_coupons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          cancellation_reason: string | null
          cancellation_status: string | null
          check_in_time: string | null
          checked_in_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          registered_at: string | null
          status: string | null
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancellation_status?: string | null
          check_in_time?: string | null
          checked_in_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          registered_at?: string | null
          status?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancellation_status?: string | null
          check_in_time?: string | null
          checked_in_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          registered_at?: string | null
          status?: string | null
          tags?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_transactions: {
        Row: {
          coupon_id: string
          event_id: string
          id: string
          redeemed_at: string | null
          staff_id: string | null
          user_id: string
        }
        Insert: {
          coupon_id: string
          event_id: string
          id?: string
          redeemed_at?: string | null
          staff_id?: string | null
          user_id: string
        }
        Update: {
          coupon_id?: string
          event_id?: string
          id?: string
          redeemed_at?: string | null
          staff_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_transactions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "event_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          date_start: string | null
          description: string | null
          id: string
          is_online: boolean | null
          location: string | null
          province: string[] | null
          quota: number | null
          registration_deadline: string | null
          scope: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          date_start?: string | null
          description?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          province?: string[] | null
          quota?: number | null
          registration_deadline?: string | null
          scope?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          date_start?: string | null
          description?: string | null
          id?: string
          is_online?: boolean | null
          location?: string | null
          province?: string[] | null
          quota?: number | null
          registration_deadline?: string | null
          scope?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_archived: boolean | null
          status: string
          target_user_id: string | null
          title: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          status?: string
          target_user_id?: string | null
          title: string
          type?: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          status?: string
          target_user_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      master_universities: {
        Row: {
          created_at: string
          id: number
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string | null
          birth_date: string | null
          birth_place: string | null
          business_desc: string | null
          business_field: string | null
          business_location: string | null
          business_name: string | null
          business_position: string | null
          communities: string | null
          company_name: string | null
          consecutive_absences: number | null
          created_at: string | null
          current_education_level: string | null
          current_university: string | null
          domicile_city: string | null
          domicile_country: string | null
          domicile_province: string | null
          education_level: string | null
          email: string | null
          faculty: string | null
          full_name: string | null
          gender: string | null
          generation: string | null
          has_business: boolean | null
          hobbies: string | null
          id: string
          industry_sector: string | null
          interests: string | null
          is_verifier: boolean | null
          job_position: string | null
          job_type: string | null
          last_read_inbox: string | null
          linkedin_url: string | null
          major: string | null
          managed_provinces: string[] | null
          member_id: string | null
          phone: string | null
          photo_url: string | null
          role: string | null
          university: string | null
          updated_at: string | null
        }
        Insert: {
          account_status?: string | null
          birth_date?: string | null
          birth_place?: string | null
          business_desc?: string | null
          business_field?: string | null
          business_location?: string | null
          business_name?: string | null
          business_position?: string | null
          communities?: string | null
          company_name?: string | null
          consecutive_absences?: number | null
          created_at?: string | null
          current_education_level?: string | null
          current_university?: string | null
          domicile_city?: string | null
          domicile_country?: string | null
          domicile_province?: string | null
          education_level?: string | null
          email?: string | null
          faculty?: string | null
          full_name?: string | null
          gender?: string | null
          generation?: string | null
          has_business?: boolean | null
          hobbies?: string | null
          id: string
          industry_sector?: string | null
          interests?: string | null
          is_verifier?: boolean | null
          job_position?: string | null
          job_type?: string | null
          last_read_inbox?: string | null
          linkedin_url?: string | null
          major?: string | null
          managed_provinces?: string[] | null
          member_id?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          university?: string | null
          updated_at?: string | null
        }
        Update: {
          account_status?: string | null
          birth_date?: string | null
          birth_place?: string | null
          business_desc?: string | null
          business_field?: string | null
          business_location?: string | null
          business_name?: string | null
          business_position?: string | null
          communities?: string | null
          company_name?: string | null
          consecutive_absences?: number | null
          created_at?: string | null
          current_education_level?: string | null
          current_university?: string | null
          domicile_city?: string | null
          domicile_country?: string | null
          domicile_province?: string | null
          education_level?: string | null
          email?: string | null
          faculty?: string | null
          full_name?: string | null
          gender?: string | null
          generation?: string | null
          has_business?: boolean | null
          hobbies?: string | null
          id?: string
          industry_sector?: string | null
          interests?: string | null
          is_verifier?: boolean | null
          job_position?: string | null
          job_type?: string | null
          last_read_inbox?: string | null
          linkedin_url?: string | null
          major?: string | null
          managed_provinces?: string[] | null
          member_id?: string | null
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          university?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      temp_registrations: {
        Row: {
          email: string | null
          full_name: string | null
          id: string
          pin: string | null
          raw_data: Json | null
          status: string | null
          submitted_at: string | null
          whatsapp: string | null
        }
        Insert: {
          email?: string | null
          full_name?: string | null
          id?: string
          pin?: string | null
          raw_data?: Json | null
          status?: string | null
          submitted_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          id?: string
          pin?: string | null
          raw_data?: Json | null
          status?: string | null
          submitted_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_update_profile: {
        Args: { new_data: Json; target_user_id: string }
        Returns: undefined
      }
      approve_cancellation: {
        Args: { p_approve: boolean; p_event_id: string; p_user_id: string }
        Returns: undefined
      }
      check_email_status: { Args: { email_input: string }; Returns: Json }
      check_in_participant: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: undefined
      }
      finalize_event_attendance: {
        Args: { p_event_id: string }
        Returns: string
      }
      generate_new_member_id: { Args: never; Returns: string }
      get_active_alumni_count: { Args: never; Returns: number }
      get_activity_logs: {
        Args: { search_text?: string }
        Returns: {
          action: string
          actor_email: string
          actor_name: string
          created_at: string
          details: Json
          id: string
        }[]
      }
      get_all_profiles_for_admin: {
        Args: never
        Returns: {
          account_status: string | null
          birth_date: string | null
          birth_place: string | null
          business_desc: string | null
          business_field: string | null
          business_location: string | null
          business_name: string | null
          business_position: string | null
          communities: string | null
          company_name: string | null
          consecutive_absences: number | null
          created_at: string | null
          current_education_level: string | null
          current_university: string | null
          domicile_city: string | null
          domicile_country: string | null
          domicile_province: string | null
          education_level: string | null
          email: string | null
          faculty: string | null
          full_name: string | null
          gender: string | null
          generation: string | null
          has_business: boolean | null
          hobbies: string | null
          id: string
          industry_sector: string | null
          interests: string | null
          is_verifier: boolean | null
          job_position: string | null
          job_type: string | null
          last_read_inbox: string | null
          linkedin_url: string | null
          major: string | null
          managed_provinces: string[] | null
          member_id: string | null
          phone: string | null
          photo_url: string | null
          role: string | null
          university: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_directory_members: {
        Args: { search_query?: string }
        Returns: {
          company_name: string
          full_name: string
          generation: string
          id: string
          job_position: string
          linkedin_url: string
          major: string
          photo_url: string
          university: string
        }[]
      }
      get_directory_members_v2: {
        Args: { search_query?: string }
        Returns: {
          company_name: string
          full_name: string
          generation: string
          id: string
          job_position: string
          linkedin_url: string
          major: string
          photo_url: string
          university: string
        }[]
      }
      get_event_participants: {
        Args: { target_event_id: string }
        Returns: {
          email: string
          full_name: string
          generation: string
          phone: string
          user_id: string
        }[]
      }
      get_my_role: { Args: never; Returns: string }
      get_next_member_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_admin_check: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_superadmin: { Args: never; Returns: boolean }
      log_activity: {
        Args: { p_action: string; p_details?: Json; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
