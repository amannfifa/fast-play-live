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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      match_redirects: {
        Row: {
          backup_url: string | null
          click_count: number
          clicks_today: number
          country_overrides: Json
          created_at: string
          enabled: boolean
          id: string
          last_clicked_at: string | null
          last_reset_date: string
          match_id: string
          open_in_new_tab: boolean
          primary_url: string | null
          provider: string | null
          scheduled_switch_at: string | null
          scheduled_url: string | null
          updated_at: string
        }
        Insert: {
          backup_url?: string | null
          click_count?: number
          clicks_today?: number
          country_overrides?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_clicked_at?: string | null
          last_reset_date?: string
          match_id: string
          open_in_new_tab?: boolean
          primary_url?: string | null
          provider?: string | null
          scheduled_switch_at?: string | null
          scheduled_url?: string | null
          updated_at?: string
        }
        Update: {
          backup_url?: string | null
          click_count?: number
          clicks_today?: number
          country_overrides?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          last_clicked_at?: string | null
          last_reset_date?: string
          match_id?: string
          open_in_new_tab?: boolean
          primary_url?: string | null
          provider?: string | null
          scheduled_switch_at?: string | null
          scheduled_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_redirects_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_flag: string | null
          away_score: number
          away_team: string
          city: string | null
          competition: string | null
          corners_away: number | null
          corners_home: number | null
          created_at: string
          home_flag: string | null
          home_score: number
          home_team: string
          id: string
          kickoff_at: string
          minute: number | null
          possession_home: number | null
          red_away: number | null
          red_home: number | null
          referee: string | null
          replay_url: string | null
          shots_away: number | null
          shots_home: number | null
          sport_key: string
          status: Database["public"]["Enums"]["match_status"]
          stream_url: string | null
          updated_at: string
          venue: string | null
          viewer_count: number | null
          yellow_away: number | null
          yellow_home: number | null
        }
        Insert: {
          away_flag?: string | null
          away_score?: number
          away_team: string
          city?: string | null
          competition?: string | null
          corners_away?: number | null
          corners_home?: number | null
          created_at?: string
          home_flag?: string | null
          home_score?: number
          home_team: string
          id?: string
          kickoff_at: string
          minute?: number | null
          possession_home?: number | null
          red_away?: number | null
          red_home?: number | null
          referee?: string | null
          replay_url?: string | null
          shots_away?: number | null
          shots_home?: number | null
          sport_key: string
          status?: Database["public"]["Enums"]["match_status"]
          stream_url?: string | null
          updated_at?: string
          venue?: string | null
          viewer_count?: number | null
          yellow_away?: number | null
          yellow_home?: number | null
        }
        Update: {
          away_flag?: string | null
          away_score?: number
          away_team?: string
          city?: string | null
          competition?: string | null
          corners_away?: number | null
          corners_home?: number | null
          created_at?: string
          home_flag?: string | null
          home_score?: number
          home_team?: string
          id?: string
          kickoff_at?: string
          minute?: number | null
          possession_home?: number | null
          red_away?: number | null
          red_home?: number | null
          referee?: string | null
          replay_url?: string | null
          shots_away?: number | null
          shots_home?: number | null
          sport_key?: string
          status?: Database["public"]["Enums"]["match_status"]
          stream_url?: string | null
          updated_at?: string
          venue?: string | null
          viewer_count?: number | null
          yellow_away?: number | null
          yellow_home?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_sport_key_fkey"
            columns: ["sport_key"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["key"]
          },
        ]
      }
      sports: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
      increment_redirect_click: {
        Args: { _match_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      match_status: "upcoming" | "live" | "finished" | "replay"
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
      match_status: ["upcoming", "live", "finished", "replay"],
    },
  },
} as const
