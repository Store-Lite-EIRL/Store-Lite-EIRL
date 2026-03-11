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
      business_settings: {
        Row: {
          business_id: string
          contrast_level: string
          created_at: string
          custom_colors: Json | null
          id: string
          preferences: Json | null
          theme_mode: string
          updated_at: string
        }
        Insert: {
          business_id: string
          contrast_level?: string
          created_at?: string
          custom_colors?: Json | null
          id?: string
          preferences?: Json | null
          theme_mode?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          contrast_level?: string
          created_at?: string
          custom_colors?: Json | null
          id?: string
          preferences?: Json | null
          theme_mode?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_settings_business_id_businesses_id_fk"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          is_active: boolean
          legal_rep_email: string | null
          legal_rep_name: string | null
          legal_rep_phone: string | null
          legal_rep_role: string | null
          logo_url: string | null
          name: string
          owner_id: string
          person_type: string | null
          slug: string
          store_type: string | null
          tax_id: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_rep_email?: string | null
          legal_rep_name?: string | null
          legal_rep_phone?: string | null
          legal_rep_role?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          person_type?: string | null
          slug: string
          store_type?: string | null
          tax_id?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_rep_email?: string | null
          legal_rep_name?: string | null
          legal_rep_phone?: string | null
          legal_rep_role?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          person_type?: string | null
          slug?: string
          store_type?: string | null
          tax_id?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_profiles_id_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          business_id: string
          created_at: string | null
          guest_gender: string
          guest_id: string
          guest_name: string
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          guest_gender: string
          guest_id: string
          guest_name: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          guest_gender?: string
          guest_id?: string
          guest_name?: string
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_from_store: boolean | null
          is_read: boolean | null
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_from_store?: boolean | null
          is_read?: boolean | null
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_from_store?: boolean | null
          is_read?: boolean | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          business_id: string
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_business_id_businesses_id_fk"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_likes: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_likes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_media: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          media_type: string
          media_url: string
          product_id: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type?: string
          media_url: string
          product_id: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type?: string
          media_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_media_product_id_products_id_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          business_id: string
          category_id: string | null
          created_at: string
          currency: string
          description: string | null
          display_order: number | null
          id: string
          is_available: boolean
          metadata: Json | null
          price: number
          sale_status: string
          second_price: number | null
          shipping_info: string | null
          stars: number | null
          stock: number
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          business_id: string
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean
          metadata?: Json | null
          price: number
          sale_status?: string
          second_price?: number | null
          shipping_info?: string | null
          stars?: number | null
          stock?: number
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          business_id?: string
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          is_available?: boolean
          metadata?: Json | null
          price?: number
          sale_status?: string
          second_price?: number | null
          shipping_info?: string | null
          stars?: number | null
          stock?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_businesses_id_fk"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_product_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          age: number | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          provider_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          provider_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          age?: number | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          provider_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_orphaned_product_images: { Args: never; Returns: undefined }
      cleanup_orphaned_store_covers: { Args: never; Returns: undefined }
      generate_slug: { Args: { input_text: string }; Returns: string }
      is_product_owner: { Args: { product_uuid: string }; Returns: boolean }
      is_store_owner: { Args: { store_uuid: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      contrast_level: "standard" | "medium" | "high"
      media_type: "image" | "video"
      theme_mode: "light" | "dark"
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
      contrast_level: ["standard", "medium", "high"],
      media_type: ["image", "video"],
      theme_mode: ["light", "dark"],
    },
  },
} as const
