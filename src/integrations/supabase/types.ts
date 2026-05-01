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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      circle_invitations: {
        Row: {
          circle_id: string
          created_at: string
          id: string
          invitee_email: string
          inviter_id: string
          last_reminder_at: string | null
          personal_message: string | null
          status: string
          suggested_role: Database["public"]["Enums"]["circle_role"]
          updated_at: string
        }
        Insert: {
          circle_id: string
          created_at?: string
          id?: string
          invitee_email: string
          inviter_id: string
          last_reminder_at?: string | null
          personal_message?: string | null
          status?: string
          suggested_role?: Database["public"]["Enums"]["circle_role"]
          updated_at?: string
        }
        Update: {
          circle_id?: string
          created_at?: string
          id?: string
          invitee_email?: string
          inviter_id?: string
          last_reminder_at?: string | null
          personal_message?: string | null
          status?: string
          suggested_role?: Database["public"]["Enums"]["circle_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_invitations_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "memory_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string
          display_name: string | null
          id: string
          joined_at: string
          role_label: Database["public"]["Enums"]["circle_role"]
          status: string
          user_id: string
        }
        Insert: {
          circle_id: string
          display_name?: string | null
          id?: string
          joined_at?: string
          role_label?: Database["public"]["Enums"]["circle_role"]
          status?: string
          user_id: string
        }
        Update: {
          circle_id?: string
          display_name?: string | null
          id?: string
          joined_at?: string
          role_label?: Database["public"]["Enums"]["circle_role"]
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "memory_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_memories: {
        Row: {
          author_id: string
          category: string | null
          circle_id: string
          content: string | null
          created_at: string
          id: string
          life_year: number | null
          photo_urls: string[] | null
          question: string | null
          voice_note_path: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          circle_id: string
          content?: string | null
          created_at?: string
          id?: string
          life_year?: number | null
          photo_urls?: string[] | null
          question?: string | null
          voice_note_path?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          circle_id?: string
          content?: string | null
          created_at?: string
          id?: string
          life_year?: number | null
          photo_urls?: string[] | null
          question?: string | null
          voice_note_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_memories_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "memory_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          ai_story: string
          chapter: string | null
          created_at: string
          id: string
          original_text: string
          question: string
          user_id: string
        }
        Insert: {
          ai_story: string
          chapter?: string | null
          created_at?: string
          id?: string
          original_text: string
          question: string
          user_id: string
        }
        Update: {
          ai_story?: string
          chapter?: string | null
          created_at?: string
          id?: string
          original_text?: string
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      family_connections: {
        Row: {
          created_at: string
          id: string
          relationship: string
          requester_id: string
          status: string
          target_email: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship: string
          requester_id: string
          status?: string
          target_email: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship?: string
          requester_id?: string
          status?: string
          target_email?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          birth_year: number | null
          created_at: string
          death_year: number | null
          genetic_conditions: string | null
          id: string
          name: string
          notes: string | null
          parent_member_id: string | null
          relationship: string
          user_id: string
        }
        Insert: {
          birth_year?: number | null
          created_at?: string
          death_year?: number | null
          genetic_conditions?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_member_id?: string | null
          relationship: string
          user_id: string
        }
        Update: {
          birth_year?: number | null
          created_at?: string
          death_year?: number | null
          genetic_conditions?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_member_id?: string | null
          relationship?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_parent_member_id_fkey"
            columns: ["parent_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_circles: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          invite_code: string
          person_birth_year: number | null
          person_death_year: number | null
          person_name: string
          person_photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          invite_code?: string
          person_birth_year?: number | null
          person_death_year?: number | null
          person_name: string
          person_photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          invite_code?: string
          person_birth_year?: number | null
          person_death_year?: number | null
          person_name?: string
          person_photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          circle_id: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          circle_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          circle_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "memory_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          advice_to_descendants: string | null
          avatar_url: string | null
          biggest_dream: string | null
          birth_date: string | null
          city: string | null
          completion_step: number
          created_at: string
          education: string | null
          employment_sphere: string | null
          family: string | null
          full_name: string | null
          grateful_for: string | null
          hobbies: string | null
          id: string
          is_public: boolean
          languages: string | null
          last_active_at: string | null
          life_motto: string | null
          occupation: string | null
          updated_at: string
          user_id: string
          username: string | null
          would_change: string | null
        }
        Insert: {
          advice_to_descendants?: string | null
          avatar_url?: string | null
          biggest_dream?: string | null
          birth_date?: string | null
          city?: string | null
          completion_step?: number
          created_at?: string
          education?: string | null
          employment_sphere?: string | null
          family?: string | null
          full_name?: string | null
          grateful_for?: string | null
          hobbies?: string | null
          id?: string
          is_public?: boolean
          languages?: string | null
          last_active_at?: string | null
          life_motto?: string | null
          occupation?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          would_change?: string | null
        }
        Update: {
          advice_to_descendants?: string | null
          avatar_url?: string | null
          biggest_dream?: string | null
          birth_date?: string | null
          city?: string | null
          completion_step?: number
          created_at?: string
          education?: string | null
          employment_sphere?: string | null
          family?: string | null
          full_name?: string | null
          grateful_for?: string | null
          hobbies?: string | null
          id?: string
          is_public?: boolean
          languages?: string | null
          last_active_at?: string | null
          life_motto?: string | null
          occupation?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          would_change?: string | null
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          field_key: string | null
          id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          field_key?: string | null
          id?: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          field_key?: string | null
          id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          hobbies: string | null
          is_public: boolean | null
          life_motto: string | null
          occupation: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          hobbies?: string | null
          is_public?: boolean | null
          life_motto?: string | null
          occupation?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          hobbies?: string | null
          is_public?: boolean | null
          life_motto?: string | null
          occupation?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_circle_invitation: {
        Args: {
          _circle_id: string
          _email: string
          _message: string
          _role: Database["public"]["Enums"]["circle_role"]
        }
        Returns: string
      }
      has_confirmed_connection: {
        Args: { _other_user_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_circle_member: {
        Args: { _circle_id: string; _user_id: string }
        Returns: boolean
      }
      remind_silent_contributor: {
        Args: { _circle_id: string; _member_user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      circle_role: "family" | "friend" | "colleague"
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
      app_role: ["admin", "user"],
      circle_role: ["family", "friend", "colleague"],
    },
  },
} as const
