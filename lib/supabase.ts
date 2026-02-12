import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { supabase } from "./supabase/client"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

if (!supabaseServiceKey) {
  console.warn("Missing SUPABASE_SERVICE_ROLE_KEY environment variable - some features may not work")
}

// Client for browser usage
export { supabase }

// Admin client for server-side operations (only for API routes)
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: number
          api_key: string
          user_id: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: number
          api_key: string
          user_id: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: number
          api_key?: string
          user_id?: string
          created_at?: string
          is_active?: boolean
        }
      }
      global_messages: {
        Row: {
          id: number
          api_key: string
          message: string
          sent_at: string
        }
        Insert: {
          id?: number
          api_key: string
          message: string
          sent_at?: string
        }
        Update: {
          id?: number
          api_key?: string
          message?: string
          sent_at?: string
        }
      }
      active_players: {
        Row: {
          id: number
          user_id: string
          api_key: string
          username: string
          display_name: string | null
          player_user_id: number | null
          total_executions: number
          last_execution: string | null
          last_seen: string
        }
        Insert: {
          id?: number
          user_id: string
          api_key: string
          username: string
          display_name?: string | null
          player_user_id?: number | null
          total_executions?: number
          last_execution?: string | null
          last_seen?: string
        }
        Update: {
          id?: number
          user_id?: string
          api_key?: string
          username?: string
          display_name?: string | null
          player_user_id?: number | null
          total_executions?: number
          last_execution?: string | null
          last_seen?: string
        }
      }
      api_usage_history: {
        Row: {
          id: number
          user_id: string
          api_key: string
          action_type: string
          content: string
          executed_by_player: string | null
          player_user_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          api_key: string
          action_type: string
          content: string
          executed_by_player?: string | null
          player_user_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          api_key?: string
          action_type?: string
          content?: string
          executed_by_player?: string | null
          player_user_id?: number | null
          created_at?: string
        }
      }
      script_execution_logs: {
        Row: {
          id: number
          user_id: string
          api_key: string
          script_content: string
          executed_by_player: string
          player_user_id: number | null
          execution_status: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          api_key: string
          script_content: string
          executed_by_player: string
          player_user_id?: number | null
          execution_status?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          api_key?: string
          script_content?: string
          executed_by_player?: string
          player_user_id?: number | null
          execution_status?: string
          created_at?: string
        }
      }
    }
  }
}
