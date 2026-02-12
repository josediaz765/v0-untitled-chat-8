-- Add public_custom_html column to scripts table to control HTML viewer visibility
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS public_custom_html BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS scripts_public_custom_html_idx ON scripts(public_custom_html);

-- Update existing scripts to have public_custom_html enabled by default
UPDATE scripts SET public_custom_html = true WHERE public_custom_html IS NULL;
