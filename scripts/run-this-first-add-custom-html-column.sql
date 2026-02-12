-- ============================================
-- ADD PUBLIC_CUSTOM_HTML COLUMN TO SCRIPTS
-- Run this script FIRST before using the app
-- ============================================

-- Step 1: Add the column with a default value
ALTER TABLE scripts 
ADD COLUMN IF NOT EXISTS public_custom_html BOOLEAN DEFAULT true;

-- Step 2: Update all existing scripts to have the default value
UPDATE scripts 
SET public_custom_html = true 
WHERE public_custom_html IS NULL;

-- Step 3: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_scripts_public_custom_html 
ON scripts(public_custom_html);

-- Step 4: Verify the column was added
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'scripts' 
    AND column_name = 'public_custom_html'
  ) THEN
    RAISE NOTICE '✅ Column public_custom_html successfully added to scripts table';
  ELSE
    RAISE NOTICE '❌ Failed to add column public_custom_html';
  END IF;
END $$;
