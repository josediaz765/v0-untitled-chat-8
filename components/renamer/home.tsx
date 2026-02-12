"use client"

import { useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Code2, Sparkles, Zap } from "lucide-react"
import CodeEditor from "@/components/renamer/code-editor"
import ProgressBar from "@/components/renamer/progress-bar"
import ActionButtons from "@/components/renamer/action-buttons"
import MiniGames from "@/components/renamer/mini-games"
import ProcessingQueue, { type QueueItem, MAX_QUEUE_SIZE } from "@/components/renamer/processing-queue"
import { toast } from "sonner"

const CHUNK_SIZE_THRESHOLD = 400 * 1024
const VARS_PER_BATCH_NORMAL = 50 // Increased from 25
const VARS_PER_BATCH_FAST = 300 // Increased from 200
const MAX_RETRY_PASSES = 2 // Reduced from 3
const API_TIMEOUT = 15000 // Reduced from 30000
const MAX_RETRIES_PER_BATCH = 1 // Reduced from 2

const PAYLOAD_HEADER = `--renamed by verbal ai\n\n`

export default function Home() {
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
  const [selectedModel, setSelectedModel] = useState("openai")
  const [processingQueue, setProcessingQueue] = useState<QueueItem[]>([])
  const [currentError, setCurrentError] = useState<{ message: string; details: string } | null>(null)
  const etaIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const extractAllVariables = (code: string) => {
    const varPattern = /\b(v[u]?\d+|p[u]?\d+)\b/g
    const variables = new Set<string>()
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

  const getVariableContext = (code: string, varName: string) => {
    const lines = code.split("\n")
    const contexts: string[] = []
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(varName)) {
        contexts.push(lines[i].trim())
        if (contexts.length >= 3) break
      }
    }
    return contexts.join("\n")
  }

  const updateQueueItem = useCallback((id: string, updates: Partial<QueueItem>) => {
    setProcessingQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  const fetchWithRetry = async (url: string, options: RequestInit, retries = 1): Promise<Response> => {
    let lastError: Error | null = null

    for (let i = 0; i <= retries; i++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok || response.status < 500) {
          return response
        }

        lastError = new Error(`Server error: ${response.status}`)
      } catch (err) {
        lastError = err as Error
      }

      if (i < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    throw lastError || new Error("Failed after retries")
  }

  const formatEta = (seconds: number): string => {
    if (seconds <= 0) return "Finishing..."
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `ETA: ${mins}:${secs.toString().padStart(2, "0")}`
    }
    return `ETA: ${seconds}s`
  }

  const canAddToQueue = useCallback(() => {
    return processingQueue.length < MAX_QUEUE_SIZE
  }, [processingQueue.length])

  // Enhanced non-AI renaming - comprehensive pattern matching
  const basicRename = useCallback(() => {
    if (!canAddToQueue()) {
      toast.error(`Queue is full (max ${MAX_QUEUE_SIZE}). Remove items to continue.`)
      return
    }

    setIsProcessing(true)
    setOutput("")
    setCurrentError(null)

    const queueId = `basic-${Date.now()}`
    const allVariables = extractAllVariables(input)

    setProcessingQueue((prev) => [
      ...prev,
      {
        id: queueId,
        fileName: "Current Input",
        status: "processing",
        progress: 0,
        variablesTotal: allVariables.length,
        variablesRenamed: 0,
        startTime: Date.now(),
      },
    ])

    setTimeout(() => {
      try {
        let result = input
        const variables = extractAllVariables(input)
        const mappings: Record<string, string> = {}
        const usedNames = new Set<string>()

        const getUniqueName = (baseName: string) => {
          // Clean the base name
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

        // Pattern matching for variable renaming (same as before)
        variables.forEach((v, index) => {
          const ctx = getVariableContext(input, v).toLowerCase()
          let baseName = "reference"

          // Smart context-based naming
          if (ctx.includes("player") || ctx.includes("plr")) baseName = "playerRef"
          else if (ctx.includes("character") || ctx.includes("char")) baseName = "characterRef"
          else if (ctx.includes("humanoid") || ctx.includes("hum")) baseName = "humanoidRef"
          else if (ctx.includes("part") || ctx.includes("basepart")) baseName = "partRef"
          else if (ctx.includes("model")) baseName = "modelRef"
          else if (ctx.includes("service")) baseName = "serviceRef"
          else if (ctx.includes("event") || ctx.includes("connect")) baseName = "eventConnection"
          else if (ctx.includes("remote")) baseName = "remoteRef"
          else if (ctx.includes("tween")) baseName = "tweenRef"
          else if (ctx.includes("sound")) baseName = "soundRef"
          else if (ctx.includes("animation") || ctx.includes("anim")) baseName = "animRef"
          else if (ctx.includes("gui") || ctx.includes("frame") || ctx.includes("button")) baseName = "guiElement"
          else if (ctx.includes("camera") || ctx.includes("cam")) baseName = "cameraRef"
          else if (ctx.includes("vector")) baseName = "vectorVal"
          else if (ctx.includes("cframe")) baseName = "cframeVal"
          else if (ctx.includes("color")) baseName = "colorVal"
          else if (ctx.includes("position") || ctx.includes("pos")) baseName = "positionVal"
          else if (ctx.includes("size")) baseName = "sizeVal"
          else if (ctx.includes("speed")) baseName = "speedVal"
          else if (ctx.includes("time") || ctx.includes("wait") || ctx.includes("delay")) baseName = "timeVal"
          else if (ctx.includes("index") || ctx.includes("idx")) baseName = "indexVal"
          else if (ctx.includes("count") || ctx.includes("num") || ctx.includes("amount")) baseName = "countVal"
          else if (ctx.includes("name")) baseName = "nameStr"
          else if (ctx.includes("text") || ctx.includes("string") || ctx.includes('"')) baseName = "textStr"
          else if (ctx.includes("table") || ctx.includes("{}") || ctx.includes("[]")) baseName = "dataTable"
          else if (ctx.includes("function") || ctx.includes("func") || ctx.includes("callback")) baseName = "funcRef"
          else if (ctx.includes("result") || ctx.includes("return")) baseName = "resultVal"
          else if (ctx.includes("success") || ctx.includes("pcall")) baseName = "successFlag"
          else if (ctx.includes("true") || ctx.includes("false") || ctx.includes("bool")) baseName = "boolFlag"
          else if (ctx.includes("loop") || ctx.includes("for ") || ctx.includes("pairs") || ctx.includes("ipairs"))
            baseName = "loopItem"
          else if (ctx.includes("child")) baseName = "childRef"
          else if (ctx.includes("parent")) baseName = "parentRef"
          else if (ctx.includes("clone")) baseName = "clonedRef"
          else if (ctx.includes("instance")) baseName = "instanceRef"
          else if (ctx.includes("value") || ctx.includes(".value")) baseName = "storedValue"
          else if (ctx.includes("data") || ctx.includes("info")) baseName = "dataRef"
          else if (ctx.includes("config") || ctx.includes("settings")) baseName = "configRef"
          else if (ctx.includes("module") || ctx.includes("require")) baseName = "moduleRef"
          else if (v.startsWith("p")) baseName = "paramRef"
          else baseName = "localRef"

          mappings[v] = getUniqueName(baseName)

          // Update progress
          updateQueueItem(queueId, {
            progress: Math.round(((index + 1) / variables.length) * 100),
            variablesRenamed: index + 1,
          })
        })

        // Apply mappings
        const sortedMappings = Object.entries(mappings).sort((a, b) => b[0].length - a[0].length)
        for (const [oldName, newName] of sortedMappings) {
          const regex = new RegExp(`\\b${oldName}\\b`, "g")
          result = result.replace(regex, newName)
        }

        result = PAYLOAD_HEADER + result
        setOutput(result)

        updateQueueItem(queueId, {
          status: "completed",
          progress: 100,
          variablesRenamed: variables.length,
          output: result,
          endTime: Date.now(),
        })

        toast.success(`Renamed ${variables.length} variables`)
      } catch (error: any) {
        updateQueueItem(queueId, {
          status: "error",
          error: "Renaming failed",
          errorDetails: error?.message || "An unexpected error occurred",
          endTime: Date.now(),
        })
        setCurrentError({
          message: "Renaming failed",
          details: error?.message || "An unexpected error occurred",
        })
        toast.error("Renaming failed")
      } finally {
        setIsProcessing(false)
      }
    }, 100)
  }, [input, updateQueueItem, canAddToQueue])

  const aiRename = useCallback(async () => {
    if (!input.trim()) {
      toast.error("Please enter some code to rename")
      return
    }

    if (!canAddToQueue()) {
      toast.error(`Queue is full (max ${MAX_QUEUE_SIZE}). Remove items to continue.`)
      return
    }

    setIsProcessing(true)
    setOutput("")
    setProgress(0)
    setCurrentError(null)
    startTimeRef.current = Date.now()
    abortControllerRef.current = new AbortController()

    const queueId = `ai-${Date.now()}`
    const allVariables = extractAllVariables(input)

    if (allVariables.length === 0) {
      toast.info("No obfuscated variables found to rename")
      setIsProcessing(false)
      return
    }

    setProcessingQueue((prev) => [
      ...prev,
      {
        id: queueId,
        fileName: "Current Input",
        status: "processing",
        progress: 0,
        eta: "Calculating...",
        variablesTotal: allVariables.length,
        variablesRenamed: 0,
        startTime: Date.now(),
      },
    ])

    try {
      const varContexts: Record<string, string> = {}
      allVariables.forEach((v) => {
        varContexts[v] = getVariableContext(input, v)
      })

      const batchSize = fastMode ? VARS_PER_BATCH_FAST : VARS_PER_BATCH_NORMAL

      const batches: string[][] = []
      for (let i = 0; i < allVariables.length; i += batchSize) {
        batches.push(allVariables.slice(i, i + batchSize))
      }

      setTotalChunks(batches.length)
      const estimatedTime = fastMode ? Math.max(batches.length * 3, 10) : Math.max(batches.length * 8, 15)
      setEtaSeconds(estimatedTime)

      updateQueueItem(queueId, {
        eta: formatEta(estimatedTime),
      })

      const globalMappings: Record<string, string> = {}
      const usedNames = new Set<string>()

      const updateLivePreview = (mappings: Record<string, string>) => {
        if (!livePreview) return
        let result = input
        const sortedMappings = Object.entries(mappings).sort((a, b) => b[0].length - a[0].length)
        for (const [oldName, newName] of sortedMappings) {
          const regex = new RegExp(`\\b${oldName}\\b`, "g")
          result = result.replace(regex, newName)
        }
        setOutput(PAYLOAD_HEADER + result)
      }

      let failedBatches = 0
      const MAX_FAILED_BATCHES = Math.ceil(batches.length * 0.5) // Allow 50% failures

      const processBatch = async (batch: string[], batchIndex: number): Promise<Record<string, string>> => {
        if (abortControllerRef.current?.signal.aborted) {
          return {}
        }

        const batchWithContext = batch.map((v) => `${v}: ${varContexts[v].split("\n")[0].slice(0, 100)}`).join("\n")
        const existingNames = Object.values(globalMappings).slice(-30).join(", ")

        const prompt = `Rename these Lua variables to meaningful names. Return JSON only.
Variables:
${batchWithContext}

Avoid names: ${existingNames || "none"}

Return: {"mappings": {"oldName": "newName", ...}}`

        try {
          const response = await fetchWithRetry("/api/ai-rename", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              selectedModel,
            }),
          })

          const result = await response.json()

          if (result.error && !result.mappings) {
            throw new Error(result.details || result.error)
          }

          return result?.mappings || {}
        } catch (err) {
          console.warn(`Batch ${batchIndex + 1} failed:`, (err as Error).message)
          return {}
        }
      }

      for (let i = 0; i < batches.length; i += 2) {
        if (abortControllerRef.current?.signal.aborted) break

        setCurrentChunk(Math.min(i + 2, batches.length))
        const currentProgress = Math.round(((i + 1) / batches.length) * 85)
        setProgress(currentProgress)

        // Update ETA
        if (i > 0 && startTimeRef.current) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000
          const avgPerBatch = elapsed / (i + 1)
          const remaining = Math.max(0, (batches.length - i - 1) * avgPerBatch * 0.5) // Account for parallelism
          setEtaSeconds(Math.ceil(remaining))
          updateQueueItem(queueId, {
            progress: currentProgress,
            eta: formatEta(Math.ceil(remaining)),
            variablesRenamed: Object.keys(globalMappings).length,
          })
        }

        // Process up to 2 batches in parallel
        const batchPromises = []
        batchPromises.push(processBatch(batches[i], i))
        if (i + 1 < batches.length) {
          batchPromises.push(processBatch(batches[i + 1], i + 1))
        }

        const results = await Promise.all(batchPromises)

        // Merge results
        for (const mappings of results) {
          if (Object.keys(mappings).length === 0) {
            failedBatches++
          }
          for (const [oldName, newName] of Object.entries(mappings)) {
            if (!globalMappings[oldName] && oldName && newName && typeof newName === "string") {
              let finalName = newName
              // Reject generic names
              if (/^(var|param|arg|v)\d*$/i.test(finalName)) {
                const ctx = varContexts[oldName] || ""
                if (ctx.includes("Player")) finalName = "playerRef"
                else if (ctx.includes("Part")) finalName = "partRef"
                else if (ctx.includes("Service")) finalName = "serviceRef"
                else if (ctx.includes("function")) finalName = "funcRef"
                else finalName = "localVar"
              }

              let counter = 1
              let uniqueName = finalName
              while (usedNames.has(uniqueName)) {
                uniqueName = `${finalName}${counter}`
                counter++
              }
              usedNames.add(uniqueName)
              globalMappings[oldName] = uniqueName
            }
          }
        }

        updateLivePreview(globalMappings)

        if (failedBatches > MAX_FAILED_BATCHES) {
          throw new Error(`Too many batches failed (${failedBatches}/${batches.length})`)
        }
      }

      setProgress(90)
      updateQueueItem(queueId, { progress: 90 })

      const unmapped = allVariables.filter((v) => !globalMappings[v])
      if (unmapped.length > 0 && unmapped.length < 100) {
        toast.info(`Quick retry for ${unmapped.length} remaining variables...`)

        const retryMappings = await processBatch(unmapped, -1)
        for (const [oldName, newName] of Object.entries(retryMappings)) {
          if (!globalMappings[oldName] && newName) {
            let uniqueName = newName
            let counter = 1
            while (usedNames.has(uniqueName)) {
              uniqueName = `${newName}${counter}`
              counter++
            }
            usedNames.add(uniqueName)
            globalMappings[oldName] = uniqueName
          }
        }
        updateLivePreview(globalMappings)
      }

      // Fallback for any still unmapped
      const stillUnmapped = allVariables.filter((v) => !globalMappings[v])
      if (stillUnmapped.length > 0) {
        stillUnmapped.forEach((v, idx) => {
          const ctx = varContexts[v] || ""
          let baseName = "var"
          if (ctx.includes("Player")) baseName = "player"
          else if (ctx.includes("function")) baseName = "func"
          else if (ctx.includes("table")) baseName = "tbl"

          let uniqueName = `${baseName}_${idx + 1}`
          while (usedNames.has(uniqueName)) {
            uniqueName = `${baseName}_${idx + 1}_${Date.now() % 1000}`
          }
          usedNames.add(uniqueName)
          globalMappings[v] = uniqueName
        })
        updateLivePreview(globalMappings)
      }

      // Final output
      let finalResult = input
      const sortedMappings = Object.entries(globalMappings).sort((a, b) => b[0].length - a[0].length)
      for (const [oldName, newName] of sortedMappings) {
        const regex = new RegExp(`\\b${oldName}\\b`, "g")
        finalResult = finalResult.replace(regex, newName)
      }

      const finalOutput = PAYLOAD_HEADER + finalResult
      setOutput(finalOutput)
      setProgress(100)

      const endTime = Date.now()
      const duration = ((endTime - (startTimeRef.current || endTime)) / 1000).toFixed(1)

      updateQueueItem(queueId, {
        status: "completed",
        progress: 100,
        output: finalOutput,
        variablesRenamed: Object.keys(globalMappings).length,
        endTime,
        eta: `Done in ${duration}s`,
      })

      toast.success(`Renamed ${Object.keys(globalMappings).length} variables in ${duration}s`)
    } catch (error: unknown) {
      const err = error as Error
      const errorMessage = err.message || "Unknown error"

      let errorDetails = "An unexpected error occurred during AI renaming."
      if (errorMessage.includes("timeout") || errorMessage.includes("Timeout")) {
        errorDetails = "Request took too long. Try 'Fast' mode or a different model."
      } else if (errorMessage.includes("Too many batches failed")) {
        errorDetails = "API may be overloaded. Try again in a minute or use 'Rename (No AI)'."
      } else if (errorMessage.includes("cancelled")) {
        errorDetails = "Processing was cancelled."
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        errorDetails = "Network error. Check your connection and try again."
      }

      updateQueueItem(queueId, {
        status: "error",
        error: errorMessage,
        errorDetails: errorDetails,
        endTime: Date.now(),
      })

      setCurrentError({
        message: errorMessage,
        details: errorDetails,
      })

      toast.error("AI renaming failed. See error details.")
    } finally {
      setIsProcessing(false)
      setProgress(0)
      setCurrentChunk(0)
      setTotalChunks(0)
      setEtaSeconds(0)
      abortControllerRef.current = null
      if (etaIntervalRef.current) {
        clearInterval(etaIntervalRef.current)
      }
    }
  }, [input, fastMode, livePreview, selectedModel, canAddToQueue, updateQueueItem])

  const handleViewOutput = useCallback((item: QueueItem) => {
    if (item.output) {
      setOutput(item.output)
      toast.success("Output loaded")
    }
  }, [])

  const handleRetry = useCallback(
    (item: QueueItem) => {
      // Remove the failed item and retry
      setProcessingQueue((prev) => prev.filter((i) => i.id !== item.id))
      aiRename()
    },
    [aiRename],
  )

  const handleRemoveFromQueue = useCallback((id: string) => {
    setProcessingQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }, [output])

  const handleClear = useCallback(() => {
    setInput("")
    setOutput("")
    setCurrentError(null)
  }, [])

  const handleUpload = useCallback((content: string) => {
    setInput(content)
    setOutput("")
    setCurrentError(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/20">
              <Code2 className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Variable Renamer
            </h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Transform obfuscated code into readable source with intelligent variable renaming
          </p>

          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Zap className="w-4 h-4 text-teal-400" />
              <span>Pattern Matching</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <ActionButtons
            onAIRename={aiRename}
            onBasicRename={basicRename}
            onUpload={handleUpload}
            onClear={handleClear}
            onCopy={handleCopy}
            isProcessing={isProcessing}
            hasInput={!!input.trim()}
            hasOutput={!!output.trim()}
            copied={copied}
            fastMode={fastMode}
            onFastModeToggle={() => setFastMode(!fastMode)}
            livePreview={livePreview}
            onLivePreviewToggle={() => setLivePreview(!livePreview)}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </motion.div>

        <AnimatePresence>
          {currentError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-red-400">{currentError.message}</p>
                  <p className="text-sm text-red-300/70 mt-1">{currentError.details}</p>
                </div>
                <button onClick={() => setCurrentError(null)} className="text-red-400 hover:text-red-300">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProcessing && totalChunks > 0 && (
            <motion.div className="mb-6">
              <ProgressBar
                progress={progress}
                currentChunk={currentChunk}
                totalChunks={totalChunks}
                eta={formatEta(etaSeconds)}
                isProcessing={isProcessing}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {processingQueue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <ProcessingQueue
                items={processingQueue}
                onViewOutput={handleViewOutput}
                onRetry={handleRetry}
                onRemove={handleRemoveFromQueue}
                canAddMore={canAddToQueue()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Input Code</h2>
            </div>
            <CodeEditor value={input} onChange={setInput} placeholder="Paste your obfuscated code here..." />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-teal-400" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Renamed Output</h2>
            </div>
            <CodeEditor value={output} readOnly placeholder="Renamed code will appear here..." />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-10 text-slate-600 text-sm"
        >
          <p>Optimized for Lua/Roblox scripts</p>
        </motion.div>
      </div>

      {/* Mini Games Widget */}
      <MiniGames />
    </div>
  )
}
