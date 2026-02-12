-- Create global_chat_messages table for the new global chat feature
CREATE TABLE IF NOT EXISTS global_chat_messages (
    id SERIAL PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    thumbnail_url TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_global_chat_sent_at ON global_chat_messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_chat_api_key ON global_chat_messages(api_key);

-- Enable RLS
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (anyone can read, verified API keys can write)
CREATE POLICY "Public access to global chat messages" 
    ON global_chat_messages 
    FOR ALL 
    USING (true);
