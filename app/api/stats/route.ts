import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    // Check if Supabase admin is available
    if (!supabaseAdmin) {
      return NextResponse.json({
        success: true,
        stats: {
          totalMessages: 0,
          totalExecutions: 0,
          totalPlayers: 0,
          executionStats: {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 0,
            todayExecutions: 0,
          },
        },
        error: "Database connection not available",
      })
    }

    // Verify API key and get user_id
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({
        success: true,
        stats: {
          totalMessages: 0,
          totalExecutions: 0,
          totalPlayers: 0,
          executionStats: {
            total: 0,
            successful: 0,
            failed: 0,
            successRate: 0,
            todayExecutions: 0,
          },
        },
        error: "Invalid API key",
      })
    }

    // Get total messages count for this API key
    const { count: totalMessages } = await supabaseAdmin
      .from("global_messages")
      .select("*", { count: "exact", head: true })
      .eq("api_key", apiKey)

    // Get total script executions count for this user
    const { count: totalExecutions } = await supabaseAdmin
      .from("script_execution_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", keyData.user_id)

    // Get unique players count for this user
    const { count: totalPlayers } = await supabaseAdmin
      .from("active_players")
      .select("player_user_id", { count: "exact", head: true })
      .eq("user_id", keyData.user_id)

    // Get execution success rate
    const { data: executionLogs } = await supabaseAdmin
      .from("script_execution_logs")
      .select("execution_status, created_at")
      .eq("user_id", keyData.user_id)

    const executionStats = {
      total: executionLogs?.length || 0,
      successful: executionLogs?.filter((log) => log.execution_status === "executed").length || 0,
      failed: executionLogs?.filter((log) => log.execution_status === "failed").length || 0,
      successRate:
        executionLogs?.length > 0
          ? Math.round(
              (executionLogs.filter((log) => log.execution_status === "executed").length / executionLogs.length) * 100,
            )
          : 0,
      todayExecutions:
        executionLogs?.filter((log) => new Date(log.created_at).toDateString() === new Date().toDateString()).length ||
        0,
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalMessages: totalMessages || 0,
        totalExecutions: totalExecutions || 0,
        totalPlayers: totalPlayers || 0,
        executionStats: executionStats,
      },
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({
      success: true,
      stats: {
        totalMessages: 0,
        totalExecutions: 0,
        totalPlayers: 0,
        executionStats: {
          total: 0,
          successful: 0,
          failed: 0,
          successRate: 0,
          todayExecutions: 0,
        },
      },
      error: "Failed to fetch stats",
    })
  }
}
