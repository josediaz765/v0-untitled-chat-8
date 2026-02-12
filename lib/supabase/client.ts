import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createBrowserClient() {
  if (typeof window === "undefined") {
    throw new Error("createBrowserClient can only be used in browser context")
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing Supabase environment variables")
  }

  if (client) return client

  client = createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    },
  )

  return client
}

// Keep createClient as alias for backward compatibility
export const createClient = createBrowserClient

// This is safe because it will only be evaluated on the client side when imported
export const supabase = typeof window !== "undefined" ? createBrowserClient() : null
