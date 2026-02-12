import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const OWNER_EMAIL = "nuviadiaz1008@gmail.com"

export async function POST(request: Request) {
  try {
    const { scriptId, userEmail } = await request.json()

    // Verify owner
    if (userEmail !== OWNER_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!scriptId) {
      return NextResponse.json({ error: "Script ID required" }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Delete related records first
    await supabase.from("script_reports").delete().eq("script_id", scriptId)
    await supabase.from("script_likes").delete().eq("script_id", scriptId)
    await supabase.from("script_views").delete().eq("script_id", scriptId)

    // Delete the script
    const { error } = await supabase.from("scripts").delete().eq("id", scriptId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Owner delete script error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
