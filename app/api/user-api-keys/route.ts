import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
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

    // Check if Supabase admin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Check if tables exist
    const { data: tableCheck, error: tableError } = await supabaseAdmin.from("api_keys").select("id").limit(1)

    if (tableError && tableError.code === "42P01") {
      return NextResponse.json({ setup_required: true }, { status: 400 })
    }

    // Get user's API keys
    const { data: apiKeys, error } = await supabaseAdmin
      .from("api_keys")
      .select("id, api_key, is_active, is_private, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys || [],
    })
  } catch (error) {
    console.error("Fetch API Keys Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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
    const { apiKeyId } = await request.json()

    if (!apiKeyId) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 })
    }

    // Check if Supabase admin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Delete the API key (only if it belongs to the user)
    const { error } = await supabaseAdmin.from("api_keys").delete().eq("id", apiKeyId).eq("user_id", userId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "API key deleted successfully",
    })
  } catch (error) {
    console.error("Delete API Key Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
