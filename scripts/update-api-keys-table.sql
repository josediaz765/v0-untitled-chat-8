-- Add is_private column to api_keys table for private API key feature
ALTER TABLE api_keys ADD COLUMN is_private BOOLEAN DEFAULT FALSE;

-- Update existing keys to be public by default
UPDATE api_keys SET is_private = FALSE WHERE is_private IS NULL;
