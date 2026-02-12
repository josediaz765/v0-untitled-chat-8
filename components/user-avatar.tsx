"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"

interface UserAvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  className?: string
}

export function UserAvatar({ src, alt, fallback, className }: UserAvatarProps) {
  const avatarSrc = src && src !== "/placeholder.svg" ? src : undefined

  return (
    <Avatar className={className}>
      {avatarSrc && <AvatarImage key={avatarSrc} src={avatarSrc || "/placeholder.svg"} alt={alt || "User avatar"} />}
      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        {fallback ? fallback.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  )
}

export default UserAvatar
