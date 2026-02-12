import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { randomBytes } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify the token with Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = userData.user.id

    // Get request body
    const body = await request.json().catch(() => ({}))
    const isPrivate = body.isPrivate || false

    // Check if Supabase admin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Check if tables exist
    const { data: tableCheck, error: tableError } = await supabaseAdmin.from("api_keys").select("id").limit(1)

    if (tableError && tableError.code === "42P01") {
      return NextResponse.json({ setup_required: true }, { status: 400 })
    }

    // Generate a unique API key
    const apiKey = `rblx_${randomBytes(32).toString("hex")}`

    // Insert the new API key
    const { data, error } = await supabaseAdmin.from("api_keys").insert({
      user_id: userId,
      api_key: apiKey,
      is_active: true,
      is_private: isPrivate,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create API key" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      apiKey: apiKey,
      isPrivate: isPrivate,
    })
  } catch (error) {
    console.error("Generate API Key Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
