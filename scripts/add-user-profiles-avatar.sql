-- Add avatar_url column to user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing profiles to use username as display_name if null
UPDATE user_profiles
SET display_name = username
WHERE display_name IS NULL;
