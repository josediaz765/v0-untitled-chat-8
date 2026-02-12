"use client"

import type React from "react"
import { useEffect, useState } from "react"

interface EnvironmentCheckProps {
  children: React.ReactNode
}

export function EnvironmentCheck({ children }: EnvironmentCheckProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Quick check for env vars - if missing, the auth provider will handle it
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Always set ready after a brief moment to avoid flash
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 100)

    // If env vars exist, set ready immediately
    if (supabaseUrl && supabaseAnonKey) {
      setIsReady(true)
      clearTimeout(timer)
    }

    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return null // Brief flash prevention
  }

  return <>{children}</>
}
