import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        history: [],
        setup_required: true,
        error: "Server configuration error: Supabase admin client not available",
      })
    }

    // Get user from session
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Validate token format
    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed: " + authError.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Check if api_usage_history table exists first
    const { error: tableError } = await supabaseAdmin
      .from("api_usage_history")
      .select("count", { count: "exact", head: true })

    if (tableError) {
      console.error("Table check error:", tableError)
      return NextResponse.json({
        success: true,
        history: [],
        setup_required: true,
      })
    }

    // Get usage history for the user
    const { data: history, error } = await supabaseAdmin
      .from("api_usage_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching usage history:", error)
      return NextResponse.json({
        success: true,
        history: [],
        error: "Failed to fetch usage history: " + error.message,
      })
    }

    return NextResponse.json({
      success: true,
      history: history || [],
    })
  } catch (error) {
    console.error("Error fetching usage history:", error)
    return NextResponse.json({
      success: true,
      history: [],
      error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error"),
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: "Server configuration error: Supabase admin client not available",
        setup_required: true,
      })
    }

    // Get user from session
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Validate token format
    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 })
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Authentication failed: " + authError.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const { apiKey, actionType, content, executedByPlayer, playerUserId } = await request.json()

    // Check if api_usage_history table exists first
    const { error: tableError } = await supabaseAdmin
      .from("api_usage_history")
      .select("count", { count: "exact", head: true })

    if (tableError) {
      console.error("Table check error:", tableError)
      return NextResponse.json({
        success: false,
        error: "Database tables not found. Please run setup first.",
        setup_required: true,
      })
    }

    // Add to usage history
    const { error } = await supabaseAdmin.from("api_usage_history").insert([
      {
        user_id: user.id,
        api_key: apiKey,
        action_type: actionType,
        content: content,
        executed_by_player: executedByPlayer,
        player_user_id: playerUserId,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("Error adding to usage history:", error)
      return NextResponse.json({ error: "Failed to add to usage history: " + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Added to usage history",
    })
  } catch (error) {
    console.error("Error adding to usage history:", error)
    return NextResponse.json(
      {
        error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}
