-- Enhanced Database Schema for Roblox Global Message API
-- This script creates all necessary tables with advanced features

-- API Keys table with enhanced features
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) DEFAULT 'Untitled Key',
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    rate_limit INTEGER DEFAULT 1000,
    rate_limit_window INTEGER DEFAULT 3600, -- seconds
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    allowed_origins TEXT[],
    allowed_ips INET[],
    permissions JSONB DEFAULT '{"messages": true, "scripts": true, "players": true, "analytics": true}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Global Messages table with advanced features
CREATE TABLE IF NOT EXISTS global_messages (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    priority INTEGER DEFAULT 1,
    target_players TEXT[],
    target_criteria JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    read_count INTEGER DEFAULT 0,
    delivery_status VARCHAR(50) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
);

-- Active Players table with comprehensive tracking
CREATE TABLE IF NOT EXISTS active_players (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    player_user_id BIGINT,
    job_id VARCHAR(255),
    place_id BIGINT,
    server_region VARCHAR(100),
    device_type VARCHAR(50),
    platform VARCHAR(50),
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    last_execution TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_duration INTEGER DEFAULT 0,
    total_playtime INTEGER DEFAULT 0,
    is_premium BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    reputation_score INTEGER DEFAULT 0,
    player_level INTEGER DEFAULT 1,
    player_data JSONB DEFAULT '{}'::jsonb,
    connection_quality VARCHAR(50) DEFAULT 'unknown',
    last_ping INTEGER DEFAULT 0,
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE,
    UNIQUE(api_key, player_user_id)
);

-- Script Executions table with detailed tracking
CREATE TABLE IF NOT EXISTS script_executions (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    script_content TEXT NOT NULL,
    script_hash VARCHAR(64),
    script_name VARCHAR(255),
    script_category VARCHAR(100),
    executed_by_player VARCHAR(255),
    player_user_id BIGINT,
    execution_status VARCHAR(50) DEFAULT 'pending',
    execution_time INTEGER, -- milliseconds
    memory_usage INTEGER, -- bytes
    cpu_usage DECIMAL(5,2), -- percentage
    error_message TEXT,
    error_type VARCHAR(100),
    stack_trace TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    environment_info JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
);

-- User Profiles table with enhanced features
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    is_developer BOOLEAN DEFAULT false,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires TIMESTAMP WITH TIME ZONE,
    total_api_calls BIGINT DEFAULT 0,
    total_messages_sent BIGINT DEFAULT 0,
    total_scripts_executed BIGINT DEFAULT 0,
    reputation_score INTEGER DEFAULT 0,
    achievements TEXT[],
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- API Usage History table with comprehensive logging
CREATE TABLE IF NOT EXISTS api_usage_history (
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
    request_headers JSONB DEFAULT '{}'::jsonb,
    response_time INTEGER, -- milliseconds
    status_code INTEGER DEFAULT 200,
    error_message TEXT,
    request_size INTEGER, -- bytes
    response_size INTEGER, -- bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    trace_id VARCHAR(255),
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
);

-- Scheduled Messages table
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    name VARCHAR(255) DEFAULT 'Untitled Schedule',
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    repeat_interval VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'custom'
    repeat_pattern JSONB DEFAULT '{}'::jsonb,
    max_repeats INTEGER,
    current_repeats INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    target_players TEXT[],
    target_criteria JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    next_execution TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
);

-- Webhooks table for external integrations
CREATE TABLE IF NOT EXISTS webhooks (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    headers JSONB DEFAULT '{}'::jsonb,
    last_triggered TIMESTAMP WITH TIME ZONE,
    last_status INTEGER,
    last_error TEXT,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
);

-- Analytics Events table for detailed tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(100),
    event_action VARCHAR(100),
    event_label VARCHAR(255),
    event_value DECIMAL(10,2),
    event_data JSONB DEFAULT '{}'::jsonb,
    player_info JSONB DEFAULT '{}'::jsonb,
    session_id VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    page_url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT false,
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE
);

-- Script Templates table
CREATE TABLE IF NOT EXISTS script_templates (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'utility',
    script_content TEXT NOT NULL,
    script_language VARCHAR(50) DEFAULT 'lua',
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    rating_count INTEGER DEFAULT 0,
    version VARCHAR(50) DEFAULT '1.0.0',
    changelog TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message Templates table
CREATE TABLE IF NOT EXISTS message_templates (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general',
    message_content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    variables JSONB DEFAULT '{}'::jsonb,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Server Statistics table
CREATE TABLE IF NOT EXISTS server_statistics (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    place_id BIGINT,
    job_id VARCHAR(255),
    server_region VARCHAR(100),
    player_count INTEGER DEFAULT 0,
    max_players INTEGER DEFAULT 0,
    server_fps INTEGER DEFAULT 0,
    server_ping INTEGER DEFAULT 0,
    memory_usage INTEGER DEFAULT 0,
    cpu_usage DECIMAL(5,2) DEFAULT 0.0,
    uptime INTEGER DEFAULT 0,
    game_version VARCHAR(100),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    FOREIGN KEY (api_key) REFERENCES api_keys(api_key) ON DELETE CASCADE,
    UNIQUE(api_key, place_id, job_id, recorded_at)
);

-- Create comprehensive indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires ON api_keys(expires_at);

CREATE INDEX IF NOT EXISTS idx_messages_api_key ON global_messages(api_key);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON global_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_type ON global_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON global_messages(priority);
CREATE INDEX IF NOT EXISTS idx_messages_status ON global_messages(delivery_status);
CREATE INDEX IF NOT EXISTS idx_messages_expires ON global_messages(expires_at);

CREATE INDEX IF NOT EXISTS idx_players_api_key ON active_players(api_key);
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON active_players(last_seen);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON active_players(player_user_id);
CREATE INDEX IF NOT EXISTS idx_players_place_id ON active_players(place_id);
CREATE INDEX IF NOT EXISTS idx_players_executions ON active_players(total_executions);

CREATE INDEX IF NOT EXISTS idx_executions_api_key ON script_executions(api_key);
CREATE INDEX IF NOT EXISTS idx_executions_player ON script_executions(player_user_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON script_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_executions_executed_at ON script_executions(executed_at);
CREATE INDEX IF NOT EXISTS idx_executions_hash ON script_executions(script_hash);

CREATE INDEX IF NOT EXISTS idx_usage_history_user ON api_usage_history(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_history_api_key ON api_usage_history(api_key);
CREATE INDEX IF NOT EXISTS idx_usage_history_created ON api_usage_history(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_history_action ON api_usage_history(action_type);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled ON scheduled_messages(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_next ON scheduled_messages(next_execution);

CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON webhooks USING GIN(events);

CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_api_key ON analytics_events(api_key);

CREATE INDEX IF NOT EXISTS idx_script_templates_category ON script_templates(category);
CREATE INDEX IF NOT EXISTS idx_script_templates_public ON script_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_script_templates_featured ON script_templates(is_featured);
CREATE INDEX IF NOT EXISTS idx_script_templates_tags ON script_templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_public ON message_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_message_templates_tags ON message_templates USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_server_stats_api_key ON server_statistics(api_key);
CREATE INDEX IF NOT EXISTS idx_server_stats_place ON server_statistics(place_id);
CREATE INDEX IF NOT EXISTS idx_server_stats_recorded ON server_statistics(recorded_at);

-- Enable Row Level Security on all tables
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_statistics ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies
-- API Keys policies
CREATE POLICY "Users can manage their own API keys" ON api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Global Messages policies (allow API access)
CREATE POLICY "Allow all operations on global_messages" ON global_messages
    FOR ALL USING (true);

-- Active Players policies (allow API access)
CREATE POLICY "Allow all operations on active_players" ON active_players
    FOR ALL USING (true);

-- Script Executions policies (allow API access)
CREATE POLICY "Allow all operations on script_executions" ON script_executions
    FOR ALL USING (true);

-- User Profiles policies
CREATE POLICY "Users can manage their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable" ON user_profiles
    FOR SELECT USING (true);

-- API Usage History policies
CREATE POLICY "Users can view their own usage history" ON api_usage_history
    FOR ALL USING (auth.uid() = user_id);

-- Scheduled Messages policies
CREATE POLICY "Users can manage their own scheduled messages" ON scheduled_messages
    FOR ALL USING (auth.uid() = user_id);

-- Webhooks policies
CREATE POLICY "Users can manage their own webhooks" ON webhooks
    FOR ALL USING (auth.uid() = user_id);

-- Analytics policies
CREATE POLICY "Users can view their own analytics" ON analytics_events
    FOR ALL USING (auth.uid() = user_id);

-- Script Templates policies
CREATE POLICY "Users can manage their own script templates" ON script_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public script templates are viewable" ON script_templates
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Message Templates policies
CREATE POLICY "Users can manage their own message templates" ON message_templates
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public message templates are viewable" ON message_templates
    FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Server Statistics policies (allow API access)
CREATE POLICY "Allow all operations on server_statistics" ON server_statistics
    FOR ALL USING (true);

-- Create useful database functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_messages_updated_at BEFORE UPDATE ON scheduled_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_script_templates_updated_at BEFORE UPDATE ON script_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at BEFORE UPDATE ON message_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Delete expired messages
    DELETE FROM global_messages 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Delete expired API keys
    DELETE FROM api_keys 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    -- Delete old analytics events (older than 1 year)
    DELETE FROM analytics_events 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    -- Delete old usage history (older than 6 months)
    DELETE FROM api_usage_history 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Update player last seen status
    UPDATE active_players 
    SET player_data = player_data || '{"status": "offline"}'::jsonb
    WHERE last_seen < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;

-- Create function to get API key statistics
CREATE OR REPLACE FUNCTION get_api_key_stats(key_id INTEGER)
RETURNS TABLE(
    total_messages BIGINT,
    total_executions BIGINT,
    active_players BIGINT,
    usage_today BIGINT,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM global_messages gm 
         JOIN api_keys ak ON gm.api_key = ak.api_key 
         WHERE ak.id = key_id),
        (SELECT COUNT(*) FROM script_executions se 
         JOIN api_keys ak ON se.api_key = ak.api_key 
         WHERE ak.id = key_id),
        (SELECT COUNT(*) FROM active_players ap 
         JOIN api_keys ak ON ap.api_key = ak.api_key 
         WHERE ak.id = key_id AND ap.last_seen > NOW() - INTERVAL '5 minutes'),
        (SELECT COUNT(*) FROM api_usage_history auh 
         JOIN api_keys ak ON auh.api_key = ak.api_key 
         WHERE ak.id = key_id AND auh.created_at > CURRENT_DATE),
        (SELECT 
            CASE 
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((COUNT(*) FILTER (WHERE execution_status = 'success')::DECIMAL / COUNT(*)) * 100, 2)
            END
         FROM script_executions se 
         JOIN api_keys ak ON se.api_key = ak.api_key 
         WHERE ak.id = key_id);
END;
$$ LANGUAGE plpgsql;
