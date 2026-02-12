"use client"
import { motion } from "framer-motion"
import { Loader2, Clock, Zap } from "lucide-react"

export default function ProgressBar({ progress, currentChunk, totalChunks, eta, isProcessing }) {
  if (!isProcessing) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          <span className="text-sm font-medium text-slate-200">
            Processing batch {currentChunk} of {totalChunks}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-mono">{progress}%</span>
          </div>
          {eta && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/10 rounded-md border border-cyan-500/20">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-sm font-mono font-bold text-cyan-400">{eta}</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </motion.div>
      </div>

      <div className="flex justify-between mt-2">
        <p className="text-xs text-slate-500">Analyzing variable contexts for accurate renaming</p>
        <p className="text-xs text-slate-400">
          {currentChunk * 25} / ~{totalChunks * 25} vars
        </p>
      </div>
    </motion.div>
  )
}
