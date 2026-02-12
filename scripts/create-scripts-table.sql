CREATE TABLE IF NOT EXISTS scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled Script',
    content TEXT DEFAULT '',
    author_id UUID NOT NULL,
    is_private BOOLEAN DEFAULT false,
    is_disabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view public scripts or their own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can insert their own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can update their own scripts" ON scripts;
DROP POLICY IF EXISTS "Users can delete their own scripts" ON scripts;

CREATE POLICY "Users can view public scripts or their own scripts" ON scripts
    FOR SELECT USING (
        NOT is_private OR 
        author_id = auth.uid()
    );

CREATE POLICY "Users can insert their own scripts" ON scripts
    FOR INSERT WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update their own scripts" ON scripts
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete their own scripts" ON scripts
    FOR DELETE USING (author_id = auth.uid());

CREATE INDEX IF NOT EXISTS scripts_author_id_idx ON scripts(author_id);
CREATE INDEX IF NOT EXISTS scripts_updated_at_idx ON scripts(updated_at DESC);
CREATE INDEX IF NOT EXISTS scripts_title_idx ON scripts(title);
CREATE INDEX IF NOT EXISTS scripts_is_disabled_idx ON scripts(is_disabled);

CREATE UNIQUE INDEX IF NOT EXISTS scripts_title_author_unique ON scripts(title, author_id);
