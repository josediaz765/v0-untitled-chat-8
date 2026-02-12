import { put, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Avatar upload started")

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] User check:", { userId: user?.id, error: authError })

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get("file") as File
    const oldAvatarUrl = formData.get("oldAvatarUrl") as string | null

    console.log("[v0] File details:", {
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    })

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 })
    }

    // Delete old avatar from Blob if exists
    if (oldAvatarUrl && oldAvatarUrl.includes("blob.vercel-storage.com")) {
      try {
        await del(oldAvatarUrl)
        console.log("[v0] Deleted old avatar")
      } catch (e) {
        console.warn("[v0] Could not delete old avatar:", e)
      }
    }

    // Upload new avatar to Vercel Blob
    const fileExt = file.name.split(".").pop()
    const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`

    console.log("[v0] Uploading to Blob storage:", fileName)

    const blob = await put(fileName, file, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log("[v0] Blob upload successful:", blob.url)

    // Update user profile in database using service role for admin access
    const adminSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const { error: updateError } = await adminSupabase
      .from("user_profiles")
      .update({ avatar_url: blob.url })
      .eq("user_id", user.id)

    console.log("[v0] Database update:", { error: updateError })

    if (updateError) {
      console.error("[v0] Database update error:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    console.log("[v0] Avatar upload complete!")
    return NextResponse.json({ avatar_url: blob.url })
  } catch (error) {
    console.error("[v0] Avatar upload error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
