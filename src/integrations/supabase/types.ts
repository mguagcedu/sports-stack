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
      access_requests: {
        Row: {
          created_at: string
          id: string
          justification: string | null
          requested_page: string | null
          requested_role: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by_user_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          justification?: string | null
          requested_page?: string | null
          requested_role: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          justification?: string | null
          requested_page?: string | null
          requested_role?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_user_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      athlete_positions: {
        Row: {
          created_at: string | null
          depth_order: number | null
          id: string
          is_primary: boolean | null
          position_id: string
          team_membership_id: string
        }
        Insert: {
          created_at?: string | null
          depth_order?: number | null
          id?: string
          is_primary?: boolean | null
          position_id: string
          team_membership_id: string
        }
        Update: {
          created_at?: string | null
          depth_order?: number | null
          id?: string
          is_primary?: boolean | null
          position_id?: string
          team_membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "sport_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_positions_team_membership_id_fkey"
            columns: ["team_membership_id"]
            isOneToOne: false
            referencedRelation: "team_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          card_theme_preference: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by_user_id: string | null
          dominant_hand: string | null
          first_name: string
          grad_year: number | null
          height: string | null
          id: string
          is_anonymized: boolean | null
          last_name: string
          organization_id: string | null
          photo_url: string | null
          school_id: string | null
          updated_at: string | null
          user_id: string | null
          weight: string | null
        }
        Insert: {
          card_theme_preference?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          dominant_hand?: string | null
          first_name: string
          grad_year?: number | null
          height?: string | null
          id?: string
          is_anonymized?: boolean | null
          last_name: string
          organization_id?: string | null
          photo_url?: string | null
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight?: string | null
        }
        Update: {
          card_theme_preference?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          dominant_hand?: string | null
          first_name?: string
          grad_year?: number | null
          height?: string | null
          id?: string
          is_anonymized?: boolean | null
          last_name?: string
          organization_id?: string | null
          photo_url?: string | null
          school_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          auto_complete_reason: string | null
          auto_complete_scheduled_at: string | null
          auto_completed: boolean | null
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_in_method: string | null
          check_in_time: string | null
          check_in_verified: boolean | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          check_out_method: string | null
          check_out_time: string | null
          check_out_verified: boolean | null
          coach_notes: string | null
          created_at: string
          event_date: string
          event_id: string | null
          event_type: string
          id: string
          is_away_event: boolean
          marked_by_user_id: string | null
          status: string
          team_id: string
          team_member_id: string
          updated_at: string
        }
        Insert: {
          auto_complete_reason?: string | null
          auto_complete_scheduled_at?: string | null
          auto_completed?: boolean | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_method?: string | null
          check_in_time?: string | null
          check_in_verified?: boolean | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_method?: string | null
          check_out_time?: string | null
          check_out_verified?: boolean | null
          coach_notes?: string | null
          created_at?: string
          event_date?: string
          event_id?: string | null
          event_type?: string
          id?: string
          is_away_event?: boolean
          marked_by_user_id?: string | null
          status?: string
          team_id: string
          team_member_id: string
          updated_at?: string
        }
        Update: {
          auto_complete_reason?: string | null
          auto_complete_scheduled_at?: string | null
          auto_completed?: boolean | null
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_in_method?: string | null
          check_in_time?: string | null
          check_in_verified?: boolean | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          check_out_method?: string | null
          check_out_time?: string | null
          check_out_verified?: boolean | null
          coach_notes?: string | null
          created_at?: string
          event_date?: string
          event_id?: string | null
          event_type?: string
          id?: string
          is_away_event?: boolean
          marked_by_user_id?: string | null
          status?: string
          team_id?: string
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
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
      badge_definitions: {
        Row: {
          badge_key: string
          category: string | null
          created_at: string | null
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_assignable: boolean | null
          is_auto_awarded: boolean | null
          sport_code: string | null
        }
        Insert: {
          badge_key: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_assignable?: boolean | null
          is_auto_awarded?: boolean | null
          sport_code?: string | null
        }
        Update: {
          badge_key?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_assignable?: boolean | null
          is_auto_awarded?: boolean | null
          sport_code?: string | null
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
      concession_items: {
        Row: {
          category: string | null
          created_at: string | null
          current_inventory: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          purchase_cost: number | null
          reorder_threshold: number | null
          sale_price: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_inventory?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          purchase_cost?: number | null
          reorder_threshold?: number | null
          sale_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_inventory?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          purchase_cost?: number | null
          reorder_threshold?: number | null
          sale_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concession_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      concession_transactions: {
        Row: {
          concession_item_id: string | null
          created_at: string | null
          event_id: string | null
          id: string
          notes: string | null
          quantity: number
          recorded_by_user_id: string | null
          total_amount: number
          transaction_type: string
          unit_price: number
        }
        Insert: {
          concession_item_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          quantity: number
          recorded_by_user_id?: string | null
          total_amount: number
          transaction_type: string
          unit_price: number
        }
        Update: {
          concession_item_id?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          recorded_by_user_id?: string | null
          total_amount?: number
          transaction_type?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "concession_transactions_concession_item_id_fkey"
            columns: ["concession_item_id"]
            isOneToOne: false
            referencedRelation: "concession_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concession_transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          anonymize_on_delete: boolean | null
          created_at: string | null
          entity_type: string
          id: string
          retention_days: number | null
          soft_delete_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          anonymize_on_delete?: boolean | null
          created_at?: string | null
          entity_type: string
          id?: string
          retention_days?: number | null
          soft_delete_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          anonymize_on_delete?: boolean | null
          created_at?: string | null
          entity_type?: string
          id?: string
          retention_days?: number | null
          soft_delete_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      digital_signatures: {
        Row: {
          created_at: string | null
          form_submission_id: string | null
          id: string
          ip_address: string | null
          signature_data: string | null
          signature_type: string | null
          signed_at: string | null
          signer_name: string
          signer_role: string
          signer_user_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          form_submission_id?: string | null
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signer_name: string
          signer_role: string
          signer_user_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          form_submission_id?: string | null
          id?: string
          ip_address?: string | null
          signature_data?: string | null
          signature_type?: string | null
          signed_at?: string | null
          signer_name?: string
          signer_role?: string
          signer_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_signatures_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      district_sport_override: {
        Row: {
          created_at: string | null
          district_id: string
          id: string
          last_verified_date: string | null
          rules_url_override: string | null
          sanctioned_override: boolean | null
          sport_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          district_id: string
          id?: string
          last_verified_date?: string | null
          rules_url_override?: string | null
          sanctioned_override?: boolean | null
          sport_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          district_id?: string
          id?: string
          last_verified_date?: string | null
          rules_url_override?: string | null
          sanctioned_override?: boolean | null
          sport_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "district_sport_override_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          address: string | null
          charter_lea: string | null
          city: string | null
          created_at: string
          finalforms_enabled: boolean | null
          finalforms_portal_url: string | null
          gofan_enabled: boolean | null
          gofan_school_url: string | null
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
          finalforms_enabled?: boolean | null
          finalforms_portal_url?: string | null
          gofan_enabled?: boolean | null
          gofan_school_url?: string | null
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
          finalforms_enabled?: boolean | null
          finalforms_portal_url?: string | null
          gofan_enabled?: boolean | null
          gofan_school_url?: string | null
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
      eligibility_updates: {
        Row: {
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["eligibility_status_type"]
          old_status:
            | Database["public"]["Enums"]["eligibility_status_type"]
            | null
          reason: string | null
          team_member_id: string
          updated_by_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["eligibility_status_type"]
          old_status?:
            | Database["public"]["Enums"]["eligibility_status_type"]
            | null
          reason?: string | null
          team_member_id: string
          updated_by_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["eligibility_status_type"]
          old_status?:
            | Database["public"]["Enums"]["eligibility_status_type"]
            | null
          reason?: string | null
          team_member_id?: string
          updated_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eligibility_updates_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_access_requests: {
        Row: {
          approved_by_user_id: string | null
          created_at: string | null
          id: string
          justification: string | null
          requested_role: string
          reviewed_at: string | null
          school_id: string | null
          status: string
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_by_user_id?: string | null
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_role?: string
          reviewed_at?: string | null
          school_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_by_user_id?: string | null
          created_at?: string | null
          id?: string
          justification?: string | null
          requested_role?: string
          reviewed_at?: string | null
          school_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_access_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_access_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_audit_log: {
        Row: {
          action_description: string | null
          action_type: string
          checkout_id: string | null
          created_at: string | null
          equipment_item_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          performed_by_user_id: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          checkout_id?: string | null
          created_at?: string | null
          equipment_item_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by_user_id?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          checkout_id?: string | null
          created_at?: string | null
          equipment_item_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          performed_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_audit_log_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "equipment_checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_audit_log_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_cart: {
        Row: {
          condition: string | null
          created_at: string | null
          created_by_user_id: string
          equipment_item_id: string
          id: string
          notes: string | null
          quantity: number | null
          recipient_team_member_id: string | null
          recipient_user_id: string
          session_id: string
          size_id: string | null
          status: string | null
          team_id: string | null
          tracking_code: string | null
          updated_at: string | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          created_by_user_id: string
          equipment_item_id: string
          id?: string
          notes?: string | null
          quantity?: number | null
          recipient_team_member_id?: string | null
          recipient_user_id: string
          session_id: string
          size_id?: string | null
          status?: string | null
          team_id?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          created_by_user_id?: string
          equipment_item_id?: string
          id?: string
          notes?: string | null
          quantity?: number | null
          recipient_team_member_id?: string | null
          recipient_user_id?: string
          session_id?: string
          size_id?: string | null
          status?: string | null
          team_id?: string | null
          tracking_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_cart_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_cart_recipient_team_member_id_fkey"
            columns: ["recipient_team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_cart_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "equipment_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_cart_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_categories: {
        Row: {
          code: string
          created_at: string | null
          default_lifespan_years: number | null
          description: string | null
          has_sizes: boolean | null
          icon: string | null
          id: string
          name: string
          requires_inspection: boolean | null
          sport_code: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          default_lifespan_years?: number | null
          description?: string | null
          has_sizes?: boolean | null
          icon?: string | null
          id?: string
          name: string
          requires_inspection?: boolean | null
          sport_code?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          default_lifespan_years?: number | null
          description?: string | null
          has_sizes?: boolean | null
          icon?: string | null
          id?: string
          name?: string
          requires_inspection?: boolean | null
          sport_code?: string | null
        }
        Relationships: []
      }
      equipment_checkouts: {
        Row: {
          actual_return_date: string | null
          checked_out_by_user_id: string
          checkout_date: string
          condition_on_checkout: string | null
          condition_on_return: string | null
          created_at: string | null
          equipment_item_id: string
          expected_return_date: string | null
          id: string
          needs_refurbishment: boolean | null
          notes: string | null
          quantity: number
          refurbishment_notes: string | null
          return_notes: string | null
          return_received_by_user_id: string | null
          reusable: boolean | null
          size_id: string | null
          status: string
          team_id: string | null
          team_member_id: string | null
          tracking_code: string | null
          tracking_method: string | null
          updated_at: string | null
          user_id: string
          wash_required: boolean | null
          washed_at: string | null
          washed_by_user_id: string | null
        }
        Insert: {
          actual_return_date?: string | null
          checked_out_by_user_id: string
          checkout_date?: string
          condition_on_checkout?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          equipment_item_id: string
          expected_return_date?: string | null
          id?: string
          needs_refurbishment?: boolean | null
          notes?: string | null
          quantity?: number
          refurbishment_notes?: string | null
          return_notes?: string | null
          return_received_by_user_id?: string | null
          reusable?: boolean | null
          size_id?: string | null
          status?: string
          team_id?: string | null
          team_member_id?: string | null
          tracking_code?: string | null
          tracking_method?: string | null
          updated_at?: string | null
          user_id: string
          wash_required?: boolean | null
          washed_at?: string | null
          washed_by_user_id?: string | null
        }
        Update: {
          actual_return_date?: string | null
          checked_out_by_user_id?: string
          checkout_date?: string
          condition_on_checkout?: string | null
          condition_on_return?: string | null
          created_at?: string | null
          equipment_item_id?: string
          expected_return_date?: string | null
          id?: string
          needs_refurbishment?: boolean | null
          notes?: string | null
          quantity?: number
          refurbishment_notes?: string | null
          return_notes?: string | null
          return_received_by_user_id?: string | null
          reusable?: boolean | null
          size_id?: string | null
          status?: string
          team_id?: string | null
          team_member_id?: string | null
          tracking_code?: string | null
          tracking_method?: string | null
          updated_at?: string | null
          user_id?: string
          wash_required?: boolean | null
          washed_at?: string | null
          washed_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_checkouts_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "equipment_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_checkouts_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_delegations: {
        Row: {
          created_at: string | null
          delegated_by_user_id: string
          delegation_type: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          revoked_at: string | null
          revoked_by_user_id: string | null
          school_id: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delegated_by_user_id: string
          delegation_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          revoked_by_user_id?: string | null
          school_id?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delegated_by_user_id?: string
          delegation_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          revoked_at?: string | null
          revoked_by_user_id?: string | null
          school_id?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_delegations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_delegations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string
          equipment_item_id: string
          file_name: string
          file_size_bytes: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_by_user_id: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type: string
          equipment_item_id: string
          file_name: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_by_user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string
          equipment_item_id?: string
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_by_user_id?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_documents_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_issuance: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          issued_at: string | null
          issued_by_user_id: string | null
          notes: string | null
          package_id: string | null
          received_by_user_id: string | null
          return_due_date: string | null
          returned_at: string | null
          status: string | null
          team_id: string | null
          team_member_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by_user_id?: string | null
          notes?: string | null
          package_id?: string | null
          received_by_user_id?: string | null
          return_due_date?: string | null
          returned_at?: string | null
          status?: string | null
          team_id?: string | null
          team_member_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          issued_at?: string | null
          issued_by_user_id?: string | null
          notes?: string | null
          package_id?: string | null
          received_by_user_id?: string | null
          return_due_date?: string | null
          returned_at?: string | null
          status?: string | null
          team_id?: string | null
          team_member_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_issuance_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "equipment_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_issuance_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_issuance_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_issuance_items: {
        Row: {
          checkout_id: string | null
          created_at: string | null
          equipment_item_id: string | null
          id: string
          issuance_id: string
          issued_at: string | null
          notes: string | null
          package_item_id: string | null
          quantity_expected: number | null
          quantity_issued: number | null
          returned_at: string | null
          size_id: string | null
          status: string | null
        }
        Insert: {
          checkout_id?: string | null
          created_at?: string | null
          equipment_item_id?: string | null
          id?: string
          issuance_id: string
          issued_at?: string | null
          notes?: string | null
          package_item_id?: string | null
          quantity_expected?: number | null
          quantity_issued?: number | null
          returned_at?: string | null
          size_id?: string | null
          status?: string | null
        }
        Update: {
          checkout_id?: string | null
          created_at?: string | null
          equipment_item_id?: string | null
          id?: string
          issuance_id?: string
          issued_at?: string | null
          notes?: string | null
          package_item_id?: string | null
          quantity_expected?: number | null
          quantity_issued?: number | null
          returned_at?: string | null
          size_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_issuance_items_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "equipment_checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_issuance_items_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_issuance_items_issuance_id_fkey"
            columns: ["issuance_id"]
            isOneToOne: false
            referencedRelation: "equipment_issuance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_issuance_items_package_item_id_fkey"
            columns: ["package_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_package_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_issuance_items_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "equipment_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_items: {
        Row: {
          assigned_value: number | null
          available_quantity: number
          barcode: string | null
          category: string
          code_type: string | null
          condition_status: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_returnable: boolean | null
          last_inspection_date: string | null
          last_recertification_date: string | null
          lifecycle_status: string | null
          manufacturer: string | null
          max_lifespan_years: number | null
          model_number: string | null
          name: string
          next_inspection_date: string | null
          non_returnable_reason: string | null
          notes: string | null
          organization_id: string | null
          our_cost: number | null
          purchase_date: string | null
          received_date: string | null
          recertification_due_date: string | null
          recertification_interval_months: number | null
          reorder_threshold: number | null
          requires_washing: boolean | null
          retail_price: number | null
          retirement_date: string | null
          school_id: string | null
          serial_number: string | null
          sku: string | null
          sport_code: string | null
          total_quantity: number
          unit_cost: number | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          assigned_value?: number | null
          available_quantity?: number
          barcode?: string | null
          category: string
          code_type?: string | null
          condition_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_returnable?: boolean | null
          last_inspection_date?: string | null
          last_recertification_date?: string | null
          lifecycle_status?: string | null
          manufacturer?: string | null
          max_lifespan_years?: number | null
          model_number?: string | null
          name: string
          next_inspection_date?: string | null
          non_returnable_reason?: string | null
          notes?: string | null
          organization_id?: string | null
          our_cost?: number | null
          purchase_date?: string | null
          received_date?: string | null
          recertification_due_date?: string | null
          recertification_interval_months?: number | null
          reorder_threshold?: number | null
          requires_washing?: boolean | null
          retail_price?: number | null
          retirement_date?: string | null
          school_id?: string | null
          serial_number?: string | null
          sku?: string | null
          sport_code?: string | null
          total_quantity?: number
          unit_cost?: number | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          assigned_value?: number | null
          available_quantity?: number
          barcode?: string | null
          category?: string
          code_type?: string | null
          condition_status?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_returnable?: boolean | null
          last_inspection_date?: string | null
          last_recertification_date?: string | null
          lifecycle_status?: string | null
          manufacturer?: string | null
          max_lifespan_years?: number | null
          model_number?: string | null
          name?: string
          next_inspection_date?: string | null
          non_returnable_reason?: string | null
          notes?: string | null
          organization_id?: string | null
          our_cost?: number | null
          purchase_date?: string | null
          received_date?: string | null
          recertification_due_date?: string | null
          recertification_interval_months?: number | null
          reorder_threshold?: number | null
          requires_washing?: boolean | null
          retail_price?: number | null
          retirement_date?: string | null
          school_id?: string | null
          serial_number?: string | null
          sku?: string | null
          sport_code?: string | null
          total_quantity?: number
          unit_cost?: number | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_lifecycle_logs: {
        Row: {
          action_date: string | null
          action_type: string
          created_at: string | null
          document_url: string | null
          equipment_item_id: string
          id: string
          metadata: Json | null
          new_status: string | null
          notes: string | null
          old_status: string | null
          performed_by_user_id: string | null
        }
        Insert: {
          action_date?: string | null
          action_type: string
          created_at?: string | null
          document_url?: string | null
          equipment_item_id: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by_user_id?: string | null
        }
        Update: {
          action_date?: string | null
          action_type?: string
          created_at?: string | null
          document_url?: string | null
          equipment_item_id?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_lifecycle_logs_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_package_items: {
        Row: {
          category: string
          created_at: string | null
          equipment_item_id: string | null
          id: string
          is_required: boolean | null
          item_name: string
          notes: string | null
          package_id: string
          quantity: number | null
          subcategory: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          equipment_item_id?: string | null
          id?: string
          is_required?: boolean | null
          item_name: string
          notes?: string | null
          package_id: string
          quantity?: number | null
          subcategory?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          equipment_item_id?: string | null
          id?: string
          is_required?: boolean | null
          item_name?: string
          notes?: string | null
          package_id?: string
          quantity?: number | null
          subcategory?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_package_items_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_package_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "equipment_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_packages: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sport_code: string | null
          team_level: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sport_code?: string | null
          team_level?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sport_code?: string | null
          team_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_refurbishment: {
        Row: {
          cost: number | null
          created_at: string | null
          equipment_item_id: string
          id: string
          next_due_date: string | null
          notes: string | null
          performed_by_user_id: string | null
          provider: string | null
          refurb_date: string
          refurb_type: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          equipment_item_id: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by_user_id?: string | null
          provider?: string | null
          refurb_date?: string
          refurb_type: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          equipment_item_id?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by_user_id?: string | null
          provider?: string | null
          refurb_date?: string
          refurb_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_refurbishment_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_sizes: {
        Row: {
          available_quantity: number
          created_at: string | null
          equipment_item_id: string
          id: string
          quantity: number
          size_label: string
        }
        Insert: {
          available_quantity?: number
          created_at?: string | null
          equipment_item_id: string
          id?: string
          quantity?: number
          size_label: string
        }
        Update: {
          available_quantity?: number
          created_at?: string | null
          equipment_item_id?: string
          id?: string
          quantity?: number
          size_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_sizes_equipment_item_id_fkey"
            columns: ["equipment_item_id"]
            isOneToOne: false
            referencedRelation: "equipment_items"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_sku_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          next_number: number | null
          organization_id: string | null
          prefix: string
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          next_number?: number | null
          organization_id?: string | null
          prefix: string
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          next_number?: number | null
          organization_id?: string | null
          prefix?: string
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      event_tickets: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          payment_id: string | null
          payment_status: string | null
          purchased_at: string | null
          purchaser_email: string
          purchaser_name: string | null
          purchaser_user_id: string | null
          quantity: number
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          purchaser_email: string
          purchaser_name?: string | null
          purchaser_user_id?: string | null
          quantity?: number
          total_amount: number
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          payment_id?: string | null
          payment_status?: string | null
          purchased_at?: string | null
          purchaser_email?: string
          purchaser_name?: string | null
          purchaser_user_id?: string | null
          quantity?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          away_team_id: string | null
          created_at: string | null
          custom_season_label: string | null
          end_time: string | null
          event_type: string
          forms_provider:
            | Database["public"]["Enums"]["forms_provider_type"]
            | null
          gofan_event_url: string | null
          home_team_id: string | null
          id: string
          is_cancelled: boolean | null
          max_capacity: number | null
          name: string
          organization_id: string
          school_year: number | null
          season: Database["public"]["Enums"]["sport_season_type"] | null
          season_year_label: string | null
          sport_key: string | null
          start_time: string
          ticket_price: number | null
          ticketing_provider:
            | Database["public"]["Enums"]["ticketing_provider_type"]
            | null
          tickets_sold: number | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          away_team_id?: string | null
          created_at?: string | null
          custom_season_label?: string | null
          end_time?: string | null
          event_type: string
          forms_provider?:
            | Database["public"]["Enums"]["forms_provider_type"]
            | null
          gofan_event_url?: string | null
          home_team_id?: string | null
          id?: string
          is_cancelled?: boolean | null
          max_capacity?: number | null
          name: string
          organization_id: string
          school_year?: number | null
          season?: Database["public"]["Enums"]["sport_season_type"] | null
          season_year_label?: string | null
          sport_key?: string | null
          start_time: string
          ticket_price?: number | null
          ticketing_provider?:
            | Database["public"]["Enums"]["ticketing_provider_type"]
            | null
          tickets_sold?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Update: {
          away_team_id?: string | null
          created_at?: string | null
          custom_season_label?: string | null
          end_time?: string | null
          event_type?: string
          forms_provider?:
            | Database["public"]["Enums"]["forms_provider_type"]
            | null
          gofan_event_url?: string | null
          home_team_id?: string | null
          id?: string
          is_cancelled?: boolean | null
          max_capacity?: number | null
          name?: string
          organization_id?: string
          school_year?: number | null
          season?: Database["public"]["Enums"]["sport_season_type"] | null
          season_year_label?: string | null
          sport_key?: string | null
          start_time?: string
          ticket_price?: number | null
          ticketing_provider?:
            | Database["public"]["Enums"]["ticketing_provider_type"]
            | null
          tickets_sold?: number | null
          updated_at?: string | null
          venue_address?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      financial_adjustments: {
        Row: {
          adjustment_type: string
          amount_cents: number
          approved_at: string | null
          approved_by_user_id: string | null
          created_at: string | null
          created_by_user_id: string
          id: string
          metadata: Json | null
          original_entry_id: string
          reason: string
        }
        Insert: {
          adjustment_type: string
          amount_cents: number
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string | null
          created_by_user_id: string
          id?: string
          metadata?: Json | null
          original_entry_id: string
          reason: string
        }
        Update: {
          adjustment_type?: string
          amount_cents?: number
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string | null
          created_by_user_id?: string
          id?: string
          metadata?: Json | null
          original_entry_id?: string
          reason?: string
        }
        Relationships: []
      }
      financial_ledger: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          fiscal_year: string | null
          id: string
          is_income: boolean
          notes: string | null
          organization_id: string | null
          reference_id: string | null
          reference_type: string | null
          subcategory: string | null
          team_id: string | null
          transaction_date: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          fiscal_year?: string | null
          id?: string
          is_income?: boolean
          notes?: string | null
          organization_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          subcategory?: string | null
          team_id?: string | null
          transaction_date?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          fiscal_year?: string | null
          id?: string
          is_income?: boolean
          notes?: string | null
          organization_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          subcategory?: string | null
          team_id?: string | null
          transaction_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      form_access_log: {
        Row: {
          access_type: string
          accessed_by_user_id: string
          created_at: string | null
          form_submission_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by_user_id: string
          created_at?: string | null
          form_submission_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by_user_id?: string
          created_at?: string | null
          form_submission_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          athlete_user_id: string
          created_at: string | null
          form_id: string | null
          id: string
          registration_id: string | null
          responses: Json | null
          status: string | null
          submitted_at: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          athlete_user_id: string
          created_at?: string | null
          form_id?: string | null
          id?: string
          registration_id?: string | null
          responses?: Json | null
          status?: string | null
          submitted_at?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          athlete_user_id?: string
          created_at?: string | null
          form_id?: string | null
          id?: string
          registration_id?: string | null
          responses?: Json | null
          status?: string | null
          submitted_at?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "registration_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_day_roster_entries: {
        Row: {
          created_at: string | null
          depth_order: number | null
          game_day_roster_id: string
          id: string
          is_starter: boolean | null
          line_group_override: string | null
          notes: string | null
          position_override: string | null
          status: string | null
          team_member_id: string
        }
        Insert: {
          created_at?: string | null
          depth_order?: number | null
          game_day_roster_id: string
          id?: string
          is_starter?: boolean | null
          line_group_override?: string | null
          notes?: string | null
          position_override?: string | null
          status?: string | null
          team_member_id: string
        }
        Update: {
          created_at?: string | null
          depth_order?: number | null
          game_day_roster_id?: string
          id?: string
          is_starter?: boolean | null
          line_group_override?: string | null
          notes?: string | null
          position_override?: string | null
          status?: string | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_day_roster_entries_game_day_roster_id_fkey"
            columns: ["game_day_roster_id"]
            isOneToOne: false
            referencedRelation: "game_day_rosters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_day_roster_entries_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      game_day_rosters: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          notes: string | null
          published_at: string | null
          published_by_user_id: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          notes?: string | null
          published_at?: string | null
          published_by_user_id?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          published_at?: string | null
          published_by_user_id?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_day_rosters_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_day_rosters_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_fence_settings: {
        Row: {
          away_game_auto_complete_hours: number
          created_at: string
          id: string
          is_active: boolean
          latitude: number
          longitude: number
          minimum_time_minutes: number
          radius_meters: number
          require_check_out: boolean
          school_id: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          away_game_auto_complete_hours?: number
          created_at?: string
          id?: string
          is_active?: boolean
          latitude: number
          longitude: number
          minimum_time_minutes?: number
          radius_meters?: number
          require_check_out?: boolean
          school_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          away_game_auto_complete_hours?: number
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number
          longitude?: number
          minimum_time_minutes?: number
          radius_meters?: number
          require_check_out?: boolean
          school_id?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geo_fence_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geo_fence_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      governing_bodies: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_seeded: boolean | null
          name: string
          region_label: string | null
          short_name: string | null
          state_code: string | null
          type: Database["public"]["Enums"]["governing_body_type"]
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_seeded?: boolean | null
          name: string
          region_label?: string | null
          short_name?: string | null
          state_code?: string | null
          type?: Database["public"]["Enums"]["governing_body_type"]
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_seeded?: boolean | null
          name?: string
          region_label?: string | null
          short_name?: string | null
          state_code?: string | null
          type?: Database["public"]["Enums"]["governing_body_type"]
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
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
      jersey_numbers: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          jersey_number: number | null
          team_membership_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          jersey_number?: number | null
          team_membership_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          jersey_number?: number | null
          team_membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jersey_numbers_team_membership_id_fkey"
            columns: ["team_membership_id"]
            isOneToOne: false
            referencedRelation: "team_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      line_groups: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          description: string | null
          display_name: string
          id: string
          is_custom: boolean | null
          is_default: boolean | null
          line_key: string
          season_id: string | null
          sort_order: number | null
          sport_key: string
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_custom?: boolean | null
          is_default?: boolean | null
          line_key: string
          season_id?: string | null
          sort_order?: number | null
          sport_key: string
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_custom?: boolean | null
          is_default?: boolean | null
          line_key?: string
          season_id?: string | null
          sort_order?: number | null
          sport_key?: string
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "line_groups_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_groups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          created_at: string | null
          email: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_agent?: string | null
        }
        Relationships: []
      }
      member_line_groups: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          line_group_id: string
          team_membership_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          line_group_id: string
          team_membership_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          line_group_id?: string
          team_membership_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_line_groups_line_group_id_fkey"
            columns: ["line_group_id"]
            isOneToOne: false
            referencedRelation: "line_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_line_groups_team_membership_id_fkey"
            columns: ["team_membership_id"]
            isOneToOne: false
            referencedRelation: "team_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_security_settings: {
        Row: {
          allow_public_cards: boolean | null
          allow_public_rosters: boolean | null
          created_at: string | null
          id: string
          max_sessions_per_user: number | null
          mfa_required: boolean | null
          organization_id: string
          password_min_length: number | null
          password_require_lowercase: boolean | null
          password_require_number: boolean | null
          password_require_special: boolean | null
          password_require_uppercase: boolean | null
          session_timeout_minutes: number | null
          show_athlete_height_weight: boolean | null
          show_athlete_photos: boolean | null
          show_athlete_ratings: boolean | null
          show_jersey_numbers: boolean | null
          updated_at: string | null
        }
        Insert: {
          allow_public_cards?: boolean | null
          allow_public_rosters?: boolean | null
          created_at?: string | null
          id?: string
          max_sessions_per_user?: number | null
          mfa_required?: boolean | null
          organization_id: string
          password_min_length?: number | null
          password_require_lowercase?: boolean | null
          password_require_number?: boolean | null
          password_require_special?: boolean | null
          password_require_uppercase?: boolean | null
          session_timeout_minutes?: number | null
          show_athlete_height_weight?: boolean | null
          show_athlete_photos?: boolean | null
          show_athlete_ratings?: boolean | null
          show_jersey_numbers?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allow_public_cards?: boolean | null
          allow_public_rosters?: boolean | null
          created_at?: string | null
          id?: string
          max_sessions_per_user?: number | null
          mfa_required?: boolean | null
          organization_id?: string
          password_min_length?: number | null
          password_require_lowercase?: boolean | null
          password_require_number?: boolean | null
          password_require_special?: boolean | null
          password_require_uppercase?: boolean | null
          session_timeout_minutes?: number | null
          show_athlete_height_weight?: boolean | null
          show_athlete_photos?: boolean | null
          show_athlete_ratings?: boolean | null
          show_jersey_numbers?: boolean | null
          updated_at?: string | null
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
      password_history: {
        Row: {
          created_at: string | null
          id: string
          password_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password_hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string
          payment_type: string
          reference_id: string | null
          reference_type: string | null
          status: string
          stripe_payment_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          payment_type: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          payment_type?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          stripe_payment_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_approvals: {
        Row: {
          child_user_id: string | null
          created_at: string
          id: string
          invitation_id: string | null
          organization_id: string | null
          parent_user_id: string | null
          rejection_reason: string | null
          requested_role: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          child_user_id?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          organization_id?: string | null
          parent_user_id?: string | null
          rejection_reason?: string | null
          requested_role: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          child_user_id?: string | null
          created_at?: string
          id?: string
          invitation_id?: string | null
          organization_id?: string | null
          parent_user_id?: string | null
          rejection_reason?: string | null
          requested_role?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_approvals_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "team_invitations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_approvals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_approvals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      player_achievements: {
        Row: {
          achievement_date: string
          achievement_type: string
          awarded_by_user_id: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_public: boolean
          stat_category: string | null
          stat_value: number | null
          team_member_id: string
          title: string
        }
        Insert: {
          achievement_date?: string
          achievement_type: string
          awarded_by_user_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          stat_category?: string | null
          stat_value?: number | null
          team_member_id: string
          title: string
        }
        Update: {
          achievement_date?: string
          achievement_type?: string
          awarded_by_user_id?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          stat_category?: string | null
          stat_value?: number | null
          team_member_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_achievements_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      player_badges: {
        Row: {
          awarded_at: string | null
          awarded_by_user_id: string | null
          badge_definition_id: string
          expires_at: string | null
          id: string
          notes: string | null
          team_member_id: string
        }
        Insert: {
          awarded_at?: string | null
          awarded_by_user_id?: string | null
          badge_definition_id: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          team_member_id: string
        }
        Update: {
          awarded_at?: string | null
          awarded_by_user_id?: string | null
          badge_definition_id?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_badges_badge_definition_id_fkey"
            columns: ["badge_definition_id"]
            isOneToOne: false
            referencedRelation: "badge_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_badges_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      player_disciplines: {
        Row: {
          bench_duration: string | null
          consequence_type: string | null
          created_at: string | null
          description: string
          discipline_type: string
          games_suspended: number | null
          id: string
          incident_date: string
          issued_by_user_id: string | null
          notes: string | null
          notify_parents: boolean | null
          notify_player: boolean | null
          notify_team: boolean | null
          served_date: string | null
          severity: string
          status: string
          team_id: string
          team_member_id: string
          updated_at: string | null
        }
        Insert: {
          bench_duration?: string | null
          consequence_type?: string | null
          created_at?: string | null
          description: string
          discipline_type: string
          games_suspended?: number | null
          id?: string
          incident_date?: string
          issued_by_user_id?: string | null
          notes?: string | null
          notify_parents?: boolean | null
          notify_player?: boolean | null
          notify_team?: boolean | null
          served_date?: string | null
          severity?: string
          status?: string
          team_id: string
          team_member_id: string
          updated_at?: string | null
        }
        Update: {
          bench_duration?: string | null
          consequence_type?: string | null
          created_at?: string | null
          description?: string
          discipline_type?: string
          games_suspended?: number | null
          id?: string
          incident_date?: string
          issued_by_user_id?: string | null
          notes?: string | null
          notify_parents?: boolean | null
          notify_player?: boolean | null
          notify_team?: boolean | null
          served_date?: string | null
          severity?: string
          status?: string
          team_id?: string
          team_member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_disciplines_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_disciplines_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      player_injuries: {
        Row: {
          actual_return_date: string | null
          body_part: string | null
          cleared_by_user_id: string | null
          created_at: string | null
          estimated_return_date: string | null
          id: string
          injury_date: string
          injury_description: string | null
          injury_type: string
          is_on_ir: boolean | null
          notes: string | null
          reported_by_user_id: string | null
          status: string
          team_id: string
          team_member_id: string
          updated_at: string | null
        }
        Insert: {
          actual_return_date?: string | null
          body_part?: string | null
          cleared_by_user_id?: string | null
          created_at?: string | null
          estimated_return_date?: string | null
          id?: string
          injury_date?: string
          injury_description?: string | null
          injury_type: string
          is_on_ir?: boolean | null
          notes?: string | null
          reported_by_user_id?: string | null
          status?: string
          team_id: string
          team_member_id: string
          updated_at?: string | null
        }
        Update: {
          actual_return_date?: string | null
          body_part?: string | null
          cleared_by_user_id?: string | null
          created_at?: string | null
          estimated_return_date?: string | null
          id?: string
          injury_date?: string
          injury_description?: string | null
          injury_type?: string
          is_on_ir?: boolean | null
          notes?: string | null
          reported_by_user_id?: string | null
          status?: string
          team_id?: string
          team_member_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_injuries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_injuries_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      player_practice_notes: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          is_private: boolean
          note_type: string
          noted_by_user_id: string
          notes: string
          practice_date: string
          session_effort: number | null
          session_performance: number | null
          team_member_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_private?: boolean
          note_type?: string
          noted_by_user_id: string
          notes: string
          practice_date?: string
          session_effort?: number | null
          session_performance?: number | null
          team_member_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_private?: boolean
          note_type?: string
          noted_by_user_id?: string
          notes?: string
          practice_date?: string
          session_effort?: number | null
          session_performance?: number | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_practice_notes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_practice_notes_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      player_praises: {
        Row: {
          created_at: string | null
          given_by_user_id: string | null
          id: string
          is_public: boolean | null
          notes: string | null
          praise_type: string
          team_id: string
          team_member_id: string
        }
        Insert: {
          created_at?: string | null
          given_by_user_id?: string | null
          id?: string
          is_public?: boolean | null
          notes?: string | null
          praise_type: string
          team_id: string
          team_member_id: string
        }
        Update: {
          created_at?: string | null
          given_by_user_id?: string | null
          id?: string
          is_public?: boolean | null
          notes?: string | null
          praise_type?: string
          team_id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_praises_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_praises_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      player_ratings: {
        Row: {
          areas_for_improvement: string | null
          attitude_rating: number | null
          coach_notes: string | null
          coachability_rating: number | null
          created_at: string
          current_line: string | null
          depth_position: number | null
          effort_rating: number | null
          game_iq_rating: number | null
          id: string
          overall_rating: number | null
          rated_by_user_id: string
          rating_date: string
          skill_rating: number | null
          strengths: string | null
          team_member_id: string
          teamwork_rating: number | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          attitude_rating?: number | null
          coach_notes?: string | null
          coachability_rating?: number | null
          created_at?: string
          current_line?: string | null
          depth_position?: number | null
          effort_rating?: number | null
          game_iq_rating?: number | null
          id?: string
          overall_rating?: number | null
          rated_by_user_id: string
          rating_date?: string
          skill_rating?: number | null
          strengths?: string | null
          team_member_id: string
          teamwork_rating?: number | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          attitude_rating?: number | null
          coach_notes?: string | null
          coachability_rating?: number | null
          created_at?: string
          current_line?: string | null
          depth_position?: number | null
          effort_rating?: number | null
          game_iq_rating?: number | null
          id?: string
          overall_rating?: number | null
          rated_by_user_id?: string
          rating_date?: string
          skill_rating?: number | null
          strengths?: string | null
          team_member_id?: string
          teamwork_rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_ratings_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_settings: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          setting_key: string
          setting_value: boolean | null
          updated_at: string | null
          updated_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          setting_key: string
          setting_value?: boolean | null
          updated_at?: string | null
          updated_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          setting_key?: string
          setting_value?: boolean | null
          updated_at?: string | null
          updated_by_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_updated_at: string | null
          avatar_url: string | null
          birth_date: string | null
          birthday_notification_enabled: boolean | null
          card_photo_url: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_anonymized: boolean | null
          last_name: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_updated_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birthday_notification_enabled?: boolean | null
          card_photo_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_anonymized?: boolean | null
          last_name?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_updated_at?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          birthday_notification_enabled?: boolean | null
          card_photo_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_anonymized?: boolean | null
          last_name?: string | null
          phone?: string | null
          photo_url?: string | null
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
      registration_forms: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          district_id: string | null
          external_provider: string | null
          external_url: string | null
          form_type: string
          id: string
          is_required: boolean | null
          requires_admin_signature: boolean | null
          requires_coach_signature: boolean | null
          requires_parent_signature: boolean | null
          school_id: string | null
          sport_code: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          external_provider?: string | null
          external_url?: string | null
          form_type: string
          id?: string
          is_required?: boolean | null
          requires_admin_signature?: boolean | null
          requires_coach_signature?: boolean | null
          requires_parent_signature?: boolean | null
          school_id?: string | null
          sport_code?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          district_id?: string | null
          external_provider?: string | null
          external_url?: string | null
          form_type?: string
          id?: string
          is_required?: boolean | null
          requires_admin_signature?: boolean | null
          requires_coach_signature?: boolean | null
          requires_parent_signature?: boolean | null
          school_id?: string | null
          sport_code?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_forms_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_forms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          athlete_user_id: string
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          medical_notes: string | null
          notes: string | null
          parent_user_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          athlete_user_id: string
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_notes?: string | null
          notes?: string | null
          parent_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          athlete_user_id?: string
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          medical_notes?: string | null
          notes?: string | null
          parent_user_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      roster_reveal_state: {
        Row: {
          created_at: string | null
          id: string
          last_replayed_at: string | null
          reveal_completed_at: string | null
          reveal_enabled_on_dashboard: boolean | null
          season_id: string | null
          team_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_replayed_at?: string | null
          reveal_completed_at?: string | null
          reveal_enabled_on_dashboard?: boolean | null
          season_id?: string | null
          team_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_replayed_at?: string | null
          reveal_completed_at?: string | null
          reveal_enabled_on_dashboard?: boolean | null
          season_id?: string | null
          team_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roster_reveal_state_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roster_reveal_state_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      school_governing_bodies: {
        Row: {
          created_at: string | null
          governing_body_id: string
          id: string
          is_primary: boolean | null
          school_id: string
        }
        Insert: {
          created_at?: string | null
          governing_body_id: string
          id?: string
          is_primary?: boolean | null
          school_id: string
        }
        Update: {
          created_at?: string | null
          governing_body_id?: string
          id?: string
          is_primary?: boolean | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_governing_bodies_governing_body_id_fkey"
            columns: ["governing_body_id"]
            isOneToOne: false
            referencedRelation: "governing_bodies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_governing_bodies_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          accent_color: string | null
          address: string | null
          charter_status: string | null
          city: string | null
          county: string | null
          created_at: string
          district_id: string | null
          finalforms_enabled: boolean | null
          finalforms_portal_url: string | null
          gofan_enabled: boolean | null
          gofan_school_url: string | null
          id: string
          latitude: number | null
          lea_id: string | null
          level: string | null
          logo_url: string | null
          longitude: number | null
          magnet_status: string | null
          name: string
          nces_id: string | null
          operational_status: string | null
          phone: string | null
          primary_color: string | null
          primary_governing_body_id: string | null
          school_type: string | null
          school_year: string | null
          secondary_color: string | null
          state: string | null
          sy_status: string | null
          text_on_primary: string | null
          theme_source: string | null
          title1_status: string | null
          updated_at: string
          virtual_status: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          accent_color?: string | null
          address?: string | null
          charter_status?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          district_id?: string | null
          finalforms_enabled?: boolean | null
          finalforms_portal_url?: string | null
          gofan_enabled?: boolean | null
          gofan_school_url?: string | null
          id?: string
          latitude?: number | null
          lea_id?: string | null
          level?: string | null
          logo_url?: string | null
          longitude?: number | null
          magnet_status?: string | null
          name: string
          nces_id?: string | null
          operational_status?: string | null
          phone?: string | null
          primary_color?: string | null
          primary_governing_body_id?: string | null
          school_type?: string | null
          school_year?: string | null
          secondary_color?: string | null
          state?: string | null
          sy_status?: string | null
          text_on_primary?: string | null
          theme_source?: string | null
          title1_status?: string | null
          updated_at?: string
          virtual_status?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          accent_color?: string | null
          address?: string | null
          charter_status?: string | null
          city?: string | null
          county?: string | null
          created_at?: string
          district_id?: string | null
          finalforms_enabled?: boolean | null
          finalforms_portal_url?: string | null
          gofan_enabled?: boolean | null
          gofan_school_url?: string | null
          id?: string
          latitude?: number | null
          lea_id?: string | null
          level?: string | null
          logo_url?: string | null
          longitude?: number | null
          magnet_status?: string | null
          name?: string
          nces_id?: string | null
          operational_status?: string | null
          phone?: string | null
          primary_color?: string | null
          primary_governing_body_id?: string | null
          school_type?: string | null
          school_year?: string | null
          secondary_color?: string | null
          state?: string | null
          sy_status?: string | null
          text_on_primary?: string | null
          theme_source?: string | null
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
          {
            foreignKeyName: "schools_primary_governing_body_id_fkey"
            columns: ["primary_governing_body_id"]
            isOneToOne: false
            referencedRelation: "governing_bodies"
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
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          resolved_at: string | null
          resolved_by_user_id: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          resolved_at?: string | null
          resolved_by_user_id?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sport_bench_rules: {
        Row: {
          bench_duration_key: string
          created_at: string | null
          display_name: string
          id: string
          sort_order: number | null
          sport_code: string
        }
        Insert: {
          bench_duration_key: string
          created_at?: string | null
          display_name: string
          id?: string
          sort_order?: number | null
          sport_code: string
        }
        Update: {
          bench_duration_key?: string
          created_at?: string | null
          display_name?: string
          id?: string
          sort_order?: number | null
          sport_code?: string
        }
        Relationships: []
      }
      sport_layout_templates: {
        Row: {
          created_at: string | null
          default_for_sport: boolean | null
          display_name: string
          id: string
          side: string | null
          slot_map: Json
          sport_key: string
          template_key: string
          template_type: string
        }
        Insert: {
          created_at?: string | null
          default_for_sport?: boolean | null
          display_name: string
          id?: string
          side?: string | null
          slot_map?: Json
          sport_key: string
          template_key: string
          template_type: string
        }
        Update: {
          created_at?: string | null
          default_for_sport?: boolean | null
          display_name?: string
          id?: string
          side?: string | null
          slot_map?: Json
          sport_key?: string
          template_key?: string
          template_type?: string
        }
        Relationships: []
      }
      sport_positions: {
        Row: {
          created_at: string | null
          display_name: string
          group_key: string | null
          id: string
          is_active: boolean | null
          layout_slot_key: string | null
          position_key: string
          sort_order: number | null
          sport_key: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          group_key?: string | null
          id?: string
          is_active?: boolean | null
          layout_slot_key?: string | null
          position_key: string
          sort_order?: number | null
          sport_key: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          group_key?: string | null
          id?: string
          is_active?: boolean | null
          layout_slot_key?: string | null
          position_key?: string
          sort_order?: number | null
          sport_key?: string
          unit?: string | null
        }
        Relationships: []
      }
      sport_season_defaults: {
        Row: {
          created_at: string | null
          default_season: Database["public"]["Enums"]["sport_season_type"]
          governing_body_id: string | null
          id: string
          sport_key: string
          state_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_season: Database["public"]["Enums"]["sport_season_type"]
          governing_body_id?: string | null
          id?: string
          sport_key: string
          state_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_season?: Database["public"]["Enums"]["sport_season_type"]
          governing_body_id?: string | null
          id?: string
          sport_key?: string
          state_code?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sport_season_defaults_governing_body_id_fkey"
            columns: ["governing_body_id"]
            isOneToOne: false
            referencedRelation: "governing_bodies"
            referencedColumns: ["id"]
          },
        ]
      }
      sport_types: {
        Row: {
          allow_override: boolean | null
          created_at: string | null
          default_season_national:
            | Database["public"]["Enums"]["sport_season_type"]
            | null
          format: string
          gender: string
          image_url: string | null
          maturity: string
          season: string
          sport_code: string
          sport_icon_key: string | null
          sport_id: string
          sport_name: string
          updated_at: string | null
        }
        Insert: {
          allow_override?: boolean | null
          created_at?: string | null
          default_season_national?:
            | Database["public"]["Enums"]["sport_season_type"]
            | null
          format: string
          gender: string
          image_url?: string | null
          maturity: string
          season: string
          sport_code: string
          sport_icon_key?: string | null
          sport_id: string
          sport_name: string
          updated_at?: string | null
        }
        Update: {
          allow_override?: boolean | null
          created_at?: string | null
          default_season_national?:
            | Database["public"]["Enums"]["sport_season_type"]
            | null
          format?: string
          gender?: string
          image_url?: string | null
          maturity?: string
          season?: string
          sport_code?: string
          sport_icon_key?: string | null
          sport_id?: string
          sport_name?: string
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
      sports_cards: {
        Row: {
          accent_color: string | null
          background_style: string | null
          badges: Json | null
          card_version: number | null
          created_at: string | null
          id: string
          rating_overall: number | null
          render_variant: string | null
          season_id: string | null
          show_height_weight: boolean | null
          show_rating: boolean | null
          team_membership_id: string
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          background_style?: string | null
          badges?: Json | null
          card_version?: number | null
          created_at?: string | null
          id?: string
          rating_overall?: number | null
          render_variant?: string | null
          season_id?: string | null
          show_height_weight?: boolean | null
          show_rating?: boolean | null
          team_membership_id: string
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          background_style?: string | null
          badges?: Json | null
          card_version?: number | null
          created_at?: string | null
          id?: string
          rating_overall?: number | null
          render_variant?: string | null
          season_id?: string | null
          show_height_weight?: boolean | null
          show_rating?: boolean | null
          team_membership_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sports_cards_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sports_cards_team_membership_id_fkey"
            columns: ["team_membership_id"]
            isOneToOne: false
            referencedRelation: "team_memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      state_athletic_associations: {
        Row: {
          association_abbrev: string
          association_name: string
          created_at: string | null
          nfhs_status: string | null
          state_association_id: string
          state_code: string
          state_name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          association_abbrev: string
          association_name: string
          created_at?: string | null
          nfhs_status?: string | null
          state_association_id: string
          state_code: string
          state_name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          association_abbrev?: string
          association_name?: string
          created_at?: string | null
          nfhs_status?: string | null
          state_association_id?: string
          state_code?: string
          state_name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      state_sport_sanction: {
        Row: {
          created_at: string | null
          id: string
          last_verified_date: string | null
          rules_url: string | null
          sanctioned: boolean | null
          season_override: string | null
          sport_code: string
          state_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_verified_date?: string | null
          rules_url?: string | null
          sanctioned?: boolean | null
          season_override?: string | null
          sport_code: string
          state_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_verified_date?: string | null
          rules_url?: string | null
          sanctioned?: boolean | null
          season_override?: string | null
          sport_code?: string
          state_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_features: {
        Row: {
          created_at: string | null
          description: string | null
          enabled: boolean | null
          feature_key: string
          feature_name: string
          id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          feature_key: string
          feature_name: string
          id?: string
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string | null
          description?: string | null
          enabled?: boolean | null
          feature_key?: string
          feature_name?: string
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          invite_code: string
          invite_type: string
          is_active: boolean
          max_uses: number | null
          organization_id: string | null
          target_role: string
          team_id: string
          updated_at: string
          uses_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          invite_code: string
          invite_type?: string
          is_active?: boolean
          max_uses?: number | null
          organization_id?: string | null
          target_role?: string
          team_id: string
          updated_at?: string
          uses_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          invite_code?: string
          invite_type?: string
          is_active?: boolean
          max_uses?: number | null
          organization_id?: string | null
          target_role?: string
          team_id?: string
          updated_at?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_layout_preferences: {
        Row: {
          created_at: string | null
          id: string
          season_id: string | null
          selected_line_group_id: string | null
          selected_template_keys: Json | null
          sport_key: string
          team_id: string
          updated_at: string | null
          updated_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          season_id?: string | null
          selected_line_group_id?: string | null
          selected_template_keys?: Json | null
          sport_key: string
          team_id: string
          updated_at?: string | null
          updated_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          season_id?: string | null
          selected_line_group_id?: string | null
          selected_template_keys?: Json | null
          sport_key?: string
          team_id?: string
          updated_at?: string | null
          updated_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_layout_preferences_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_layout_preferences_selected_line_group_id_fkey"
            columns: ["selected_line_group_id"]
            isOneToOne: false
            referencedRelation: "line_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_layout_preferences_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          deleted_by_user_id: string | null
          depth_order: number | null
          eligibility_last_verified_at: string | null
          eligibility_notes: string | null
          eligibility_status:
            | Database["public"]["Enums"]["eligibility_status_type"]
            | null
          eligibility_verified_by_user_id: string | null
          id: string
          is_captain: boolean | null
          is_starter: boolean | null
          jersey_number: string | null
          joined_at: string | null
          position: string | null
          role: string
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          depth_order?: number | null
          eligibility_last_verified_at?: string | null
          eligibility_notes?: string | null
          eligibility_status?:
            | Database["public"]["Enums"]["eligibility_status_type"]
            | null
          eligibility_verified_by_user_id?: string | null
          id?: string
          is_captain?: boolean | null
          is_starter?: boolean | null
          jersey_number?: string | null
          joined_at?: string | null
          position?: string | null
          role: string
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          depth_order?: number | null
          eligibility_last_verified_at?: string | null
          eligibility_notes?: string | null
          eligibility_status?:
            | Database["public"]["Enums"]["eligibility_status_type"]
            | null
          eligibility_verified_by_user_id?: string | null
          id?: string
          is_captain?: boolean | null
          is_starter?: boolean | null
          jersey_number?: string | null
          joined_at?: string | null
          position?: string | null
          role?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          person_id: string
          person_type: string
          role_on_team: string
          season_id: string | null
          team_id: string
          updated_at: string | null
          visibility_scope: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          person_id: string
          person_type: string
          role_on_team: string
          season_id?: string | null
          team_id: string
          updated_at?: string | null
          visibility_scope?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          person_id?: string
          person_type?: string
          role_on_team?: string
          season_id?: string | null
          team_id?: string
          updated_at?: string | null
          visibility_scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_notifications: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          is_sent: boolean | null
          message: string
          notification_type: string
          priority: string | null
          read_at: string | null
          recipient_role: string | null
          recipient_user_id: string | null
          reference_id: string | null
          reference_type: string | null
          team_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message: string
          notification_type: string
          priority?: string | null
          read_at?: string | null
          recipient_role?: string | null
          recipient_user_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          team_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          is_sent?: boolean | null
          message?: string
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          recipient_role?: string | null
          recipient_user_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_notifications_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_volunteer_settings: {
        Row: {
          created_at: string | null
          cross_team_rule: string | null
          deposit_amount: number | null
          deposit_refund_method: string | null
          hours_per_event: number | null
          id: string
          is_active: boolean | null
          refund_policy: string | null
          required_events: number | null
          required_volunteer_hours: number | null
          reward_enabled: boolean | null
          reward_threshold_events: number | null
          reward_threshold_hours: number | null
          team_id: string
          tracking_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cross_team_rule?: string | null
          deposit_amount?: number | null
          deposit_refund_method?: string | null
          hours_per_event?: number | null
          id?: string
          is_active?: boolean | null
          refund_policy?: string | null
          required_events?: number | null
          required_volunteer_hours?: number | null
          reward_enabled?: boolean | null
          reward_threshold_events?: number | null
          reward_threshold_hours?: number | null
          team_id: string
          tracking_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cross_team_rule?: string | null
          deposit_amount?: number | null
          deposit_refund_method?: string | null
          hours_per_event?: number | null
          id?: string
          is_active?: boolean | null
          refund_policy?: string | null
          required_events?: number | null
          required_volunteer_hours?: number | null
          reward_enabled?: boolean | null
          reward_threshold_events?: number | null
          reward_threshold_hours?: number | null
          team_id?: string
          tracking_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_volunteer_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          custom_season_label: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          level: string | null
          max_roster_size: number | null
          name: string
          organization_id: string | null
          school_id: string | null
          school_year: number | null
          season: Database["public"]["Enums"]["sport_season_type"] | null
          season_id: string | null
          season_year_label: string | null
          sport_id: string | null
          sport_key: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_season_label?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_roster_size?: number | null
          name: string
          organization_id?: string | null
          school_id?: string | null
          school_year?: number | null
          season?: Database["public"]["Enums"]["sport_season_type"] | null
          season_id?: string | null
          season_year_label?: string | null
          sport_id?: string | null
          sport_key?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_season_label?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          max_roster_size?: number | null
          name?: string
          organization_id?: string | null
          school_id?: string | null
          school_year?: number | null
          season?: Database["public"]["Enums"]["sport_season_type"] | null
          season_id?: string | null
          season_year_label?: string | null
          sport_id?: string | null
          sport_key?: string | null
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
      user_preferences: {
        Row: {
          compact_mode: boolean | null
          created_at: string | null
          date_format: string | null
          email_equipment: boolean | null
          email_events: boolean | null
          email_payments: boolean | null
          email_registrations: boolean | null
          email_team_updates: boolean | null
          id: string
          language: string | null
          notifications_email: boolean | null
          notifications_push: boolean | null
          notifications_sms: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          compact_mode?: boolean | null
          created_at?: string | null
          date_format?: string | null
          email_equipment?: boolean | null
          email_events?: boolean | null
          email_payments?: boolean | null
          email_registrations?: boolean | null
          email_team_updates?: boolean | null
          id?: string
          language?: string | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          notifications_sms?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          compact_mode?: boolean | null
          created_at?: string | null
          date_format?: string | null
          email_equipment?: boolean | null
          email_events?: boolean | null
          email_payments?: boolean | null
          email_registrations?: boolean | null
          email_team_updates?: boolean | null
          id?: string
          language?: string | null
          notifications_email?: boolean | null
          notifications_push?: boolean | null
          notifications_sms?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
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
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: Json | null
          expires_at: string
          forced_logout_at: string | null
          forced_logout_reason: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_activity_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          expires_at: string
          forced_logout_at?: string | null
          forced_logout_reason?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          expires_at?: string
          forced_logout_at?: string | null
          forced_logout_reason?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_activity_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      volunteer_exclusions: {
        Row: {
          created_at: string | null
          excluded_by_user_id: string | null
          id: string
          reason: string
          team_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          excluded_by_user_id?: string | null
          id?: string
          reason: string
          team_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          excluded_by_user_id?: string | null
          id?: string
          reason?: string
          team_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_exclusions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_fee_deposits: {
        Row: {
          amount: number
          completed_events: number | null
          completed_hours: number | null
          created_at: string | null
          id: string
          notes: string | null
          payment_id: string | null
          refund_amount: number | null
          refund_method: string | null
          refunded_at: string | null
          required_events: number | null
          required_hours: number | null
          status: string
          team_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_events?: number | null
          completed_hours?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refunded_at?: string | null
          required_events?: number | null
          required_hours?: number | null
          status?: string
          team_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_events?: number | null
          completed_hours?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_id?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refunded_at?: string | null
          required_events?: number | null
          required_hours?: number | null
          status?: string
          team_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_fee_deposits_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_fee_deposits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_position_templates: {
        Row: {
          created_at: string | null
          default_count: number | null
          default_hours: number | null
          description: string | null
          id: string
          is_active: boolean | null
          position_name: string
          position_type: string
          sport_code: string | null
        }
        Insert: {
          created_at?: string | null
          default_count?: number | null
          default_hours?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          position_name: string
          position_type: string
          sport_code?: string | null
        }
        Update: {
          created_at?: string | null
          default_count?: number | null
          default_hours?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          position_name?: string
          position_type?: string
          sport_code?: string | null
        }
        Relationships: []
      }
      volunteer_positions: {
        Row: {
          created_at: string | null
          description: string | null
          eligible_team_levels: string[] | null
          end_time: string | null
          event_id: string | null
          filled_count: number | null
          hours_credit: number | null
          id: string
          location: string | null
          position_name: string
          position_type: string
          required_count: number
          start_time: string | null
          team_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          eligible_team_levels?: string[] | null
          end_time?: string | null
          event_id?: string | null
          filled_count?: number | null
          hours_credit?: number | null
          id?: string
          location?: string | null
          position_name: string
          position_type: string
          required_count?: number
          start_time?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          eligible_team_levels?: string[] | null
          end_time?: string | null
          event_id?: string | null
          filled_count?: number | null
          hours_credit?: number | null
          id?: string
          location?: string | null
          position_name?: string
          position_type?: string
          required_count?: number
          start_time?: string | null
          team_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_positions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_positions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_reward_templates: {
        Row: {
          created_at: string | null
          description: string | null
          events_required: number | null
          hours_required: number | null
          id: string
          is_active: boolean | null
          monetary_value: number | null
          reward_name: string
          reward_type: string
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          events_required?: number | null
          hours_required?: number | null
          id?: string
          is_active?: boolean | null
          monetary_value?: number | null
          reward_name: string
          reward_type: string
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          events_required?: number | null
          hours_required?: number | null
          id?: string
          is_active?: boolean | null
          monetary_value?: number | null
          reward_name?: string
          reward_type?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_reward_templates_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_rewards: {
        Row: {
          created_at: string | null
          description: string | null
          earned_at: string | null
          expires_at: string | null
          id: string
          is_redeemed: boolean | null
          monetary_value: number | null
          redeemed_at: string | null
          reward_name: string
          reward_type: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          monetary_value?: number | null
          redeemed_at?: string | null
          reward_name: string
          reward_type: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          is_redeemed?: boolean | null
          monetary_value?: number | null
          redeemed_at?: string | null
          reward_name?: string
          reward_type?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_rewards_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_signups: {
        Row: {
          check_in_code: string | null
          check_in_time: string | null
          check_out_code: string | null
          check_out_time: string | null
          confirmed_by_user_id: string | null
          created_at: string | null
          events_credited: number | null
          geo_check_in_lat: number | null
          geo_check_in_lng: number | null
          geo_check_out_lat: number | null
          geo_check_out_lng: number | null
          hours_credited: number | null
          id: string
          manually_confirmed: boolean | null
          notes: string | null
          position_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          check_in_code?: string | null
          check_in_time?: string | null
          check_out_code?: string | null
          check_out_time?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          events_credited?: number | null
          geo_check_in_lat?: number | null
          geo_check_in_lng?: number | null
          geo_check_out_lat?: number | null
          geo_check_out_lng?: number | null
          hours_credited?: number | null
          id?: string
          manually_confirmed?: boolean | null
          notes?: string | null
          position_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          check_in_code?: string | null
          check_in_time?: string | null
          check_out_code?: string | null
          check_out_time?: string | null
          confirmed_by_user_id?: string | null
          created_at?: string | null
          events_credited?: number | null
          geo_check_in_lat?: number | null
          geo_check_in_lng?: number | null
          geo_check_out_lat?: number | null
          geo_check_out_lng?: number | null
          hours_credited?: number | null
          id?: string
          manually_confirmed?: boolean | null
          notes?: string | null
          position_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_signups_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "volunteer_positions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_approve_equipment_requests: {
        Args: { _team_id?: string; _user_id: string }
        Returns: boolean
      }
      can_delegate_equipment_access: {
        Args: { _team_id?: string; _user_id: string }
        Returns: boolean
      }
      get_org_features: { Args: { _org_id: string }; Returns: string[] }
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
      has_equipment_access: {
        Args: { _team_id?: string; _user_id: string }
        Returns: boolean
      }
      has_feature: {
        Args: {
          _feature_key: string
          _tier: Database["public"]["Enums"]["subscription_tier"]
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
      log_form_access: {
        Args: {
          _access_type: string
          _form_submission_id: string
          _ip_address?: string
          _user_agent?: string
        }
        Returns: undefined
      }
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
        | "head_coach"
        | "equipment_manager"
        | "student_manager"
        | "student_equipment_manager"
      eligibility_status_type: "unknown" | "pending" | "cleared" | "not_cleared"
      forms_provider_type: "none" | "finalforms" | "other"
      governing_body_type:
        | "state_primary"
        | "state_private"
        | "city_public"
        | "independent_schools"
        | "prep_conference"
        | "charter"
        | "national"
        | "multi_state"
        | "other"
      organization_type:
        | "school"
        | "district"
        | "league"
        | "club"
        | "youth_organization"
      sport_season_type:
        | "fall"
        | "winter"
        | "spring"
        | "summer"
        | "year_round"
        | "varies"
        | "custom"
      subscription_tier:
        | "free"
        | "starter"
        | "school"
        | "district"
        | "enterprise"
      ticketing_provider_type: "none" | "gofan" | "internal" | "other"
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
        "head_coach",
        "equipment_manager",
        "student_manager",
        "student_equipment_manager",
      ],
      eligibility_status_type: ["unknown", "pending", "cleared", "not_cleared"],
      forms_provider_type: ["none", "finalforms", "other"],
      governing_body_type: [
        "state_primary",
        "state_private",
        "city_public",
        "independent_schools",
        "prep_conference",
        "charter",
        "national",
        "multi_state",
        "other",
      ],
      organization_type: [
        "school",
        "district",
        "league",
        "club",
        "youth_organization",
      ],
      sport_season_type: [
        "fall",
        "winter",
        "spring",
        "summer",
        "year_round",
        "varies",
        "custom",
      ],
      subscription_tier: [
        "free",
        "starter",
        "school",
        "district",
        "enterprise",
      ],
      ticketing_provider_type: ["none", "gofan", "internal", "other"],
    },
  },
} as const
