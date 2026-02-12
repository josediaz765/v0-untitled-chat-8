# Public Custom HTML Toggle - Setup Instructions

## Quick Setup (3 Steps)

### Step 1: Add Database Column

You need to add the `public_custom_html` column to your Supabase `scripts` table.

**Option A: Run the SQL Script in Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `scripts/run-this-first-add-custom-html-column.sql`
5. Click **Run** to execute the script
6. You should see a success message: "✅ Column public_custom_html successfully added"

**Option B: Use the Scripts Runner (if available)**

1. Look for the "Run SQL Scripts" button in your app
2. Select the migration script
3. Click "Execute"

### Step 2: Verify the Column Exists

Run this query in Supabase SQL Editor to verify:

\`\`\`sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'scripts' 
AND column_name = 'public_custom_html';
\`\`\`

You should see:
- column_name: `public_custom_html`
- data_type: `boolean`
- column_default: `true`

### Step 3: Test the Feature

1. Create a new script or edit an existing one
2. You should now see the **"Custom HTML"** toggle next to Private and Disabled
3. Toggle it OFF to show raw Lua code on the `/raw/[id]` page
4. Toggle it ON to show the fancy HTML viewer

## How It Works

### Display Modes

**When Custom HTML is ON (default):**
- `/raw/[id]` → Shows beautiful HTML viewer with syntax highlighting
- `/raw/[id]/raw` → Always returns raw Lua code (for Roblox execution)

**When Custom HTML is OFF:**
- `/raw/[id]` → Shows raw Lua code (same as `/raw/[id]/raw`)
- `/raw/[id]/raw` → Always returns raw Lua code (for Roblox execution)

### Private Mode Behavior

When a script is set to **Private**:
- The source code is hidden from the HTML viewer
- Shows a security page instead
- Execution via loadstring still works via `/raw/[id]/raw`
- Custom HTML toggle has no effect (private page always shows)

## Troubleshooting

### "Cannot save scripts" error

**Cause:** The `public_custom_html` column doesn't exist in your database yet.

**Solution:** Run the SQL migration script (Step 1 above)

### Toggle not appearing

**Cause:** You may be viewing someone else's script.

**Solution:** You can only see and use the toggle on scripts you own.

### Changes not reflecting

**Cause:** Browser cache or stale data.

**Solution:** 
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Re-save the script

## Need Help?

If you're still having issues:
1. Check the browser console for errors (F12 → Console tab)
2. Verify the Supabase connection is working
3. Make sure you're logged in as the script owner
4. Try creating a brand new script to test
