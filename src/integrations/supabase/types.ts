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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          earned_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          code: string
          earned_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          code?: string
          earned_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          dog_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dog_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dog_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          recipe_ids: string[]
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          recipe_ids?: string[]
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          recipe_ids?: string[]
          role?: Database["public"]["Enums"]["chat_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_recipes: {
        Row: {
          created_at: string
          date: string
          dog_id: string | null
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          dog_id?: string | null
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          dog_id?: string | null
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_recipes_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"]
          age_years: number
          allergies: string[]
          birth_date: string | null
          breed: string
          cooking_time: string
          created_at: string
          disliked_ingredients: string[]
          favorite_ingredients: string[]
          forbidden_ingredients: string[]
          goal: string
          has_oven: boolean
          health_conditions: string[]
          id: string
          is_neutered: boolean
          name: string
          photo_url: string | null
          sex: Database["public"]["Enums"]["dog_sex"]
          updated_at: string
          user_id: string
          weekly_budget: number
          weight: number
          weight_unit: Database["public"]["Enums"]["weight_unit"]
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          age_years?: number
          allergies?: string[]
          birth_date?: string | null
          breed?: string
          cooking_time?: string
          created_at?: string
          disliked_ingredients?: string[]
          favorite_ingredients?: string[]
          forbidden_ingredients?: string[]
          goal?: string
          has_oven?: boolean
          health_conditions?: string[]
          id?: string
          is_neutered?: boolean
          name: string
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["dog_sex"]
          updated_at?: string
          user_id: string
          weekly_budget?: number
          weight?: number
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"]
          age_years?: number
          allergies?: string[]
          birth_date?: string | null
          breed?: string
          cooking_time?: string
          created_at?: string
          disliked_ingredients?: string[]
          favorite_ingredients?: string[]
          forbidden_ingredients?: string[]
          goal?: string
          has_oven?: boolean
          health_conditions?: string[]
          id?: string
          is_neutered?: boolean
          name?: string
          photo_url?: string | null
          sex?: Database["public"]["Enums"]["dog_sex"]
          updated_at?: string
          user_id?: string
          weekly_budget?: number
          weight?: number
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_recipes: {
        Row: {
          benefits: string
          calories: number
          category: Database["public"]["Enums"]["recipe_category"]
          created_at: string
          description: string
          difficulty: string
          dog_id: string | null
          id: string
          ingredients: Json
          minutes: number
          servings: number
          steps: string[]
          storage: string
          title: string
          updated_at: string
          user_id: string
          warnings: string
        }
        Insert: {
          benefits?: string
          calories?: number
          category?: Database["public"]["Enums"]["recipe_category"]
          created_at?: string
          description?: string
          difficulty?: string
          dog_id?: string | null
          id?: string
          ingredients?: Json
          minutes?: number
          servings?: number
          steps?: string[]
          storage?: string
          title: string
          updated_at?: string
          user_id: string
          warnings?: string
        }
        Update: {
          benefits?: string
          calories?: number
          category?: Database["public"]["Enums"]["recipe_category"]
          created_at?: string
          description?: string
          difficulty?: string
          dog_id?: string | null
          id?: string
          ingredients?: Json
          minutes?: number
          servings?: number
          steps?: string[]
          storage?: string
          title?: string
          updated_at?: string
          user_id?: string
          warnings?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_recipes_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_safety: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string
          note: string | null
          safety: Database["public"]["Enums"]["safety_level"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id: string
          note?: string | null
          safety?: Database["public"]["Enums"]["safety_level"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string
          note?: string | null
          safety?: Database["public"]["Enums"]["safety_level"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_safety_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: true
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: Database["public"]["Enums"]["ingredient_category"]
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          category: Database["public"]["Enums"]["ingredient_category"]
          created_at: string
          expires_at: string | null
          id: string
          name: string
          notes: string | null
          purchased_at: string | null
          quantity: number
          status: Database["public"]["Enums"]["pantry_status"]
          unit: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          expires_at?: string | null
          id?: string
          name: string
          notes?: string | null
          purchased_at?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["pantry_status"]
          unit?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          purchased_at?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["pantry_status"]
          unit?: string
          user_id?: string
        }
        Relationships: []
      }
      prepared_recipes: {
        Row: {
          dog_id: string | null
          id: string
          notes: string | null
          prepared_at: string
          rating: number | null
          recipe_id: string
          used_pantry: boolean
          user_id: string
        }
        Insert: {
          dog_id?: string | null
          id?: string
          notes?: string | null
          prepared_at?: string
          rating?: number | null
          recipe_id: string
          used_pantry?: boolean
          user_id: string
        }
        Update: {
          dog_id?: string | null
          id?: string
          notes?: string | null
          prepared_at?: string
          rating?: number | null
          recipe_id?: string
          used_pantry?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prepared_recipes_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prepared_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          plan: Database["public"]["Enums"]["plan_id"]
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          name?: string
          plan?: Database["public"]["Enums"]["plan_id"]
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          plan?: Database["public"]["Enums"]["plan_id"]
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string | null
          name: string
          quantity: number
          recipe_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          name: string
          quantity?: number
          recipe_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          name?: string
          quantity?: number
          recipe_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          benefit: string
          category: Database["public"]["Enums"]["recipe_category"]
          created_at: string
          id: string
          image_url: string | null
          minutes: number
          needs_oven: boolean
          published: boolean
          servings: number
          slug: string
          steps: string[]
          storage: string
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          benefit?: string
          category?: Database["public"]["Enums"]["recipe_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          minutes?: number
          needs_oven?: boolean
          published?: boolean
          servings?: number
          slug: string
          steps?: string[]
          storage?: string
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          benefit?: string
          category?: Database["public"]["Enums"]["recipe_category"]
          created_at?: string
          id?: string
          image_url?: string | null
          minutes?: number
          needs_oven?: boolean
          published?: boolean
          servings?: number
          slug?: string
          steps?: string[]
          storage?: string
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          key: Database["public"]["Enums"]["reminder_key"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          key: Database["public"]["Enums"]["reminder_key"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          key?: Database["public"]["Enums"]["reminder_key"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          bought: boolean
          category: Database["public"]["Enums"]["ingredient_category"]
          created_at: string
          id: string
          list_id: string
          name: string
          owned: boolean
          quantity: number
          unit: string
          user_id: string
        }
        Insert: {
          bought?: boolean
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          id?: string
          list_id: string
          name: string
          owned?: boolean
          quantity?: number
          unit?: string
          user_id: string
        }
        Update: {
          bought?: boolean
          category?: Database["public"]["Enums"]["ingredient_category"]
          created_at?: string
          id?: string
          list_id?: string
          name?: string
          owned?: boolean
          quantity?: number
          unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_id"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_id"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_id"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          created_at: string
          daily_date: string
          daily_generated: number
          id: string
          last_recipe_at: string | null
          month: number
          plan: string
          recipes_generated: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          daily_date?: string
          daily_generated?: number
          id?: string
          last_recipe_at?: string | null
          month: number
          plan?: string
          recipes_generated?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          daily_date?: string
          daily_generated?: number
          id?: string
          last_recipe_at?: string | null
          month?: number
          plan?: string
          recipes_generated?: number
          updated_at?: string
          user_id?: string
          year?: number
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
          role: Database["public"]["Enums"]["app_role"]
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
      weekly_plans: {
        Row: {
          created_at: string
          days: Json
          dog_id: string | null
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          days?: Json
          dog_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          days?: Json
          dog_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plans_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_records: {
        Row: {
          created_at: string
          date: string
          dog_id: string
          id: string
          note: string | null
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          date?: string
          dog_id: string
          id?: string
          note?: string | null
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          date?: string
          dog_id?: string
          id?: string
          note?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
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
    }
    Enums: {
      activity_level: "bajo" | "moderado" | "alto"
      app_role: "admin" | "user"
      chat_role: "user" | "assistant"
      dog_sex: "macho" | "hembra"
      ingredient_category:
        | "proteina"
        | "vegetal"
        | "cereal"
        | "fruta"
        | "grasa"
        | "suplemento"
      pantry_status: "disponible" | "poco" | "consumido"
      plan_id: "trial" | "basico" | "familiar" | "premium" | "gratis" | "pro"
      recipe_category:
        | "desayuno"
        | "principal"
        | "snack"
        | "premio"
        | "hidratacion"
      reminder_key: "comida" | "cocinar" | "pesar" | "compras" | "recetaDelDia"
      safety_level: "seguro" | "moderacion" | "evitar"
      weight_unit: "kg" | "lb"
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
      activity_level: ["bajo", "moderado", "alto"],
      app_role: ["admin", "user"],
      chat_role: ["user", "assistant"],
      dog_sex: ["macho", "hembra"],
      ingredient_category: [
        "proteina",
        "vegetal",
        "cereal",
        "fruta",
        "grasa",
        "suplemento",
      ],
      pantry_status: ["disponible", "poco", "consumido"],
      plan_id: ["trial", "basico", "familiar", "premium", "gratis", "pro"],
      recipe_category: [
        "desayuno",
        "principal",
        "snack",
        "premio",
        "hidratacion",
      ],
      reminder_key: ["comida", "cocinar", "pesar", "compras", "recetaDelDia"],
      safety_level: ["seguro", "moderacion", "evitar"],
      weight_unit: ["kg", "lb"],
    },
  },
} as const
