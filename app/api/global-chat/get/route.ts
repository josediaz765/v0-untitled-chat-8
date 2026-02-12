import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")
    const lastId = searchParams.get("lastId") || "0"

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
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

    // Get messages newer than lastId
    const { data: messages, error } = await supabaseAdmin
      .from("global_chat_messages")
      .select("*")
      .gt("id", Number.parseInt(lastId))
      .order("sent_at", { ascending: true })
      .limit(50)

    if (error) {
      console.error("Error fetching chat messages:", error)
      if (error.code === "42P01") {
        return NextResponse.json({ error: "Database tables not found", setup_required: true }, { status: 500 })
      }
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    })
  } catch (error) {
    console.error("Error fetching chat messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
