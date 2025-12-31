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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          compliance_tags: string[] | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          impersonator_id: string | null
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          session_id: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          compliance_tags?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          impersonator_id?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          session_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          compliance_tags?: string[] | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          impersonator_id?: string | null
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          session_id?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      compliance_events: {
        Row: {
          affected_user_id: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          affected_user_id?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          affected_user_id?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      districts: {
        Row: {
          address: string | null
          charter_lea: string | null
          city: string | null
          created_at: string
          highest_grade: string | null
          id: string
          lea_type: string | null
          lea_type_text: string | null
          lowest_grade: string | null
          management_mode: string | null
          name: string
          nces_id: string
          operational_schools: number | null
          operational_status: string | null
          operational_status_text: string | null
          phone: string | null
          state: string
          state_lea_id: string | null
          state_name: string | null
          updated_at: string
          website: string | null
          zip: string | null
          zip4: string | null
        }
        Insert: {
          address?: string | null
          charter_lea?: string | null
          city?: string | null
          created_at?: string
          highest_grade?: string | null
          id?: string
          lea_type?: string | null
          lea_type_text?: string | null
          lowest_grade?: string | null
          management_mode?: string | null
          name: string
          nces_id: string
          operational_schools?: number | null
          operational_status?: string | null
          operational_status_text?: string | null
          phone?: string | null
          state: string
          state_lea_id?: string | null
          state_name?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
          zip4?: string | null
        }
        Update: {
          address?: string | null
          charter_lea?: string | null
          city?: string | null
          created_at?: string
          highest_grade?: string | null
          id?: string
          lea_type?: string | null
          lea_type_text?: string | null
          lowest_grade?: string | null
          management_mode?: string | null
          name?: string
          nces_id?: string
          operational_schools?: number | null
          operational_status?: string | null
          operational_status_text?: string | null
          phone?: string | null
          state?: string
          state_lea_id?: string | null
          state_name?: string | null
          updated_at?: string
          website?: string | null
          zip?: string | null
          zip4?: string | null
        }
        Relationships: []
      }
      family_accounts: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          relationship: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          relationship?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          relationship?: string | null
        }
        Relationships: []
      }
      file_access_logs: {
        Row: {
          action: string
          created_at: string | null
          file_id: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          file_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          file_id?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_access_logs_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "uploaded_files"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonation_sessions: {
        Row: {
          actions_count: number | null
          ended_at: string | null
          id: string
          reason: string
          started_at: string | null
          superadmin_id: string
          target_user_id: string
        }
        Insert: {
          actions_count?: number | null
          ended_at?: string | null
          id?: string
          reason: string
          started_at?: string | null
          superadmin_id: string
          target_user_id: string
        }
        Update: {
          actions_count?: number | null
          ended_at?: string | null
          id?: string
          reason?: string
          started_at?: string | null
          superadmin_id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      import_history: {
        Row: {
          completed_at: string | null
          created_at: string | null
          districts_processed: number | null
          duration_seconds: number | null
          error_message: string | null
          expected_total: number | null
          file_name: string
          file_size_bytes: number | null
          format: string | null
          id: string
          import_type: string
          matches_expected: boolean | null
          rows_inserted: number | null
          rows_skipped: number | null
          started_at: string | null
          state_breakdown: Json | null
          status: string
          status_breakdown: Json | null
          total_rows: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          districts_processed?: number | null
          duration_seconds?: number | null
          error_message?: string | null
          expected_total?: number | null
          file_name: string
          file_size_bytes?: number | null
          format?: string | null
          id?: string
          import_type?: string
          matches_expected?: boolean | null
          rows_inserted?: number | null
          rows_skipped?: number | null
          started_at?: string | null
          state_breakdown?: Json | null
          status?: string
          status_breakdown?: Json | null
          total_rows?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          districts_processed?: number | null
          duration_seconds?: number | null
          error_message?: string | null
          expected_total?: number | null
          file_name?: string
          file_size_bytes?: number | null
          format?: string | null
          id?: string
          import_type?: string
          matches_expected?: boolean | null
          rows_inserted?: number | null
          rows_skipped?: number | null
          started_at?: string | null
          state_breakdown?: Json | null
          status?: string
          status_breakdown?: Json | null
          total_rows?: number | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          district_id: string | null
          id: string
          logo_url: string | null
          management_mode: string | null
          name: string
          phone: string | null
          school_id: string | null
          settings: Json | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          type: Database["public"]["Enums"]["organization_type"]
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          logo_url?: string | null
          management_mode?: string | null
          name: string
          phone?: string | null
          school_id?: string | null
          settings?: Json | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          logo_url?: string | null
          management_mode?: string | null
          name?: string
          phone?: string | null
          school_id?: string | null
          settings?: Json | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          type?: Database["public"]["Enums"]["organization_type"]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_organizations_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quarantined_files: {
        Row: {
          created_at: string | null
          file_hash: string | null
          file_size_bytes: number | null
          id: string
          magic_bytes: string | null
          metadata: Json | null
          mime_type: string | null
          original_filename: string
          reason: string
          tenant_id: string | null
          upload_ip: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_hash?: string | null
          file_size_bytes?: number | null
          id?: string
          magic_bytes?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename: string
          reason: string
          tenant_id?: string | null
          upload_ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_hash?: string | null
          file_size_bytes?: number | null
          id?: string
          magic_bytes?: string | null
          metadata?: Json | null
          mime_type?: string | null
          original_filename?: string
          reason?: string
          tenant_id?: string | null
          upload_ip?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          charter_status: string | null
          city: string | null
          county: string | null
          created_at: string
          district_id: string | null
          id: string
          latitude: number | null
          lea_id: string | null
          level: string | null
          longitude: number | null
          magnet_status: string | null
          name: string
          nces_id: string | null
          operational_status: string | null
          phone: string | null
          school_type: string | null
          school_year: string | null
          state: string | null
          sy_status: string | null
          title1_status: string | null
          updated_at: string
          virtual_status: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          charter_status?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          latitude?: number | null
          lea_id?: string | null
          level?: string | null
          longitude?: number | null
          magnet_status?: string | null
          name: string
          nces_id?: string | null
          operational_status?: string | null
          phone?: string | null
          school_type?: string | null
          school_year?: string | null
          state?: string | null
          sy_status?: string | null
          title1_status?: string | null
          updated_at?: string
          virtual_status?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          charter_status?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          latitude?: number | null
          lea_id?: string | null
          level?: string | null
          longitude?: number | null
          magnet_status?: string | null
          name?: string
          nces_id?: string | null
          operational_status?: string | null
          phone?: string | null
          school_type?: string | null
          school_year?: string | null
          state?: string | null
          sy_status?: string | null
          title1_status?: string | null
          updated_at?: string
          virtual_status?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          academic_year: string | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sports: {
        Row: {
          code: string | null
          created_at: string | null
          gender: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          gender?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          gender?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          level: string | null
          max_roster_size: number | null
          name: string
          organization_id: string | null
          school_id: string | null
          season_id: string | null
          sport_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_roster_size?: number | null
          name: string
          organization_id?: string | null
          school_id?: string | null
          season_id?: string | null
          sport_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_roster_size?: number | null
          name?: string
          organization_id?: string | null
          school_id?: string | null
          season_id?: string | null
          sport_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_data_policies: {
        Row: {
          audit_log_retention_days: number | null
          created_at: string | null
          data_residency_region: string | null
          data_retention_days: number | null
          ferpa_compliant: boolean | null
          gdpr_compliant: boolean | null
          hipaa_compliant: boolean | null
          id: string
          pii_handling_policy: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          audit_log_retention_days?: number | null
          created_at?: string | null
          data_residency_region?: string | null
          data_retention_days?: number | null
          ferpa_compliant?: boolean | null
          gdpr_compliant?: boolean | null
          hipaa_compliant?: boolean | null
          id?: string
          pii_handling_policy?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          audit_log_retention_days?: number | null
          created_at?: string | null
          data_residency_region?: string | null
          data_retention_days?: number | null
          ferpa_compliant?: boolean | null
          gdpr_compliant?: boolean | null
          hipaa_compliant?: boolean | null
          id?: string
          pii_handling_policy?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      uploaded_files: {
        Row: {
          created_at: string | null
          file_size_bytes: number
          file_type: string
          height: number | null
          id: string
          metadata_stripped: boolean | null
          mime_type: string
          original_filename: string
          preview_path: string | null
          processing_status: string | null
          raw_path: string | null
          standard_path: string | null
          stored_filename: string
          tenant_id: string | null
          thumb_path: string | null
          updated_at: string | null
          upload_ip: string | null
          user_agent: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_size_bytes: number
          file_type: string
          height?: number | null
          id?: string
          metadata_stripped?: boolean | null
          mime_type: string
          original_filename: string
          preview_path?: string | null
          processing_status?: string | null
          raw_path?: string | null
          standard_path?: string | null
          stored_filename: string
          tenant_id?: string | null
          thumb_path?: string | null
          updated_at?: string | null
          upload_ip?: string | null
          user_agent?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_size_bytes?: number
          file_type?: string
          height?: number | null
          id?: string
          metadata_stripped?: boolean | null
          mime_type?: string
          original_filename?: string
          preview_path?: string | null
          processing_status?: string | null
          raw_path?: string | null
          standard_path?: string | null
          stored_filename?: string
          tenant_id?: string | null
          thumb_path?: string | null
          updated_at?: string | null
          upload_ip?: string | null
          user_agent?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      user_role_contexts: {
        Row: {
          active_district_id: string | null
          active_organization_id: string | null
          active_role: Database["public"]["Enums"]["app_role"] | null
          active_school_id: string | null
          active_season_id: string | null
          active_sport_id: string | null
          active_team_id: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_district_id?: string | null
          active_organization_id?: string | null
          active_role?: Database["public"]["Enums"]["app_role"] | null
          active_school_id?: string | null
          active_season_id?: string | null
          active_sport_id?: string | null
          active_team_id?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_district_id?: string | null
          active_organization_id?: string | null
          active_role?: Database["public"]["Enums"]["app_role"] | null
          active_school_id?: string | null
          active_season_id?: string | null
          active_sport_id?: string | null
          active_team_id?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_contexts_active_district_id_fkey"
            columns: ["active_district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_contexts_active_organization_id_fkey"
            columns: ["active_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_contexts_active_school_id_fkey"
            columns: ["active_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_contexts_active_season_id_fkey"
            columns: ["active_season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_contexts_active_sport_id_fkey"
            columns: ["active_sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_contexts_active_team_id_fkey"
            columns: ["active_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          district_id: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          season_id: string | null
          sport_id: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          district_id?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          season_id?: string | null
          sport_id?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          district_id?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          season_id?: string | null
          sport_id?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_context: {
        Args: { _user_id: string }
        Returns: {
          active_district_id: string
          active_organization_id: string
          active_role: Database["public"]["Enums"]["app_role"]
          active_school_id: string
          active_season_id: string
          active_sport_id: string
          active_team_id: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_district_role: {
        Args: {
          _district_id: string
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_school_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _school_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "system_admin"
        | "org_admin"
        | "athletic_director"
        | "coach"
        | "assistant_coach"
        | "team_manager"
        | "parent"
        | "athlete"
        | "guardian"
        | "registrar"
        | "finance_admin"
        | "gate_staff"
        | "viewer"
        | "superadmin"
        | "district_owner"
        | "district_admin"
        | "district_viewer"
        | "school_owner"
        | "school_admin"
        | "school_viewer"
        | "trainer"
        | "scorekeeper"
        | "finance_clerk"
      organization_type:
        | "school"
        | "district"
        | "league"
        | "club"
        | "youth_organization"
      subscription_tier:
        | "free"
        | "starter"
        | "school"
        | "district"
        | "enterprise"
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
    Enums: {
      app_role: [
        "system_admin",
        "org_admin",
        "athletic_director",
        "coach",
        "assistant_coach",
        "team_manager",
        "parent",
        "athlete",
        "guardian",
        "registrar",
        "finance_admin",
        "gate_staff",
        "viewer",
        "superadmin",
        "district_owner",
        "district_admin",
        "district_viewer",
        "school_owner",
        "school_admin",
        "school_viewer",
        "trainer",
        "scorekeeper",
        "finance_clerk",
      ],
      organization_type: [
        "school",
        "district",
        "league",
        "club",
        "youth_organization",
      ],
      subscription_tier: [
        "free",
        "starter",
        "school",
        "district",
        "enterprise",
      ],
    },
  },
} as const
