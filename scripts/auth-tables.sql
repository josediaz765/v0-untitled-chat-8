-- Enhanced Authentication and User Management Tables
-- This script creates comprehensive user management and authentication tables

-- Extended user profiles with comprehensive features
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    email VARCHAR(255),
    avatar_url TEXT,
    cover_image_url TEXT,
    bio TEXT,
    website_url TEXT,
    location VARCHAR(255),
    timezone VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    
    -- Social links
    social_links JSONB DEFAULT '{
        "twitter": null,
        "github": null,
        "discord": null,
        "youtube": null,
        "twitch": null,
        "roblox": null
    }'::jsonb,
    
    -- Status and verification
    is_verified BOOLEAN DEFAULT false,
    is_developer BOOLEAN DEFAULT false,
    is_beta_tester BOOLEAN DEFAULT false,
    account_status VARCHAR(50) DEFAULT 'active',
    verification_level INTEGER DEFAULT 0,
    
    -- Subscription and billing
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_expires TIMESTAMP WITH TIME ZONE,
    billing_customer_id VARCHAR(255),
    
    -- Usage statistics
    total_api_calls BIGINT DEFAULT 0,
    total_messages_sent BIGINT DEFAULT 0,
    total_scripts_executed BIGINT DEFAULT 0,
    total_players_reached BIGINT DEFAULT 0,
    
    -- Reputation and achievements
    reputation_score INTEGER DEFAULT 0,
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    achievements TEXT[] DEFAULT '{}',
    badges JSONB DEFAULT '[]'::jsonb,
    
    -- Preferences and settings
    preferences JSONB DEFAULT '{
        "theme": "system",
        "notifications": {
            "email": true,
            "push": true,
            "discord": false
        },
        "privacy": {
            "profile_public": true,
            "show_stats": true,
            "show_activity": false
        },
        "api": {
            "rate_limit_notifications": true,
            "execution_notifications": true,
            "error_notifications": true
        }
    }'::jsonb,
    
    -- Security settings
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    backup_codes TEXT[],
    security_questions JSONB DEFAULT '[]'::jsonb,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Activity tracking
    last_login TIMESTAMP WITH TIME ZONE,
    last_activity TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    ip_addresses INET[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_subscription_tier CHECK (subscription_tier IN ('free', 'pro', 'enterprise', 'lifetime')),
    CONSTRAINT valid_account_status CHECK (account_status IN ('active', 'suspended', 'banned', 'pending')),
    CONSTRAINT valid_verification_level CHECK (verification_level >= 0 AND verification_level <= 5)
);

-- User sessions table for enhanced session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    location_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles and permissions system
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- User activity log
CREATE TABLE IF NOT EXISTS user_activity_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_description TEXT,
    activity_data JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notifications system
CREATE TABLE IF NOT EXISTS user_notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    priority INTEGER DEFAULT 1,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_priority CHECK (priority >= 1 AND priority <= 5)
);

-- User API quotas and limits
CREATE TABLE IF NOT EXISTS user_quotas (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_type VARCHAR(100) NOT NULL,
    quota_limit INTEGER NOT NULL,
    quota_used INTEGER DEFAULT 0,
    quota_period VARCHAR(50) DEFAULT 'monthly',
    reset_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, quota_type, quota_period)
);

-- User feedback and support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'general',
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    assigned_to UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed'))
);

-- Support ticket messages
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feature flags and experiments
CREATE TABLE IF NOT EXISTS user_feature_flags (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name VARCHAR(255) NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    variant VARCHAR(100),
    experiment_group VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, feature_name)
);

-- Insert default roles
INSERT INTO roles (name, display_name, description, permissions, is_system_role) VALUES
('admin', 'Administrator', 'Full system access', 
 ARRAY['*'], true),
('moderator', 'Moderator', 'Content moderation and user management', 
 ARRAY['users.read', 'users.moderate', 'content.moderate', 'reports.manage'], true),
('developer', 'Developer', 'API development and testing access', 
 ARRAY['api.unlimited', 'scripts.advanced', 'analytics.detailed', 'webhooks.manage'], true),
('premium', 'Premium User', 'Enhanced features and higher limits', 
 ARRAY['api.premium', 'scripts.premium', 'analytics.premium', 'support.priority'], true),
('user', 'Regular User', 'Standard user access', 
 ARRAY['api.basic', 'scripts.basic', 'analytics.basic'], true)
ON CONFLICT (name) DO NOTHING;

-- Create comprehensive indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification ON user_profiles(is_verified, verification_level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_activity ON user_profiles(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active, expires_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_type ON user_quotas(quota_type, quota_period);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);

CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_ticket_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_user_feature_flags_user_id ON user_feature_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feature_flags_feature ON user_feature_flags(feature_name, is_enabled);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_flags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles policies
CREATE POLICY "Users can view and edit their own profile" ON user_profiles
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
    FOR SELECT USING (
        (preferences->>'privacy'->>'profile_public')::boolean = true OR 
        auth.uid() = user_id
    );

-- User sessions policies
CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- User roles policies (admin only for modifications)
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = auth.uid() AND r.name = 'admin' AND ur.is_active = true
        )
    );

-- User activity log policies
CREATE POLICY "Users can view their own activity" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs" ON user_activity_log
    FOR INSERT WITH CHECK (true);

-- User notifications policies
CREATE POLICY "Users can manage their own notifications" ON user_notifications
    FOR ALL USING (auth.uid() = user_id);

-- User quotas policies
CREATE POLICY "Users can view their own quotas" ON user_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage quotas" ON user_quotas
    FOR ALL USING (true);

-- Support tickets policies
CREATE POLICY "Users can manage their own tickets" ON support_tickets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Support staff can view all tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('admin', 'moderator') 
            AND ur.is_active = true
        )
    );

-- Support ticket messages policies
CREATE POLICY "Users can manage messages for their tickets" ON support_ticket_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM support_tickets st 
            WHERE st.id = ticket_id AND st.user_id = auth.uid()
        ) OR auth.uid() = user_id
    );

-- User feature flags policies
CREATE POLICY "Users can view their own feature flags" ON user_feature_flags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage feature flags" ON user_feature_flags
    FOR ALL USING (true);

-- Create useful functions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TEXT[] AS $$
DECLARE
    permissions TEXT[] := '{}';
BEGIN
    SELECT array_agg(DISTINCT unnest(r.permissions))
    INTO permissions
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true 
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
    
    RETURN COALESCE(permissions, '{}');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_user_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN permission_name = ANY(get_user_permissions(user_uuid)) OR '*' = ANY(get_user_permissions(user_uuid));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_activity(
    user_uuid UUID,
    activity_type_param VARCHAR(100),
    activity_description_param TEXT DEFAULT NULL,
    activity_data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, activity_description, activity_data)
    VALUES (user_uuid, activity_type_param, activity_description_param, activity_data_param);
    
    UPDATE user_profiles 
    SET last_activity = NOW() 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_user_notification(
    user_uuid UUID,
    title_param VARCHAR(255),
    message_param TEXT,
    type_param VARCHAR(100),
    priority_param INTEGER DEFAULT 1,
    data_param JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO user_notifications (user_id, title, message, notification_type, priority, data)
    VALUES (user_uuid, title_param, message_param, type_param, priority_param, data_param)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_quotas_updated_at 
    BEFORE UPDATE ON user_quotas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at 
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number = 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('support_tickets_id_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_support_ticket_number 
    BEFORE INSERT ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();
