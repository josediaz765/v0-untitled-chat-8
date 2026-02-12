import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, script } = await request.json()

    if (!apiKey || !script) {
      return NextResponse.json({ error: "API key and script are required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
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

    // Send script as a message with EXECUTE_SCRIPT prefix
    const { data, error } = await supabaseAdmin
      .from("global_messages")
      .insert({
        api_key: apiKey,
        message: `EXECUTE_SCRIPT:${script}`,
        sent_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error inserting script message:", error)
      return NextResponse.json({ error: "Failed to execute script" }, { status: 500 })
    }

    // Log script execution
    const { error: logError } = await supabaseAdmin.from("script_execution_logs").insert({
      user_id: keyData.user_id,
      api_key: apiKey,
      script_content: script,
      executed_by_player: "API",
      execution_status: "sent",
      created_at: new Date().toISOString(),
    })

    if (logError) {
      console.error("Error logging script execution:", logError)
    }

    return NextResponse.json({
      success: true,
      message: "Script sent for execution",
      data: data,
    })
  } catch (error) {
    console.error("Error executing script:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
