import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // SQL to add the column
    const sql = `
      -- Add public_custom_html column to scripts table
      ALTER TABLE scripts 
      ADD COLUMN IF NOT EXISTS public_custom_html BOOLEAN DEFAULT true;
      
      -- Update existing scripts
      UPDATE scripts 
      SET public_custom_html = true 
      WHERE public_custom_html IS NULL;
      
      -- Create index
      CREATE INDEX IF NOT EXISTS idx_scripts_public_custom_html 
      ON scripts(public_custom_html);
    `

    const { data, error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("[v0] SQL execution error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          hint: "You may need to run the SQL script directly in Supabase SQL Editor",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Column added successfully",
    })
  } catch (error: any) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
