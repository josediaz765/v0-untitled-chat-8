import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Script {
  id: string
  title: string
  content: string
  author_id: string
  is_private: boolean
  is_disabled: boolean
  updated_at: string
  created_at: string
}

async function getScript(id: string): Promise<Script | null> {
  try {
    let query = supabase.from("scripts").select("*")

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      query = query.eq("id", id)
    } else {
      query = query.eq("title", decodeURIComponent(id))
    }

    const { data, error } = await query.single()

    if (error || !data) {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const script = await getScript(params.id)

    if (!script) {
      return new NextResponse("-- Script not found", { status: 404 })
    }

    // Return clean Lua content without HTML wrapper for all cases
    if (script.is_disabled) {
      return new NextResponse('game.Players.LocalPlayer:Kick("This script has been disabled by the author.")', {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })
    }

    // Private scripts return their content without comments
    return new NextResponse(script.content || "-- Empty script", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error) {
    console.error("[v0] Error in raw GET:", error)
    return new NextResponse("-- Internal server error", { status: 500 })
  }
}
