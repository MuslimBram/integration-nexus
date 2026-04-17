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
      channel_settings: {
        Row: {
          ai_auto_reply: boolean
          channel: string
          config: Json | null
          created_at: string
          enabled: boolean
          id: string
          system_prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_auto_reply?: boolean
          channel: string
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          system_prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_auto_reply?: boolean
          channel?: string
          config?: Json | null
          created_at?: string
          enabled?: boolean
          id?: string
          system_prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          channel: string
          contact_handle: string | null
          contact_name: string | null
          created_at: string
          external_id: string
          id: string
          last_message_at: string | null
          unread_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          channel: string
          contact_handle?: string | null
          contact_name?: string | null
          created_at?: string
          external_id: string
          id?: string
          last_message_at?: string | null
          unread_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          contact_handle?: string | null
          contact_name?: string | null
          created_at?: string
          external_id?: string
          id?: string
          last_message_at?: string | null
          unread_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integrations: {
        Row: {
          api_key_encrypted: string | null
          category: Database["public"]["Enums"]["integration_category"]
          config: Json | null
          created_at: string
          description: string | null
          fields: string[] | null
          icon: string | null
          id: string
          name: string
          provider_id: string
          status: Database["public"]["Enums"]["integration_status"]
          supports_oauth: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          category: Database["public"]["Enums"]["integration_category"]
          config?: Json | null
          created_at?: string
          description?: string | null
          fields?: string[] | null
          icon?: string | null
          id?: string
          name: string
          provider_id: string
          status?: Database["public"]["Enums"]["integration_status"]
          supports_oauth?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          category?: Database["public"]["Enums"]["integration_category"]
          config?: Json | null
          created_at?: string
          description?: string | null
          fields?: string[] | null
          icon?: string | null
          id?: string
          name?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["integration_status"]
          supports_oauth?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          channel: string | null
          contact_handle: string | null
          contact_name: string | null
          conversation_id: string | null
          created_at: string
          id: string
          message: string | null
          payload: Json | null
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string | null
          contact_handle?: string | null
          contact_name?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          source: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string | null
          contact_handle?: string | null
          contact_name?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message?: string | null
          payload?: Json | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string
          content: string
          conversation_id: string
          created_at: string
          direction: string
          external_message_id: string | null
          id: string
          metadata: Json | null
          sender: string | null
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          external_message_id?: string | null
          id?: string
          metadata?: Json | null
          sender?: string | null
          status?: string
          user_id: string
        }
        Update: {
          channel?: string
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          external_message_id?: string | null
          id?: string
          metadata?: Json | null
          sender?: string | null
          status?: string
          user_id?: string
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
      n8n_config: {
        Row: {
          api_key_encrypted: string | null
          base_url: string
          created_at: string
          id: string
          is_connected: boolean
          last_sync: string | null
          updated_at: string
          user_id: string
          webhook_secret: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          base_url: string
          created_at?: string
          id?: string
          is_connected?: boolean
          last_sync?: string | null
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          base_url?: string
          created_at?: string
          id?: string
          is_connected?: boolean
          last_sync?: string | null
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
        }
        Relationships: []
      }
      n8n_workflows: {
        Row: {
          active: boolean
          business_id: string | null
          channel_id: string | null
          created_at: string
          event_type: string | null
          id: string
          last_run: string | null
          logs: Json | null
          n8n_workflow_id: string
          name: string
          provider: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          business_id?: string | null
          channel_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          last_run?: string | null
          logs?: Json | null
          n8n_workflow_id: string
          name: string
          provider?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          business_id?: string | null
          channel_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          last_run?: string | null
          logs?: Json | null
          n8n_workflow_id?: string
          name?: string
          provider?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_connections: {
        Row: {
          access_token: string | null
          account_info: Json | null
          account_label: string | null
          created_at: string
          id: string
          integration_id: string
          provider: string
          refresh_token: string | null
          scopes: string[] | null
          token_expiry: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_info?: Json | null
          account_label?: string | null
          created_at?: string
          id?: string
          integration_id: string
          provider: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expiry?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_info?: Json | null
          account_label?: string | null
          created_at?: string
          id?: string
          integration_id?: string
          provider?: string
          refresh_token?: string | null
          scopes?: string[] | null
          token_expiry?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_connections_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      telegram_bot_owner: {
        Row: {
          id: number
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          id: number
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          owner_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          source: string | null
          status: string
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source?: string | null
          status?: string
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          source?: string | null
          status?: string
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "n8n_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrypt_secret: {
        Args: { encrypted_text: string; encryption_key: string }
        Returns: string
      }
      encrypt_secret: {
        Args: { encryption_key: string; plain_text: string }
        Returns: string
      }
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "business_owner"
        | "freelancer"
        | "ambassador"
        | "manager"
      integration_category:
        | "ai"
        | "build"
        | "automation"
        | "delivery"
        | "monitoring"
        | "growth"
      integration_status: "connected" | "disconnected" | "error"
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
        "super_admin",
        "admin",
        "business_owner",
        "freelancer",
        "ambassador",
        "manager",
      ],
      integration_category: [
        "ai",
        "build",
        "automation",
        "delivery",
        "monitoring",
        "growth",
      ],
      integration_status: ["connected", "disconnected", "error"],
    },
  },
} as const
