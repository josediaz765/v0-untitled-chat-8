"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, UserPlus, Loader2, AlertTriangle, Sparkles } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [username, setUsername] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [usernameError, setUsernameError] = useState("")
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])
  const [isValidatingUsername, setIsValidatingUsername] = useState(false)
  const [usernameValidated, setUsernameValidated] = useState(false)
  const router = useRouter()

  const validateUsername = async (name: string): Promise<boolean> => {
    if (!name || name.length < 3) {
      setUsernameError("Username must be at least 3 characters")
      setUsernameSuggestions([])
      setUsernameValidated(false)
      return false
    }

    setIsValidatingUsername(true)
    setUsernameError("")
    setUsernameSuggestions([])

    try {
      console.log("[v0] Validating username:", name)
      const response = await fetch("/api/validate-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name }),
      })

      const data = await response.json()
      console.log("[v0] Username validation result:", data)

      if (!data.isValid) {
        setUsernameError(data.reason || "Username not allowed")
        setUsernameSuggestions(data.suggestions || [])
        setUsernameValidated(false)
        return false
      }

      setUsernameValidated(true)
      return true
    } catch (err) {
      console.error("[v0] Username validation error:", err)
      // On error, allow (fail open)
      setUsernameValidated(true)
      return true
    } finally {
      setIsValidatingUsername(false)
    }
  }

  const selectSuggestion = (suggestion: string) => {
    setUsername(suggestion)
    setUsernameError("")
    setUsernameSuggestions([])
    setUsernameValidated(true) // Suggestions are pre-validated
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    const isUsernameValid = await validateUsername(username)
    if (!isUsernameValid) {
      setError("Please choose a valid username")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            username: username,
          },
        },
      })

      if (error) {
        setError(error.message)
        return
      }

      if (data.user) {
        const profileResponse = await fetch("/api/create-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: data.user.id,
            username: username,
          }),
        })

        const profileData = await profileResponse.json()
        if (profileData.error) {
          console.error("[v0] Profile creation error:", profileData.error)
        }

        if (data.user.email_confirmed_at) {
          setSuccess("Account created successfully! Redirecting...")
          setTimeout(() => {
            router.push("/")
            router.refresh()
          }, 2000)
        } else {
          setSuccess("Account created successfully! Please check your email to verify your account.")
          setTimeout(() => {
            router.push("/auth/login")
          }, 3000)
        }
      }
    } catch (err) {
      console.error("[v0] Signup error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create Account
          </CardTitle>
          <CardDescription>Sign up for your Roblox API Manager account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setUsernameError("")
                    setUsernameSuggestions([])
                    setUsernameValidated(false)
                  }}
                  onBlur={() => username.length >= 3 && validateUsername(username)}
                  placeholder="Choose a username"
                  required
                  className={usernameError ? "border-red-500 pr-10" : usernameValidated ? "border-green-500 pr-10" : ""}
                />
                {isValidatingUsername && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {usernameValidated && !isValidatingUsername && !usernameError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Username error and suggestions */}
              {usernameError && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-red-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{usernameError}</span>
                  </div>

                  {usernameSuggestions.length > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Sparkles className="h-4 w-4" />
                        <span>Try one of these instead:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {usernameSuggestions.map((suggestion, i) => (
                          <Button
                            key={i}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectSuggestion(suggestion)}
                            className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isValidatingUsername}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
