import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const { apiKey, messageIds, olderThan, messageType } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Verify API key exists and is active
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("id, permissions")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 })
    }

    // Check permissions
    if (!keyData.permissions?.messages) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    let query = supabaseAdmin
      .from("global_messages")
      .delete()
      .eq("api_key", apiKey)

    // Apply filters
    if (messageIds && Array.isArray(messageIds)) {
      query = query.in("id", messageIds)
    } else if (olderThan) {
      query = query.lt("sent_at", olderThan)
    } else if (messageType) {
      query = query.eq("message_type", messageType)
    }

    const { data, error, count } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to clear messages" }, { status: 500 })
    }

    // Log the action
    await supabaseAdmin.from("api_usage_history").insert([
      {
        api_key: apiKey,
        action_type: "clear_messages",
        content: `Cleared ${count || 0} messages`,
        target_info: { messageIds, olderThan, messageType },
        created_at: new Date().toISOString(),
      },
    ])

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${count || 0} messages`,
      deletedCount: count || 0,
    })
  } catch (error) {
    console.error("Clear messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
