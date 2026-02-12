import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function DELETE(request: NextRequest) {
  try {
    const { apiKey, messageId } = await request.json()

    if (!apiKey || !messageId) {
      return NextResponse.json({ error: "API key and message ID are required" }, { status: 400 })
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
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 })
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

    const { data: messageData, error: fetchError } = await supabaseAdmin
      .from("global_messages")
      .select("*")
      .eq("id", messageId)
      .in("api_key", apiKeysList)
      .single()

    if (fetchError || !messageData) {
      return NextResponse.json({ error: "Message not found or access denied" }, { status: 404 })
    }

    const { error } = await supabaseAdmin
      .from("global_messages")
      .delete()
      .eq("id", messageId)
      .in("api_key", apiKeysList)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to remove message" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Message removed successfully",
      removedMessage: {
        id: messageData.id,
        message: messageData.message,
        sent_at: messageData.sent_at,
      },
    })
  } catch (error) {
    console.error("Remove message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
