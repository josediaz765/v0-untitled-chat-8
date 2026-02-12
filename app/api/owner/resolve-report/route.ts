import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const OWNER_EMAIL = "nuviadiaz1008@gmail.com"

export async function POST(request: Request) {
  try {
    const { reportId, status, userEmail } = await request.json()

    // Verify owner
    if (userEmail !== OWNER_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!reportId || !status) {
      return NextResponse.json({ error: "Report ID and status required" }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { error } = await supabase.from("script_reports").update({ status }).eq("id", reportId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Owner resolve report error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
