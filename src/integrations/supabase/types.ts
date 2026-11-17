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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          cattle_id: string | null
          created_at: string
          farmer_id: string
          id: string
          notes: string | null
          reason: string
          status: string
          updated_at: string
          vet_id: string
        }
        Insert: {
          appointment_date: string
          cattle_id?: string | null
          created_at?: string
          farmer_id: string
          id?: string
          notes?: string | null
          reason: string
          status?: string
          updated_at?: string
          vet_id: string
        }
        Update: {
          appointment_date?: string
          cattle_id?: string | null
          created_at?: string
          farmer_id?: string
          id?: string
          notes?: string | null
          reason?: string
          status?: string
          updated_at?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cattle_id_fkey"
            columns: ["cattle_id"]
            isOneToOne: false
            referencedRelation: "cattle"
            referencedColumns: ["id"]
          },
        ]
      }
      cattle: {
        Row: {
          age: number | null
          breed: string | null
          cattle_tag: string | null
          created_at: string
          farm_location: string | null
          id: string
          image_url: string | null
          name: string
          owner_id: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          breed?: string | null
          cattle_tag?: string | null
          created_at?: string
          farm_location?: string | null
          id?: string
          image_url?: string | null
          name: string
          owner_id: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          breed?: string | null
          cattle_tag?: string | null
          created_at?: string
          farm_location?: string | null
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cattle_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_queries: {
        Row: {
          created_at: string
          id: string
          language: string
          query: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language: string
          query: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          farmer_id: string
          id: string
          report_id: string | null
          updated_at: string
          vet_id: string
        }
        Insert: {
          created_at?: string
          farmer_id: string
          id?: string
          report_id?: string | null
          updated_at?: string
          vet_id: string
        }
        Update: {
          created_at?: string
          farmer_id?: string
          id?: string
          report_id?: string | null
          updated_at?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_embeddings: {
        Row: {
          content: string
          disease_id: string
          embedding: string
          model: string
          updated_at: string
        }
        Insert: {
          content: string
          disease_id: string
          embedding: string
          model?: string
          updated_at?: string
        }
        Update: {
          content?: string
          disease_id?: string
          embedding?: string
          model?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disease_embeddings_disease_id_fkey"
            columns: ["disease_id"]
            isOneToOne: true
            referencedRelation: "diseases"
            referencedColumns: ["id"]
          },
        ]
      }
      diseases: {
        Row: {
          created_at: string
          description: string
          home_remedies: string[]
          id: string
          name: string
          precautions: string[]
          severity: string
          symptoms: string[]
          treatment_duration: string | null
          urgency: string | null
          veterinarian_recommended: boolean
        }
        Insert: {
          created_at?: string
          description: string
          home_remedies: string[]
          id?: string
          name: string
          precautions: string[]
          severity: string
          symptoms: string[]
          treatment_duration?: string | null
          urgency?: string | null
          veterinarian_recommended?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          home_remedies?: string[]
          id?: string
          name?: string
          precautions?: string[]
          severity?: string
          symptoms?: string[]
          treatment_duration?: string | null
          urgency?: string | null
          veterinarian_recommended?: boolean
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          cattle_id: string
          confidence_score: number
          created_at: string
          diagnosis_date: string
          id: string
          image_url: string | null
          ml_model_used: string
          predicted_disease: string
          selected_symptoms: string[] | null
          severity: string
          treatment_notes: string | null
          user_id: string
          veterinarian_recommended: boolean
        }
        Insert: {
          cattle_id: string
          confidence_score: number
          created_at?: string
          diagnosis_date?: string
          id?: string
          image_url?: string | null
          ml_model_used: string
          predicted_disease: string
          selected_symptoms?: string[] | null
          severity: string
          treatment_notes?: string | null
          user_id: string
          veterinarian_recommended: boolean
        }
        Update: {
          cattle_id?: string
          confidence_score?: number
          created_at?: string
          diagnosis_date?: string
          id?: string
          image_url?: string | null
          ml_model_used?: string
          predicted_disease?: string
          selected_symptoms?: string[] | null
          severity?: string
          treatment_notes?: string | null
          user_id?: string
          veterinarian_recommended?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reports_cattle_id_fkey"
            columns: ["cattle_id"]
            isOneToOne: false
            referencedRelation: "cattle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccinations: {
        Row: {
          administered_by: string | null
          batch_number: string | null
          cattle_id: string
          created_at: string
          id: string
          next_due_date: string | null
          notes: string | null
          updated_at: string
          vaccination_date: string
          vaccine_name: string
        }
        Insert: {
          administered_by?: string | null
          batch_number?: string | null
          cattle_id: string
          created_at?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string
          vaccination_date: string
          vaccine_name: string
        }
        Update: {
          administered_by?: string | null
          batch_number?: string | null
          cattle_id?: string
          created_at?: string
          id?: string
          next_due_date?: string | null
          notes?: string | null
          updated_at?: string
          vaccination_date?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccinations_cattle_id_fkey"
            columns: ["cattle_id"]
            isOneToOne: false
            referencedRelation: "cattle"
            referencedColumns: ["id"]
          },
        ]
      }
      vet_notes: {
        Row: {
          created_at: string
          follow_up_date: string | null
          id: string
          notes: string
          report_id: string
          treatment_status: string | null
          updated_at: string
          vet_id: string
        }
        Insert: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes: string
          report_id: string
          treatment_status?: string | null
          updated_at?: string
          vet_id: string
        }
        Update: {
          created_at?: string
          follow_up_date?: string | null
          id?: string
          notes?: string
          report_id?: string
          treatment_status?: string | null
          updated_at?: string
          vet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vet_notes_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vet_notes_vet_id_fkey"
            columns: ["vet_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      veterinarians: {
        Row: {
          available_days: string[] | null
          city: string
          clinic_address: string
          clinic_name: string
          consultation_fee: number | null
          consultation_hours: string | null
          created_at: string | null
          experience_years: number | null
          id: string
          is_verified: boolean | null
          latitude: number | null
          license_number: string | null
          longitude: number | null
          phone: string
          pincode: string | null
          specialization: string | null
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_days?: string[] | null
          city: string
          clinic_address: string
          clinic_name: string
          consultation_fee?: number | null
          consultation_hours?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          license_number?: string | null
          longitude?: number | null
          phone: string
          pincode?: string | null
          specialization?: string | null
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_days?: string[] | null
          city?: string
          clinic_address?: string
          clinic_name?: string
          consultation_fee?: number | null
          consultation_hours?: string | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          is_verified?: boolean | null
          latitude?: number | null
          license_number?: string | null
          longitude?: number | null
          phone?: string
          pincode?: string | null
          specialization?: string | null
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_metrics: { Args: { days?: number }; Returns: Json }
      email_registered: { Args: { _email: string }; Returns: boolean }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      match_diseases: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          disease_id: string
          similarity: number
        }[]
      }
      vet_has_notes_on_report: {
        Args: { _report_id: string; _vet_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "farmer" | "veterinarian" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["farmer", "veterinarian", "admin"],
    },
  },
} as const
