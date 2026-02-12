"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
  requiredPermissions?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, requiredRole, requiredPermissions = [], fallback }: ProtectedRouteProps) {
  const { user, loading, signOut } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authChecking) {
        console.log("[v0] Auth check timeout - forcing completion")
        setAuthChecking(false)
      }
    }, 5000)

    const checkAuthorization = async () => {
      if (loading) {
        // Give it 3 seconds max to load
        setTimeout(() => {
          if (loading) {
            setAuthChecking(false)
          }
        }, 3000)
        return
      }

      if (!user) {
        setIsAuthorized(false)
        setAuthChecking(false)
        return
      }

      // Check role if required
      if (requiredRole && user.user_metadata?.role !== requiredRole) {
        setIsAuthorized(false)
        setAuthChecking(false)
        return
      }

      // Check permissions if required
      if (requiredPermissions.length > 0) {
        const userPermissions = user.user_metadata?.permissions || []
        const hasAllPermissions = requiredPermissions.every((permission) => userPermissions.includes(permission))

        if (!hasAllPermissions) {
          setIsAuthorized(false)
          setAuthChecking(false)
          return
        }
      }

      setIsAuthorized(true)
      setAuthChecking(false)
    }

    checkAuthorization()

    return () => clearTimeout(timeout)
  }, [user, loading, requiredRole, requiredPermissions])

  if (loading || authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authenticating...</h3>
            <p className="text-sm text-gray-600 text-center">Please wait while we verify your credentials</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show unauthorized state
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Authentication Required</CardTitle>
            <CardDescription>You need to be signed in to access this page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => router.push("/auth/login")} className="w-full bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
            <Button onClick={() => router.push("/auth/signup")} variant="outline" className="w-full">
              Create Account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show insufficient permissions state
  if (!isAuthorized) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">Access Denied</CardTitle>
              <CardDescription>You don't have permission to access this resource</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {requiredRole && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800">
                    <strong>Required Role:</strong> {requiredRole}
                  </p>
                  <p className="text-sm text-orange-600">Your Role: {user.user_metadata?.role || "None"}</p>
                </div>
              )}

              {requiredPermissions.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-800 mb-2">
                    <strong>Required Permissions:</strong>
                  </p>
                  <ul className="text-sm text-orange-600 space-y-1">
                    {requiredPermissions.map((permission, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => router.push("/")} variant="outline" className="flex-1">
                  Go Home
                </Button>
                <Button onClick={signOut} variant="destructive" className="flex-1">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  // Show success state briefly before rendering children
  return (
    <div className="relative">
      {/* Optional: Show a brief success indicator */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-green-100 border border-green-200 rounded-lg p-2 flex items-center gap-2 shadow-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800 font-medium">Authenticated</span>
        </div>
      </div>

      {children}
    </div>
  )
}

export default ProtectedRoute

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: string
    requiredPermissions?: string[]
    fallback?: React.ReactNode
  },
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for checking permissions within components
export function usePermissions() {
  const { user } = useAuth()

  const hasRole = (role: string) => {
    return user?.user_metadata?.role === role
  }

  const hasPermission = (permission: string) => {
    const userPermissions = user?.user_metadata?.permissions || []
    return userPermissions.includes(permission)
  }

  const hasAllPermissions = (permissions: string[]) => {
    const userPermissions = user?.user_metadata?.permissions || []
    return permissions.every((permission) => userPermissions.includes(permission))
  }

  const hasAnyPermission = (permissions: string[]) => {
    const userPermissions = user?.user_metadata?.permissions || []
    return permissions.some((permission) => userPermissions.includes(permission))
  }

  return {
    user,
    hasRole,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAdmin: hasRole("admin"),
    isDeveloper: hasRole("developer"),
    isPremium: user?.user_metadata?.subscription_tier !== "free",
  }
}
