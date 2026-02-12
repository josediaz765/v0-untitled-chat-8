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
