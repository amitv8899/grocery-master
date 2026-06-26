export type Priority = 'low' | 'normal' | 'high'

export type Ingredient = {
  name: string
  count: number
  priority: Priority
  label: string | null
}

export type Database = {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    Tables: {
      items: {
        Row: {
          id: string
          name: string
          count: number
          priority: Priority
          checked: boolean
          label: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          count?: number
          priority?: Priority
          checked?: boolean
          label?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          count?: number
          priority?: Priority
          checked?: boolean
          label?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      item_catalog: {
        Row: { id: string; name: string; tag_name: string | null; updated_at: string }
        Insert: { id?: string; name: string; tag_name?: string | null; updated_at?: string }
        Update: { id?: string; name?: string; tag_name?: string | null; updated_at?: string }
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          name: string
          ingredients: Ingredient[]
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          ingredients?: Ingredient[]
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          ingredients?: Ingredient[]
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
  }
}

export type ItemCatalog = {
  id: string
  name: string
  tag_name: string | null
  updated_at: string
}

export type Item = Database['public']['Tables']['items']['Row']
export type ItemInsert = Database['public']['Tables']['items']['Insert']
export type ItemUpdate = Database['public']['Tables']['items']['Update']

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']
