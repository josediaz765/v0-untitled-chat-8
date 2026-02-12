ALTER TABLE scripts ADD COLUMN IF NOT EXISTS api_key_source TEXT;
CREATE INDEX IF NOT EXISTS scripts_api_key_source_idx ON scripts(api_key_source);
