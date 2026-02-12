import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, message, username, displayName, userId, thumbnailUrl, playerUserId } = await request.json()

    if (!apiKey || !message || !username) {
      return NextResponse.json({ error: "API key, message, and username are required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available", setup_required: true }, { status: 500 })
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

    const messageUserId = playerUserId || 1 // Default to 1 for web users

    const { data, error } = await supabaseAdmin
      .from("global_chat_messages")
      .insert({
        api_key: apiKey,
        message: message,
        username: username,
        display_name: displayName,
        user_id: messageUserId, // This is bigint for Roblox user IDs
        thumbnail_url: thumbnailUrl,
        sent_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error inserting chat message:", error)
      if (error.code === "42P01") {
        return NextResponse.json({ error: "Database tables not found", setup_required: true }, { status: 500 })
      }
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Chat message sent successfully",
      data: data,
    })
  } catch (error) {
    console.error("Error sending chat message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
