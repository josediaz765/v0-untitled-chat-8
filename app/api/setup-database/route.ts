import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check if we have the required environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        success: false,
        error: "SUPABASE_SERVICE_ROLE_KEY environment variable is missing",
        setup_required: true,
      })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({
        success: false,
        error: "NEXT_PUBLIC_SUPABASE_URL environment variable is missing",
        setup_required: true,
      })
    }

    // Dynamically import supabase to avoid initialization errors
    const { supabaseAdmin } = await import("@/lib/supabase")

    if (!supabaseAdmin) {
      return NextResponse.json({
        success: false,
        error: "Supabase admin client could not be initialized",
        setup_required: true,
      })
    }

    // Get user from session
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 })
    }

    // Test if tables exist by trying to query them
    const tablesToCheck = [
      "user_profiles",
      "api_keys",
      "global_messages",
      "script_executions",
      "active_players",
      "api_usage_history",
      "script_execution_logs",
    ]

    const missingTables = []

    for (const table of tablesToCheck) {
      try {
        const { error } = await supabaseAdmin.from(table).select("count", { count: "exact", head: true })
        if (error && error.code === "42P01") {
          missingTables.push(table)
        }
      } catch (e) {
        missingTables.push(table)
      }
    }

    if (missingTables.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing tables: ${missingTables.join(", ")}`,
        setup_required: true,
        missing_tables: missingTables,
        instructions: "Please run the SQL script in your Supabase SQL Editor to create the required tables.",
        sql_script_path: "/scripts/supabase-database-setup.sql",
      })
    }

    // All tables exist, test basic functionality
    try {
      // Test inserting and deleting a test record
      const testApiKey = "test_setup_" + Date.now()

      const { error: insertError } = await supabaseAdmin.from("api_keys").insert({
        api_key: testApiKey,
        user_id: user.id,
        is_active: true,
      })

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: "Database tables exist but insert operation failed: " + insertError.message,
          setup_required: true,
        })
      }

      // Clean up test record
      await supabaseAdmin.from("api_keys").delete().eq("api_key", testApiKey)

      return NextResponse.json({
        success: true,
        message: "Database is properly configured and working!",
        tables_verified: tablesToCheck,
      })
    } catch (testError) {
      return NextResponse.json({
        success: false,
        error: "Database connection test failed: " + testError,
        setup_required: true,
      })
    }
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({
      success: false,
      error: "Setup verification failed: " + error,
      setup_required: true,
    })
  }
}
