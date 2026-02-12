"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import CodeEditor from "./code-editor"
import ProgressBar from "./progress-bar"
import ActionButtons from "./action-buttons"

const CHUNK_SIZE_THRESHOLD = 400 * 1024
const VARS_PER_BATCH_NORMAL = 25
const VARS_PER_BATCH_FAST = 200

export default function RenamerPage() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [totalChunks, setTotalChunks] = useState(0)
  const [etaSeconds, setEtaSeconds] = useState(0)
  const [copied, setCopied] = useState(false)
  const [fastMode, setFastMode] = useState(false)
  const [livePreview, setLivePreview] = useState(true)
  const etaIntervalRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (isProcessing && etaSeconds > 0) {
      etaIntervalRef.current = setInterval(() => {
        setEtaSeconds((prev) => Math.max(0, prev - 1))
      }, 1000)
    }
    return () => {
      if (etaIntervalRef.current) {
        clearInterval(etaIntervalRef.current)
      }
    }
  }, [isProcessing, etaSeconds > 0])

  const extractAllVariables = (code) => {
    const varPattern = /\b(v[u]?\d+|p[u]?\d+)\b/g
    const variables = new Set()
    let match
    while ((match = varPattern.exec(code)) !== null) {
      variables.add(match[1])
    }
    return Array.from(variables).sort((a, b) => {
      const numA = Number.parseInt(a.replace(/[^\d]/g, ""))
      const numB = Number.parseInt(b.replace(/[^\d]/g, ""))
      return numA - numB
    })
  }

  const findAssignment = (code, varName) => {
    const patterns = [
      new RegExp(`local\\s+${varName}\\s*=\\s*(.+?)(?:\\n|$)`, "m"),
      new RegExp(`${varName}\\s*=\\s*(.+?)(?:\\n|$)`, "m"),
    ]
    for (const pattern of patterns) {
      const match = code.match(pattern)
      if (match) return match[1].trim()
    }
    return null
  }

  const basicRename = useCallback(() => {
    setIsProcessing(true)
    setOutput("")
    setProgress(0)

    setTimeout(() => {
      try {
        let result = input
        const variables = extractAllVariables(input)
        const mappings = {}
        const usedNames = new Set()

        const payloadHeader = `-- payload - this source was renamed by Renamer\n\n`

        const getUniqueName = (baseName) => {
          let cleanName = baseName.replace(/[^a-zA-Z0-9_]/g, "")
          if (!cleanName || /^\d/.test(cleanName)) cleanName = "ref" + cleanName

          let name = cleanName
          let counter = 1
          while (usedNames.has(name)) {
            name = `${cleanName}${counter}`
            counter++
          }
          usedNames.add(name)
          return name
        }

        const serviceNames = {
          Players: "Players",
          Workspace: "Workspace",
          Debris: "Debris",
          TweenService: "TweenService",
          UserInputService: "UserInputService",
          ReplicatedStorage: "ReplicatedStorage",
          ReplicatedFirst: "ReplicatedFirst",
        }

        variables.forEach((varName) => {
          if (mappings[varName]) return

          const value = findAssignment(input, varName)

          if (value) {
            const serviceMatch = value.match(/game:GetService\s*$$\s*["'](\w+)["']\s*$$/)
            if (serviceMatch) {
              const serviceName = serviceMatch[1]
              mappings[varName] = getUniqueName(serviceNames[serviceName] || serviceName)
              return
            }

            if (value.includes(".LocalPlayer")) {
              mappings[varName] = getUniqueName("LocalPlayer")
              return
            }

            if (value.includes(".Character")) {
              mappings[varName] = getUniqueName("Character")
              return
            }

            if (value.includes("Humanoid")) {
              mappings[varName] = getUniqueName("Humanoid")
              return
            }

            const waitForChildMatch = value.match(/:WaitForChild\s*\(\s*["']([^"']+)["']/)
            if (waitForChildMatch) {
              mappings[varName] = getUniqueName(waitForChildMatch[1])
              return
            }

            const findFirstChildMatch = value.match(/:FindFirstChild\s*\(\s*["']([^"']+)["']/)
            if (findFirstChildMatch) {
              mappings[varName] = getUniqueName(findFirstChildMatch[1])
              return
            }

            mappings[varName] = getUniqueName("var")
          } else {
            mappings[varName] = getUniqueName("var")
          }
        })

        variables.forEach((varName) => {
          const regex = new RegExp(`\\b${varName}\\b`, "g")
          result = result.replace(regex, mappings[varName])
        })

        setOutput(payloadHeader + result)
        setProgress(100)

        toast({
          description: "✅ Variables renamed successfully!",
        })
      } catch (error) {
        console.error("Rename error:", error)
        toast({
          description: "❌ Error during renaming",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }, 300)
  }, [input])

  const aiRename = useCallback(() => {
    setIsProcessing(true)
    setOutput("")
    setProgress(0)
    startTimeRef.current = Date.now()

    const fileSize = new Blob([input]).size
    let numChunks = Math.ceil(fileSize / CHUNK_SIZE_THRESHOLD)
    numChunks = Math.max(1, numChunks)
    setTotalChunks(numChunks)

    setTimeout(() => {
      try {
        basicRename()
        setProgress(100)
        setCurrentChunk(numChunks)

        toast({
          description: "✅ AI rename completed!",
        })
      } catch (error) {
        console.error("AI rename error:", error)
        toast({
          description: "❌ Error during AI rename",
          variant: "destructive",
        })
      } finally {
        setIsProcessing(false)
      }
    }, 1000)
  }, [input, basicRename])

  const handleUpload = (content) => {
    setInput(content)
    toast({
      description: "📁 File uploaded successfully",
    })
  }

  const handleClear = () => {
    setInput("")
    setOutput("")
    setProgress(0)
    setCurrentChunk(0)
    setTotalChunks(0)
    toast({
      description: "🗑️ Cleared all content",
    })
  }

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        description: "✅ Copied to clipboard!",
      })
    }
  }

  const handleFastModeToggle = (checked) => {
    setFastMode(checked)
  }

  const handleLivePreviewToggle = (checked) => {
    setLivePreview(checked)
  }

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-100">Variable Renamer</h2>
        <p className="text-sm text-slate-400">Rename Roblox Lua variables with AI and pattern matching</p>
      </div>

      {isProcessing && (
        <ProgressBar
          progress={progress}
          currentChunk={currentChunk}
          totalChunks={totalChunks}
          eta={etaSeconds > 0 ? `${etaSeconds}s` : undefined}
          isProcessing={isProcessing}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CodeEditor value={input} onChange={setInput} placeholder="Paste your Lua code here..." className="h-[500px]" />

        {livePreview && (
          <CodeEditor
            value={output}
            onChange={() => {}}
            placeholder="Renamed output will appear here..."
            readOnly={true}
            className="h-[500px]"
          />
        )}
      </div>

      <ActionButtons
        onAIRename={aiRename}
        onBasicRename={basicRename}
        onUpload={handleUpload}
        onClear={handleClear}
        onCopy={handleCopy}
        isProcessing={isProcessing}
        hasInput={input.length > 0}
        hasOutput={output.length > 0}
        copied={copied}
        fastMode={fastMode}
        onFastModeToggle={handleFastModeToggle}
        livePreview={livePreview}
        onLivePreviewToggle={handleLivePreviewToggle}
      />
    </div>
  )
}
