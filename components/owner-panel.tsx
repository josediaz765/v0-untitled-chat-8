"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Trash2,
  Flag,
  Key,
  Users,
  FileText,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Crown,
  Activity,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
  Skull,
  Flame,
} from "lucide-react"

interface Report {
  id: string
  script_id: string
  reporter_id: string
  reason: string
  description: string
  status: string
  created_at: string
  script?: {
    id: string
    title: string
    author_id: string
  }
  reporter?: {
    username: string
    display_name: string
    avatar_url: string
  }
}

interface ApiKey {
  id: number
  api_key: string
  user_id: string
  is_active: boolean
  is_private: boolean
  created_at: string
  user_profile?: {
    username: string
    display_name: string
    avatar_url: string
  }
}

interface AllScript {
  id: string
  title: string
  content: string
  author_id: string
  is_private: boolean
  is_disabled: boolean
  views_count: number
  likes_count: number
  dislikes_count: number
  created_at: string
  updated_at: string
  author_profile?: {
    username: string
    display_name: string
    avatar_url: string
  }
}

interface UserProfile {
  user_id: string
  username: string
  display_name: string
  avatar_url: string
  created_at: string
}

interface Stats {
  totalScripts: number
  totalUsers: number
  totalReports: number
  totalApiKeys: number
  pendingReports: number
  activeApiKeys: number
}

export function OwnerPanel() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState("overview")
  const [reports, setReports] = useState<Report[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [allScripts, setAllScripts] = useState<AllScript[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<Stats>({
    totalScripts: 0,
    totalUsers: 0,
    totalReports: 0,
    totalApiKeys: 0,
    pendingReports: 0,
    activeApiKeys: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; id: string; title?: string }>({
    open: false,
    type: "",
    id: "",
  })

  useEffect(() => {
    if (user?.isOwner) {
      loadAllData()
    }
  }, [user])

  const loadAllData = async () => {
    setLoading(true)
    try {
      console.log("[v0] Loading owner data for:", user?.email)
      const response = await fetch(`/api/owner/data?email=${encodeURIComponent(user?.email || "")}`)
      const data = await response.json()

      console.log("[v0] Owner data response:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      setAllScripts(data.scripts || [])
      setUsers(data.users || [])
      setReports(data.reports || [])
      setApiKeys(data.apiKeys || [])
      setStats(
        data.stats || {
          totalScripts: 0,
          totalUsers: 0,
          totalReports: 0,
          totalApiKeys: 0,
          pendingReports: 0,
          activeApiKeys: 0,
        },
      )

      console.log("[v0] Loaded:", {
        scripts: data.scripts?.length || 0,
        users: data.users?.length || 0,
        reports: data.reports?.length || 0,
        apiKeys: data.apiKeys?.length || 0,
      })
    } catch (error: any) {
      console.error("[v0] Error loading owner data:", error)
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setLoading(false)
  }

  const handleDeleteScript = async (scriptId: string) => {
    try {
      const response = await fetch("/api/owner/delete-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId, userEmail: user?.email }),
      })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      toast({ title: "Script deleted", description: "Script has been permanently removed" })
      loadAllData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setDeleteDialog({ open: false, type: "", id: "" })
  }

  const handleDeleteApiKey = async (keyId: string) => {
    try {
      const response = await fetch("/api/owner/delete-apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: Number.parseInt(keyId), userEmail: user?.email }),
      })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      toast({ title: "API Key deleted", description: "API key has been permanently removed" })
      loadAllData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
    setDeleteDialog({ open: false, type: "", id: "" })
  }

  const handleResolveReport = async (reportId: string, status: string) => {
    try {
      const response = await fetch("/api/owner/resolve-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status, userEmail: user?.email }),
      })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      toast({ title: "Report updated", description: `Report marked as ${status}` })
      loadAllData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleToggleApiKey = async (keyId: number, isActive: boolean) => {
    try {
      const response = await fetch("/api/owner/toggle-apikey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, isActive, userEmail: user?.email }),
      })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      toast({ title: "API Key updated", description: `Key ${isActive ? "disabled" : "enabled"}` })
      loadAllData()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const filteredReports = reports.filter(
    (r) =>
      r.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.script?.title?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredApiKeys = apiKeys.filter(
    (k) =>
      k.api_key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.user_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredScripts = allScripts.filter(
    (s) =>
      s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.author_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!user?.isOwner) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md border-red-500/50 bg-red-500/5">
          <CardContent className="p-8 text-center">
            <Skull className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2 text-red-500">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to view this panel.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-500/30 border-t-yellow-500 mx-auto"></div>
            <Crown className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Loading Owner Panel...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-xl shadow-lg shadow-orange-500/30">
            <Crown className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
              OWNER PANEL
              <Flame className="w-5 h-5 text-orange-500" />
            </h1>
            <p className="text-sm text-muted-foreground">Total system domination</p>
          </div>
        </div>
        <Button
          onClick={loadAllData}
          variant="outline"
          size="sm"
          className="border-orange-500/50 hover:bg-orange-500/10 bg-transparent"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-black text-blue-400">{stats.totalScripts}</span>
            </div>
            <p className="text-xs text-blue-300/70 mt-1 font-medium">Total Scripts</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30 hover:border-green-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-black text-green-400">{stats.totalUsers}</span>
            </div>
            <p className="text-xs text-green-300/70 mt-1 font-medium">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30 hover:border-red-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              <span className="text-2xl font-black text-red-400">{stats.pendingReports}</span>
            </div>
            <p className="text-xs text-red-300/70 mt-1 font-medium">Pending Reports</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span className="text-2xl font-black text-purple-400">{stats.activeApiKeys}</span>
            </div>
            <p className="text-xs text-purple-300/70 mt-1 font-medium">Active API Keys</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30 hover:border-orange-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-2xl font-black text-orange-400">{stats.totalReports}</span>
            </div>
            <p className="text-xs text-orange-300/70 mt-1 font-medium">Total Reports</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 hover:border-cyan-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <span className="text-2xl font-black text-cyan-400">{stats.totalApiKeys}</span>
            </div>
            <p className="text-xs text-cyan-300/70 mt-1 font-medium">Total API Keys</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search across all data..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-orange-500/30 focus:border-orange-500"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-background/50 border border-orange-500/20">
          <TabsTrigger
            value="overview"
            className="gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400"
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="gap-2 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400"
          >
            <Flag className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
            {stats.pendingReports > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 animate-pulse">
                {stats.pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="scripts"
            className="gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Scripts</span>
          </TabsTrigger>
          <TabsTrigger
            value="apikeys"
            className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 mt-4">
          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Reports */}
              <Card className="border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-red-400">
                    <Flag className="w-5 h-5" />
                    Recent Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-red-500/5 border border-red-500/20 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{report.script?.title || "Unknown Script"}</p>
                        <p className="text-sm text-muted-foreground">{report.reason}</p>
                      </div>
                      <Badge
                        variant={report.status === "pending" ? "destructive" : "secondary"}
                        className="ml-2 shrink-0"
                      >
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                  {reports.length === 0 && <p className="text-center text-muted-foreground py-4">No reports yet</p>}
                </CardContent>
              </Card>

              {/* Recent Users */}
              <Card className="border-green-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-400">
                    <Users className="w-5 h-5" />
                    Recent Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {users.slice(0, 5).map((u) => (
                    <div
                      key={u.user_id}
                      className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg"
                    >
                      <Avatar className="w-8 h-8 border border-green-500/30">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="bg-green-500/20 text-green-400">
                          {(u.display_name || u.username || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{u.display_name || u.username}</p>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {users.length === 0 && <p className="text-center text-muted-foreground py-4">No users yet</p>}
                </CardContent>
              </Card>

              {/* Recent Scripts */}
              <Card className="md:col-span-2 border-blue-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-blue-400">
                    <FileText className="w-5 h-5" />
                    Recent Scripts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {allScripts.slice(0, 6).map((script) => (
                      <div key={script.id} className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium truncate flex-1">{script.title}</p>
                          <div className="flex gap-1 shrink-0">
                            {script.is_private && (
                              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-400">
                                Private
                              </Badge>
                            )}
                            {script.is_disabled && (
                              <Badge variant="destructive" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {script.views_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> {script.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> {script.dislikes_count}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by @{script.author_profile?.username || "unknown"}
                        </p>
                      </div>
                    ))}
                  </div>
                  {allScripts.length === 0 && <p className="text-center text-muted-foreground py-4">No scripts yet</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="m-0 space-y-3">
            {filteredReports.length === 0 ? (
              <Card className="border-red-500/20">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">No reports found</p>
                  <p className="text-muted-foreground">All clear!</p>
                </CardContent>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <Card
                  key={report.id}
                  className={`border-l-4 ${report.status === "pending" ? "border-l-red-500 bg-red-500/5" : "border-l-green-500 bg-green-500/5"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={report.status === "pending" ? "destructive" : "secondary"}
                            className="uppercase text-xs font-bold"
                          >
                            {report.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg">{report.script?.title || "Unknown Script"}</h3>
                        <p className="text-sm">
                          <span className="font-medium text-red-400">Reason:</span> {report.reason}
                        </p>
                        {report.description && <p className="text-sm text-muted-foreground">{report.description}</p>}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="w-4 h-4">
                            <AvatarImage src={report.reporter?.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {(report.reporter?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>Reported by @{report.reporter?.username || "unknown"}</span>
                        </div>
                      </div>
                      {report.status === "pending" && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/20 bg-transparent"
                            onClick={() => handleResolveReport(report.id, "resolved")}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-500/50 hover:bg-gray-500/20 bg-transparent"
                            onClick={() => handleResolveReport(report.id, "dismissed")}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setDeleteDialog({
                                open: true,
                                type: "script",
                                id: report.script_id,
                                title: report.script?.title,
                              })
                            }
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete Script
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Scripts Tab */}
          <TabsContent value="scripts" className="m-0 space-y-3">
            {filteredScripts.length === 0 ? (
              <Card className="border-blue-500/20">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                  <p className="text-lg font-medium">No scripts found</p>
                </CardContent>
              </Card>
            ) : (
              filteredScripts.map((script) => (
                <Card key={script.id} className="border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg">{script.title}</h3>
                          {script.is_private && (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                              Private
                            </Badge>
                          )}
                          {script.is_disabled && <Badge variant="destructive">Disabled</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {script.views_count} views
                          </span>
                          <span className="flex items-center gap-1 text-green-400">
                            <ThumbsUp className="w-4 h-4" /> {script.likes_count}
                          </span>
                          <span className="flex items-center gap-1 text-red-400">
                            <ThumbsDown className="w-4 h-4" /> {script.dislikes_count}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={script.author_profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(script.author_profile?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>@{script.author_profile?.username || "unknown"}</span>
                          <span>•</span>
                          <span>{new Date(script.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          setDeleteDialog({ open: true, type: "script", id: script.id, title: script.title })
                        }
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apikeys" className="m-0 space-y-3">
            {filteredApiKeys.length === 0 ? (
              <Card className="border-purple-500/20">
                <CardContent className="p-8 text-center">
                  <Key className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                  <p className="text-lg font-medium">No API keys found</p>
                </CardContent>
              </Card>
            ) : (
              filteredApiKeys.map((key) => (
                <Card
                  key={key.id}
                  className={`border-l-4 ${key.is_active ? "border-l-green-500 bg-green-500/5" : "border-l-red-500 bg-red-500/5"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={key.is_active ? "default" : "destructive"}
                            className={key.is_active ? "bg-green-500" : ""}
                          >
                            {key.is_active ? "Active" : "Disabled"}
                          </Badge>
                          {key.is_private && (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                              Private
                            </Badge>
                          )}
                        </div>
                        <code className="text-sm font-mono bg-background/50 px-2 py-1 rounded block overflow-x-auto">
                          {key.api_key}
                        </code>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={key.user_profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {(key.user_profile?.username || "U").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>@{key.user_profile?.username || "unknown"}</span>
                          <span>•</span>
                          <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className={
                            key.is_active
                              ? "border-red-500/50 text-red-400 hover:bg-red-500/20"
                              : "border-green-500/50 text-green-400 hover:bg-green-500/20"
                          }
                          onClick={() => handleToggleApiKey(key.id, key.is_active)}
                        >
                          {key.is_active ? (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Disable
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Enable
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setDeleteDialog({ open: true, type: "apikey", id: key.id.toString(), title: key.api_key })
                          }
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="border-red-500/50 bg-background">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Skull className="w-5 h-5" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-bold text-foreground">"{deleteDialog.title}"</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, type: "", id: "" })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.type === "script") {
                  handleDeleteScript(deleteDialog.id)
                } else if (deleteDialog.type === "apikey") {
                  handleDeleteApiKey(deleteDialog.id)
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
