"use client"

import type React from "react"

import { useCallback } from "react"
import { Upload, FileCode } from "lucide-react"

interface FileUploadProps {
  onFileLoad: (content: string, filename: string) => void
  className?: string
}

export function FileUpload({ onFileLoad, className = "" }: FileUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files[0]
    if (file) {
      readFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      readFile(file)
    }
  }, [])

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onFileLoad(content, file.name)
    }
    reader.readAsText(file)
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`relative border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 hover:border-primary hover:bg-primary/5 group ${className}`}
    >
      <input
        type="file"
        accept=".lua,.txt"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <FileCode className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        <div>
          <p className="text-foreground font-medium text-sm sm:text-base">Drop your Lua file here</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">or tap to browse</p>
        </div>

        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
          <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>.lua and .txt files</span>
        </div>
      </div>
    </div>
  )
}
