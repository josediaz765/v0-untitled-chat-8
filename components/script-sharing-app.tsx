"use client"

import type React from "react"

import { CardDescription } from "@/components/ui/card"
import { useState, useEffect, useCallback, useMemo } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  Save,
  Copy,
  Trash2,
  Lock,
  FileText,
  Clock,
  Menu,
  X,
  Smartphone,
  Monitor,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Flag,
  Upload,
  ImageIcon,
  ExternalLink,
  Loader2,
  Verified,
  Key,
  Globe,
  Crown,
} from "lucide-react"
import { OwnerPanel } from "@/components/owner-panel"

interface UserProfile {
  user_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

interface Script {
  id: string
  title: string
  content: string
  author_id: string
  is_private: boolean
  is_disabled: boolean
  public_custom_html: boolean
  updated_at: string
  created_at: string
  likes_count: number
  dislikes_count: number
  views_count: number
  thumbnail_url: string | null
  author_profile?: UserProfile
}

interface ScriptBloxScript {
  _id: string
  title: string
  game: {
    _id: string
    name: string
    imageUrl: string
  }
  slug: string
  verified: boolean
  key: boolean
  views: number
  scriptType: string
  isUniversal: boolean
  isPatched: boolean
  createdAt: string
  updatedAt?: string
  image: string
  script: string
  owner?: {
    username: string
    verified: boolean
    profilePicture: string
  }
  likeCount?: number
  dislikeCount?: number
}

function generateUUID() {
  return crypto.randomUUID()
}

function AdPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg shadow-2xl max-w-md w-full relative">
        <Button variant="ghost" size="sm" className="absolute top-2 right-2 z-10" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
        <div className="p-6 text-center space-y-4">
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-primary">Advertisement</p>
              <p className="text-sm text-muted-foreground">Your ad could be here</p>
              <p className="text-xs text-muted-foreground">Google AdSense Placeholder</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">This ad helps support free scripts</p>
        </div>
      </div>
    </div>
  )
}

function UserProfilePopup({
  profile,
  onClose,
  onSelectScript,
}: {
  profile: UserProfile
  onClose: () => void
  onSelectScript: (scriptId: string) => void
}) {
  const [scripts, setScripts] = useState<Script[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    const loadUserScripts = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from("scripts")
          .select("*")
          .eq("author_id", profile.user_id)
          .eq("is_private", false)
          .order("created_at", { ascending: false })

        if (error) throw error
        setScripts(data || [])
      } catch (error) {
        console.error("Error loading user scripts:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUserScripts()
  }, [profile.user_id, supabase])

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {(profile.display_name || profile.username || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">
                {profile.display_name || profile.username || "Unknown User"}
              </DialogTitle>
              {profile.username && profile.display_name && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <h4 className="font-medium">Public Scripts ({scripts.length})</h4>
          <ScrollArea className="h-64">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : scripts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No public scripts</p>
            ) : (
              <div className="space-y-2">
                {scripts.map((script) => (
                  <Card
                    key={script.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      onSelectScript(script.id)
                      onClose()
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {script.thumbnail_url && (
                          <img
                            src={script.thumbnail_url || "/placeholder.svg"}
                            alt=""
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{script.title || "Untitled"}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" /> {script.views_count || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" /> {script.likes_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ScriptBloxTab() {
  const [scripts, setScripts] = useState<ScriptBloxScript[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState("updatedAt")
  // Use "all" instead of empty string for filter values
  const [filters, setFilters] = useState({
    mode: "all",
    patched: "all",
    key: "all",
    universal: "all",
    verified: "all",
  })
  const [selectedScript, setSelectedScript] = useState<ScriptBloxScript | null>(null)
  const [scriptDetails, setScriptDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const fetchScripts = useCallback(
    async (isSearch = false) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set("page", page.toString())
        params.set("max", "20")
        params.set("sortBy", sortBy)

        // Only add filter params if not "all"
        if (filters.mode !== "all") params.set("mode", filters.mode)
        if (filters.patched !== "all") params.set("patched", filters.patched)
        if (filters.key !== "all") params.set("key", filters.key)
        if (filters.universal !== "all") params.set("universal", filters.universal)
        if (filters.verified !== "all") params.set("verified", filters.verified)

        let url: string
        if (isSearch && searchQuery.trim()) {
          params.set("q", searchQuery.trim())
          url = `https://scriptblox.com/api/script/search?${params.toString()}`
        } else {
          url = `https://scriptblox.com/api/script/fetch?${params.toString()}`
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.result) {
          setScripts(data.result.scripts || [])
          setTotalPages(data.result.totalPages || 1)
        }
      } catch (error) {
        console.error("ScriptBlox fetch error:", error)
        toast({
          title: "Error",
          description: "Failed to fetch scripts from ScriptBlox",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [page, sortBy, filters, searchQuery],
  )

  useEffect(() => {
    fetchScripts(searchQuery.trim().length > 0)
  }, [page, sortBy, filters])

  const handleSearch = () => {
    setPage(1)
    fetchScripts(true)
  }

  const fetchScriptDetails = async (slug: string) => {
    setLoadingDetails(true)
    try {
      const response = await fetch(`https://scriptblox.com/api/script/${slug}`)
      const data = await response.json()
      if (data.script) {
        setScriptDetails(data.script)
      }
    } catch (error) {
      console.error("Error fetching script details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const copyScript = async (script: string) => {
    try {
      await navigator.clipboard.writeText(script)
      toast({ title: "Copied!", description: "Script copied to clipboard" })
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ScriptBlox scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Updated</SelectItem>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="views">Views</SelectItem>
              <SelectItem value="likeCount">Likes</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.mode} onValueChange={(v) => setFilters((f) => ({ ...f, mode: v }))}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.verified} onValueChange={(v) => setFilters((f) => ({ ...f, verified: v }))}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Verified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1">Verified</SelectItem>
              <SelectItem value="0">Unverified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.key} onValueChange={(v) => setFilters((f) => ({ ...f, key: v }))}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Key" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1">Has Key</SelectItem>
              <SelectItem value="0">No Key</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.universal} onValueChange={(v) => setFilters((f) => ({ ...f, universal: v }))}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Universal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1">Universal</SelectItem>
              <SelectItem value="0">Game Specific</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.patched} onValueChange={(v) => setFilters((f) => ({ ...f, patched: v }))}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="0">Working</SelectItem>
              <SelectItem value="1">Patched</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Scripts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((script) => (
            <Card
              key={script._id}
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedScript(script)
                fetchScriptDetails(script.slug)
              }}
            >
              <div className="aspect-video relative bg-muted">
                {script.image ? (
                  <img
                    src={script.image.startsWith("http") ? script.image : `https://scriptblox.com${script.image}`}
                    alt={script.title}
                    className="w-full h-full object-cover"
                  />
                ) : script.game?.imageUrl ? (
                  <img
                    src={script.game.imageUrl || "/placeholder.svg"}
                    alt={script.game.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {script.verified && (
                    <Badge className="bg-blue-500">
                      <Verified className="w-3 h-3" />
                    </Badge>
                  )}
                  {script.key && (
                    <Badge variant="secondary">
                      <Key className="w-3 h-3" />
                    </Badge>
                  )}
                  {script.isUniversal && (
                    <Badge variant="outline" className="bg-background/80">
                      <Globe className="w-3 h-3" />
                    </Badge>
                  )}
                </div>
                {script.isPatched && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <Badge variant="destructive">PATCHED</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <h3 className="font-medium truncate">{script.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {script.isUniversal ? "Universal Script" : script.game?.name || "Unknown Game"}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {script.views?.toLocaleString() || 0}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {script.scriptType || "free"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button variant="outline" size="sm" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Script Details Dialog - Fixed duplicate closing Dialog tag */}
      <Dialog open={!!selectedScript} onOpenChange={() => setSelectedScript(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedScript && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {selectedScript.image ? (
                      <img
                        src={
                          selectedScript.image.startsWith("http")
                            ? selectedScript.image
                            : `https://scriptblox.com${selectedScript.image}`
                        }
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg">{selectedScript.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedScript.isUniversal ? "Universal Script" : selectedScript.game?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {selectedScript.verified && <Badge className="bg-blue-500">Verified</Badge>}
                      {selectedScript.key && <Badge variant="secondary">Key System</Badge>}
                      {selectedScript.isPatched && <Badge variant="destructive">Patched</Badge>}
                      <Badge variant="outline">{selectedScript.scriptType}</Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> {selectedScript.views?.toLocaleString() || 0} views
                  </span>
                  {scriptDetails && (
                    <>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" /> {scriptDetails.likeCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4" /> {scriptDetails.dislikeCount || 0}
                      </span>
                    </>
                  )}
                </div>

                {scriptDetails?.owner && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={scriptDetails.owner.profilePicture || "/placeholder.svg"} />
                      <AvatarFallback>{scriptDetails.owner.username?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        {scriptDetails.owner.username}
                        {scriptDetails.owner.verified && <Verified className="w-4 h-4 text-blue-500" />}
                      </p>
                      <p className="text-xs text-muted-foreground">Script Author</p>
                    </div>
                  </div>
                )}

                {scriptDetails?.features && (
                  <div>
                    <h4 className="font-medium mb-2">Features</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{scriptDetails.features}</p>
                  </div>
                )}

                {loadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium mb-2">Script</h4>
                    <div className="relative">
                      <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto max-h-48">
                        <code>{scriptDetails?.script || selectedScript.script || "Loading..."}</code>
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyScript(scriptDetails?.script || selectedScript.script)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => copyScript(scriptDetails?.script || selectedScript.script)}>
                    <Copy className="w-4 h-4 mr-2" /> Copy Script
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://scriptblox.com/script/${selectedScript.slug}`, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> View on ScriptBlox
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ScriptSharingApp() {
  const { user, loading } = useAuth()
  const supabase = createBrowserClient()
  const [scripts, setScripts] = useState<Script[]>([])
  const [currentScript, setCurrentScript] = useState<Script | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUnauthorized, setShowUnauthorized] = useState(false)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState("storage")
  const [userLikes, setUserLikes] = useState<Record<string, boolean | null>>({})
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [showAd, setShowAd] = useState(false)
  const [adShown, setAdShown] = useState(false)

  useEffect(() => {
    if (!adShown && user) {
      const randomDelay = Math.random() * 30000 + 10000 // 10-40 seconds
      const timer = setTimeout(() => {
        setShowAd(true)
        setAdShown(true)
      }, randomDelay)
      return () => clearTimeout(timer)
    }
  }, [user, adShown])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const loadScripts = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("scripts")
        .select(`
          id, title, author_id, is_private, is_disabled, public_custom_html,
          updated_at, created_at, likes_count, dislikes_count, views_count, thumbnail_url
        `)
        .order("updated_at", { ascending: false })
        .limit(100)

      if (error) throw error

      // Fetch author profiles
      const authorIds = [...new Set((data || []).map((s) => s.author_id))]
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", authorIds)

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || [])

      const scriptsWithProfiles = (data || []).map((script) => ({
        ...script,
        public_custom_html: script.public_custom_html ?? true,
        likes_count: script.likes_count || 0,
        dislikes_count: script.dislikes_count || 0,
        views_count: script.views_count || 0,
        author_profile: profileMap.get(script.author_id) as UserProfile | undefined,
      }))

      setScripts(scriptsWithProfiles)

      // Load user's likes
      if (user) {
        const { data: likesData } = await supabase
          .from("script_likes")
          .select("script_id, is_like")
          .eq("user_id", user.id)

        const likesMap: Record<string, boolean | null> = {}
        likesData?.forEach((l) => {
          likesMap[l.script_id] = l.is_like
        })
        setUserLikes(likesMap)
      }
    } catch (error: any) {
      console.error("[v0] Script loading error:", error)
      toast({
        title: "Connection Issue",
        description: "Having trouble loading scripts. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    loadScripts()
  }, [loadScripts])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("scripts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scripts",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "DELETE") {
            loadScripts()
          } else if (payload.eventType === "UPDATE" && payload.new) {
            setScripts((prev) =>
              prev.map((script) => (script.id === payload.new.id ? { ...script, ...payload.new } : script)),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, loadScripts, supabase])

  const filteredScripts = useMemo(
    () => scripts.filter((script) => script.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [scripts, searchQuery],
  )

  const handleLikeDislike = async (scriptId: string, isLike: boolean) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to like scripts", variant: "destructive" })
      return
    }

    const currentLike = userLikes[scriptId]

    try {
      if (currentLike === isLike) {
        // Remove like/dislike
        await supabase.from("script_likes").delete().eq("script_id", scriptId).eq("user_id", user.id)
        setUserLikes((prev) => ({ ...prev, [scriptId]: null }))

        // Update counts
        const field = isLike ? "likes_count" : "dislikes_count"
        await supabase.rpc("decrement_script_count", { script_id: scriptId, count_field: field })
      } else {
        // Add or change like/dislike
        await supabase.from("script_likes").upsert(
          {
            script_id: scriptId,
            user_id: user.id,
            is_like: isLike,
          },
          { onConflict: "script_id,user_id" },
        )

        setUserLikes((prev) => ({ ...prev, [scriptId]: isLike }))

        // Update counts - if changing from like to dislike or vice versa
        if (currentLike !== null && currentLike !== undefined) {
          const oldField = currentLike ? "likes_count" : "dislikes_count"
          await supabase.rpc("decrement_script_count", { script_id: scriptId, count_field: oldField })
        }
        const newField = isLike ? "likes_count" : "dislikes_count"
        await supabase.rpc("increment_script_count", { script_id: scriptId, count_field: newField })
      }

      await loadScripts()
    } catch (error) {
      console.error("Like/dislike error:", error)
      toast({ title: "Error", description: "Failed to update", variant: "destructive" })
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentScript || !user || !e.target.files?.[0]) return

    const file = e.target.files[0]

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" })
      return
    }

    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("scriptId", currentScript.id || "new")

      const response = await fetch("/api/upload-script-thumbnail", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const data = await response.json()

      setCurrentScript((prev) => (prev ? { ...prev, thumbnail_url: data.url } : null))

      if (currentScript.id) {
        await supabase.from("scripts").update({ thumbnail_url: data.url }).eq("id", currentScript.id)
        await loadScripts()
      }

      toast({ title: "Thumbnail uploaded", description: "Your thumbnail has been updated" })
    } catch (error) {
      console.error("Thumbnail upload error:", error)
      toast({ title: "Upload failed", description: "Failed to upload thumbnail", variant: "destructive" })
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleReport = async () => {
    if (!currentScript || !user || !reportReason) return

    try {
      await supabase.from("script_reports").insert({
        script_id: currentScript.id,
        reporter_id: user.id,
        reason: reportReason,
        description: reportDescription,
      })

      toast({ title: "Report submitted", description: "Thank you for your report" })
      setShowReportDialog(false)
      setReportReason("")
      setReportDescription("")
    } catch (error) {
      console.error("Report error:", error)
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" })
    }
  }

  const recordView = async (scriptId: string) => {
    try {
      await supabase.from("script_views").upsert(
        {
          script_id: scriptId,
          viewer_id: user?.id || null,
        },
        { onConflict: "script_id,viewer_id", ignoreDuplicates: true },
      )

      await supabase.rpc("increment_script_count", { script_id: scriptId, count_field: "views_count" })
    } catch (error) {
      // Silent fail for views
    }
  }

  const createNewScript = () => {
    setShowUnauthorized(false)
    setCurrentScript({
      id: "",
      title: "",
      content: "",
      author_id: user?.id || "",
      is_private: false,
      is_disabled: false,
      public_custom_html: true,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      likes_count: 0,
      dislikes_count: 0,
      views_count: 0,
      thumbnail_url: null,
    })
    if (isMobile) setSidebarOpen(false)
  }

  const loadScript = async (scriptId: string) => {
    setShowUnauthorized(false)

    try {
      const { data, error } = await supabase.from("scripts").select("*").eq("id", scriptId).single()

      if (error) throw error

      if (data.is_private && data.author_id !== user?.id) {
        setShowUnauthorized(true)
        setCurrentScript(null)
        return
      }

      // Load author profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("user_id, username, display_name, avatar_url")
        .eq("user_id", data.author_id)
        .single()

      setCurrentScript({
        ...data,
        public_custom_html: data.public_custom_html ?? true,
        likes_count: data.likes_count || 0,
        dislikes_count: data.dislikes_count || 0,
        views_count: data.views_count || 0,
        author_profile: profile as UserProfile | undefined,
      })

      // Record view
      if (data.author_id !== user?.id) {
        recordView(scriptId)
      }

      if (isMobile) setSidebarOpen(false)
    } catch (error) {
      console.error("[v0] Script load error:", error)
      setShowUnauthorized(true)
      setCurrentScript(null)
      toast({
        title: "Script Not Found",
        description: "This script may have been deleted or you don't have permission to view it.",
        variant: "destructive",
      })
    }
  }

  const saveScript = async () => {
    if (!user || !currentScript) return

    if (currentScript.id && currentScript.author_id !== user.id) {
      toast({
        title: "Access denied",
        description: "You can only edit scripts that you created",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const title = currentScript.title.trim() || "Untitled Script"

      const isNewScript = !currentScript.id
      const scriptId = isNewScript ? generateUUID() : currentScript.id

      const scriptData: any = {
        title: title,
        content: currentScript.content,
        author_id: user.id,
        is_private: currentScript.is_private,
        is_disabled: currentScript.is_disabled,
        public_custom_html: currentScript.public_custom_html ?? true,
        thumbnail_url: currentScript.thumbnail_url,
        updated_at: new Date().toISOString(),
      }

      let result

      if (isNewScript) {
        scriptData.id = scriptId
        result = await supabase.from("scripts").insert(scriptData).select().single()
      } else {
        result = await supabase
          .from("scripts")
          .update(scriptData)
          .eq("id", currentScript.id)
          .eq("author_id", user.id)
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      setCurrentScript({
        ...result.data,
        public_custom_html: result.data.public_custom_html ?? true,
        likes_count: result.data.likes_count || 0,
        dislikes_count: result.data.dislikes_count || 0,
        views_count: result.data.views_count || 0,
      })

      await loadScripts()

      toast({
        title: "Script saved",
        description: "Your script has been saved successfully",
      })
    } catch (error: any) {
      console.error("Save error:", error)
      toast({
        title: "Save error",
        description: error.message || "Failed to save script. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteScript = async () => {
    if (!currentScript?.id) return

    const isAppOwner = user?.email === "nuviadiaz1008@gmail.com"

    if (currentScript.author_id !== user?.id && !isAppOwner) {
      toast({
        title: "Access denied",
        description: "You can only delete scripts that you created",
        variant: "destructive",
      })
      return
    }

    try {
      if (isAppOwner && currentScript.author_id !== user?.id) {
        const response = await fetch("/api/owner/delete-script", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scriptId: currentScript.id, userEmail: user?.email }),
        })
        const data = await response.json()
        if (data.error) throw new Error(data.error)
      } else {
        const { error } = await supabase.from("scripts").delete().eq("id", currentScript.id)
        if (error) throw error
      }

      setCurrentScript(null)
      setShowDeleteDialog(false)

      await loadScripts()

      toast({
        title: "Script deleted",
        description:
          isAppOwner && currentScript.author_id !== user?.id
            ? "Script deleted by owner"
            : "The script and its raw link have been removed",
      })
    } catch (error: any) {
      console.error("Delete error:", error)
      toast({
        title: "Delete error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const togglePrivacy = async () => {
    if (!currentScript?.id) {
      setCurrentScript((prev) => (prev ? { ...prev, is_private: !prev.is_private } : null))
      return
    }

    if (currentScript.author_id !== user?.id) {
      toast({
        title: "Access denied",
        description: "You can only modify scripts that you created",
        variant: "destructive",
      })
      return
    }

    try {
      const newPrivacyState = !currentScript.is_private

      const { error, data } = await supabase
        .from("scripts")
        .update({ is_private: newPrivacyState })
        .eq("id", currentScript.id)
        .eq("author_id", user.id)
        .select()
        .single()

      if (error) throw error

      setCurrentScript((prev) =>
        prev ? { ...prev, ...data, public_custom_html: data.public_custom_html ?? true } : null,
      )

      await loadScripts()

      toast({
        title: "Privacy updated",
        description: newPrivacyState
          ? "Script is now private - source code hidden"
          : "Script is now public - source code visible",
      })
    } catch (error: any) {
      console.error("Privacy toggle error:", error)
      toast({
        title: "Privacy update error",
        description: error.message || "Failed to update privacy",
        variant: "destructive",
      })
    }
  }

  const toggleDisabled = async () => {
    if (!currentScript?.id) {
      setCurrentScript((prev) => (prev ? { ...prev, is_disabled: !prev.is_disabled } : null))
      return
    }

    if (currentScript.author_id !== user?.id) {
      toast({
        title: "Access denied",
        description: "You can only modify scripts that you created",
        variant: "destructive",
      })
      return
    }

    try {
      const newDisabledState = !currentScript.is_disabled

      const { error, data } = await supabase
        .from("scripts")
        .update({ is_disabled: newDisabledState })
        .eq("id", currentScript.id)
        .eq("author_id", user.id)
        .select()
        .single()

      if (error) throw error

      setCurrentScript((prev) =>
        prev ? { ...prev, ...data, public_custom_html: data.public_custom_html ?? true } : null,
      )

      await loadScripts()

      toast({
        title: "Script status updated",
        description: newDisabledState ? "Script disabled - users will be kicked" : "Script enabled",
      })
    } catch (error: any) {
      console.error("Disabled toggle error:", error)
      toast({
        title: "Status update error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      })
    }
  }

  const togglePublicCustomHtml = async () => {
    if (!currentScript?.id) {
      setCurrentScript((prev) => (prev ? { ...prev, public_custom_html: !prev.public_custom_html } : null))
      return
    }

    if (currentScript.author_id !== user?.id) {
      toast({
        title: "Access denied",
        description: "You can only modify scripts that you created",
        variant: "destructive",
      })
      return
    }

    try {
      const newState = !currentScript.public_custom_html

      const { error, data } = await supabase
        .from("scripts")
        .update({ public_custom_html: newState })
        .eq("id", currentScript.id)
        .eq("author_id", user.id)
        .select()
        .single()

      if (error) throw error

      setCurrentScript((prev) =>
        prev ? { ...prev, ...data, public_custom_html: data.public_custom_html ?? true } : null,
      )

      await loadScripts()

      toast({
        title: "Display mode updated",
        description: newState ? "Custom HTML viewer enabled" : "Custom HTML disabled - showing raw Lua only",
      })
    } catch (error: any) {
      console.error("Custom HTML toggle error:", error)
      toast({
        title: "Update error",
        description: error.message || "Failed to update display mode",
        variant: "destructive",
      })
    }
  }

  const copyScript = async () => {
    if (!currentScript?.content) return

    try {
      await navigator.clipboard.writeText(currentScript.content)
      toast({
        title: "Copied!",
        description: "Script content copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      })
    }
  }

  const copyLoadstring = async () => {
    if (!currentScript?.id) return

    try {
      const identifier = currentScript.title?.trim() || currentScript.id
      const rawUrl = `${window.location.origin}/raw/${encodeURIComponent(identifier)}`
      const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`

      await navigator.clipboard.writeText(loadstring)
      toast({
        title: "Loadstring copied!",
        description: "Roblox loadstring copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy loadstring to clipboard",
        variant: "destructive",
      })
    }
  }

  const openRawLink = () => {
    if (!currentScript?.id) return

    const identifier = currentScript.title?.trim() || currentScript.id
    const rawUrl = `${window.location.origin}/raw/${encodeURIComponent(identifier)}`
    window.open(rawUrl, "_blank")
  }

  const isOwner = currentScript && user && currentScript.author_id === user.id

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Script Storage</p>
            <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Script Storage Public
              </CardTitle>
              <CardDescription className="text-base">Secure cloud storage for your Roblox scripts</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Sign in to the main website to access your script storage, create new scripts, and manage your
                collection.
              </p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Monitor className="w-3 h-3" />
                <span>Desktop</span>
              </div>
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                <span>Mobile</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex flex-col relative">
      {showAd && <AdPopup onClose={() => setShowAd(false)} />}

      {selectedUserProfile && (
        <UserProfilePopup
          profile={selectedUserProfile}
          onClose={() => setSelectedUserProfile(null)}
          onSelectScript={loadScript}
        />
      )}

      <div className="flex justify-center p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full max-w-md ${user?.isOwner ? "grid-cols-3" : "grid-cols-2"}`}>
            <TabsTrigger value="storage">Storage Public</TabsTrigger>
            <TabsTrigger value="scriptblox">ScriptBlox</TabsTrigger>
            {user?.isOwner && (
              <TabsTrigger value="owner" className="gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                Owner
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "owner" && user?.isOwner ? (
        <div className="flex-1 overflow-auto">
          <OwnerPanel />
        </div>
      ) : activeTab === "scriptblox" ? (
        <div className="flex-1 p-4 overflow-auto">
          <ScriptBloxTab />
        </div>
      ) : (
        <div className="flex-1 flex relative">
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          )}

          <div
            className={`
            ${isMobile ? "fixed" : "relative"}
            ${isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"}
            ${isMobile ? "z-50 w-80" : "w-80 lg:w-96"}
            transition-transform duration-300 ease-in-out
            border-r bg-card/95 backdrop-blur flex flex-col shadow-lg
          `}
          >
            <div className="p-4 border-b bg-card/80">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Scripts
                </h1>
                {isMobile && (
                  <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 p-2 bg-muted/50 rounded-lg">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-primary">
                    {(user.username || user.email || "").charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="truncate font-medium">{user.username || user.email}</span>
              </div>

              <Button onClick={createNewScript} className="w-full mb-4 shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                New Script
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search scripts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8 space-y-2">
                    <div className="animate-pulse w-8 h-8 bg-muted rounded-full mx-auto"></div>
                    <p>Loading scripts...</p>
                  </div>
                ) : filteredScripts.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 space-y-2">
                    <FileText className="w-12 h-12 mx-auto opacity-50" />
                    <p className="font-medium">{searchQuery ? "No scripts found" : "No scripts yet"}</p>
                    <p className="text-xs">
                      {searchQuery ? "Try a different search term" : "Create your first script to get started"}
                    </p>
                  </div>
                ) : (
                  filteredScripts.map((script) => (
                    <Card
                      key={script.id}
                      className={`mb-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                        currentScript?.id === script.id
                          ? "ring-2 ring-primary shadow-md bg-primary/5"
                          : "hover:bg-accent/50"
                      }`}
                      onClick={() => loadScript(script.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {script.thumbnail_url && (
                            <img
                              src={script.thumbnail_url || "/placeholder.svg"}
                              alt=""
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate flex items-center gap-2 text-sm">
                              {script.title || "Untitled Script"}
                              {script.is_private && <Lock className="w-3 h-3 text-amber-500" />}
                              {script.is_disabled && (
                                <Badge variant="destructive" className="text-xs px-1 py-0">
                                  Disabled
                                </Badge>
                              )}
                              {!script.is_private && !script.is_disabled && (
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  Public
                                </Badge>
                              )}
                            </h3>
                            {script.author_profile && (
                              <div
                                className="flex items-center gap-1 mt-1 cursor-pointer hover:underline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedUserProfile(script.author_profile!)
                                }}
                              >
                                <Avatar className="w-4 h-4">
                                  <AvatarImage src={script.author_profile.avatar_url || undefined} />
                                  <AvatarFallback className="text-[8px]">
                                    {(script.author_profile.display_name || script.author_profile.username || "U")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground truncate">
                                  {script.author_profile.display_name || script.author_profile.username}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {script.views_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3" /> {script.likes_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(script.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col relative">
            {isMobile && (
              <div className="p-4 border-b bg-card/80 backdrop-blur flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}>
                  <Menu className="w-4 h-4" />
                </Button>
                <h1 className="font-semibold">Script Storage Public</h1>
              </div>
            )}

            {showUnauthorized ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
                <Card className="max-w-md mx-4 shadow-lg">
                  <CardContent className="text-center p-8 space-y-4">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                      <Lock className="w-8 h-8 text-destructive" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold">Private Script</h2>
                      <p className="text-muted-foreground">
                        This script is private and can only be viewed by its creator.
                      </p>
                    </div>
                    <Button onClick={() => setShowUnauthorized(false)} variant="outline">
                      Go Back
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : currentScript ? (
              <>
                <div className="p-4 border-b bg-card/80 backdrop-blur">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          {currentScript.thumbnail_url ? (
                            <img
                              src={currentScript.thumbnail_url || "/placeholder.svg"}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                          )}
                        </div>
                        {isOwner && (
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-lg">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleThumbnailUpload}
                              disabled={uploadingThumbnail}
                            />
                            {uploadingThumbnail ? (
                              <Loader2 className="w-5 h-5 text-white animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-white" />
                            )}
                          </label>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder="Script title..."
                          value={currentScript.title}
                          onChange={(e) =>
                            setCurrentScript((prev) => (prev ? { ...prev, title: e.target.value } : null))
                          }
                          className="text-lg font-semibold bg-background/50 mb-2"
                          disabled={!isOwner}
                        />
                        {currentScript.author_profile && (
                          <div
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-1 -ml-1 w-fit"
                            onClick={() => setSelectedUserProfile(currentScript.author_profile!)}
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={currentScript.author_profile.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(
                                  currentScript.author_profile.display_name ||
                                  currentScript.author_profile.username ||
                                  "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {currentScript.author_profile.display_name || currentScript.author_profile.username}
                            </span>
                          </div>
                        )}
                      </div>
                      {currentScript?.id && (
                        <Badge
                          variant="outline"
                          className="text-green-600 border-green-600 shadow-sm whitespace-nowrap"
                        >
                          Roblox Ready
                        </Badge>
                      )}
                    </div>

                    {currentScript?.id && (
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-4 h-4" /> {currentScript.views_count} views
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant={userLikes[currentScript.id] === true ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleLikeDislike(currentScript.id, true)}
                            disabled={isOwner}
                          >
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {currentScript.likes_count}
                          </Button>
                          <Button
                            variant={userLikes[currentScript.id] === false ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleLikeDislike(currentScript.id, false)}
                            disabled={isOwner}
                          >
                            <ThumbsDown className="w-4 h-4 mr-1" />
                            {currentScript.dislikes_count}
                          </Button>
                        </div>
                        {!isOwner && (
                          <Button variant="ghost" size="sm" onClick={() => setShowReportDialog(true)}>
                            <Flag className="w-4 h-4 mr-1" />
                            Report
                          </Button>
                        )}
                      </div>
                    )}

                    {(isOwner || user?.email === "nuviadiaz1008@gmail.com") && (
                      <div className="flex items-center gap-6 flex-wrap">
                        {isOwner && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">Private</span>
                              <Switch checked={currentScript.is_private} onCheckedChange={togglePrivacy} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">Disabled</span>
                              <Switch checked={currentScript.is_disabled} onCheckedChange={toggleDisabled} />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground whitespace-nowrap">Custom HTML</span>
                              <Switch
                                checked={currentScript.public_custom_html}
                                onCheckedChange={togglePublicCustomHtml}
                              />
                            </div>
                          </>
                        )}
                        <Button
                          onClick={() => setShowDeleteDialog(true)}
                          variant={isOwner ? "ghost" : "destructive"}
                          size="sm"
                          className={isOwner ? "ml-auto" : "ml-auto"}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {!isOwner && "Delete (Owner)"}
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={openRawLink} variant="outline" size="sm" disabled={!currentScript?.id}>
                        <FileText className="w-4 h-4 mr-2" />
                        Open Link
                      </Button>
                      <Button onClick={copyScript} variant="outline" size="sm">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                      <Button onClick={copyLoadstring} variant="outline" size="sm" disabled={!currentScript?.id}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Loadstring
                      </Button>
                      {isOwner && (
                        <Button onClick={saveScript} disabled={isSaving} size="sm" className="shadow-sm ml-auto">
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {currentScript?.id && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="text-xs text-muted-foreground break-all">
                        <span className="font-medium">API URL:</span> {window.location.origin}/raw/
                        {encodeURIComponent(currentScript.title?.trim() || currentScript.id)}
                      </div>
                      {(currentScript.is_private || currentScript.is_disabled || !currentScript.public_custom_html) && (
                        <div className="flex gap-2 flex-wrap">
                          {currentScript.is_private && (
                            <Badge variant="secondary" className="text-xs">
                              Private - source hidden but executable
                            </Badge>
                          )}
                          {currentScript.is_disabled && (
                            <Badge variant="destructive" className="text-xs">
                              Disabled - will kick users
                            </Badge>
                          )}
                          {!currentScript.public_custom_html && (
                            <Badge variant="outline" className="text-xs">
                              Raw mode - no HTML viewer
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 overflow-hidden">
                  <Textarea
                    placeholder="Start writing your script..."
                    value={currentScript.content}
                    onChange={(e) => setCurrentScript((prev) => (prev ? { ...prev, content: e.target.value } : null))}
                    className="w-full h-full resize-none font-mono text-sm bg-background/50 backdrop-blur"
                    disabled={!isOwner}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="max-w-md mx-4 shadow-lg">
                  <CardContent className="text-center p-8 space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Welcome to Script Storage
                      </h2>
                      <p className="text-muted-foreground">
                        Select a script from the sidebar or create a new one to get started
                      </p>
                    </div>
                    <Button onClick={createNewScript} className="shadow-sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Script
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Script</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this script? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteScript}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Script</DialogTitle>
            <DialogDescription>Help us understand what&apos;s wrong with this script.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="malicious">Malicious Code</SelectItem>
                <SelectItem value="stolen">Stolen/Copied Content</SelectItem>
                <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="broken">Broken/Not Working</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Additional details (optional)"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={!reportReason}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
