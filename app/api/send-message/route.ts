import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, message } = await request.json()

    if (!apiKey || !message) {
      return NextResponse.json({ error: "API key and message are required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available", setup_required: true }, { status: 500 })
    }

    // Verify API key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Insert message
    const { data, error } = await supabaseAdmin
      .from("global_messages")
      .insert({
        api_key: apiKey,
        message: message,
        sent_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error inserting message:", error)
      if (error.code === "42P01") {
        return NextResponse.json({ error: "Database tables not found", setup_required: true }, { status: 500 })
      }
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
      data: data,
    })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
