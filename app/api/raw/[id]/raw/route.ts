import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const scriptId = resolvedParams.id

    if (!scriptId) {
      return NextResponse.json({ error: "Script ID required" }, { status: 400 })
    }

    let query = supabase.from("scripts").select("*")

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(scriptId)) {
      query = query.eq("id", scriptId)
    } else {
      query = query.eq("title", decodeURIComponent(scriptId))
    }

    const { data: script, error } = await query.single()

    if (error || !script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 })
    }

    if (script.is_private) {
      return new NextResponse("-- This script is private and cannot be accessed directly", {
        status: 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      })
    }

    // Return raw Lua script content without HTML wrapper
    return new NextResponse(script.content, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[v0] Raw script fetch error:", error)
    return new NextResponse("-- Error loading script", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}
