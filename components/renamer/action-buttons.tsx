"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sparkles, RefreshCw, Upload, Trash2, Copy, Check, Zap, Eye } from "lucide-react"
import { motion } from "framer-motion"

export default function ActionButtons({
  onAIRename,
  onBasicRename,
  onUpload,
  onClear,
  onCopy,
  isProcessing,
  hasInput,
  hasOutput,
  copied,
  fastMode,
  onFastModeToggle,
  livePreview,
  onLivePreviewToggle,
  onModelChange,
  selectedModel,
}) {
  const fileInputRef = React.useRef(null)
  const [models, setModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(true)

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch("https://text.pollinations.ai/models")
        const data = await response.json()

        // Filter for text generation models (not audio, image, etc.)
        const textModels = data
          .filter((model) => model.input_modalities?.includes("text") && model.output_modalities?.includes("text"))
          .slice(0, 8) // Limit to 8 models for UI simplicity

        setModels(textModels)
      } catch (error) {
        console.error("Failed to fetch models:", error)
        // Fallback models if API fails
        setModels([
          { name: "openai", description: "OpenAI GPT-5 Nano" },
          { name: "mistral", description: "Mistral Small 3.2 24B" },
          { name: "gemini", description: "Gemini 2.5 Flash Lite" },
          { name: "deepseek", description: "DeepSeek V3.1" },
        ])
      } finally {
        setLoadingModels(false)
      }
    }

    fetchModels()
  }, [])

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onUpload(event.target.result)
      }
      reader.readAsText(file)
    }
    e.target.value = ""
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".lua,.txt,.js,.py,.cpp,.c,.h,.hpp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onAIRename}
            disabled={!hasInput || isProcessing}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold px-6 py-5 rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Renamer
          </Button>
        </motion.div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <label htmlFor="model-select" className="text-xs text-slate-400">
            Model:
          </label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={isProcessing || loadingModels}
            className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600 hover:border-slate-500 disabled:opacity-50"
          >
            {loadingModels ? (
              <option>Loading models...</option>
            ) : (
              models.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.description || model.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <Zap className={`w-4 h-4 ${fastMode ? "text-yellow-400" : "text-slate-500"}`} />
          <Label htmlFor="fast-mode" className="text-xs text-slate-400 cursor-pointer">
            Fast
          </Label>
          <Switch
            id="fast-mode"
            checked={fastMode}
            onCheckedChange={onFastModeToggle}
            disabled={isProcessing}
            className="data-[state=checked]:bg-yellow-500"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <Eye className={`w-4 h-4 ${livePreview ? "text-green-400" : "text-slate-500"}`} />
          <Label htmlFor="live-preview" className="text-xs text-slate-400 cursor-pointer">
            Live
          </Label>
          <Switch
            id="live-preview"
            checked={livePreview}
            onCheckedChange={onLivePreviewToggle}
            disabled={isProcessing}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onBasicRename}
          disabled={!hasInput || isProcessing}
          variant="outline"
          className="border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 font-semibold px-6 py-5 rounded-xl disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Rename (No AI)
        </Button>
      </motion.div>

      <div className="h-8 w-px bg-slate-700 mx-2 hidden sm:block" />

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          variant="ghost"
          className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 px-4 py-5 rounded-xl"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onClear}
          disabled={(!hasInput && !hasOutput) || isProcessing}
          variant="ghost"
          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-5 rounded-xl disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button
          onClick={onCopy}
          disabled={!hasOutput}
          variant="ghost"
          className="text-slate-400 hover:text-green-400 hover:bg-green-500/10 px-4 py-5 rounded-xl disabled:opacity-50"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )
}
