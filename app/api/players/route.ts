import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// In-memory store for player activity with 30-second timeout
const playerStore = new Map<
  string,
  {
    username: string
    displayName: string
    userId: string
    jobId: string
    placeId: string
    lastActive: string
    totalExecutions: number
  }
>()

let totalExecutionsCount = 0

// Cleanup interval to remove inactive players (every 10 seconds)
setInterval(() => {
  const now = Date.now()
  const thirtySeconds = 30 * 1000

  for (const [key, player] of playerStore.entries()) {
    const lastActiveTime = new Date(player.lastActive).getTime()
    if (now - lastActiveTime > thirtySeconds) {
      console.log(`[v0] Removing inactive player: ${player.displayName}`)
      playerStore.delete(key)
    }
  }
}, 10 * 1000) // Check every 10 seconds

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("apiKey")
    const summary = searchParams.get("summary") === "true"

    if (!apiKey) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: "Database connection not available",
      })
    }

    // Verify API key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({
        success: false,
        error: "Invalid API key",
      })
    }

    const activePlayers = Array.from(playerStore.values())

    if (summary) {
      const uniqueServers = new Set(activePlayers.map((p) => p.jobId))
      const latestPlayer = activePlayers.length > 0 ? activePlayers[0] : null
      const summaryText =
        activePlayers.length > 0
          ? `${activePlayers.length} players active across ${uniqueServers.size} servers. Latest: ${latestPlayer?.displayName} in place ${latestPlayer?.placeId}.`
          : "No players currently active."

      return NextResponse.json({
        success: true,
        summary: summaryText,
      })
    }

    return NextResponse.json({
      success: true,
      activeCount: activePlayers.length,
      activePlayers: activePlayers.map((player) => ({
        username: player.username,
        displayName: player.displayName,
        userId: player.userId,
        placeId: player.placeId,
        jobId: player.jobId,
        lastActive: player.lastActive,
      })),
      totalExecutions: totalExecutionsCount,
      count: activePlayers.length,
      players: activePlayers.map((player) => ({
        username: player.username,
        display_name: player.displayName,
        player_user_id: player.userId,
        place_id: player.placeId,
        job_id: player.jobId,
        last_active: player.lastActive,
      })),
    })
  } catch (error) {
    console.error("Error in players GET:", error)
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, username, displayName, userId, jobId, placeId, totalExecutions, isActive } = body

    if (!apiKey || !username) {
      return NextResponse.json({ error: "API key and username are required" }, { status: 400 })
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

    const playerKey = `${keyData.user_id}:${username}`
    const currentTime = new Date().toISOString()

    const isNewPlayer = !playerStore.has(playerKey)
    const existingPlayer = playerStore.get(playerKey)

    playerStore.set(playerKey, {
      username,
      displayName: displayName || username,
      userId: String(userId),
      jobId: String(jobId),
      placeId: String(placeId),
      lastActive: currentTime,
      totalExecutions: totalExecutions || 0,
    })

    if (isNewPlayer && totalExecutions && totalExecutions > 0) {
      totalExecutionsCount += totalExecutions
    } else if (!isNewPlayer && existingPlayer && totalExecutions && totalExecutions > existingPlayer.totalExecutions) {
      // Only add the difference if this is an existing player with new executions
      totalExecutionsCount += totalExecutions - existingPlayer.totalExecutions
    }

    // Also persist to database for historical records
    const { error: upsertError } = await supabaseAdmin.from("active_players").upsert(
      {
        user_id: keyData.user_id,
        api_key: apiKey,
        username: username,
        display_name: displayName || username,
        player_user_id: String(userId),
        total_executions: totalExecutions || 0,
        last_execution: isActive ? currentTime : null,
        last_seen: currentTime,
        job_id: jobId || null,
        place_id: placeId ? Number.parseInt(String(placeId)) : null,
      },
      {
        onConflict: "user_id,username",
      },
    )

    if (upsertError) {
      console.error("Error updating player:", upsertError)
    }

    return NextResponse.json({
      success: true,
      totalExecutions: totalExecutions || 0,
      message: isActive ? "Player heartbeat recorded" : "Player status updated",
    })
  } catch (error) {
    console.error("Error in players POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE endpoint to explicitly remove players when they leave
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, username } = body

    if (!apiKey || !username) {
      return NextResponse.json({ error: "API key and username are required" }, { status: 400 })
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

    const playerKey = `${keyData.user_id}:${username}`

    if (playerStore.has(playerKey)) {
      const player = playerStore.get(playerKey)
      console.log(`[v0] Player left game: ${player?.displayName}`)
      playerStore.delete(playerKey)

      // Update database to mark as left
      await supabaseAdmin
        .from("active_players")
        .update({ last_seen: new Date().toISOString() })
        .eq("username", username)
        .eq("user_id", keyData.user_id)
    }

    return NextResponse.json({
      success: true,
      message: "Player removed from active list",
    })
  } catch (error) {
    console.error("Error removing player:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
