-- Complete Supabase Database Setup Script
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful with this in production)
DROP TABLE IF EXISTS public.script_execution_logs CASCADE;
DROP TABLE IF EXISTS public.api_usage_history CASCADE;
DROP TABLE IF EXISTS public.active_players CASCADE;
DROP TABLE IF EXISTS public.script_executions CASCADE;
DROP TABLE IF EXISTS public.global_messages CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create user profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create API keys table
CREATE TABLE public.api_keys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Create global messages table
CREATE TABLE public.global_messages (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create script executions table
CREATE TABLE public.script_executions (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    script_content TEXT NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create active players table
CREATE TABLE public.active_players (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    player_user_id BIGINT,
    total_executions INTEGER DEFAULT 0,
    last_execution TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_key, player_user_id)
);

-- Create API usage history table
CREATE TABLE public.api_usage_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    executed_by_player VARCHAR(255),
    player_user_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create script execution logs table
CREATE TABLE public.script_execution_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    script_content TEXT NOT NULL,
    executed_by_player VARCHAR(255) NOT NULL,
    player_user_id BIGINT,
    execution_status VARCHAR(50) DEFAULT 'executed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active);
CREATE INDEX idx_api_keys_key ON public.api_keys(api_key);
CREATE INDEX idx_messages_sent_at ON public.global_messages(sent_at);
CREATE INDEX idx_messages_api_key ON public.global_messages(api_key);
CREATE INDEX idx_active_players_api_key ON public.active_players(api_key);
CREATE INDEX idx_active_players_user_id ON public.active_players(user_id);
CREATE INDEX idx_active_players_last_seen ON public.active_players(last_seen);
CREATE INDEX idx_script_executions_api_key ON public.script_executions(api_key);
CREATE INDEX idx_usage_history_user_id ON public.api_usage_history(user_id);
CREATE INDEX idx_execution_logs_user_id ON public.script_execution_logs(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_execution_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Public access to global messages" ON public.global_messages;
DROP POLICY IF EXISTS "Users can manage their own players" ON public.active_players;
DROP POLICY IF EXISTS "Public access to script executions" ON public.script_executions;
DROP POLICY IF EXISTS "Users can manage their own usage history" ON public.api_usage_history;
DROP POLICY IF EXISTS "Users can manage their own execution logs" ON public.script_execution_logs;

-- Create RLS policies
CREATE POLICY "Users can manage their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public access to global messages" ON public.global_messages
    FOR ALL USING (true);

CREATE POLICY "Users can manage their own players" ON public.active_players
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public access to script executions" ON public.script_executions
    FOR ALL USING (true);

CREATE POLICY "Users can manage their own usage history" ON public.api_usage_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own execution logs" ON public.script_execution_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, username)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert some test data (optional)
-- You can remove this section if you don't want test data
INSERT INTO public.global_messages (api_key, message, sent_at) VALUES 
('test_key_123', 'Welcome to Roblox API Manager!', NOW()),
('test_key_123', 'System is ready for use.', NOW());

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'All tables, indexes, and policies have been created.';
    RAISE NOTICE 'You can now use the Roblox API Manager application.';
END $$;
