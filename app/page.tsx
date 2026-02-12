"use client"

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { Calendar } from "@/components/ui/calendar"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Copy,
  Key,
  Send,
  Trash2,
  Users,
  BarChart3,
  Download,
  Upload,
  History,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2,
  Server,
  Code,
  Gamepad2,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  FileText,
  Play,
  Zap,
  TrendingUp,
  Trophy,
  Volume2,
  Timer,
  MoreVertical,
  Star,
  Sun,
  Target,
  Clock,
  Shield,
  Sparkles,
  LogOut,
  User,
  Settings,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import RenamerPage from "@/components/renamer-page"
import PlayersAndGames from "@/components/players-and-games" // Added import
import ScriptSharingApp from "@/components/script-sharing-app" // Added import
import { useAuth } from "@/components/auth-provider" // Fixed import path - useAuth is exported from auth-provider, not a separate hook file
import UserAvatar from "@/components/user-avatar" // Added import
import ThemeSelector from "@/components/theme-selector" // Added import
import ProtectedRoute from "@/components/protected-route" // Added import
import { createClient } from "@/lib/supabase/client" // Import createClient properly instead of using supabase directly

function RobloxAPIManagerContent() {
  const { user, signOut, updateProfile, reloadUserProfile } = useAuth()
  const [supabase] = useState(() => createClient())
  const [apiKey, setApiKey] = useState("")
  const [message, setMessage] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [generatedScript, setGeneratedScript] = useState("")
  const [scriptToExecute, setScriptToExecute] = useState("")
  const [players, setPlayers] = useState([])
  const [playerCount, setPlayerCount] = useState(0)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")

  // New state variables for additional features
  const [executionCount, setExecutionCount] = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(2)
  const [instantRefresh, setInstantRefresh] = useState(false)
  const [newMessagesOnly, setNewMessagesOnly] = useState(false)
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null)
  const [messageFilter, setMessageFilter] = useState("all")
  const [apiStats, setApiStats] = useState({
    totalMessages: 0,
    totalExecutions: 0,
    totalPlayers: 0,
    executionStats: {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
      todayExecutions: 0,
    },
  })
  const [userApiKeys, setUserApiKeys] = useState([])
  const [usageHistory, setUsageHistory] = useState([])
  const [customSounds, setCustomSounds] = useState(false)
  const [universalApiKey, setUniversalApiKey] = useState("")
  const [audioOnlyMode, setAudioOnlyMode] = useState(false)
  const [showStatusMessages, setShowStatusMessages] = useState(true)
  const [scriptExecutionCount, setScriptExecutionCount] = useState(0)
  const [senderName, setSenderName] = useState("")
  const [privateMode, setPrivateMode] = useState(false)

  // Scheduled message states
  const [scheduledMessage, setScheduledMessage] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("")
  const [scheduledMessages, setScheduledMessages] = useState([])
  const [enableNotifications, setEnableNotifications] = useState(false)
  const [autoClearMessages, setAutoClearMessages] = useState(false)
  const [messageHistoryLimit, setMessageHistoryLimit] = useState("100")
  const [defaultMessageFormat, setDefaultMessageFormat] = useState("username")

  const scheduledTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map())

  // Add these new state variables after the existing ones
  const [bulkMessages, setBulkMessages] = useState("")
  const [messageDelay, setMessageDelay] = useState(1)
  const [serverInfo, setServerInfo] = useState({ totalServers: 0, totalPlayers: 0 })
  const [apiKeyNotes, setApiKeyNotes] = useState({})
  const [favoriteScripts, setFavoriteScripts] = useState([])
  const [scriptCategories, setScriptCategories] = useState({
    movement: [],
    visual: [],
    utility: [],
    fun: [],
  })
  const [messageTemplates, setMessageTemplates] = useState([
    { name: "Welcome", content: "Welcome to the server! Have fun!" },
    { name: "Rules", content: "Please follow server rules and be respectful." },
    { name: "Event", content: "Special event starting now! Join us!" },
  ])
  const [playerFilters, setPlayerFilters] = useState({
    showOnlineOnly: true,
    sortBy: "lastSeen",
    minExecutions: 0,
  })
  const [exportData, setExportData] = useState(null)
  const [importData, setImportData] = useState("")

  const [totalExecutions, setTotalExecutions] = useState<number>(0)
  const [totalScriptExecutions, setTotalScriptExecutions] = useState<number>(0) // Added declaration

  const [loadstringProcessing, setLoadstringProcessing] = useState(false)
  const [loadstringResult, setLoadstringResult] = useState("")

  const [globalChatScript, setGlobalChatScript] = useState("")
  const [globalChatMessages, setGlobalChatMessages] = useState([])
  const [globalChatTab, setGlobalChatTab] = useState("live")

  const [aiChatOpen, setAiChatOpen] = useState(true)
  const [aiChatMinimized, setAiChatMinimized] = useState(false)
  const [aiInput, setAiInput] = useState("")
  const [aiMessages, setAiMessages] = useState([])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [aiConversationHistory, setAiConversationHistory] = useState([])

  const [globalChatInput, setGlobalChatInput] = useState("")
  const [isAskingAI, setIsAskingAI] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])

  // New state variables for global chat
  const [isSendingGlobalChat, setIsSendingGlobalChat] = useState(false)
  const [globalChatMessage, setGlobalChatMessage] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [displayName, setDisplayName] = useState(user?.display_name || "")

  const [todayMessages, setTodayMessages] = useState(0)
  const [weeklyMessages, setWeeklyMessages] = useState(0)
  const [topPlayer, setTopPlayer] = useState<string | null>(null)

  const MAX_API_KEYS = 10

  const [convertedApiKeys, setConvertedApiKeys] = useState<Set<string>>(new Set())

  // Removed useEffect for checking database setup
  // if (isCheckingSetup) { ... }

  const getAuthToken = async () => {
    try {
      // First try to get the session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("[v0] Error getting session:", error)
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshData.session) {
          console.error("[v0] Session refresh failed:", refreshError)
          toast({
            title: "⚠️ Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          })
          setTimeout(() => signOut(), 2000)
          return null
        }
        return refreshData.session.access_token
      }

      if (!session?.access_token) {
        console.log("[v0] No valid session found")
        toast({
          title: "⚠️ Authentication Required",
          description: "Please log in to continue.",
          variant: "destructive",
        })
        setTimeout(() => signOut(), 2000)
        return null
      }

      return session.access_token
    } catch (error) {
      console.error("[v0] Failed to get auth token:", error)
      return null
    }
  }

  const submitUniversalApiKey = async () => {
    if (!universalApiKey.trim()) {
      toast({
        title: "⚠️ Warning",
        description: "Please enter an API key.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // First check if the API key is protected
      const checkResponse = await fetch("/api/check-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: universalApiKey.trim(),
          isUniversalAccess: true,
        }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        if (checkData.isProtected) {
          toast({
            title: "🔒 API Key Protected",
            description:
              "This API key is private and protected by Verbal Hub. Please use another API key that is public.",
            variant: "destructive",
          })
          return
        }
        throw new Error(checkData.error || "Invalid API key")
      }

      // Set the API key directly
      setApiKey(universalApiKey.trim())

      // Generate script for this API key
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: universalApiKey.trim(),
          websiteUrl: window.location.origin,
          showStatusMessages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate script")
      }

      const data = await response.json()
      if (data.success) {
        setGeneratedScript(data.script)
      }

      toast({
        title: "🔑 Universal API Key Set",
        description: "API key has been set and script generated successfully.",
      })

      // Fetch data for this API key
      fetchStats()
      fetchPlayers()
    } catch (error) {
      console.error("Error setting universal API key:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to set universal API key.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateApiKey = async () => {
    // Check if user has reached the limit
    if (userApiKeys.length >= MAX_API_KEYS) {
      toast({
        title: "⚠️ API Key Limit Reached",
        description: `You can only have ${MAX_API_KEYS} API keys. Please remove some existing keys first.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        toast({
          title: "❌ Error",
          description: "Authentication token not found. Please log in again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const response = await fetch("/api/generate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPrivate: privateMode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Removed setup_required check
        throw new Error(errorData.error || "Failed to generate API key")
      }

      const data = await response.json()

      if (data.success && data.apiKey) {
        await fetchUserApiKeys()
        setApiKey(data.apiKey)
        toast({
          title: "✅ Success",
          description: `API key generated successfully! ${data.isPrivate ? "(Private Mode)" : ""}`,
        })
      }
    } catch (error) {
      console.error("Error generating API key:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to generate API key",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeApiKey = async (apiKeyId: string) => {
    setIsLoading(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        toast({
          title: "❌ Error",
          description: "Authentication token not found. Please log in again.",
          variant: "destructive",
        })
        return
      }

      const apiKeyToRemove = userApiKeys.find((key) => key.id === apiKeyId)

      if (apiKeyToRemove) {
        await supabase.from("scripts").delete().eq("api_key_source", apiKeyToRemove.api_key).eq("author_id", user?.id)

        setConvertedApiKeys((prev) => {
          const newSet = new Set(prev)
          newSet.delete(apiKeyToRemove.api_key)
          return newSet
        })
      }

      const response = await fetch("/api/user-api-keys", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.JSON.stringify({ apiKeyId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove API key")
      }

      // Refresh user API keys
      await fetchUserApiKeys()

      toast({
        title: "🗑️ API Key Removed",
        description: "API key and associated script storage have been successfully deleted.",
      })
    } catch (error) {
      console.error("Remove API Key Error:", error)
      toast({
        title: "❌ Error",
        description: error.message || "Failed to remove API key.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserApiKeys = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        console.log("[v0] No valid session for fetching API keys")
        return
      }

      const response = await fetch("/api/user-api-keys", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.status === 401) {
        console.log("[v0] Unauthorized - session may be expired")
        toast({
          title: "⚠️ Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        setTimeout(() => signOut(), 2000)
        return
      }

      if (response.status === 429) {
        console.log("API Keys rate limited, waiting...")
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        if (errorText.includes("Too Many R")) {
          console.log("Database rate limited for API keys, backing off...")
          await new Promise((resolve) => setTimeout(resolve, 5000))
          return
        }
        throw new Error(`API Keys response not ok: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setUserApiKeys(data.apiKeys || [])

        if (data.apiKeys && data.apiKeys.length > 0) {
          const totalExecs = await fetchTotalExecutions(data.apiKeys)
          setTotalScriptExecutions(totalExecs)
        }
      }
    } catch (error) {
      if (error.message.includes("Too Many R")) {
        console.log("Database connection rate limited, backing off...")
        return
      }
      console.error("Error fetching API keys:", error)
    }
  }

  const fetchTotalExecutions = async (apiKeys: any[]) => {
    try {
      let totalExecutions = 0

      for (const key of apiKeys) {
        const response = await fetch(`/api/players?apiKey=${key.api_key}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.players) {
            const keyExecutions = data.players.reduce(
              (sum: number, player: any) => sum + (player.total_executions || 0),
              0,
            )
            totalExecutions += keyExecutions
          }
        }
      }

      return totalExecutions
    } catch (error) {
      console.error("Error fetching total executions:", error)
      return 0
    }
  }

  const fetchUsageHistory = async () => {
    if (!user) {
      console.log("No authenticated user")
      return
    }

    try {
      const token = await getAuthToken()
      if (!token) {
        console.log("No auth token available")
        return
      }

      const response = await fetch("/api/usage-history", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`API Keys response not ok: ${response.status}`)
      }

      const data = await response.json()
      setUserApiKeys(data.apiKeys || [])
    } catch (error) {
      console.error("Error fetching API keys:", error)
      setUserApiKeys([])
    }
  }

  const fetchUsageHistory2 = async () => {
    try {
      const token = await getAuthToken()
      if (!token) {
        console.log("No auth token available for fetching usage history")
        setUsageHistory([])
        return
      }

      const response = await fetch("/api/usage-history", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.error("Usage history response not ok:", response.status, response.statusText)

        try {
          const errorText = await response.text()
          console.error("Usage history error response:", errorText)

          try {
            const errorData = JSON.parse(errorText)
            // Removed setup_required check
          } catch (jsonError) {
            console.error("Could not parse usage history error as JSON:", jsonError)
          }
        } catch (textError) {
          console.error("Could not read usage history error:", textError)
        }

        setUsageHistory([])
        return
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Usage history response is not JSON:", contentType)
        setUsageHistory([])
        return
      }

      const data = await response.json()

      if (data.success) {
        setUsageHistory(data.history || [])
      } else {
        console.error("Usage history API response not successful:", data)
        setUsageHistory([])
      }
    } catch (error) {
      console.error("Failed to fetch usage history:", error)
      setUsageHistory([])
    }
  }

  const addToUsageHistory = async (
    actionType: string,
    content: string,
    executedByPlayer?: string,
    playerUserId?: number,
  ) => {
    try {
      const token = await getAuthToken()
      if (!token) {
        console.log("No auth token available for adding to usage history")
        return
      }

      const response = await fetch("/api/usage-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          apiKey,
          actionType,
          content,
          executedByPlayer,
          playerUserId,
        }),
      })

      if (response.ok) {
        // Refresh usage history after adding
        await fetchUsageHistory2()
      } else {
        const errorData = await response.json()
        console.error("Failed to add to usage history:", errorData)
      }
    } catch (error) {
      console.error("Failed to add to usage history:", error)
    }
  }

  const sendMessage = async () => {
    if (!message.trim()) {
      toast({
        title: "⚠️ Warning",
        description: "Please enter a message to send.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "⚠️ Warning",
        description: "Please generate an API key first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const finalMessage = senderName.trim() ? `${senderName.trim()}: ${message.trim()}` : message.trim()

      console.log("[v0] Sending message:", {
        apiKey: apiKey.substring(0, 10) + "...",
        message: finalMessage,
        messageLength: finalMessage.length,
      })

      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          message: finalMessage,
        }),
      })

      const data = await response.json()
      console.log("[v0] Send message response:", {
        status: response.status,
        ok: response.ok,
        data,
      })

      if (response.ok && data.success) {
        toast({
          title: "📤 Message Sent",
          description: "Global message has been sent successfully.",
        })

        await addToUsageHistory("message", finalMessage)
        setMessage("")
        fetchMessages()
        fetchStats()
      } else {
        console.error("[v0] Send message failed:", data)
        // Removed setup_required check
        toast({
          title: "❌ Error",
          description: data.error || "Failed to send message.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Send message error:", error)
      toast({
        title: "❌ Error",
        description: "Failed to send message. Please check your connection.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sendYouTubeVideo = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "⚠️ Warning",
        description: "Please enter a YouTube URL.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "⚠️ Warning",
        description: "Please generate an API key first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const messageContent = audioOnlyMode ? `YOUTUBE_AUDIO:${youtubeUrl.trim()}` : `YOUTUBE:${youtubeUrl.trim()}`

      console.log("[v0] Sending YouTube content:", {
        apiKey: apiKey.substring(0, 10) + "...",
        messageContent,
        audioOnlyMode,
        originalUrl: youtubeUrl.trim(),
      })

      const response = await fetch("/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          message: messageContent,
        }),
      })

      const data = await response.json()
      console.log("[v0] YouTube send response:", {
        status: response.status,
        ok: response.ok,
        data,
      })

      if (response.ok) {
        toast({
          title: audioOnlyMode ? "🎵 YouTube Audio Sent" : "🎥 YouTube Video Sent",
          description: audioOnlyMode ? "Audio will play in Roblox shortly." : "Video will play in Roblox shortly.",
        })

        await addToUsageHistory("youtube", messageContent)
        setYoutubeUrl("")
        fetchMessages()
        fetchStats()
      } else {
        console.error("[v0] YouTube send failed:", data)
        toast({
          title: "❌ Error",
          description: data.error || "Failed to send video.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] YouTube send error:", error)
      toast({
        title: "❌ Error",
        description: "Failed to send video.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeScript = async () => {
    if (!scriptToExecute.trim()) {
      toast({
        title: "⚠️ Warning",
        description: "Please enter a script to execute.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "⚠️ Warning",
        description: "Please generate an API key first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/execute-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          script: scriptToExecute.trim(),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setExecutionCount((prev) => prev + 1)
        setScriptExecutionCount((prev) => prev + 1)

        // Add to usage history
        await addToUsageHistory("script", scriptToExecute.trim())

        toast({
          title: "⚡ Script Executed",
          description: "Script has been sent to all connected players.",
        })
        fetchMessages()
        fetchStats()
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Failed to execute script.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to execute script.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearAllMessages = async () => {
    if (!apiKey) {
      toast({
        title: "⚠️ Warning",
        description: "Generate an API key first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/clear-messages", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "🗑️ Messages Cleared",
          description: "All messages have been removed.",
        })
        setMessages([])
        fetchMessages()
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Failed to clear messages.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to clear messages.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeMessage = async (messageId: number) => {
    try {
      const response = await fetch("/api/remove-message", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey, messageId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== messageId))
        toast({
          title: "🗑️ Message Removed",
          description: "Message deleted successfully.",
        })
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Failed to remove message.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to remove message.",
        variant: "destructive",
      })
    }
  }

  const sendTestMessage = async () => {
    if (!apiKey) {
      toast({
        title: "⚠️ Warning",
        description: "Generate an API key first.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/test-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "🧪 Test Message Sent",
          description: "Check your Roblox for the test message.",
        })

        // Add to usage history
        await addToUsageHistory("test", "Test message")

        fetchMessages()
      } else {
        toast({
          title: "❌ Error",
          description: data.error || "Failed to send test message.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to send test message.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const scheduleMessage = async () => {
    if (!scheduledMessage.trim()) {
      toast({
        title: "⚠️ Warning",
        description: "Please enter a message to schedule.",
        variant: "destructive",
      })
      return
    }

    if (!scheduledDate || !scheduledTime) {
      toast({
        title: "⚠️ Warning",
        description: "Please select both date and time for the scheduled message.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "⚠️ Warning",
        description: "Please generate an API key first.",
        variant: "destructive",
      })
      return
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
    const now = new Date()

    if (scheduledDateTime <= now) {
      toast({
        title: "⚠️ Warning",
        description: "Scheduled time must be in the future.",
        variant: "destructive",
      })
      return
    }

    const newScheduledMessage = {
      id: Date.now(),
      message: scheduledMessage,
      scheduledFor: scheduledDateTime,
      apiKey: apiKey,
      status: "pending",
      createdAt: now,
    }

    setScheduledMessages((prev) => [...prev, newScheduledMessage])

    const timeUntilSend = scheduledDateTime.getTime() - now.getTime()
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch("/api/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: newScheduledMessage.apiKey,
            message: `[SCHEDULED] ${newScheduledMessage.message}`,
          }),
        })

        if (response.ok) {
          setScheduledMessages((prev) =>
            prev.map((msg) => (msg.id === newScheduledMessage.id ? { ...msg, status: "sent" } : msg)),
          )
          toast({
            title: "📅 Scheduled Message Sent",
            description: "Your scheduled message has been sent successfully.",
          })
        } else {
          setScheduledMessages((prev) =>
            prev.map((msg) => (msg.id === newScheduledMessage.id ? { ...msg, status: "failed" } : msg)),
          )
        }
      } catch (error) {
        setScheduledMessages((prev) =>
          prev.map((msg) => (msg.id === newScheduledMessage.id ? { ...msg, status: "failed" } : msg)),
        )
      } finally {
        scheduledTimeoutsRef.current.delete(newScheduledMessage.id)
      }
    }, timeUntilSend)

    scheduledTimeoutsRef.current.set(newScheduledMessage.id, timeoutId)

    toast({
      title: "📅 Message Scheduled",
      description: `Message will be sent on ${scheduledDateTime.toLocaleString()}`,
    })

    setScheduledMessage("")
    setScheduledDate("")
    setScheduledTime("")
  }

  const cancelScheduledMessage = (messageId: number) => {
    const timeoutId = scheduledTimeoutsRef.current.get(messageId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      scheduledTimeoutsRef.current.delete(messageId)
    }

    setScheduledMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    toast({
      title: "❌ Scheduled Message Cancelled",
      description: "The scheduled message has been cancelled.",
    })
  }

  const fetchMessages = async () => {
    if (!apiKey) return

    console.log("[v0] Fetching messages with apiKey:", apiKey)
    console.log("[v0] New messages only:", newMessagesOnly)
    console.log("[v0] Last message timestamp:", lastMessageTimestamp)

    try {
      let url = `/api/get-messages?apiKey=${apiKey}`

      if (newMessagesOnly && lastMessageTimestamp) {
        url += `&since=${encodeURIComponent(lastMessageTimestamp)}`
      }

      const response = await fetch(url)
      console.log("[v0] Messages response status:", response.status)

      if (response.status === 429) {
        console.log("[v0] Rate limited, waiting before retry...")
        await new Promise((resolve) => setTimeout(resolve, 2000))
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        if (errorText.includes("Too Many R")) {
          console.log("[v0] Database rate limited, backing off...")
          await new Promise((resolve) => setTimeout(resolve, 5000))
          return
        }
        throw new Error(`Messages response not ok: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Messages data received:", data)

      if (data.success && data.messages) {
        if (data.messages.length > 0) {
          const latestMessage = data.messages[data.messages.length - 1]
          setLastMessageTimestamp(latestMessage.sent_at)
        }
        setMessages(data.messages)
      }
    } catch (error) {
      console.error("[v0] Error fetching messages:", error)
    }
  }

  const fetchPlayers = useCallback(async () => {
    if (!apiKey) return

    try {
      const response = await fetch(`/api/players?apiKey=${apiKey}`)

      if (response.status === 429) {
        console.log("Players API rate limited, waiting...")
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        if (errorText.includes("Too Many R")) {
          console.log("Database rate limited for players, backing off...")
          await new Promise((resolve) => setTimeout(resolve, 5000))
          return
        }
        console.error("Players API response not ok:", response.status)
        return
      }

      const data = await response.json()

      if (data.success) {
        setPlayers(data.players || [])
        setPlayerCount(data.count || 0)
        setTotalExecutions(data.totalExecutions || 0)
      }
    } catch (error) {
      if (error.message.includes("Too Many R")) {
        console.log("Database connection rate limited, backing off...")
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return
      }
      console.error("Error fetching players:", error)
    }
  }, [apiKey]) // Add apiKey as a dependency

  // Function to fetch active players, used by the new interval
  const fetchActivePlayers = async (currentApiKey: string) => {
    if (!currentApiKey) return

    try {
      const response = await fetch(`/api/players?apiKey=${currentApiKey}`)

      if (response.status === 429) {
        console.log("Players API rate limited, waiting...")
        await new Promise((resolve) => setTimeout(resolve, 3000))
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        if (errorText.includes("Too Many R")) {
          console.log("Database rate limited for players, backing off...")
          await new Promise((resolve) => setTimeout(resolve, 5000))
          return
        }
        console.error("Players API response not ok:", response.status)
        return
      }

      const data = await response.json()

      if (data.success) {
        const playersList = data.players || []
        const count = data.count || 0

        setPlayers((prevPlayers) => {
          const prevJSON = JSON.stringify(prevPlayers.sort((a, b) => a.username.localeCompare(b.username)))
          const newJSON = JSON.stringify(playersList.sort((a, b) => a.username.localeCompare(b.username)))

          if (prevJSON !== newJSON) {
            return playersList
          }
          return prevPlayers
        })

        setTotalExecutions(data.totalExecutions || 0)
        setPlayerCount(count)
      }
    } catch (error) {
      if (error.message.includes("Too Many R")) {
        console.log("Database connection rate limited, backing off...")
        await new Promise((resolve) => setTimeout(resolve, 5000))
        return
      }
      console.error("Error fetching active players:", error)
    }
  }

  const fetchStats = async () => {
    if (!apiKey) return

    try {
      const response = await fetch(`/api/stats?apiKey=${apiKey}`)

      if (!response.ok) {
        console.error("Stats API response not ok:", response.status)
        return
      }

      const data = await response.json()

      if (data.success) {
        setApiStats(
          data.stats || {
            totalMessages: 0,
            totalExecutions: 0,
            totalPlayers: 0,
            executionStats: {
              total: 0,
              successful: 0,
              failed: 0,
              successRate: 0,
              todayExecutions: 0,
            },
          },
        )
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const clearScript = () => {
    setScriptToExecute("")
  }

  const handleApiKeySelection = async (selectedApiKey: string) => {
    setApiKey(selectedApiKey)

    // Generate script for this API key
    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: selectedApiKey,
          websiteUrl: window.location.origin,
          showStatusMessages,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate script")
      }

      const data = await response.json()
      if (data.success) {
        setGeneratedScript(data.script)
      }
      toast({
        title: "🔑 API Key Selected",
        description: "Using existing API key from your history.",
      })
    } catch (error) {
      console.error("Error generating script:", error)
      toast({
        title: "❌ Error",
        description: "Failed to generate script for selected API key.",
        variant: "destructive",
      })
    }
  }

  const reuseFromHistory = (historyItem: any) => {
    // Switch to the appropriate tab first
    if (historyItem.action_type === "message") {
      setActiveTab("dashboard")
      setMessage(historyItem.content.replace(/^[^:]+:\s*/, "")) // Remove username prefix if present
      if (historyItem.content.includes(":")) {
        const username = historyItem.content.split(":")[0]
        setSenderName(username)
      }
    } else if (historyItem.action_type === "youtube") {
      setActiveTab("dashboard")
      const url = historyItem.content.replace("YOUTUBE:", "").replace("YOUTUBE_AUDIO:", "")
      setYoutubeUrl(url)
      setAudioOnlyMode(historyItem.content.startsWith("YOUTUBE_AUDIO:"))
    } else if (historyItem.action_type === "script") {
      setActiveTab("execute")
      setScriptToExecute(historyItem.content)
    }

    toast({
      title: "🔄 Content Loaded",
      description: "Content loaded from history. You can modify and send again.",
    })
  }

  // Removed setupDatabase function

  const joinPlayerServer = (player: any) => {
    if (player.job_id && player.place_id) {
      const robloxUrl = `roblox://placeId=${player.place_id}&jobId=${player.job_id}`
      window.open(robloxUrl, "_blank")
      toast({
        title: "🎮 Joining Server",
        description: `Attempting to join ${player.display_name}'s server...`,
      })
    } else {
      toast({
        title: "❌ Cannot Join",
        description: "Server information not available for this player.",
        variant: "destructive",
      })
    }
  }

  const openRobloxProfile = (playerId: string) => {
    const robloxUrl = `https://www.roblox.com/users/${playerId}/profile`
    window.open(robloxUrl, "_blank")
  }

  const copyJobId = (jobId: string) => {
    navigator.clipboard.writeText(jobId).then(() => {
      toast({
        title: "✅ Copied",
        description: "Job ID copied to clipboard",
      })
    })
  }

  useEffect(() => {
    if (user?.display_name) {
      setDisplayName(user.display_name)
    }
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "❌ Invalid File",
        description: "Please upload an image file (PNG, JPG, GIF)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "❌ File Too Large",
        description: "Avatar must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      if (user?.avatar_url) {
        formData.append("oldAvatarUrl", user.avatar_url)
      }

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload avatar")
      }

      const data = await response.json()

      // Update profile through context (this triggers proper React state update)
      await updateProfile({ avatar_url: data.avatar_url })

      // Also refresh from database to ensure sync
      await reloadUserProfile()

      toast({
        title: "✅ Avatar Updated",
        description: "Your profile picture has been updated successfully!",
      })
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      toast({
        title: "❌ Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploadingAvatar(false)
      // Reset the input
      e.target.value = ""
    }
  }

  const handleUpdateDisplayName = async () => {
    if (!user || !displayName.trim()) return

    try {
      await updateProfile({ display_name: displayName.trim() })
      toast({
        title: "✅ Success",
        description: "Display name updated!",
      })
    } catch (error) {
      console.error("Error updating display name:", error)
      toast({
        title: "❌ Update Failed",
        description: "Failed to update display name.",
        variant: "destructive",
      })
    }
  }

  // Update script when showStatusMessages changes
  useEffect(() => {
    if (apiKey) {
      const updateScript = async () => {
        try {
          const response = await fetch("/api/generate-script", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              apiKey,
              websiteUrl: window.location.origin,
              showStatusMessages,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              setGeneratedScript(data.script)
            }
          }
        } catch (error) {
          console.error("Error updating script:", error)
        }
      }
      updateScript()
    }
  }, [showStatusMessages, apiKey])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWebsiteUrl(window.location.origin)
    }
    // Check system preference for dark mode
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setIsDarkMode(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add("dark")
      }
    }
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark")
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayCount = messages.filter((msg: any) => new Date(msg.sent_at) >= today).length
      setTodayMessages(todayCount)

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weeklyCount = messages.filter((msg: any) => new Date(msg.sent_at) >= weekAgo).length
      setWeeklyMessages(weeklyCount)
    }

    if (players.length > 0) {
      const sorted = [...players].sort((a, b) => (b.total_executions || 0) - (a.total_executions || 0))
      if (sorted[0]) {
        setTopPlayer(sorted[0].display_name || sorted[0].username || "Unknown")
      }
    }
  }, [messages, players])

  useEffect(() => {
    if (!user?.id) {
      console.log("[v0] No user ID, skipping data fetch")
      return
    }

    console.log("[v0] User authenticated, fetching data for user:", user.id)

    // Initial data fetch
    fetchUserApiKeys()
    fetchUsageHistory2()
    fetchMessages()

    if (apiKey) {
      fetchStats()
      fetchPlayers()
    }
  }, [user?.id, apiKey])

  useEffect(() => {
    if (!user?.id || !autoRefresh) return

    console.log("[v0] Setting up auto-refresh interval:", refreshInterval, "seconds")

    const intervalTime = instantRefresh ? 500 : refreshInterval * 1000
    const interval = setInterval(() => {
      fetchMessages()
      if (apiKey) {
        fetchPlayers()
        fetchStats()
      }
    }, intervalTime)

    return () => {
      console.log("[v0] Cleaning up auto-refresh interval")
      clearInterval(interval)
    }
  }, [user?.id, apiKey, autoRefresh, instantRefresh, refreshInterval])

  useEffect(() => {
    if (activeTab === "globalchat") {
      fetchGlobalChatMessages()
      const interval = setInterval(fetchGlobalChatMessages, 3000)
      return () => clearInterval(interval)
    }
  }, [activeTab, apiKey, universalApiKey])

  useEffect(() => {
    if ((universalApiKey || apiKey) && activeTab === "globalchat" && !globalChatScript) {
      generateGlobalChatScript()
    }
  }, [universalApiKey, apiKey, activeTab])

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text)
      toast({
        title: "📋 Copied",
        description: "Text copied to clipboard.",
      })
    }
  }

  const filteredMessages = messages.filter((msg: any) => {
    if (messageFilter === "all") return true
    if (messageFilter === "messages")
      return (
        !msg.message.startsWith("YOUTUBE:") &&
        !msg.message.startsWith("YOUTUBE_AUDIO:") &&
        !msg.message.startsWith("EXECUTE_SCRIPT:")
      )
    if (messageFilter === "youtube")
      return msg.message.startsWith("YOUTUBE:") || msg.message.startsWith("YOUTUBE_AUDIO:")
    if (messageFilter === "scripts") return msg.message.startsWith("EXECUTE_SCRIPT:")
    return true
  })

  const defaultLuaScript = `-- Generate an API key first to get the complete script`

  // Add these new functions after the existing ones
  const sendBulkMessages = async () => {
    if (!bulkMessages.trim()) {
      toast({
        title: "⚠️ Warning",
        description: "Please enter messages to send.",
        variant: "destructive",
      })
      return
    }

    if (!apiKey) {
      toast({
        title: "⚠️ Warning",
        description: "Please generate an API key first.",
        variant: "destructive",
      })
      return
    }

    const messages = bulkMessages.split("\n").filter((msg) => msg.trim())
    if (messages.length === 0) return

    setIsLoading(true)
    let successCount = 0
    let failCount = 0

    try {
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i].trim()
        if (!message) continue

        try {
          const finalMessage = senderName.trim() ? `${senderName.trim()}: ${message}` : message

          const response = await fetch("/api/send-message", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              apiKey,
              message: finalMessage,
            }),
          })

          if (response.ok) {
            successCount++
            await addToUsageHistory("bulk_message", finalMessage)
          } else {
            failCount++
          }

          // Add delay between messages
          if (i < messages.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, messageDelay * 1000))
          }
        } catch (error) {
          failCount++
        }
      }

      toast({
        title: "📤 Bulk Messages Sent",
        description: `Successfully sent ${successCount} messages. ${failCount} failed.`,
      })

      setBulkMessages("")
      fetchMessages()
      fetchStats()
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to send bulk messages.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const saveScriptToFavorites = (script, name, category = "utility") => {
    const newScript = {
      id: Date.now(),
      name: name || "Untitled Script",
      content: script,
      category,
      createdAt: new Date().toISOString(),
    }

    setFavoriteScripts((prev) => [...prev, newScript])
    toast({
      title: "⭐ Script Saved",
      description: `Script "${name}" saved to favorites.`,
    })
  }

  const loadFavoriteScript = (script) => {
    setScriptToExecute(script.content)
    setActiveTab("execute")
    toast({
      title: "📝 Script Loaded",
      description: `Loaded "${script.name}" from favorites.`,
    })
  }

  const exportSettings = () => {
    const data = {
      apiKeys: userApiKeys,
      favoriteScripts,
      messageTemplates,
      settings: {
        autoRefresh,
        refreshInterval,
        showStatusMessages,
        audioOnlyMode,
        privateMode,
      },
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `roblox-api-settings-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: "📁 Settings Exported",
      description: "Your settings have been exported successfully.",
    })
  }

  const importSettings = () => {
    try {
      const data = JSON.parse(importData)

      if (data.favoriteScripts) {
        setFavoriteScripts(data.favoriteScripts)
      }
      if (data.messageTemplates) {
        setMessageTemplates(data.messageTemplates)
      }
      if (data.settings) {
        setAutoRefresh(data.settings.autoRefresh ?? autoRefresh)
        setRefreshInterval(data.settings.refreshInterval ?? refreshInterval)
        setShowStatusMessages(data.settings.showStatusMessages ?? showStatusMessages)
        setAudioOnlyMode(data.settings.audioOnlyMode ?? audioOnlyMode)
        setPrivateMode(data.settings.privateMode ?? privateMode)
      }

      setImportData("")
      toast({
        title: "📁 Settings Imported",
        description: "Your settings have been imported successfully.",
      })
    } catch (error) {
      toast({
        title: "❌ Import Failed",
        description: "Invalid settings file format.",
        variant: "destructive",
      })
    }
  }

  const addMessageTemplate = () => {
    const name = prompt("Template name:")
    const content = prompt("Template content:")

    if (name && content) {
      setMessageTemplates((prev) => [...prev, { name, content }])
      toast({
        title: "📝 Template Added",
        description: `Template "${name}" has been created.`,
      })
    }
  }

  const useMessageTemplate = (template) => {
    setMessage(template.content)
    toast({
      title: "📝 Template Loaded",
      description: `Loaded template "${template.name}".`,
    })
  }

  const convertApiScriptToLoadstring = async () => {
    if (!apiKey || !user) {
      toast({
        title: "Authentication required",
        description: "Please ensure you're logged in and have an API key",
        variant: "destructive",
      })
      return
    }

    setLoadstringProcessing(true)

    try {
      const scriptContent = generatedScript || defaultLuaScript
      const scriptTitle = "Global API Script"
      const rawUrl = `${window.location.origin}/raw/${encodeURIComponent(scriptTitle)}`
      const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`

      const { data: existingScript } = await supabase.from("scripts").select("id").eq("api_key_source", apiKey).single()

      let scriptData
      if (existingScript) {
        // Update existing script
        const { data, error } = await supabase
          .from("scripts")
          .update({
            title: scriptTitle,
            content: scriptContent,
            updated_at: new Date().toISOString(),
          })
          .eq("api_key_source", apiKey)
          .select()
          .single()

        if (error) throw error
        scriptData = data
      } else {
        // Create new script
        const { data, error } = await supabase
          .from("scripts")
          .insert({
            title: scriptTitle,
            content: scriptContent,
            author_id: user.id,
            is_private: true,
            is_disabled: false,
            api_key_source: apiKey,
          })
          .select()
          .single()

        if (error) throw error
        scriptData = data
      }

      setLoadstringResult(loadstring)

      toast({
        title: "Success!",
        description: existingScript
          ? "API script updated successfully!"
          : "API script converted to loadstring successfully!",
      })
    } catch (error: any) {
      console.error("Loadstring conversion error:", error)
      toast({
        title: "Conversion failed",
        description: error.message || "Failed to convert API script to loadstring",
        variant: "destructive",
      })
    } finally {
      setLoadstringProcessing(false)
    }
  }

  const removeApiKeyFromDatabase = async (keyToRemove: string) => {
    try {
      await supabase.from("scripts").delete().eq("api_key_source", keyToRemove)

      const { error } = await supabase.from("api_keys").delete().eq("api_key", keyToRemove).eq("user_id", user?.id)

      if (error) throw error

      setUserApiKeys((prev) => prev.filter((key) => key.api_key !== keyToRemove))

      if (apiKey === keyToRemove) {
        setApiKey("")
        setLoadstringResult("")
      }

      toast({
        title: "Success",
        description: "API key and associated script removed successfully",
      })
    } catch (error: any) {
      console.error("Error removing API key:", error)
      toast({
        title: "Error",
        description: "Failed to remove API key",
        variant: "destructive",
      })
    }
  }

  const generateGlobalChatScript = async () => {
    try {
      // Handle missing websiteUrl by trying to get it again
      const currentWebsiteUrl = websiteUrl || (typeof window !== "undefined" ? window.location.origin : "")

      if (!currentWebsiteUrl) {
        toast({
          title: "Error",
          description: "Website URL is not available yet. Please wait a moment.",
          variant: "destructive",
        })
        return // Do not proceed if URL is still unavailable
      }

      const response = await fetch("/api/generate-global-chat-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: universalApiKey.trim() || apiKey,
          websiteUrl: currentWebsiteUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate global chat script")
      }

      const data = await response.json()
      if (data.success) {
        setGlobalChatScript(data.script)
        toast({
          title: "Success",
          description: "Global chat script generated!",
        })
      }
    } catch (error) {
      console.error("Error generating global chat script:", error)
      toast({
        title: "Error",
        description: "Failed to generate global chat script.",
        variant: "destructive",
      })
    }
  }

  const fetchGlobalChatMessages = async () => {
    const key = universalApiKey.trim() || apiKey // Use universal key if available, else the regular one
    if (!key) return // Exit if no API key is set

    try {
      const response = await fetch(`/api/global-chat/history?apiKey=${key}&limit=100`)
      if (!response.ok) {
        console.error("Failed to fetch global chat messages:", response.status, response.statusText)
        return
      }

      const data = await response.json()

      if (data.success && data.messages) {
        // Fetch thumbnails for all unique user IDs that are actual Roblox user IDs (not web user)
        const uniqueUserIds = [
          ...new Set(
            data.messages
              .map((msg: any) => msg.player_user_id) // Use player_user_id for actual Roblox IDs
              .filter((id: any) => id && typeof id === "number" && id > 1), // Filter out null, 0, 1, and non-numeric IDs
          ),
        ]

        let messagesWithThumbnails = data.messages

        if (uniqueUserIds.length > 0) {
          try {
            // Use corsproxy to bypass CORS issues when fetching Roblox thumbnails
            const proxy = "https://corsproxy.io/?"
            const thumbnailResponse = await fetch(
              `${proxy}https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${uniqueUserIds.join(",")}&size=150x150&format=Png&isCircular=false`,
            )

            if (!thumbnailResponse.ok) {
              throw new Error(`Thumbnail API error: ${thumbnailResponse.status}`)
            }

            const thumbnailData = await thumbnailResponse.json()

            // Create a map of user IDs to thumbnail URLs
            const thumbnailMap = new Map()
            if (thumbnailData.data) {
              thumbnailData.data.forEach((item: any) => {
                thumbnailMap.set(item.targetId, item.imageUrl)
              })
            }

            // Add thumbnails to messages
            messagesWithThumbnails = data.messages.map((msg: any) => ({
              ...msg,
              // Use the thumbnail from the map if available for the player_user_id
              // Otherwise, fall back to null (or a default avatar if preferred)
              avatarUrl: msg.player_user_id ? thumbnailMap.get(msg.player_user_id) : null,
            }))
          } catch (err) {
            console.error("Failed to fetch Roblox thumbnails:", err)
            // If thumbnail fetching fails, proceed with original messages (no avatars)
            messagesWithThumbnails = data.messages
          }
        }

        setGlobalChatMessages(messagesWithThumbnails)
      }
    } catch (error) {
      console.error("Failed to fetch global chat messages:", error)
    }
  }

  const sendGlobalChatMessage = async () => {
    if (!globalChatMessage.trim() || !apiKey || !user) {
      return
    }

    setIsSendingGlobalChat(true)

    try {
      const response = await fetch("/api/global-chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: apiKey, // Use the selected/universal API key
          message: globalChatMessage.trim(),
          username: user.username || "WebUser",
          displayName: user.display_name || user.username || "Website User",
          userId: user.id, // Supabase user ID
          thumbnailUrl: user.avatar_url || null, // Use web avatar if available
          playerUserId: null, // Web users don't have a direct Roblox user ID for avatar lookup in this context
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setGlobalChatMessage("")

      toast({
        title: "✅ Message Sent",
        description: "Your message was sent successfully!",
      })

      // Refresh messages immediately to show the new message
      setTimeout(() => {
        fetchGlobalChatMessages()
      }, 300) // Small delay to allow the backend to process
    } catch (error) {
      console.error("[v0] Error sending global chat message:", error)
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSendingGlobalChat(false)
    }
  }

  const askGlobalChatAI = async () => {
    if (!globalChatInput.trim() || isAskingAI) return

    const key = universalApiKey.trim() || apiKey
    if (!key) {
      toast({
        title: "⚠️ Warning",
        description: "Please generate an API key first.",
        variant: "destructive",
      })
      return
    }

    const userMessage = globalChatInput.trim()
    setGlobalChatInput("")
    setIsAskingAI(true)

    // Add user message to conversation history
    const newHistory = [...conversationHistory, { role: "user", content: userMessage }]
    setConversationHistory(newHistory)

    // Add "Thinking..." message to UI
    const thinkingMessage = {
      username: "AI Assistant",
      display_name: "AI Assistant",
      user_id: "0", // Placeholder for AI
      message: "Thinking...",
      sent_at: new Date().toISOString(),
      thumbnail_url: null, // AI doesn't have a thumbnail
      isThinking: true, // Custom flag to identify thinking message
    }
    setGlobalChatMessages([...globalChatMessages, thinkingMessage])

    try {
      const response = await fetch("/api/global-chat/ask-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: key,
          prompt: userMessage,
          conversationHistory: newHistory.slice(-10), // Keep last 10 messages for context
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remove thinking message and add actual response
        setGlobalChatMessages((prev) => prev.filter((msg) => !msg.isThinking))

        // Add AI response to conversation history
        setConversationHistory([...newHistory, { role: "assistant", content: data.response }])

        // Fetch latest messages to show AI response in the chat feed
        await fetchGlobalChatMessages()

        toast({
          title: "🤖 AI Response",
          description: "AI has responded to your message.",
        })
      } else {
        // Remove thinking message on error
        setGlobalChatMessages((prev) => prev.filter((msg) => !msg.isThinking))

        toast({
          title: "❌ Error",
          description: data.error || "Failed to get AI response.",
          variant: "destructive",
        })
      }
    } catch (error) {
      // Remove thinking message on error
      setGlobalChatMessages((prev) => prev.filter((msg) => !msg.isThinking))

      console.error("Error asking AI:", error)
      toast({
        title: "❌ Error",
        description: "Failed to connect to AI service.",
        variant: "destructive",
      })
    } finally {
      setIsAskingAI(false)
    }
  }

  const sendAiMessage = async () => {
    if (!aiInput.trim() || isAiThinking) return

    const key = universalApiKey.trim() || apiKey
    if (!key) {
      toast({
        title: "⚠️ Warning",
        description: "Please generate an API key first.",
        variant: "destructive",
      })
      return
    }

    const userMessage = {
      role: "user",
      content: aiInput.trim(),
      timestamp: new Date().toISOString(),
    }

    setAiMessages((prev) => [...prev, userMessage])
    setAiInput("")
    setIsAiThinking(true)

    const newHistory = [...aiConversationHistory, { role: "user", content: userMessage.content }]
    setAiConversationHistory(newHistory)

    try {
      // Using Pollinations.ai API as an example
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant. Provide concise, helpful responses. If asked for Roblox code, provide clean Lua code.",
            },
            ...newHistory.slice(-10), // Send last 10 messages for context
          ],
          model: "openai", // Or another available model
        }),
      })

      if (response.ok) {
        const text = await response.text()
        const assistantMessage = {
          role: "assistant",
          content: text,
          timestamp: new Date().toISOString(),
        }

        setAiMessages((prev) => [...prev, assistantMessage])
        setAiConversationHistory([...newHistory, { role: "assistant", content: text }])
      } else {
        // Handle API errors
        const errorMessage = {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
          timestamp: new Date().toISOString(),
        }
        setAiMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      // Handle network errors
      console.error("AI error:", error)
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      }
      setAiMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsAiThinking(false)
    }
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" : "bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50"}`}
    >
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={user?.avatar_url}
              alt={user?.display_name || user?.username}
              fallback={user?.display_name || user?.username}
              className="h-12 w-12 border-2 border-primary ring-2 ring-primary/20"
            />
            <div>
              <h1
                className={`text-3xl md:text-4xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"} transition-colors`}
              >
                Welcome, {user?.display_name || user?.username}!
              </h1>
              <p className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} text-sm`}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSelector />
            <Button
              onClick={signOut}
              variant="outline"
              className="transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Removed setupRequired conditional rendering */}

        {/* API Key Limit Warning */}
        {userApiKeys.length >= MAX_API_KEYS && (
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-orange-800 dark:text-orange-200">
                You've reached the maximum limit of {MAX_API_KEYS} API keys. Remove some existing keys to create new
                ones.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("history")}
                className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Go to History
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Modified TabsList to include Players & Games tab */}
          <TabsList
            className={`grid w-full grid-cols-8 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
          >
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="script">Script</TabsTrigger>
            <TabsTrigger value="execute">Execute</TabsTrigger>
            <TabsTrigger value="globalchat">
              <MessageCircle className="h-4 w-4 mr-2" />
              Global Chat
            </TabsTrigger>
            <TabsTrigger value="playersGames">
              <Gamepad2 className="h-4 w-4 mr-2" />
              Players & Games
            </TabsTrigger>
            <TabsTrigger value="storage">
              <FileText className="h-4 w-4 mr-2" />
              Storage
            </TabsTrigger>
            <TabsTrigger value="renamer">Renamer</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* History tab */}
          <TabsContent value="history" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* API Keys History */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Key className="h-5 w-5" />
                    Your API Keys ({userApiKeys.length}/{MAX_API_KEYS})
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                    Manage your generated API keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {userApiKeys.length === 0 ? (
                      <div className="text-center py-8">
                        <Key className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          No API keys generated yet
                        </p>
                        <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          Generate your first API key to get started
                        </p>
                      </div>
                    ) : (
                      userApiKeys.map((key: any, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 space-y-2 ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "bg-white"}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className={`font-mono text-sm ${isDarkMode ? "text-white" : ""}`}>
                                {key.api_key.substring(0, 20)}...
                              </p>
                              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                Created: {new Date(key.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApiKeySelection(key.api_key)}
                                size="sm"
                                variant="outline"
                                className="transition-all duration-200 hover:scale-105"
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Use
                              </Button>
                              <Button
                                onClick={() => copyToClipboard(key.api_key)}
                                size="sm"
                                variant="ghost"
                                className="transition-all duration-200 hover:scale-105"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => removeApiKeyFromDatabase(key.api_key)}
                                size="sm"
                                variant="destructive"
                                className="transition-all duration-200 hover:scale-105"
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={key.is_active ? "default" : "secondary"}>
                              {key.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {key.is_private && (
                              <Badge variant="outline" className="text-orange-600 border-orange-600">
                                Private
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Usage History */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <History className="h-5 w-5" />
                    Usage History ({usageHistory.length})
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                    Your recent API usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {usageHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <History
                          className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}
                        />
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          No usage history yet
                        </p>
                        <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          Start using the API to see your history here
                        </p>
                      </div>
                    ) : (
                      usageHistory.map((item: any, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 space-y-2 ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "bg-white"}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {item.action_type === "message" && <Send className="h-4 w-4 text-blue-500" />}
                                {item.action_type === "youtube" && <Play className="h-4 w-4 text-red-500" />}
                                {item.action_type === "script" && <Code className="h-4 w-4 text-purple-500" />}
                                {item.action_type === "test" && <Zap className="h-4 w-4 text-yellow-500" />}
                                <Badge variant="secondary" className="text-xs">
                                  {item.action_type}
                                </Badge>
                              </div>
                              <p className={`text-sm mt-1 ${isDarkMode ? "text-white" : ""}`}>
                                {item.content.substring(0, 50)}
                                {item.content.length > 50 ? "..." : ""}
                              </p>
                              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {new Date(item.created_at).toLocaleString()}
                              </p>
                              {item.executed_by_player && (
                                <p className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                                  Executed by: {item.executed_by_player}
                                </p>
                              )}
                            </div>
                            <Button
                              onClick={() => reuseFromHistory(item)}
                              size="sm"
                              variant="outline"
                              className="transition-all duration-200 hover:scale-105"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Use Again
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {playerCount}
                      </p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Active Players</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Send className="h-5 w-5 text-green-500" />
                    <div>
                      <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {apiStats.totalMessages}
                      </p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Messages Sent</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {totalScriptExecutions}
                      </p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Total Script Executions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {apiKey ? "Active" : "Inactive"}
                      </p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>API Status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {todayMessages}
                      </p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Today's Messages</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:scale-105`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"} truncate`}>
                        {topPlayer || "N/A"}
                      </p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Top Player</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Control Cards Grid (4 columns) */}
            <div className="grid lg:grid-cols-4 gap-6">
              {/* API Key Card */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:shadow-lg`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Key className="h-5 w-5" />
                    API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={apiKey}
                      placeholder="Generate an API key"
                      readOnly
                      className={`font-mono text-sm transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(apiKey)}
                      disabled={!apiKey}
                      className="transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? "text-white" : ""}`}>Private Mode</p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Protect from universal access
                      </p>
                    </div>
                    <Switch checked={privateMode} onCheckedChange={setPrivateMode} />
                  </div>
                  <Button
                    onClick={generateApiKey}
                    disabled={isLoading || userApiKeys.length >= MAX_API_KEYS}
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isLoading ? "Generating..." : "Generate API Key"}
                  </Button>
                  {userApiKeys.length >= MAX_API_KEYS && (
                    <p className={`text-xs text-center ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                      Limit reached ({userApiKeys.length}/{MAX_API_KEYS})
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Universal API Key Card */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:shadow-lg`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Key className="h-5 w-5" />
                    Universal API Key
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                    Use an existing API key from any account (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={universalApiKey}
                    onChange={(e) => setUniversalApiKey(e.target.value)}
                    placeholder="Enter API key here..."
                    className={`font-mono text-sm transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                  />
                  <Button
                    onClick={submitUniversalApiKey}
                    disabled={isLoading || !universalApiKey.trim()}
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {isLoading ? "Submitting..." : "Submit API Key"}
                  </Button>
                  {universalApiKey && (
                    <div className="text-xs text-center space-y-1">
                      <p className={`${isDarkMode ? "text-green-400" : "text-green-600"}`}>✓ Universal API key set</p>
                      <Button
                        onClick={() => {
                          setUniversalApiKey("")
                          setApiKey("")
                          setGeneratedScript("")
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Send Message Card */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:shadow-lg`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Send className="h-5 w-5" />
                    Send Message
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your name (optional)"
                      className={`flex-1 transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                    />
                    <Button
                      onClick={() => setSenderName("")}
                      variant="ghost"
                      size="sm"
                      disabled={!senderName}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your message..."
                    rows={3}
                    className={`transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !apiKey || !message.trim()}
                      className="transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                    >
                      {isLoading ? "Sending..." : "Send"}
                    </Button>
                    <Button
                      onClick={sendTestMessage}
                      disabled={isLoading || !apiKey}
                      variant="outline"
                      className="transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
                    >
                      Test
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* YouTube Video Card */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:shadow-lg`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    {audioOnlyMode ? <Volume2 className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    YouTube {audioOnlyMode ? "Audio" : "Video"}
                    {audioOnlyMode && (
                      <Badge variant="secondary" className="ml-2">
                        Audio Only
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtu.be/..."
                    className={`transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Audio Only</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Play videos as audio without GUI frame
                      </p>
                    </div>
                    <Switch checked={audioOnlyMode} onCheckedChange={setAudioOnlyMode} />
                  </div>
                  <Button
                    onClick={sendYouTubeVideo}
                    disabled={isLoading || !apiKey || !youtubeUrl.trim()}
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  >
                    {isLoading ? "Sending..." : audioOnlyMode ? "Send Audio" : "Send Video"}
                  </Button>
                </CardContent>
              </Card>

              {/* Scheduled Message Card */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300 hover:shadow-lg`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Calendar className="h-5 w-5" />
                    Schedule Message
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                    Send messages at a specific date and time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={scheduledMessage}
                    onChange={(e) => setScheduledMessage(e.target.value)}
                    placeholder="Enter your scheduled message..."
                    rows={2}
                    className={`transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className={`transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                    />
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className={`transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                    />
                  </div>
                  <Button
                    onClick={scheduleMessage}
                    disabled={isLoading || !apiKey || !scheduledMessage.trim() || !scheduledDate || !scheduledTime}
                    className="w-full transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  >
                    <Timer className="h-4 w-4 mr-2" />
                    Schedule Message
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Active Players Card */}
              <Card
                className={`relative border-2 border-red-500 ${isDarkMode ? "bg-gray-900/80" : "bg-white/90"} transition-all duration-300 overflow-hidden`}
                style={{
                  boxShadow:
                    "0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3), inset 0 0 20px rgba(168, 85, 247, 0.1)",
                }}
              >
                {/* Neon border animation */}
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: "linear-gradient(45deg, transparent 30%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)",
                    animation: "shimmer 3s infinite",
                  }}
                />

                <CardHeader className="relative z-10">
                  <CardTitle
                    className={`flex items-center justify-between ${isDarkMode ? "text-purple-300" : "text-purple-600"}`}
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 animate-pulse" />
                      Active Players
                    </span>
                    <Badge
                      className={`${playerCount > 0 ? "bg-purple-600 text-white" : "bg-red-600/50 text-white"} animate-pulse border-purple-400`}
                    >
                      {playerCount} online
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div
                    className="space-y-3 max-h-96 overflow-y-auto pr-2"
                    style={{
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(168, 85, 247, 0.5) transparent",
                    }}
                  >
                    {players.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="relative inline-block">
                          <Users
                            className={`h-16 w-16 mx-auto mb-3 ${isDarkMode ? "text-purple-500/50" : "text-purple-300/50"}`}
                          />
                          <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75" />
                          <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        </div>
                        <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          No active players
                        </p>
                        <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          Players will appear when they use the script
                        </p>
                      </div>
                    ) : (
                      players.slice(0, 10).map((player: any, index) => (
                        <div
                          key={`${player.username}-${index}`}
                          className={`flex flex-col gap-3 p-3 rounded-lg transition-all duration-200 border border-purple-500/30 hover:border-purple-400 ${isDarkMode ? "bg-purple-950/40 hover:bg-purple-900/60" : "bg-purple-50/50 hover:bg-purple-100/50"}`}
                          style={{
                            boxShadow: "0 0 10px rgba(168, 85, 247, 0.2), inset 0 0 10px rgba(168, 85, 247, 0.05)",
                          }}
                        >
                          {/* Player info row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="relative flex-shrink-0">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75"></div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`font-semibold text-sm truncate ${isDarkMode ? "text-purple-200" : "text-purple-700"}`}
                                >
                                  {player.display_name || player.username}
                                </p>
                                <div className="flex gap-2 flex-wrap">
                                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                    @{player.username}
                                  </p>
                                  {player.player_user_id && (
                                    <p className={`text-xs ${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                                      ID: {player.player_user_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {(() => {
                                  try {
                                    const date = new Date(player.last_seen)
                                    return isNaN(date.getTime()) ? "N/A" : date.toLocaleTimeString()
                                  } catch {
                                    return "N/A"
                                  }
                                })()}
                              </p>
                            </div>
                          </div>

                          {/* Executions info */}
                          {player.total_executions > 0 && (
                            <p className={`text-xs ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                              ⚡ {player.total_executions} executions
                            </p>
                          )}

                          <div className="flex gap-2 flex-wrap">
                            {player.job_id && (
                              <Button
                                onClick={() => copyJobId(player.job_id)}
                                size="sm"
                                variant="outline"
                                className="transition-all duration-200 border-blue-400 text-blue-600 hover:bg-blue-500/20 hover:border-blue-300 text-xs h-7"
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Job ID
                              </Button>
                            )}
                            {player.player_user_id && (
                              <Button
                                onClick={() => openRobloxProfile(player.player_user_id)}
                                size="sm"
                                variant="outline"
                                className="transition-all duration-200 border-orange-400 text-orange-600 hover:bg-orange-500/20 hover:border-orange-300 text-xs h-7"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Roblox Profile
                              </Button>
                            )}
                            {player.job_id && player.place_id && (
                              <Button
                                onClick={() => joinPlayerServer(player)}
                                size="sm"
                                variant="outline"
                                className="transition-all duration-200 border-purple-400 text-purple-600 hover:bg-purple-500/20 hover:border-purple-300 text-xs h-7"
                              >
                                <Server className="h-3 w-3 mr-1" />
                                Join Server
                              </Button>
                            )}
                            <div className="relative">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="transition-all duration-200 border-gray-400 text-gray-600 hover:bg-gray-500/20 hover:border-gray-300 text-xs h-7 bg-transparent"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                    More
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {player.job_id && (
                                    <DropdownMenuItem onClick={() => copyJobId(player.job_id)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Job ID
                                    </DropdownMenuItem>
                                  )}
                                  {player.player_user_id && (
                                    <>
                                      <DropdownMenuItem onClick={() => openRobloxProfile(player.player_user_id)}>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Roblox Profile
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => navigator.clipboard.writeText(player.player_user_id)}
                                      >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Player ID
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {player.username && (
                                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(player.username)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Copy Username
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {players.length > 10 && (
                      <p
                        className={`text-xs text-center py-2 ${isDarkMode ? "text-purple-400/60" : "text-purple-500/60"}`}
                      >
                        +{players.length - 10} more players
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Script Executions Card */}
              <Card
                className={`relative border-2 border-blue-500 ${isDarkMode ? "bg-gray-900/80" : "bg-white/90"} transition-all duration-300 overflow-hidden`}
                style={{
                  boxShadow:
                    "0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)",
                }}
              >
                {/* Neon border animation */}
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: "linear-gradient(45deg, transparent 30%, rgba(59, 130, 246, 0.1) 50%, transparent 70%)",
                    animation: "shimmer 3s infinite",
                  }}
                />

                <CardHeader className="relative z-10">
                  <CardTitle
                    className={`flex items-center justify-between ${isDarkMode ? "text-blue-300" : "text-blue-600"}`}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="h-5 w-5 animate-pulse" />
                      Script Executions
                    </span>
                    <Badge className={`bg-blue-600 text-white animate-pulse border-blue-400`}>
                      {totalExecutions} total
                    </Badge>
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">{totalExecutions}</div>
                      <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Total Script Executions
                      </p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Times players have run the script
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${isDarkMode ? "bg-blue-500/20 border border-blue-500/30" : "bg-blue-50 border border-blue-200"}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <p className={`text-sm ${isDarkMode ? "text-blue-300" : "text-blue-700"}`}>
                          Active Players: {playerCount}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {playerCount > 0
                            ? `Avg ${(totalExecutions / playerCount).toFixed(1)} per player`
                            : "No active players"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Scheduled Messages Section */}
            {scheduledMessages.length > 0 && (
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Calendar className="h-5 w-5" />
                    Scheduled Messages ({scheduledMessages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {scheduledMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`border rounded-lg p-3 space-y-2 ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "bg-white"}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className={`font-medium text-sm ${isDarkMode ? "text-white" : ""}`}>
                              {msg.message.substring(0, 50)}
                              {msg.message.length > 50 ? "..." : ""}
                            </p>
                            <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              Scheduled for: {msg.scheduledFor.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                msg.status === "pending"
                                  ? "default"
                                  : msg.status === "sent"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {msg.status}
                            </Badge>
                            {msg.status === "pending" && (
                              <Button
                                onClick={() => cancelScheduledMessage(msg.id)}
                                size="sm"
                                variant="ghost"
                                className="transition-all duration-200 hover:scale-110"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Messages Section */}
            <Card
              className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
            >
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className={`${isDarkMode ? "text-white" : ""}`}>Recent Messages</CardTitle>
                  <div className="flex gap-2">
                    <Select value={messageFilter} onValueChange={setMessageFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="messages">Messages</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="scripts">Scripts</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={clearAllMessages}
                      disabled={isLoading || !apiKey || messages.length === 0}
                      variant="destructive"
                      size="sm"
                      className="transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                  {filteredMessages.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Send className={`h-12 w-12 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                      <p className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>No messages yet</p>
                    </div>
                  ) : (
                    filteredMessages.map((msg: any, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-3 space-y-2 transition-all duration-200 hover:scale-105 ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "bg-white"}`}
                      >
                        <div className="flex justify-between items-start">
                          <p className={`font-medium flex-1 text-sm ${isDarkMode ? "text-white" : ""}`}>
                            {msg.message.startsWith("YOUTUBE:") || msg.message.startsWith("YOUTUBE_AUDIO:") ? (
                              <span className="flex items-center gap-2">
                                {msg.message.startsWith("YOUTUBE_AUDIO:") ? (
                                  <Volume2 className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Play className="h-4 w-4 text-red-500" />
                                )}
                                {msg.message.startsWith("YOUTUBE_AUDIO:") ? "Audio: " : "YouTube: "}
                                {msg.message.replace("YOUTUBE:", "").replace("YOUTUBE_AUDIO:", "").substring(0, 30)}...
                              </span>
                            ) : msg.message.startsWith("EXECUTE_SCRIPT:") ? (
                              <span className="flex items-center gap-2">
                                <Code className="h-4 w-4 text-blue-500" />
                                Script: {msg.message.replace("EXECUTE_SCRIPT:", "").substring(0, 30)}...
                              </span>
                            ) : msg.message.startsWith("[SCHEDULED]") ? (
                              <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                Scheduled: {msg.message.replace("[SCHEDULED] ", "").substring(0, 30)}...
                              </span>
                            ) : (
                              msg.message.substring(0, 50) + (msg.message.length > 50 ? "..." : "")
                            )}
                          </p>
                          <Button
                            onClick={() => removeMessage(msg.id)}
                            disabled={isLoading}
                            variant="ghost"
                            size="sm"
                            className="transition-all duration-200 hover:scale-110 active:scale-95"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div
                          className={`flex justify-between items-center text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          <span>{new Date(msg.sent_at).toLocaleTimeString()}</span>
                          <span>{msg.api_key?.substring(0, 8)}...</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="script" className="space-y-4">
            <Card
              className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
            >
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                  <Code className="h-5 w-5" />
                  Roblox Script
                </CardTitle>
                <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                  Copy and paste into your executor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedScript || defaultLuaScript)}
                      className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Script
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={convertApiScriptToLoadstring}
                      disabled={!apiKey || isLoading}
                      className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20"
                    >
                      {loadstringProcessing ? "Processing..." : "Convert to Loadstring"}
                    </Button>
                  </div>

                  {loadstringResult && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-green-600">✓ Loadstring Ready</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(loadstringResult)}
                          className="text-xs"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Loadstring
                        </Button>
                      </div>
                      <pre className="bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto text-xs border">
                        <code>{loadstringResult}</code>
                      </pre>
                    </div>
                  )}

                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-96 border">
                    <code>{generatedScript || defaultLuaScript}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="execute" className="space-y-4">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Script Editor */}
              <div className="lg:col-span-2">
                <Card
                  className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
                >
                  <CardHeader>
                    <CardTitle className={`flex items-center justify-between ${isDarkMode ? "text-white" : ""}`}>
                      <span className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Execute Lua Script
                      </span>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const name = prompt("Script name:")
                            if (name && scriptToExecute.trim()) {
                              saveScriptToFavorites(scriptToExecute, name)
                            }
                          }}
                          size="sm"
                          variant="outline"
                          disabled={!scriptToExecute.trim()}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                      Execute custom Lua scripts on all connected players
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={scriptToExecute}
                      onChange={(e) => setScriptToExecute(e.target.value)}
                      placeholder="Enter your Lua script here..."
                      rows={15}
                      className={`font-mono text-sm transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={executeScript}
                        disabled={isLoading || !apiKey || !scriptToExecute.trim()}
                        className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      >
                        {isLoading ? "Executing..." : "Execute Script"}
                      </Button>
                      <Button
                        onClick={clearScript}
                        disabled={!scriptToExecute.trim()}
                        variant="outline"
                        className="transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Script Library */}
              <div className="space-y-4">
                {/* Favorite Scripts */}
                <Card
                  className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
                >
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                      <Star className="h-5 w-5" />
                      Favorite Scripts ({favoriteScripts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {favoriteScripts.length === 0 ? (
                        <div className="text-center py-4">
                          <Star className={`h-8 w-8 mx-auto mb-2 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            No favorite scripts yet
                          </p>
                        </div>
                      ) : (
                        favoriteScripts.map((script, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg p-3 space-y-2 ${isDarkMode ? "border-gray-600 bg-gray-700/50" : "bg-white"}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className={`font-medium text-sm ${isDarkMode ? "text-white" : ""}`}>{script.name}</p>
                                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                  {script.content.substring(0, 40)}...
                                </p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {script.category}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button onClick={() => loadFavoriteScript(script)} size="sm" variant="outline">
                                  Load
                                </Button>
                                <Button
                                  onClick={() => {
                                    setFavoriteScripts((prev) => prev.filter((_, i) => i !== index))
                                    toast({
                                      title: "🗑️ Script Removed",
                                      description: "Script removed from favorites.",
                                    })
                                  }}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Script Templates */}
                <Card
                  className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
                >
                  <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                      <Code className="h-5 w-5" />
                      Script Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() =>
                        setScriptToExecute(
                          'print("Hello from Global API!")\nwait(1)\nprint("Script executed successfully!")',
                        )
                      }
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Hello World
                    </Button>
                    <Button
                      onClick={() =>
                        setScriptToExecute(
                          'game.Players.LocalPlayer.Character.Humanoid.WalkSpeed = 50\nprint("Speed boost activated!")',
                        )
                      }
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Speed Boost
                    </Button>
                    <Button
                      onClick={() =>
                        setScriptToExecute(
                          'game.Players.LocalPlayer.Character.Humanoid.JumpPower = 100\nprint("Jump boost activated!")',
                        )
                      }
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Jump Boost
                    </Button>
                    <Button
                      onClick={() =>
                        setScriptToExecute(
                          'local player = game.Players.LocalPlayer\nlocal character = player.Character\nif character then\n    character:MoveTo(Vector3.new(0, 50, 0))\n    print("Teleported to spawn!")\nend',
                        )
                      }
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Teleport to Spawn
                    </Button>
                    <Button
                      onClick={() =>
                        setScriptToExecute(
                          'local lighting = game:GetService("Lighting")\nlighting.Brightness = 2\nlighting.Ambient = Color3.fromRGB(255, 255, 255)\nprint("Full bright enabled!")',
                        )
                      }
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Full Bright
                    </Button>
                    <Button
                      onClick={() =>
                        setScriptToExecute(
                          'local player = game.Players.LocalPlayer\nlocal mouse = player:GetMouse()\n\nmouse.KeyDown:Connect(function(key)\n    if key == "f" then\n        local character = player.Character\n        if character then\n            character:MoveTo(mouse.Hit.Position)\n        end\n    end\nend)\n\nprint("Press F to teleport to mouse position!")',
                        )
                      }
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Click Teleport
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <BarChart3 className="h-5 w-5" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Total Messages</span>
                      <Badge variant="secondary">{apiStats.totalMessages}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Scripts Executed</span>
                      <Badge variant="secondary">{apiStats.executionStats?.total || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Success Rate</span>
                      <Badge variant="secondary">{apiStats.executionStats?.successRate || 0}%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Active Players</span>
                      <Badge variant="secondary">{playerCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>API Status</span>
                      <Badge variant={apiKey ? "default" : "destructive"}>{apiKey ? "Active" : "No API Key"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Today's Activity</span>
                      <Badge variant="outline">{apiStats.executionStats?.todayExecutions || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        Total Script Executions
                      </span>
                      <Badge variant="secondary">{totalScriptExecutions}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Scheduled Messages</span>
                      <Badge variant="outline">
                        {scheduledMessages.filter((msg) => msg.status === "pending").length}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {messages.slice(0, 5).map((msg: any, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-3 p-2 rounded ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className={`text-sm ${isDarkMode ? "text-white" : ""}`}>
                            {msg.message.startsWith("YOUTUBE:")
                              ? "YouTube video sent"
                              : msg.message.startsWith("YOUTUBE_AUDIO:")
                                ? "YouTube audio sent"
                                : msg.message.startsWith("EXECUTE_SCRIPT:")
                                  ? "Script executed"
                                  : msg.message.startsWith("[SCHEDULED]")
                                    ? "Scheduled message sent"
                                    : "Message sent"}
                          </p>
                          <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {new Date(msg.sent_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <div className="text-center py-4">
                        <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          No recent activity
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Users className="h-5 w-5" />
                    Player Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Online Now</span>
                      <Badge variant="default">{playerCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Total Players</span>
                      <Badge variant="secondary">{apiStats.totalPlayers}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Most Active</span>
                      <Badge variant="outline">{players.length > 0 ? players[0]?.display_name || "N/A" : "N/A"}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Avg. Executions</span>
                      <Badge variant="secondary">
                        {players.length > 0
                          ? Math.round(players.reduce((acc, p) => acc + (p.total_executions || 0), 0) / players.length)
                          : 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="storage" className="space-y-4">
            <ScriptSharingApp />
          </TabsContent>

          {/* Players & Games tab */}
          <TabsContent value="playersGames" className="space-y-4">
            <PlayersAndGames isDarkMode={isDarkMode} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <User className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <UserAvatar
                      src={user?.avatar_url}
                      alt={user?.display_name || user?.username}
                      fallback={user?.display_name || user?.username}
                      className="h-24 w-24 border-4 border-primary ring-4 ring-primary/20"
                    />
                    <div className="w-full space-y-2">
                      <label
                        htmlFor="avatar-upload"
                        className={`cursor-pointer inline-flex items-center justify-center w-full px-4 py-2 rounded-md border-2 border-dashed transition-all duration-200 hover:scale-105 ${
                          isDarkMode
                            ? "border-gray-600 hover:border-gray-500 bg-gray-700/50"
                            : "border-gray-300 hover:border-gray-400 bg-gray-50"
                        }`}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        <span className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                          {isUploadingAvatar ? "Uploading..." : "Upload Avatar"}
                        </span>
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        className="hidden"
                      />
                      <p className={`text-xs text-center ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                        Max 5MB • PNG, JPG, GIF
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? "text-white" : ""}`}>Display Name</label>
                    <div className="flex gap-2">
                      <Input
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Enter your display name"
                        className={`flex-1 transition-all duration-200 ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                      />
                      <Button
                        onClick={handleUpdateDisplayName}
                        disabled={!displayName.trim() || displayName === user?.display_name}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? "text-white" : ""}`}>Username</label>
                    <Input
                      value={user?.username || ""}
                      disabled
                      className={`${isDarkMode ? "bg-gray-700/50 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-600"}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? "text-white" : ""}`}>Email</label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className={`${isDarkMode ? "bg-gray-700/50 border-gray-600 text-gray-400" : "bg-gray-100 text-gray-600"}`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Settings className="h-5 w-5" />
                    General Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Auto Refresh</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Automatically refresh data
                      </p>
                    </div>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Instant Refresh</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Ultra-fast refresh every 0.5 seconds
                      </p>
                    </div>
                    <Switch checked={instantRefresh} onCheckedChange={setInstantRefresh} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>New Messages Only</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Only show messages newer than last refresh
                      </p>
                    </div>
                    <Switch checked={newMessagesOnly} onCheckedChange={setNewMessagesOnly} />
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? "text-white" : ""}`}>
                      Custom Refresh Interval (seconds)
                    </label>
                    <Select
                      value={refreshInterval.toString()}
                      onValueChange={(value) => setRefreshInterval(Number.parseInt(value))}
                      disabled={instantRefresh}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 second</SelectItem>
                        <SelectItem value="2">2 seconds</SelectItem>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">1 minute</SelectItem>
                        <SelectItem value="120">2 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Show Status Messages</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Show downloading/fetching status labels
                      </p>
                    </div>
                    <Switch checked={showStatusMessages} onCheckedChange={setShowStatusMessages} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Audio Only Mode</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Play videos as audio without GUI frame
                      </p>
                    </div>
                    <Switch checked={audioOnlyMode} onCheckedChange={setAudioOnlyMode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Private Mode</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Protect API key from universal access
                      </p>
                    </div>
                    <Switch checked={privateMode} onCheckedChange={setPrivateMode} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Enable Notifications</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Show browser notifications for new messages
                      </p>
                    </div>
                    <Switch checked={enableNotifications} onCheckedChange={setEnableNotifications} />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Shield className="h-5 w-5" />
                    Security & Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>API Key Status</p>
                    <Badge variant={apiKey ? "default" : "destructive"}>{apiKey ? "Active" : "No API Key"}</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Script Executions</p>
                    <Badge variant="secondary">{scriptExecutionCount} total</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Favorite Scripts</p>
                    <Badge variant="outline">{favoriteScripts.length} saved</Badge>
                  </div>

                  <div className="space-y-2">
                    <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Message Templates</p>
                    <Badge variant="outline">{messageTemplates.length} templates</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management Card */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Download className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                    Export and import your settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={exportSettings} variant="outline" className="w-full bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>

                  <div className="space-y-2">
                    <Textarea
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Paste exported settings JSON here..."
                      rows={4}
                      className={`text-xs ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""}`}
                    />
                    <Button
                      onClick={importSettings}
                      disabled={!importData.trim()}
                      variant="outline"
                      className="w-full bg-transparent"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </Button>
                  </div>

                  <div className="pt-4 border-t">
                    <p className={`text-sm font-medium mb-2 ${isDarkMode ? "text-white" : ""}`}>Quick Actions</p>
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          setFavoriteScripts([])
                          toast({ title: "🗑️ Cleared", description: "All favorite scripts cleared." })
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Clear Favorite Scripts
                      </Button>
                      <Button
                        onClick={() => {
                          setUsageHistory([])
                          toast({ title: "🗑️ Cleared", description: "Usage history cleared." })
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Clear Usage History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Settings Card */}
              <Card
                className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
              >
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                    <Activity className="h-5 w-5" />
                    Advanced Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? "text-white" : ""}`}>
                      Message History Limit
                    </label>
                    <Select value={messageHistoryLimit} onValueChange={setMessageHistoryLimit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50 messages</SelectItem>
                        <SelectItem value="100">100 messages</SelectItem>
                        <SelectItem value="250">250 messages</SelectItem>
                        <SelectItem value="500">500 messages</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${isDarkMode ? "text-white" : ""}`}>
                      Default Message Format
                    </label>
                    <Select value={defaultMessageFormat} onValueChange={setDefaultMessageFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="username">Username: Message</SelectItem>
                        <SelectItem value="brackets">[Username] Message</SelectItem>
                        <SelectItem value="plain">Message only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Auto-clear Messages</p>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        Clear old messages after 24 hours
                      </p>
                    </div>
                    <Switch checked={autoClearMessages} onCheckedChange={setAutoClearMessages} />
                  </div>

                  <div className="space-y-2">
                    <p className={`font-medium ${isDarkMode ? "text-white" : ""}`}>Player Filters</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          Show online only
                        </span>
                        <Switch
                          checked={playerFilters.showOnlineOnly}
                          onCheckedChange={(checked) =>
                            setPlayerFilters((prev) => ({ ...prev, showOnlineOnly: checked }))
                          }
                        />
                      </div>
                      <Select
                        value={playerFilters.sortBy}
                        onValueChange={(value) => setPlayerFilters((prev) => ({ ...prev, sortBy: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="lastSeen">Last Seen</SelectItem>
                          <SelectItem value="executions">Most Executions</SelectItem>
                          <SelectItem value="alphabetical">Alphabetical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="globalchat" className="space-y-4">
            <Card
              className={`${isDarkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/80 backdrop-blur-sm"} transition-all duration-300`}
            >
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDarkMode ? "text-white" : ""}`}>
                  <MessageCircle className="h-5 w-5" />
                  Global Chat System
                </CardTitle>
                <CardDescription className={`${isDarkMode ? "text-gray-400" : ""}`}>
                  Real-time global chat for all players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={globalChatTab} onValueChange={setGlobalChatTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="live">Live Chat</TabsTrigger>
                    <TabsTrigger value="script">Roblox Script</TabsTrigger>
                  </TabsList>

                  <TabsContent value="live" className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                          <Activity className="h-3 w-3 mr-1" />
                          Live
                        </Badge>
                        <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {globalChatMessages.length} messages
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchGlobalChatMessages}
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>

                    <div
                      className={`rounded-lg border ${isDarkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"} p-4 max-h-96 overflow-y-auto space-y-3`}
                    >
                      {globalChatMessages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                            No messages yet. Be the first to send a message!
                          </p>
                        </div>
                      ) : (
                        globalChatMessages.map((msg: any, index: number) => (
                          <div
                            key={index}
                            className={`flex items-start gap-3 p-3 rounded-lg ${
                              msg.username === "AI Assistant"
                                ? isDarkMode
                                  ? "bg-purple-900/20 border border-purple-500/20"
                                  : "bg-purple-50 border border-purple-200"
                                : isDarkMode
                                  ? "bg-gray-800/50"
                                  : "bg-white"
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {msg.username === "AI Assistant" ? (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <Sparkles className="h-5 w-5 text-white" />
                                </div>
                              ) : msg.avatarUrl ? ( // Use avatarUrl for fetched thumbnails
                                <img
                                  src={msg.avatarUrl || "/placeholder.svg"} // Fallback to placeholder if URL is null
                                  alt={msg.display_name}
                                  className="h-10 w-10 rounded-full"
                                />
                              ) : (
                                // Default avatar for web users or if avatarUrl is not available
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-sm font-semibold ${
                                    msg.username === "AI Assistant"
                                      ? "text-purple-500"
                                      : isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                  }`}
                                >
                                  {msg.display_name}
                                </span>
                                {msg.username !== "AI Assistant" && (
                                  <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                    @{msg.username}
                                  </span>
                                )}
                                <span className={`text-xs ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                                  {new Date(msg.sent_at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Textarea
                          value={globalChatMessage}
                          onChange={(e) => setGlobalChatMessage(e.target.value)}
                          placeholder="Type your message..."
                          rows={2}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              sendGlobalChatMessage()
                            }
                          }}
                          disabled={isSendingGlobalChat || !apiKey}
                          className={`transition-all duration-200 ${
                            isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : ""
                          }`}
                        />
                        <Button
                          onClick={sendGlobalChatMessage}
                          disabled={!globalChatMessage.trim() || !apiKey || isSendingGlobalChat}
                          className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </div>
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>Press Enter to send</p>
                    </div>
                  </TabsContent>

                  <TabsContent value="script" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(globalChatScript || "")}
                          className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Script
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateGlobalChatScript}
                          disabled={!apiKey && !universalApiKey}
                          className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 bg-transparent"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>

                      <Alert className="bg-blue-500/10 border-blue-500/20">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-sm text-blue-600 dark:text-blue-400">
                          This script creates a global chat GUI with AI assistant. Uses proper HTTP request handling.
                        </AlertDescription>
                      </Alert>

                      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-96 border">
                        <code>{globalChatScript || "-- Generate an API key first"}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="renamer" className="space-y-4">
            <RenamerPage />
          </TabsContent>
        </Tabs>
      </div>

      {aiChatOpen && (
        <div
          className={`fixed ${aiChatMinimized ? "bottom-4" : "bottom-4"} left-4 z-50 ${
            aiChatMinimized ? "w-80" : "w-96"
          } transition-all duration-300`}
        >
          <div
            className={`${
              isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
            } border rounded-lg shadow-2xl overflow-hidden ${aiChatMinimized ? "h-14" : "h-[500px]"}`}
          >
            <div
              className={`flex items-center justify-between p-3 ${isDarkMode ? "bg-purple-900/30" : "bg-purple-50"} border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    AI Assistant
                  </h3>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Pollinations.AI</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAiChatMinimized(!aiChatMinimized)}
                  className="h-8 w-8 p-0"
                >
                  {aiChatMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setAiChatOpen(false)} className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!aiChatMinimized && (
              <>
                <div
                  className={`overflow-y-auto p-4 space-y-3 ${isDarkMode ? "bg-gray-800/50" : "bg-gray-50"}`}
                  style={{ height: "calc(100% - 120px)" }}
                >
                  {aiMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Sparkles className="h-12 w-12 text-purple-500 mb-3" />
                      <p className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        AI Assistant Ready
                      </p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"} mt-1`}>
                        Ask me anything about Roblox, code, or general questions
                      </p>
                    </div>
                  ) : (
                    aiMessages.map((msg: any, index: number) => (
                      <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            msg.role === "user"
                              ? "bg-blue-500 text-white"
                              : isDarkMode
                                ? "bg-purple-900/40 text-gray-200"
                                : "bg-purple-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.role === "user" ? "text-blue-100" : isDarkMode ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {isAiThinking && (
                    <div className="flex justify-start">
                      <div
                        className={`rounded-lg p-3 ${isDarkMode ? "bg-purple-900/40 text-gray-200" : "bg-purple-100 text-gray-900"}`}
                      >
                        <p className="text-sm flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Thinking...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`p-3 border-t ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200"}`}>
                  <div className="flex gap-2">
                    <Textarea
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="Type your message..."
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendAiMessage()
                        }
                      }}
                      disabled={isAiThinking}
                      className={`resize-none ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : ""}`}
                    />
                    <Button
                      onClick={sendAiMessage}
                      disabled={isAiThinking || !aiInput.trim() || !apiKey}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!aiChatOpen && (
        <Button
          onClick={() => setAiChatOpen(true)}
          className="fixed bottom-4 left-4 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}

export default function RobloxAPIManager() {
  return (
    <ProtectedRoute>
      <RobloxAPIManagerContent />
    </ProtectedRoute>
  )
}
