import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, username } = await request.json()

    if (!userId || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Check if profile already exists
    const { data: existing } = await supabase.from("user_profiles").select("id").eq("user_id", userId).single()

    if (existing) {
      return NextResponse.json({ success: true, message: "Profile already exists" })
    }

    // Create new profile
    const { error } = await supabase.from("user_profiles").insert({
      user_id: userId,
      username: username,
      display_name: username,
    })

    if (error) {
      console.error("Profile creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Create profile error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
