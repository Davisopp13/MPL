export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          team: 'CH' | 'MH'
          role: 'member' | 'supervisor'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          team: 'CH' | 'MH'
          role?: 'member' | 'supervisor'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          team?: 'CH' | 'MH'
          role?: 'member' | 'supervisor'
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          label: string
          icon: string
          team: 'CH' | 'MH'
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          icon: string
          team: 'CH' | 'MH'
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          icon?: string
          team?: 'CH' | 'MH'
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          id: string
          category_id: string
          label: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          label: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          label?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subtasks_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      log_entries: {
        Row: {
          id: string
          user_id: string
          category_id: string
          subtask_id: string
          minutes: number
          occurrences: number
          note: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id: string
          subtask_id: string
          minutes: number
          occurrences?: number
          note?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string
          subtask_id?: string
          minutes?: number
          occurrences?: number
          note?: string | null
          verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'log_entries_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'log_entries_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'log_entries_subtask_id_fkey'
            columns: ['subtask_id']
            isOneToOne: false
            referencedRelation: 'subtasks'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type aliases
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type Category = Database['public']['Tables']['categories']['Row']
export type Subtask = Database['public']['Tables']['subtasks']['Row']
export type LogEntry = Database['public']['Tables']['log_entries']['Row']
export type LogEntryInsert = Database['public']['Tables']['log_entries']['Insert']
