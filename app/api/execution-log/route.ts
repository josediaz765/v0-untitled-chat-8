import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { apiKey, scriptContent, executedByPlayer, playerUserId, executionStatus, executionTime } =
      await request.json()

    if (!apiKey || !scriptContent || !executedByPlayer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify API key exists and is active
    const { data: keyData, error: keyError } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 })
    }

    // Store the execution log with more details
    const scriptHash = crypto.createHash("md5").update(scriptContent).digest("hex")
    const { error } = await supabase.from("script_execution_logs").insert([
      {
        user_id: keyData.user_id,
        api_key: apiKey,
        script_content: scriptContent,
        executed_by_player: executedByPlayer,
        player_user_id: playerUserId,
        execution_status: executionStatus || "executed",
        execution_time: executionTime || Date.now() / 1000,
        script_hash: scriptHash,
        created_at: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("Failed to store execution log:", error)
      return NextResponse.json({ error: "Failed to store execution log" }, { status: 500 })
    }

    // Update usage history
    await supabase.from("api_usage_history").insert([
      {
        user_id: keyData.user_id,
        api_key: apiKey,
        action_type: "script",
        content: scriptContent,
        executed_by_player: executedByPlayer,
        player_user_id: playerUserId,
        created_at: new Date().toISOString(),
      },
    ])

    return NextResponse.json({
      success: true,
      message: "Execution logged successfully",
    })
  } catch (error) {
    console.error("Error logging execution:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // For universal API keys, we don't need to verify user ownership
    // Just check if the API key exists in the database
    const { data: keyCheck, error: keyError } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError && keyError.code !== "PGRST116") {
      console.error("Error checking API key:", keyError)
      return NextResponse.json({
        success: true,
        logs: [],
        stats: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
          todayExecutions: 0,
        },
      })
    }

    // Get execution logs for the API key (not just user-specific)
    const { data: logs, error } = await supabase
      .from("script_execution_logs")
      .select("*")
      .eq("api_key", apiKey)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching execution logs:", error)
      return NextResponse.json({
        success: true,
        logs: [],
        stats: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
          todayExecutions: 0,
        },
      })
    }

    // Calculate execution statistics
    const allLogs = logs || []
    const executionStats = {
      total: allLogs.length,
      successful: allLogs.filter((s) => s.execution_status === "executed").length,
      failed: allLogs.filter((s) => s.execution_status !== "executed").length,
      successRate:
        allLogs.length > 0
          ? Math.round((allLogs.filter((s) => s.execution_status === "executed").length / allLogs.length) * 100)
          : 0,
      todayExecutions: allLogs.filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
        .length,
    }

    return NextResponse.json({
      success: true,
      logs: allLogs,
      stats: executionStats,
    })
  } catch (error) {
    console.error("Error fetching execution logs:", error)
    return NextResponse.json({
      success: true,
      logs: [],
      stats: {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        todayExecutions: 0,
      },
    })
  }
}
