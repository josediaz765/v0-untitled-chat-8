"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  Users,
  User,
  Loader2,
  AlertCircle,
  Gamepad2,
  Circle,
  UserPlus,
  Calendar,
  Hash,
  AtSign,
  ExternalLink,
  Eye,
  ThumbsUp,
  MapPin,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "@/hooks/use-toast"

interface UserData {
  id: number
  username: string
  displayName: string
  followers: number
  friendsCount: number
  friends: any[]
  avatarUrl: string | null
  description: string
  created: string
  isBanned: boolean
  presence: {
    userPresenceType: number
    lastLocation: string
    placeId?: number
    gameId?: string
    universeId?: number
    game?: any
  }
}

interface GameData {
  id: number
  name: string
  description: string
  creator: {
    id: number
    name: string
    type: string
  }
  price: number
  playing: number
  visits: number
  maxPlayers: number
  created: string
  updated: string
  genre: string
  thumbnailUrl: string | null
  placeId: number
  upVotes: number
  downVotes: number
}

interface ServerData {
  id: string
  playing: number
  maxPlayers: number
  ping: number
  fps: number
}

export default function PlayersAndGames() {
  const [activeTab, setActiveTab] = useState("players")
  const [searchQuery, setSearchQuery] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [servers, setServers] = useState<ServerData[]>([])
  const [searchingPlayer, setSearchingPlayer] = useState(false)
  const [playerServer, setPlayerServer] = useState<any>(null)
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 })
  const [playerSearchUsername, setPlayerSearchUsername] = useState("")

  const searchPlayer = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a username")
      return
    }

    setLoading(true)
    setError("")
    setUserData(null)

    try {
      const proxy = "https://corsproxy.io/?"

      // Step 1: Get user ID from username
      const userResponse = await fetch(
        `${proxy}https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(searchQuery)}&limit=10`,
      )
      const userSearchData = await userResponse.json()

      if (!userSearchData.data || userSearchData.data.length === 0) {
        setError("User not found. Please check the username and try again.")
        setLoading(false)
        return
      }

      // Find exact match or closest match
      const exactMatch =
        userSearchData.data.find((u: any) => u.name.toLowerCase() === searchQuery.toLowerCase()) ||
        userSearchData.data[0]

      const userId = exactMatch.id

      // Step 2: Get detailed user info
      const detailResponse = await fetch(`${proxy}https://users.roblox.com/v1/users/${userId}`)
      const detailData = await detailResponse.json()

      // Step 3: Get follower count
      const followerResponse = await fetch(`${proxy}https://friends.roblox.com/v1/users/${userId}/followers/count`)
      const followerData = await followerResponse.json()

      // Step 4: Get avatar thumbnail - FIXED METHOD
      const thumbnailResponse = await fetch(
        `${proxy}https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`,
      )
      const thumbnailData = await thumbnailResponse.json()
      const avatarUrl = thumbnailData.data?.[0]?.imageUrl || null

      // Step 5: Get presence (online status and current game)
      const presenceResponse = await fetch(`${proxy}https://presence.roblox.com/v1/presence/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [userId] }),
      })
      const presenceData = await presenceResponse.json()
      const presence = presenceData.userPresences?.[0] || {}

      // Step 6: Get friends count
      const friendsCountResponse = await fetch(`${proxy}https://friends.roblox.com/v1/users/${userId}/friends/count`)
      const friendsCountData = await friendsCountResponse.json()

      // Step 7: Get friends list
      const friendsResponse = await fetch(`${proxy}https://friends.roblox.com/v1/users/${userId}/friends`)
      const friendsData = await friendsResponse.json()

      // Step 8: Get game details if playing
      let gameDetails = null
      if (presence.placeId && presence.gameId) {
        try {
          const gameResponse = await fetch(
            `${proxy}https://games.roblox.com/v1/games?universeIds=${presence.universeId}`,
          )
          const gameData = await gameResponse.json()
          gameDetails = gameData.data?.[0] || null
        } catch (e) {
          console.log("Failed to fetch game details")
        }
      }

      setUserData({
        id: userId,
        username: detailData.name,
        displayName: detailData.displayName,
        followers: followerData.count,
        friendsCount: friendsCountData.count,
        friends: friendsData.data || [],
        avatarUrl: avatarUrl,
        description: detailData.description,
        created: detailData.created,
        isBanned: detailData.isBanned,
        presence: {
          userPresenceType: presence.userPresenceType,
          lastLocation: presence.lastLocation,
          placeId: presence.placeId,
          gameId: presence.gameId,
          universeId: presence.universeId,
          game: gameDetails,
        },
      })

      toast({
        title: "✅ Success",
        description: `Found player: ${detailData.displayName}`,
      })
    } catch (err) {
      setError("Failed to fetch user data. Please try again.")
      console.error(err)
      toast({
        title: "❌ Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const searchGame = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a game name, ID, or URL")
      return
    }

    setLoading(true)
    setError("")
    setGameData(null)
    setServers([])
    setPlayerServer(null)

    try {
      const proxy = "https://corsproxy.io/?"
      let placeId: number | null = null

      const urlPatterns = [
        /roblox\.com\/games\/(\d+)/,
        /www\.roblox\.com\/games\/(\d+)/,
        /web\.roblox\.com\/games\/(\d+)/,
      ]

      for (const pattern of urlPatterns) {
        const match = searchQuery.match(pattern)
        if (match) {
          placeId = Number.parseInt(match[1])
          break
        }
      }

      // Check if input is just a number (game ID)
      if (!placeId && /^\d+$/.test(searchQuery.trim())) {
        placeId = Number.parseInt(searchQuery.trim())
      }

      // If we have a place ID, fetch the game directly
      if (placeId) {
        console.log("[v0] Fetching game by place ID:", placeId)

        const placeResponse = await fetch(`${proxy}https://apis.roblox.com/universes/v1/places/${placeId}/universe`)
        const placeData = await placeResponse.json()

        if (!placeData.universeId) {
          setError("Game not found. Please check the ID/URL and try again.")
          setLoading(false)
          return
        }

        const universeId = placeData.universeId

        // Get full game details using universe ID
        const gameResponse = await fetch(`${proxy}https://games.roblox.com/v1/games?universeIds=${universeId}`)
        const gameResponseData = await gameResponse.json()

        if (!gameResponseData.data || gameResponseData.data.length === 0) {
          setError("Game not found. Please check the ID/URL and try again.")
          setLoading(false)
          return
        }

        const game = gameResponseData.data[0]

        const votesResponse = await fetch(`${proxy}https://games.roblox.com/v1/games/votes?universeIds=${universeId}`)
        const votesData = await votesResponse.json()
        const votes = votesData.data?.[0] || {}

        // Get game thumbnail
        let thumbnailUrl = null
        try {
          const thumbnailResponse = await fetch(
            `${proxy}https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png`,
          )
          const thumbnailData = await thumbnailResponse.json()
          thumbnailUrl = thumbnailData.data?.[0]?.imageUrl || null
        } catch (e) {
          console.log("Failed to fetch game thumbnail")
        }

        const gamePlaceId = game.rootPlaceId
        const serversResponse = await fetch(
          `${proxy}https://games.roblox.com/v1/games/${gamePlaceId}/servers/Public?sortOrder=Desc&limit=100`,
        )
        const serversData = await serversResponse.json()
        setServers(serversData.data || [])

        setGameData({
          id: game.rootPlaceId,
          name: game.name,
          description: game.description || "No description available",
          creator: {
            id: game.creator.id,
            name: game.creator.name,
            type: game.creator.type,
          },
          price: game.price || 0,
          playing: game.playing || 0,
          visits: game.visits || 0,
          maxPlayers: game.maxPlayers || 0,
          created: game.created,
          updated: game.updated,
          genre: game.genre || "Unknown",
          thumbnailUrl: thumbnailUrl,
          placeId: gamePlaceId,
          upVotes: votes.upVotes || 0,
          downVotes: votes.downVotes || 0,
        })

        toast({
          title: "Success",
          description: `Found game: ${game.name}`,
        })
        setLoading(false)
        return
      }

      console.log("[v0] Searching game by name:", searchQuery)

      // Try to search for game by name
      const searchResponse = await fetch(
        `${proxy}https://games.roblox.com/v1/games/list?model.keyword=${encodeURIComponent(searchQuery)}&model.maxRows=10`,
      )
      const searchData = await searchResponse.json()

      if (!searchData.games || searchData.games.length === 0) {
        setError("Game not found. Please try a different search term, game ID, or URL.")
        setLoading(false)
        return
      }

      const game = searchData.games[0]

      // Get game thumbnail
      let thumbnailUrl = null
      try {
        const thumbnailResponse = await fetch(
          `${proxy}https://thumbnails.roblox.com/v1/games/icons?universeIds=${game.universeId}&size=512x512&format=Png`,
        )
        const thumbnailData = await thumbnailResponse.json()
        thumbnailUrl = thumbnailData.data?.[0]?.imageUrl || null
      } catch (e) {
        console.log("Failed to fetch game thumbnail")
      }

      setGameData({
        id: game.placeId,
        name: game.name,
        description: game.description || "No description available",
        creator: {
          id: game.creatorId,
          name: game.creatorName,
          type: game.creatorType,
        },
        price: game.price || 0,
        playing: game.playerCount || 0,
        visits: game.totalUpVotes || 0,
        maxPlayers: game.maxPlayers || 0,
        created: game.created,
        updated: game.updated,
        genre: game.genre || "Unknown",
        thumbnailUrl: thumbnailUrl,
      })

      toast({
        title: "Success",
        description: `Found game: ${game.name}`,
      })
    } catch (err) {
      setError("Failed to fetch game data. Please try again.")
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to fetch game data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const searchPlayerInServers = async () => {
    if (!playerSearchUsername.trim()) {
      setError("Please enter a username to search")
      return
    }

    if (!gameData) {
      setError("Please fetch a game first")
      return
    }

    setSearchingPlayer(true)
    setError("")
    setPlayerServer(null)
    setSearchProgress({ current: 0, total: 0 })

    try {
      const proxy = "https://corsproxy.io/?"

      // Get user ID from username
      const userResponse = await fetch(
        `${proxy}https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(playerSearchUsername)}&limit=10`,
      )
      const userSearchData = await userResponse.json()

      if (!userSearchData.data || userSearchData.data.length === 0) {
        setError("User not found.")
        setSearchingPlayer(false)
        return
      }

      const exactMatch =
        userSearchData.data.find((u: any) => u.name.toLowerCase() === playerSearchUsername.toLowerCase()) ||
        userSearchData.data[0]

      const userId = exactMatch.id

      // Get user's presence to check if they're in this game
      const presenceResponse = await fetch(`${proxy}https://presence.roblox.com/v1/presence/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [userId] }),
      })
      const presenceData = await presenceResponse.json()
      const presence = presenceData.userPresences?.[0] || {}

      // Check if user is playing this specific game
      if (!presence.placeId || presence.placeId.toString() !== gameData.placeId.toString()) {
        setError(`${exactMatch.displayName} is not currently playing this game.`)
        setSearchingPlayer(false)
        return
      }

      // User is in the game! Now find their server
      const gameInstanceId = presence.gameId

      if (gameInstanceId) {
        // We have the exact server! Just need to find server details for display
        let cursor = null
        let foundServer = null
        let totalChecked = 0
        const maxServersToCheck = 1000

        do {
          const url = cursor
            ? `${proxy}https://games.roblox.com/v1/games/${gameData.placeId}/servers/Public?sortOrder=Desc&limit=100&cursor=${cursor}`
            : `${proxy}https://games.roblox.com/v1/games/${gameData.placeId}/servers/Public?sortOrder=Desc&limit=100`

          const serversResponse = await fetch(url)
          const serversData = await serversResponse.json()

          if (serversData.data && serversData.data.length > 0) {
            totalChecked += serversData.data.length
            setSearchProgress({ current: totalChecked, total: maxServersToCheck })

            // Look for matching server ID
            foundServer = serversData.data.find((s: any) => s.id === gameInstanceId)
            if (foundServer) break
          } else {
            break
          }

          if (totalChecked >= maxServersToCheck) break
          cursor = serversData.nextPageCursor
          if (!cursor) break
        } while (!foundServer && totalChecked < maxServersToCheck)

        // Even if we don't find the exact server in the list, we can still join using the gameInstanceId
        setPlayerServer({
          server: foundServer || { id: gameInstanceId, playing: "?", ping: "?" },
          username: exactMatch.name,
          displayName: exactMatch.displayName,
          userId: userId,
          gameInstanceId: gameInstanceId,
        })

        toast({
          title: "Player Found!",
          description: `${exactMatch.displayName} is playing in a server`,
        })
      } else {
        setError(`Found ${exactMatch.displayName} in the game but couldn't get server details.`)
      }
    } catch (err) {
      setError("Failed to search for player. Please try again.")
      console.error(err)
      toast({
        title: "Error",
        description: "Failed to search for player",
        variant: "destructive",
      })
    } finally {
      setSearchingPlayer(false)
      setSearchProgress({ current: 0, total: 0 })
    }
  }

  const getJoinLink = (server: any, gameInstanceId: string | null = null) => {
    if (!gameData) return "#"
    const instanceId = gameInstanceId || server.id
    return `https://www.roblox.com/games/start?placeId=${gameData.placeId}&gameInstanceId=${instanceId}`
  }

  const handleSearch = () => {
    if (activeTab === "players") {
      searchPlayer()
    } else {
      searchGame()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + "B"
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M"
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K"
    }
    return num?.toLocaleString() || "0"
  }

  const getAccountAge = (createdDate: string) => {
    const created = new Date(createdDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const years = Math.floor(diffDays / 365)
    const months = Math.floor((diffDays % 365) / 30)

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""} ${months > 0 ? `${months} month${months > 1 ? "s" : ""}` : ""}`
    } else if (months > 0) {
      return `${months} month${months > 1 ? "s" : ""}`
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Players & Games Finder
          </CardTitle>
          <CardDescription>Search for Roblox players and games</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="players" className="gap-2">
                <User className="h-4 w-4" />
                Players
              </TabsTrigger>
              <TabsTrigger value="games" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Games
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={activeTab === "players" ? "Enter username..." : "Enter game name, ID, or URL..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-9"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    <p className="text-destructive text-sm">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <TabsContent value="players" className="mt-0">
              <AnimatePresence>
                {userData && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  >
                    <Card className="border-2">
                      <CardContent className="pt-6">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center mb-6">
                          <div className="relative mb-4">
                            {userData.avatarUrl ? (
                              <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                                <AvatarImage
                                  src={userData.avatarUrl || "/placeholder.svg"}
                                  alt={userData.displayName}
                                />
                                <AvatarFallback>
                                  <User className="h-16 w-16" />
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                                <AvatarFallback>
                                  <User className="h-16 w-16" />
                                </AvatarFallback>
                              </Avatar>
                            )}
                            {userData.isBanned && (
                              <Badge variant="destructive" className="absolute -top-2 -right-2">
                                BANNED
                              </Badge>
                            )}
                          </div>

                          {/* Name Section */}
                          <div className="text-center mb-4">
                            <h2 className="text-2xl font-bold mb-1">{userData.displayName}</h2>
                            <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
                              <AtSign className="h-4 w-4" />
                              <span className="text-sm">{userData.username}</span>
                            </div>

                            {/* Online Status */}
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
                              <Circle
                                className={`h-2.5 w-2.5 ${
                                  userData.presence.userPresenceType === 0 || userData.presence.userPresenceType === 1
                                    ? "fill-muted-foreground text-muted-foreground"
                                    : userData.presence.userPresenceType === 2
                                      ? "fill-green-500 text-green-500 animate-pulse"
                                      : "fill-yellow-500 text-yellow-500 animate-pulse"
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {userData.presence.userPresenceType === 0 || userData.presence.userPresenceType === 1
                                  ? "Offline"
                                  : userData.presence.userPresenceType === 2
                                    ? "Online"
                                    : userData.presence.game
                                      ? `Playing ${userData.presence.game.name}`
                                      : "In Game"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <div className="p-2 bg-primary/20 rounded-lg">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xl font-bold">{formatNumber(userData.followers)}</p>
                              <p className="text-xs text-muted-foreground">Followers</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <div className="p-2 bg-primary/20 rounded-lg">
                              <UserPlus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xl font-bold">{formatNumber(userData.friendsCount)}</p>
                              <p className="text-xs text-muted-foreground">Friends</p>
                            </div>
                          </div>
                        </div>

                        {/* Additional Info */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">User ID</p>
                              <p className="text-sm font-medium truncate">{userData.id}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Account Age</p>
                              <p className="text-sm font-medium truncate">{getAccountAge(userData.created)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {userData.description && (
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold mb-2 px-1 flex items-center gap-2">
                              <User className="h-4 w-4" />
                              About
                            </h3>
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="text-sm leading-relaxed line-clamp-6">{userData.description}</p>
                            </div>
                          </div>
                        )}

                        {userData.friends && userData.friends.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-sm font-semibold mb-3 px-1 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Friends ({userData.friends.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                              {userData.friends.slice(0, 18).map((friend: any) => (
                                <a
                                  key={friend.id}
                                  href={`https://www.roblox.com/users/${friend.id}/profile`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted hover:bg-muted/80 border border-border hover:border-primary/50 transition-all group"
                                >
                                  <Avatar className="h-10 w-10 ring-2 ring-border group-hover:ring-primary/50 transition-all">
                                    <AvatarImage
                                      src={`https://www.roblox.com/headshot-thumbnail/image?userId=${friend.id}&width=60&height=60&format=png`}
                                      alt={friend.displayName}
                                    />
                                    <AvatarFallback>
                                      <User className="h-5 w-5" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{friend.displayName}</p>
                                    <p className="text-xs text-muted-foreground truncate">@{friend.name}</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                            {userData.friends.length > 18 && (
                              <p className="text-xs text-muted-foreground text-center mt-2">
                                Showing 18 of {userData.friends.length} friends
                              </p>
                            )}
                          </div>
                        )}

                        {/* External Links */}
                        <div className="flex gap-2">
                          <Button asChild variant="outline" className="flex-1 bg-transparent">
                            <a
                              href={`https://www.roblox.com/users/${userData.id}/profile`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              View Profile
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="games" className="mt-0">
              <AnimatePresence>
                {gameData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="space-y-4"
                  >
                    <Card className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                          {gameData.thumbnailUrl && (
                            <img
                              src={gameData.thumbnailUrl || "/placeholder.svg"}
                              alt={gameData.name}
                              className="w-full sm:w-32 h-32 rounded-lg object-cover ring-2 ring-border"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold mb-2 truncate">{gameData.name}</h2>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{gameData.description}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                <Users className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Playing</p>
                                  <p className="text-sm font-bold">{formatNumber(gameData.playing)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                <Eye className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Visits</p>
                                  <p className="text-sm font-bold">{formatNumber(gameData.visits)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                <ThumbsUp className="h-4 w-4 text-purple-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Likes</p>
                                  <p className="text-sm font-bold">{formatNumber(gameData.upVotes)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                                <Gamepad2 className="h-4 w-4 text-yellow-500" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Max Players</p>
                                  <p className="text-sm font-bold">{gameData.maxPlayers}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Button asChild variant="outline" className="w-full bg-transparent">
                          <a
                            href={`https://www.roblox.com/games/${gameData.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            Open on Roblox
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Search className="h-5 w-5" />
                          Find Player in Game
                        </CardTitle>
                        <CardDescription>Search for a player currently playing this game</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-3 mb-3">
                          <Input
                            type="text"
                            placeholder="Enter username to search..."
                            value={playerSearchUsername}
                            onChange={(e) => setPlayerSearchUsername(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && searchPlayerInServers()}
                          />
                          <Button onClick={searchPlayerInServers} disabled={searchingPlayer}>
                            {searchingPlayer ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                          </Button>
                        </div>

                        {/* Search Progress */}
                        {searchingPlayer && searchProgress.current > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-3"
                          >
                            <p className="text-sm text-muted-foreground">Searching servers...</p>
                            <p className="text-lg font-semibold text-primary">
                              {searchProgress.current} servers checked
                            </p>
                          </motion.div>
                        )}

                        {/* Player Found */}
                        {playerServer && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-500 font-semibold mb-1">Player Found!</p>
                                <p className="text-sm mb-1">{playerServer.displayName} is playing in a server</p>
                                <p className="text-xs text-muted-foreground">
                                  Server: {playerServer.server.playing}/{gameData.maxPlayers} players • Ping:{" "}
                                  {playerServer.server.ping}ms
                                </p>
                              </div>
                              <Button asChild size="sm">
                                <a
                                  href={getJoinLink(playerServer.server, playerServer.gameInstanceId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2"
                                >
                                  Join
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>

                    {servers.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Active Servers ({servers.length})
                          </CardTitle>
                          <CardDescription>Browse and join available game servers</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2 max-h-96 overflow-y-auto pr-2">
                            {servers.slice(0, 20).map((server: any, idx: number) => (
                              <Card key={idx} className="bg-muted/30 hover:bg-muted/50 transition-all border-border/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                          <Users className="h-4 w-4 text-primary" />
                                          <span className="font-medium">
                                            {server.playing}/{gameData.maxPlayers}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={`w-2 h-2 rounded-full ${server.ping < 100 ? "bg-green-500" : server.ping < 200 ? "bg-yellow-500" : "bg-red-500"}`}
                                          />
                                          <span className="text-sm text-muted-foreground">{server.ping}ms</span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-muted-foreground">Server ID: {server.id}</p>
                                    </div>
                                    <Button asChild size="sm" variant="outline">
                                      <a
                                        href={getJoinLink(server)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2"
                                      >
                                        Join
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                          {servers.length > 20 && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              Showing 20 of {servers.length} servers
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
