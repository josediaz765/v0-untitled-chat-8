import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const OWNER_EMAIL = "nuviadiaz1008@gmail.com"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("email")

    // Verify owner
    if (userEmail !== OWNER_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const [scriptsRes, usersRes, reportsRes, apiKeysRes] = await Promise.all([
      supabase.from("scripts").select("*").order("created_at", { ascending: false }),
      supabase.from("user_profiles").select("*").order("created_at", { ascending: false }),
      // Fetch reports without foreign key join
      supabase
        .from("script_reports")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("api_keys").select("*").order("created_at", { ascending: false }),
    ])

    // Manually enrich reports with script and reporter data
    const enrichedReports = []
    if (reportsRes.data) {
      for (const report of reportsRes.data) {
        // Get script info
        let scriptInfo = null
        if (report.script_id) {
          const { data: script } = await supabase
            .from("scripts")
            .select("id, title, author_id")
            .eq("id", report.script_id)
            .single()
          scriptInfo = script
        }

        // Get reporter info
        let reporterInfo = null
        if (report.reporter_id) {
          const { data: reporter } = await supabase
            .from("user_profiles")
            .select("username, display_name, avatar_url")
            .eq("user_id", report.reporter_id)
            .single()
          reporterInfo = reporter
        }

        enrichedReports.push({
          ...report,
          script: scriptInfo,
          reporter: reporterInfo,
        })
      }
    }

    // Enrich scripts with author info
    const enrichedScripts = []
    if (scriptsRes.data) {
      for (const script of scriptsRes.data) {
        let authorInfo = null
        if (script.author_id) {
          const { data: author } = await supabase
            .from("user_profiles")
            .select("username, display_name, avatar_url")
            .eq("user_id", script.author_id)
            .single()
          authorInfo = author
        }
        enrichedScripts.push({
          ...script,
          author_profile: authorInfo,
        })
      }
    }

    // Enrich API keys with user info
    const enrichedApiKeys = []
    if (apiKeysRes.data) {
      for (const key of apiKeysRes.data) {
        let userInfo = null
        if (key.user_id) {
          const { data: user } = await supabase
            .from("user_profiles")
            .select("username, display_name, avatar_url")
            .eq("user_id", key.user_id)
            .single()
          userInfo = user
        }
        enrichedApiKeys.push({
          ...key,
          user_profile: userInfo,
        })
      }
    }

    // Calculate stats
    const pendingReports = enrichedReports.filter((r) => r.status === "pending").length
    const activeApiKeys = enrichedApiKeys.filter((k) => k.is_active).length

    return NextResponse.json({
      scripts: enrichedScripts,
      users: usersRes.data || [],
      reports: enrichedReports,
      apiKeys: enrichedApiKeys,
      stats: {
        totalScripts: enrichedScripts.length,
        totalUsers: usersRes.data?.length || 0,
        totalReports: enrichedReports.length,
        totalApiKeys: enrichedApiKeys.length,
        pendingReports,
        activeApiKeys,
      },
    })
  } catch (error: any) {
    console.error("Owner data error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
