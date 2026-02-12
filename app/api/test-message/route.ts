import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Check if Supabase admin is available
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 })
    }

    // Check if tables exist
    const { error: tableError } = await supabaseAdmin.from("api_keys").select("count", { count: "exact", head: true })

    if (tableError) {
      return NextResponse.json(
        {
          error: "Database tables not found. Please run the setup script first.",
          setup_required: true,
        },
        { status: 500 },
      )
    }

    // Verify API key exists and is active
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 })
    }

    // Insert test message
    const testMessage = `🧪 Test message sent at ${new Date().toLocaleTimeString()}`
    const { data, error } = await supabaseAdmin
      .from("global_messages")
      .insert([
        {
          api_key: apiKey,
          message: testMessage,
          sent_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({ error: "Failed to store test message: " + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Test message sent successfully",
      data: data,
    })
  } catch (error) {
    console.error("Error sending test message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
