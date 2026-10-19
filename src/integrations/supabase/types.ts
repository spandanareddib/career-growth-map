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
      analyses: {
        Row: {
          applied: boolean
          candidate_name: string | null
          created_at: string
          error: string | null
          id: string
          job_id: string
          result: Json | null
          resume_id: string
          score: number | null
          scorer_version: string
          status: string
          user_id: string
        }
        Insert: {
          applied?: boolean
          candidate_name?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_id: string
          result?: Json | null
          resume_id: string
          score?: number | null
          scorer_version?: string
          status?: string
          user_id: string
        }
        Update: {
          applied?: boolean
          candidate_name?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_id?: string
          result?: Json | null
          resume_id?: string
          score?: number | null
          scorer_version?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analyses_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company: string | null
          created_at: string
          description: string
          id: string
          is_public: boolean
          owner_id: string
          title: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          description: string
          id?: string
          is_public?: boolean
          owner_id: string
          title: string
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          owner_id?: string
          title?: string
        }
        Relationships: []
      }
      learned_skills: {
        Row: {
          learned_at: string
          skill: string
          user_id: string
        }
        Insert: {
          learned_at?: string
          skill: string
          user_id: string
        }
        Update: {
          learned_at?: string
          skill?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_activities: {
        Row: {
          completed_at: string | null
          created_at: string
          evidence_url: string | null
          id: string
          issuer: string | null
          kind: string
          resource_url: string | null
          skill: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          issuer?: string | null
          kind: string
          resource_url?: string | null
          skill: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          issuer?: string | null
          kind?: string
          resource_url?: string | null
          skill?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      market_observations: {
        Row: {
          complete: boolean
          coverage_key: string
          geography: string
          id: string
          observed_at: string
          period_end: string
          period_start: string
          postings: number
          skill: string
          source: string
          source_url: string
          taxonomy_version: string
          total_postings: number
        }
        Insert: {
          complete?: boolean
          coverage_key: string
          geography?: string
          id?: string
          observed_at?: string
          period_end: string
          period_start: string
          postings: number
          skill: string
          source: string
          source_url: string
          taxonomy_version: string
          total_postings: number
        }
        Update: {
          complete?: boolean
          coverage_key?: string
          geography?: string
          id?: string
          observed_at?: string
          period_end?: string
          period_start?: string
          postings?: number
          skill?: string
          source?: string
          source_url?: string
          taxonomy_version?: string
          total_postings?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      readiness_history: {
        Row: {
          analysis_id: string
          completed_steps: number
          created_at: string
          id: string
          job_id: string
          match_score: number | null
          remaining_weeks: number
          scorer_version: string
          source: string
          total_steps: number
          user_id: string
        }
        Insert: {
          analysis_id: string
          completed_steps: number
          created_at?: string
          id?: string
          job_id: string
          match_score?: number | null
          remaining_weeks: number
          scorer_version: string
          source: string
          total_steps: number
          user_id: string
        }
        Update: {
          analysis_id?: string
          completed_steps?: number
          created_at?: string
          id?: string
          job_id?: string
          match_score?: number | null
          remaining_weeks?: number
          scorer_version?: string
          source?: string
          total_steps?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_history_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "readiness_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          error: string | null
          file_name: string
          file_path: string
          id: string
          mime_type: string
          parsed: Json | null
          profile_id: string | null
          progress_note: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          file_name: string
          file_path: string
          id?: string
          mime_type: string
          parsed?: Json | null
          profile_id?: string | null
          progress_note?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string
          parsed?: Json | null
          profile_id?: string | null
          progress_note?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workforce_snapshots: {
        Row: {
          created_at: string
          id: string
          profile: Json
          resume_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile: Json
          resume_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile?: Json
          resume_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workforce_snapshots_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: true
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      record_readiness: {
        Args: { _source: string; _user: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "job_seeker" | "recruiter"
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
      app_role: ["job_seeker", "recruiter"],
    },
  },
} as const
