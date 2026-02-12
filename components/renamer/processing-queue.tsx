"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCode,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export const MAX_QUEUE_SIZE = 5

export interface QueueItem {
  id: string
  fileName: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  eta?: string
  variablesTotal: number
  variablesRenamed: number
  error?: string
  errorDetails?: string
  output?: string
  startTime?: number
  endTime?: number
}

interface ProcessingQueueProps {
  items: QueueItem[]
  onViewOutput: (item: QueueItem) => void
  onRetry: (item: QueueItem) => void
  onRemove: (id: string) => void
  canAddMore: boolean
}

export default function ProcessingQueue({ items, onViewOutput, onRetry, onRemove, canAddMore }: ProcessingQueueProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getStatusIcon = (status: QueueItem["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-slate-400" />
      case "processing":
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
    }
  }

  const getStatusText = (item: QueueItem) => {
    switch (item.status) {
      case "pending":
        return "Waiting in queue..."
      case "processing":
        return `Renaming please wait... ${item.eta || ""}`
      case "completed":
        return `Completed - ${item.variablesRenamed} variables renamed`
      case "error":
        return item.error || "Failed"
    }
  }

  const getProcessingTime = (item: QueueItem) => {
    if (!item.startTime) return null
    const endTime = item.endTime || Date.now()
    const seconds = Math.floor((endTime - item.startTime) / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
    >
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">Processing Queue</h3>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className={`${items.length >= MAX_QUEUE_SIZE ? "text-amber-400" : "text-slate-400"}`}>
              {items.length}/{MAX_QUEUE_SIZE} slots used
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">{items.filter((i) => i.status === "completed").length} completed</span>
          </div>
        </div>
        {!canAddMore && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-xs text-amber-400 mt-2 flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3" />
            Queue is full. Remove items to add more.
          </motion.p>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="border-b border-slate-700/30 last:border-b-0"
            >
              <div
                className="p-4 hover:bg-slate-700/20 cursor-pointer transition-colors"
                onClick={() => toggleExpand(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.fileName}</p>
                      <p className="text-xs text-slate-400">{getStatusText(item)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.status === "processing" && (
                      <div className="text-right">
                        <p className="text-xs font-mono text-cyan-400">{item.progress}%</p>
                        <p className="text-xs text-slate-500">
                          {item.variablesRenamed}/{item.variablesTotal} vars
                        </p>
                      </div>
                    )}
                    {getProcessingTime(item) && (
                      <span className="text-xs text-slate-500 font-mono">{getProcessingTime(item)}</span>
                    )}
                    {(item.status === "completed" || item.status === "error") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemove(item.id)
                        }}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {expandedItems.has(item.id) ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </div>

                {/* Progress bar for processing items */}
                {item.status === "processing" && (
                  <div className="mt-3">
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {expandedItems.has(item.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Error details */}
                      {item.status === "error" && item.errorDetails && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-red-400">{item.error}</p>
                              <p className="text-xs text-red-300/70 mt-1">{item.errorDetails}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>
                          Variables: {item.variablesRenamed}/{item.variablesTotal}
                        </span>
                        {getProcessingTime(item) && <span>Time: {getProcessingTime(item)}</span>}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {item.status === "completed" && item.output && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewOutput(item)
                            }}
                            className="text-xs bg-slate-700/50 border-slate-600 hover:bg-slate-600"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View Output
                          </Button>
                        )}
                        {item.status === "error" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRetry(item)
                            }}
                            className="text-xs bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                          >
                            Retry
                          </Button>
                        )}
                        {(item.status === "completed" || item.status === "error") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              onRemove(item.id)
                            }}
                            className="text-xs text-slate-500 hover:text-red-400"
                          >
                            Remove from queue
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
