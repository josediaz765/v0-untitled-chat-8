-- Add server info columns to active_players table if they don't exist
DO $$ 
BEGIN
    -- Add job_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'active_players' AND column_name = 'job_id'
    ) THEN
        ALTER TABLE active_players ADD COLUMN job_id TEXT;
    END IF;
    
    -- Add place_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'active_players' AND column_name = 'place_id'
    ) THEN
        ALTER TABLE active_players ADD COLUMN place_id BIGINT;
    END IF;
    
    -- Add total_executions column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'active_players' AND column_name = 'total_executions'
    ) THEN
        ALTER TABLE active_players ADD COLUMN total_executions INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_active_players_job_place ON active_players(job_id, place_id);
CREATE INDEX IF NOT EXISTS idx_active_players_executions ON active_players(total_executions DESC);
CREATE INDEX IF NOT EXISTS idx_active_players_last_seen ON active_players(last_seen DESC);

-- Update existing records to have 0 executions if NULL
UPDATE active_players SET total_executions = 0 WHERE total_executions IS NULL;
