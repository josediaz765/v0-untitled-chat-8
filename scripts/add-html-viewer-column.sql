-- Add is_html_viewer column to scripts table to toggle custom HTML viewer
ALTER TABLE scripts ADD COLUMN IF NOT EXISTS is_html_viewer BOOLEAN DEFAULT true;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS scripts_is_html_viewer_idx ON scripts(is_html_viewer);
