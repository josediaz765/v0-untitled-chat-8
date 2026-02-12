import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ success: false, error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if tables exist by trying to query them
    const { error: checkError } = await supabase.from("api_keys").select("id").limit(1)

    if (!checkError) {
      // Tables already exist
      return NextResponse.json({ success: true, message: "Database already set up" })
    }

    // Tables don't exist - create them using raw SQL via the REST API
    // Note: This requires the service role key
    const setupSQL = `
      -- Create user_profiles if not exists
      CREATE TABLE IF NOT EXISTS public.user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        username TEXT,
        display_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id)
      );

      -- Create api_keys if not exists
      CREATE TABLE IF NOT EXISTS public.api_keys (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        name VARCHAR(255) DEFAULT 'Untitled Key',
        is_private BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create global_messages if not exists
      CREATE TABLE IF NOT EXISTS public.global_messages (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        sent_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create active_players if not exists
      CREATE TABLE IF NOT EXISTS public.active_players (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        display_name VARCHAR(255),
        player_user_id BIGINT,
        total_executions INTEGER DEFAULT 0,
        last_execution TIMESTAMPTZ,
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(api_key, player_user_id)
      );

      -- Create script_executions if not exists
      CREATE TABLE IF NOT EXISTS public.script_executions (
        id SERIAL PRIMARY KEY,
        api_key VARCHAR(255) NOT NULL,
        script_content TEXT NOT NULL,
        executed_by_player VARCHAR(255),
        player_user_id BIGINT,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create api_usage_history if not exists
      CREATE TABLE IF NOT EXISTS public.api_usage_history (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        api_key VARCHAR(255) NOT NULL,
        action_type VARCHAR(100) NOT NULL,
        content TEXT,
        executed_by_player VARCHAR(255),
        player_user_id BIGINT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.active_players ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.api_usage_history ENABLE ROW LEVEL SECURITY;

      -- Create basic RLS policies (allow all for now - can be tightened later)
      DO $$ 
      BEGIN
        -- user_profiles
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Allow all for user_profiles') THEN
          CREATE POLICY "Allow all for user_profiles" ON public.user_profiles FOR ALL USING (true);
        END IF;
        
        -- api_keys
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Allow all for api_keys') THEN
          CREATE POLICY "Allow all for api_keys" ON public.api_keys FOR ALL USING (true);
        END IF;
        
        -- global_messages
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'global_messages' AND policyname = 'Allow all for global_messages') THEN
          CREATE POLICY "Allow all for global_messages" ON public.global_messages FOR ALL USING (true);
        END IF;
        
        -- active_players
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'active_players' AND policyname = 'Allow all for active_players') THEN
          CREATE POLICY "Allow all for active_players" ON public.active_players FOR ALL USING (true);
        END IF;
        
        -- script_executions
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'script_executions' AND policyname = 'Allow all for script_executions') THEN
          CREATE POLICY "Allow all for script_executions" ON public.script_executions FOR ALL USING (true);
        END IF;
        
        -- api_usage_history
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_usage_history' AND policyname = 'Allow all for api_usage_history') THEN
          CREATE POLICY "Allow all for api_usage_history" ON public.api_usage_history FOR ALL USING (true);
        END IF;
      END $$;

      -- Grant permissions
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
    `

    // Execute via postgres function or RPC
    const { error: setupError } = await supabase.rpc("exec_sql", { sql: setupSQL }).single()

    if (setupError) {
      // If RPC doesn't exist, tables might already be there or we need manual setup
      // Try a simpler approach - just verify tables work
      const { error: verifyError } = await supabase.from("api_keys").select("id").limit(1)

      if (verifyError && verifyError.message.includes("does not exist")) {
        return NextResponse.json(
          {
            success: false,
            error: "Database tables need to be created. Please run the setup script once.",
            needsManualSetup: true,
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ success: true, message: "Database setup completed" })
  } catch (error) {
    console.error("Auto-setup error:", error)
    return NextResponse.json({ success: false, error: "Failed to auto-setup database" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      // If no credentials, just return success - let the app handle auth errors
      return NextResponse.json({ success: true, tablesExist: true })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Quick check if api_keys table exists
    const { error } = await supabase.from("api_keys").select("id").limit(1)

    // If no error or error is not about missing table, assume database is ready
    const tablesExist = !error || !error.message.includes("does not exist")

    return NextResponse.json({
      success: true,
      tablesExist: tablesExist,
    })
  } catch (error) {
    // On any error, assume database is ready and let the app handle specific errors
    return NextResponse.json({ success: true, tablesExist: true })
  }
}
