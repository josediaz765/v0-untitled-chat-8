"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Copy, Database, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DatabaseSetupGuideProps {
  onSetupComplete?: () => void
}

export function DatabaseSetupGuide({ onSetupComplete }: DatabaseSetupGuideProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [setupStatus, setSetupStatus] = useState<"pending" | "success" | "error">("pending")

  const sqlScript = `-- Complete Supabase Database Setup Script
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

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully!';
    RAISE NOTICE 'All tables, indexes, and policies have been created.';
    RAISE NOTICE 'You can now use the Roblox API Manager application.';
END $$;`

  const copyScript = () => {
    navigator.clipboard.writeText(sqlScript)
    toast({
      title: "📋 SQL Script Copied",
      description: "The database setup script has been copied to your clipboard.",
    })
  }

  const testSetup = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("supabase.auth.token")
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        setSetupStatus("success")
        toast({
          title: "✅ Database Setup Complete",
          description: "All tables are properly configured!",
        })
        onSetupComplete?.()
      } else {
        setSetupStatus("error")
        toast({
          title: "❌ Setup Required",
          description: data.error || "Please run the SQL script first.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setSetupStatus("error")
      toast({
        title: "❌ Error",
        description: "Failed to test database setup.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Database Setup Required:</strong> Your Supabase database needs to be configured with the required
          tables before you can use the API manager.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Step 1: Run SQL Script
            </CardTitle>
            <CardDescription>Copy and run this script in your Supabase SQL Editor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={copyScript} variant="outline" className="flex-1 bg-transparent">
                <Copy className="h-4 w-4 mr-2" />
                Copy SQL Script
              </Button>
              <Button
                onClick={() => window.open("https://supabase.com/dashboard/project/_/sql", "_blank")}
                variant="outline"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase
              </Button>
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-64">
              <pre>
                <code>{sqlScript.substring(0, 500)}...</code>
              </pre>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Tables that will be created:</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "user_profiles",
                  "api_keys",
                  "global_messages",
                  "script_executions",
                  "active_players",
                  "api_usage_history",
                  "script_execution_logs",
                ].map((table) => (
                  <Badge key={table} variant="secondary">
                    {table}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 2: Verify Setup
            </CardTitle>
            <CardDescription>Test that your database is properly configured</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testSetup} disabled={isLoading} className="w-full">
              {isLoading ? "Testing..." : "Test Database Setup"}
            </Button>

            {setupStatus === "success" && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Your database is properly configured and ready to use.
                </AlertDescription>
              </Alert>
            )}

            {setupStatus === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Setup Required:</strong> Please run the SQL script in your Supabase SQL Editor first.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Setup Instructions:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-gray-600">
                <li>Copy the SQL script above</li>
                <li>Open your Supabase project dashboard</li>
                <li>Go to SQL Editor</li>
                <li>Paste and run the script</li>
                <li>Click "Test Database Setup" to verify</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
