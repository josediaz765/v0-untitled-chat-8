import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        messages: [],
        setup_required: true,
      })
    }

    if (!apiKey) {
      return NextResponse.json({
        success: true,
        messages: [],
        error: "API key required for private messages",
      })
    }

    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({
        success: true,
        messages: [],
        error: "Invalid API key",
      })
    }

    const { data: userApiKeys, error: userKeysError } = await supabaseAdmin
      .from("api_keys")
      .select("api_key")
      .eq("user_id", keyData.user_id)
      .eq("is_active", true)

    if (userKeysError || !userApiKeys) {
      return NextResponse.json({
        success: true,
        messages: [],
        error: "Failed to fetch user API keys",
      })
    }

    const apiKeysList = userApiKeys.map((key) => key.api_key)

    const { data: messages, error } = await supabaseAdmin
      .from("global_messages")
      .select("id, message, sent_at, api_key")
      .in("api_key", apiKeysList)
      .order("sent_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching messages:", error)
      if (error.code === "42P01") {
        return NextResponse.json({
          success: true,
          messages: [],
          setup_required: true,
        })
      }
      return NextResponse.json({
        success: true,
        messages: [],
        error: "Failed to fetch messages",
      })
    }

    return NextResponse.json({
      success: true,
      messages: messages || [],
    })
  } catch (error) {
    console.error("Error in messages route:", error)
    return NextResponse.json({
      success: true,
      messages: [],
      error: "Internal server error",
    })
  }
}
