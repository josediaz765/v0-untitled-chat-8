import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")
    const lastId = searchParams.get("lastId") || "0"
    const since = searchParams.get("since")

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    const { data: userApiKeys, error: userKeysError } = await supabaseAdmin
      .from("api_keys")
      .select("api_key")
      .eq("user_id", keyData.user_id)
      .eq("is_active", true)

    if (userKeysError || !userApiKeys) {
      return NextResponse.json({ error: "Failed to fetch user API keys" }, { status: 500 })
    }

    const apiKeysList = userApiKeys.map((key) => key.api_key)

    let timeFilter: string
    if (since) {
      // New messages only mode - use provided timestamp
      timeFilter = since
    } else {
      // Default mode - get messages from last 30 seconds for instant refresh
      timeFilter = new Date(Date.now() - 30 * 1000).toISOString()
    }

    let query = supabaseAdmin
      .from("global_messages")
      .select("id, message, sent_at, api_key")
      .in("api_key", apiKeysList)
      .gt("id", Number.parseInt(lastId))
      .gte("sent_at", timeFilter)
      .order("id", { ascending: true })

    const limit = since ? 10 : 50 // Smaller limit for new messages only, larger for instant refresh
    query = query.limit(limit)

    const { data: messages, error } = await query

    if (error) {
      console.error("Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
      timestamp: new Date().toISOString(),
      filterMode: since ? "new_only" : "instant",
      messageCount: messages?.length || 0,
    })
  } catch (error) {
    console.error("Error in get-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
