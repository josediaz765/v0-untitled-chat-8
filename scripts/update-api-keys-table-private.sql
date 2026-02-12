-- Add is_private column to api_keys table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'api_keys' AND column_name = 'is_private'
    ) THEN
        ALTER TABLE api_keys ADD COLUMN is_private BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update existing API keys to be public by default
UPDATE api_keys SET is_private = FALSE WHERE is_private IS NULL;

-- Create index for better performance on private key queries
CREATE INDEX IF NOT EXISTS idx_api_keys_private ON api_keys(is_private);

-- Create index for better performance on active private key queries
CREATE INDEX IF NOT EXISTS idx_api_keys_active_private ON api_keys(is_active, is_private);
