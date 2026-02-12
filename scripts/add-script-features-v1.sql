-- Add new columns to scripts table for likes, dislikes, views, thumbnails
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create script_likes table to track who liked/disliked
CREATE TABLE IF NOT EXISTS script_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL, -- true = like, false = dislike
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, user_id)
);

-- Create script_reports table
CREATE TABLE IF NOT EXISTS script_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, dismissed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create script_views table to track unique views
CREATE TABLE IF NOT EXISTS script_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewer_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(script_id, viewer_id)
);

-- Enable RLS on new tables
ALTER TABLE script_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE script_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for script_likes
CREATE POLICY "Users can view all likes" ON script_likes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own likes" ON script_likes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for script_reports
CREATE POLICY "Users can create reports" ON script_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view their own reports" ON script_reports FOR SELECT USING (auth.uid() = reporter_id);

-- RLS Policies for script_views
CREATE POLICY "Anyone can view script views" ON script_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert views" ON script_views FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_script_likes_script_id ON script_likes(script_id);
CREATE INDEX IF NOT EXISTS idx_script_likes_user_id ON script_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_script_reports_script_id ON script_reports(script_id);
CREATE INDEX IF NOT EXISTS idx_script_views_script_id ON script_views(script_id);
