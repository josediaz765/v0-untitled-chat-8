import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Create all necessary tables
    const tables = [
      // API Keys table
      `CREATE TABLE IF NOT EXISTS api_keys (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name VARCHAR(255) DEFAULT 'Untitled Key',
        is_private BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        usage_count INTEGER DEFAULT 0,
        last_used TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        rate_limit INTEGER DEFAULT 1000,
        allowed_origins TEXT[],
        permissions JSONB DEFAULT '{"messages": true, "scripts": true, "players": true}'::jsonb
      )`,

      // Global Messages table
      `CREATE TABLE IF NOT EXISTS global_messages (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        priority INTEGER DEFAULT 1,
        target_players TEXT[],
        metadata JSONB DEFAULT '{}'::jsonb,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        is_read BOOLEAN DEFAULT false,
        FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
      )`,

      // Active Players table
      `CREATE TABLE IF NOT EXISTS active_players (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        player_user_id BIGINT,
        job_id VARCHAR(255),
        place_id BIGINT,
        server_region VARCHAR(100),
        device_type VARCHAR(50),
        total_executions INTEGER DEFAULT 0,
        last_execution TIMESTAMP WITH TIME ZONE,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        session_duration INTEGER DEFAULT 0,
        is_premium BOOLEAN DEFAULT false,
        player_data JSONB DEFAULT '{}'::jsonb,
        FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE,
        UNIQUE(api_key, player_user_id)
      )`,

      // Script Executions table
      `CREATE TABLE IF NOT EXISTS script_executions (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) NOT NULL,
        script_content TEXT NOT NULL,
        script_hash VARCHAR(64),
        executed_by_player VARCHAR(255),
        player_user_id BIGINT,
        execution_status VARCHAR(50) DEFAULT 'pending',
        execution_time INTEGER,
        error_message TEXT,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb,
        FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
      )`,

      // User Profiles table
      `CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        username VARCHAR(255) UNIQUE,
        display_name VARCHAR(255),
        avatar_url TEXT,
        bio TEXT,
        website_url TEXT,
        is_verified BOOLEAN DEFAULT false,
        subscription_tier VARCHAR(50) DEFAULT 'free',
        total_api_calls BIGINT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // API Usage History table
      `CREATE TABLE IF NOT EXISTS api_usage_history (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        api_key VARCHAR(255) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        content TEXT,
        target_info JSONB DEFAULT '{}'::jsonb,
        executed_by_player VARCHAR(255),
        player_user_id BIGINT,
        ip_address INET,
        user_agent TEXT,
        response_time INTEGER,
        status_code INTEGER DEFAULT 200,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
      )`,

      // Scheduled Messages table
      `CREATE TABLE IF NOT EXISTS scheduled_messages (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        api_key VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        message_type VARCHAR(50) DEFAULT 'text',
        scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
        repeat_interval VARCHAR(50),
        max_repeats INTEGER,
        current_repeats INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        target_players TEXT[],
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        sent_at TIMESTAMP WITH TIME ZONE,
        FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
      )`,

      // Webhooks table
      `CREATE TABLE IF NOT EXISTS webhooks (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        api_key VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        url TEXT NOT NULL,
        events TEXT[] NOT NULL,
        secret_key VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        retry_count INTEGER DEFAULT 3,
        timeout_seconds INTEGER DEFAULT 30,
        last_triggered TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
      )`,

      // Analytics table
      `CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        api_key VARCHAR(255),
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB DEFAULT '{}'::jsonb,
        player_info JSONB DEFAULT '{}'::jsonb,
        session_id VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
      )`,
    ]

    // Execute table creation
    for (const tableSQL of tables) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: tableSQL })
      if (error) {
        console.error("Error creating table:", error)
        // Continue with other tables even if one fails
      }
    }

    // Create indexes for better performance
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active)",
      "CREATE INDEX IF NOT EXISTS idx_messages_api_key ON global_messages(api_key)",
      "CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON global_messages(sent_at)",
      "CREATE INDEX IF NOT EXISTS idx_messages_type ON global_messages(message_type)",
      "CREATE INDEX IF NOT EXISTS idx_players_api_key ON active_players(api_key)",
      "CREATE INDEX IF NOT EXISTS idx_players_last_seen ON active_players(last_seen)",
      "CREATE INDEX IF NOT EXISTS idx_players_user_id ON active_players(player_user_id)",
      "CREATE INDEX IF NOT EXISTS idx_executions_api_key ON script_executions(api_key)",
      "CREATE INDEX IF NOT EXISTS idx_executions_player ON script_executions(player_user_id)",
      "CREATE INDEX IF NOT EXISTS idx_executions_status ON script_executions(execution_status)",
      "CREATE INDEX IF NOT EXISTS idx_usage_history_user ON api_usage_history(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_usage_history_api_key ON api_usage_history(api_key)",
      "CREATE INDEX IF NOT EXISTS idx_usage_history_created ON api_usage_history(created_at)",
      "CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled ON scheduled_messages(scheduled_for)",
      "CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status)",
      "CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp)",
      "CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type)",
    ]

    for (const indexSQL of indexes) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: indexSQL })
      if (error) {
        console.error("Error creating index:", error)
      }
    }

    // Enable Row Level Security
    const rlsPolicies = [
      "ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE global_messages ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE active_players ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE script_executions ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE api_usage_history ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY",
      "ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY",
    ]

    for (const policySQL of rlsPolicies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policySQL })
      if (error) {
        console.error("Error enabling RLS:", error)
      }
    }

    // Create RLS policies
    const policies = [
      // API Keys policies
      `CREATE POLICY "Users can manage their own API keys" ON api_keys
       FOR ALL USING (auth.uid() = user_id)`,
      
      // Global Messages policies
      `CREATE POLICY "Allow all operations on global_messages" ON global_messages
       FOR ALL USING (true)`,
      
      // Active Players policies
      `CREATE POLICY "Allow all operations on active_players" ON active_players
       FOR ALL USING (true)`,
      
      // Script Executions policies
      `CREATE POLICY "Allow all operations on script_executions" ON script_executions
       FOR ALL USING (true)`,
      
      // User Profiles policies
      `CREATE POLICY "Users can manage their own profile" ON user_profiles
       FOR ALL USING (auth.uid() = user_id)`,
      
      // API Usage History policies
      `CREATE POLICY "Users can view their own usage history" ON api_usage_history
       FOR ALL USING (auth.uid() = user_id)`,
      
      // Scheduled Messages policies
      `CREATE POLICY "Users can manage their own scheduled messages" ON scheduled_messages
       FOR ALL USING (auth.uid() = user_id)`,
      
      // Webhooks policies
      `CREATE POLICY "Users can manage their own webhooks" ON webhooks
       FOR ALL USING (auth.uid() = user_id)`,
      
      // Analytics policies
      `CREATE POLICY "Users can view their own analytics" ON analytics_events
       FOR ALL USING (auth.uid() = user_id)`,
    ]

    for (const policySQL of policies) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: policySQL })
      if (error && !error.message.includes("already exists")) {
        console.error("Error creating policy:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
      tables_created: tables.length,
      indexes_created: indexes.length,
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json({ error: "Failed to setup database" }, { status: 500 })
  }
}
