import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, isUniversalAccess = false } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Check if Supabase admin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Check if the API key exists and get its privacy status
    const { data, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, is_private, user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 404 })
    }

    // If this is a universal access attempt and the key is private, deny access
    if (isUniversalAccess && data.is_private) {
      return NextResponse.json(
        {
          error: "This API key is protected",
          isProtected: true,
        },
        { status: 403 },
      )
    }

    return NextResponse.json({
      success: true,
      isPrivate: data.is_private,
      userId: data.user_id,
    })
  } catch (error) {
    console.error("Error checking API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
