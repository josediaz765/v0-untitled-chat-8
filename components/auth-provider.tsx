"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface AuthUser {
  id: string
  email: string
  username?: string
  display_name?: string
  avatar_url?: string
  isOwner?: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>
  reloadUserProfile: () => Promise<void>
}

const OWNER_EMAIL = "nuviadiaz1008@gmail.com"

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  updateProfile: async () => {},
  reloadUserProfile: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", userId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return null
        }
        console.error("Error fetching user profile:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      return null
    }
  }

  const reloadUserProfile = async () => {
    if (!user?.id) return
    const profile = await fetchUserProfile(user.id)
    if (profile) {
      setUser((prev) => (prev ? { ...prev, ...profile } : null))
    }
  }

  const setupSessionRefresh = () => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }

    // Refresh session every 45 minutes (tokens typically expire after 1 hour)
    refreshTimerRef.current = setInterval(
      async () => {
        console.log("[v0] Auto-refreshing session...")
        try {
          const { data, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error("[v0] Session refresh error:", error)
            // If refresh fails, try to get current session
            const { data: sessionData } = await supabase.auth.getSession()
            if (!sessionData.session) {
              console.log("[v0] Session expired, signing out...")
              setUser(null)
              router.push("/auth/login")
            }
          } else {
            console.log("[v0] Session refreshed successfully")
          }
        } catch (error) {
          console.error("[v0] Failed to refresh session:", error)
        }
      },
      45 * 60 * 1000,
    ) // 45 minutes
  }

  useEffect(() => {
    let mounted = true

    const getInitialSession = async () => {
      try {
        let retries = 3
        let session = null
        let error = null

        while (retries > 0 && !session) {
          const result = await supabase.auth.getSession()
          session = result.data.session
          error = result.error

          if (error) {
            console.error("Auth session error:", error)
            retries--
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 500))
            }
          } else {
            break
          }
        }

        if (mounted) {
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id)
            const isOwner = session.user.email === OWNER_EMAIL
            setUser({
              id: session.user.id,
              email: session.user.email!,
              username: profile?.username || session.user.user_metadata?.username || session.user.email?.split("@")[0],
              display_name: profile?.display_name || profile?.username || session.user.email?.split("@")[0],
              avatar_url: profile?.avatar_url,
              isOwner,
            })
            setupSessionRefresh()
          } else {
            setUser(null)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error("Failed to get session:", error)
        if (mounted) {
          setUser(null)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event)

      if (mounted) {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          const isOwner = session.user.email === OWNER_EMAIL
          setUser({
            id: session.user.id,
            email: session.user.email!,
            username: profile?.username || session.user.user_metadata?.username || session.user.email?.split("@")[0],
            display_name: profile?.display_name || profile?.username || session.user.email?.split("@")[0],
            avatar_url: profile?.avatar_url,
            isOwner,
          })
          setupSessionRefresh()
        } else {
          setUser(null)
          if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current)
            refreshTimerRef.current = null
          }
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [supabase, router])

  const signOut = async () => {
    try {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      await supabase.auth.signOut()
      setUser(null)
      router.push("/auth/login")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const updateProfile = async (updates: { display_name?: string; avatar_url?: string }) => {
    if (!user) return

    try {
      setUser((prev) => {
        if (!prev) return null
        return { ...prev, ...updates }
      })

      const { error } = await supabase.from("user_profiles").update(updates).eq("user_id", user.id)

      if (error) {
        console.error("Profile update error:", error)
        await reloadUserProfile()
        throw error
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateProfile, reloadUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}
