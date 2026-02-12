"use client"

import { useState, useMemo, useCallback } from "react"
import { CodeEditor } from "./code-editor-new"
import { FileUpload } from "./file-upload-new"
import { VariableList } from "./variable-list-new"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { parseCode, removeComments } from "@/lib/luaParser"
import { renameBatchVariables, type RenameResult } from "@/lib/pollinationsApi"
import { Wand2, Download, Copy, Trash2, Code2, ListChecks, Loader2, CheckCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function RenamerApp() {
  const [inputCode, setInputCode] = useState("")
  const [outputCode, setOutputCode] = useState("")
  const [filename, setFilename] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<RenameResult[]>([])
  const [activeTab, setActiveTab] = useState("input")

  const parsedCode = useMemo(() => {
    if (!inputCode) return null
    // Parse a comment-stripped version so we don't detect/comment-rename junk.
    return parseCode(removeComments(inputCode))
  }, [inputCode])

  const handleFileLoad = useCallback((content: string, name: string) => {
    setInputCode(content)
    setFilename(name)
    setOutputCode("")
    setResults([])
    toast.success(`Loaded ${name}`)
  }, [])

  const handleRename = useCallback(async () => {
    if (!parsedCode || parsedCode.variables.length === 0) {
      toast.error("No cryptic variables found to rename")
      return
    }

    setIsProcessing(true)
    setProgress({ current: 0, total: parsedCode.variables.length })
    setResults([])

    try {
      // Remove comments first
      const cleanCode = removeComments(inputCode)

      // Throttle UI updates for huge files (avoids thousands of React renders)
      let buffered: RenameResult[] = []
      let flushTimer: number | null = null
      let latestProgress = { current: 0, total: parsedCode.variables.length }

      const flush = () => {
        if (buffered.length) {
          const batch = buffered
          buffered = []
          setResults((prev) => [...prev, ...batch])
        }
        setProgress(latestProgress)
        flushTimer = null
      }

      const { results: renameResults, processedCode } = await renameBatchVariables(
        parsedCode.variables,
        cleanCode,
        (current, total, result) => {
          latestProgress = { current, total }
          buffered.push(result)
          if (flushTimer == null) {
            flushTimer = window.setTimeout(flush, 50)
          }
        },
      )

      if (flushTimer != null) {
        window.clearTimeout(flushTimer)
        flushTimer = null
      }
      flush()
      setResults(renameResults)

      const PAYLOAD_HEADER = `--renamed by verbal ai\n\n`
      setOutputCode(PAYLOAD_HEADER + processedCode)
      setActiveTab("output")

      const successCount = renameResults.filter((r) => r.success).length
      toast.success(`Renamed ${successCount} of ${renameResults.length} variables`)
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Error: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setIsProcessing(false)
    }
  }, [inputCode, parsedCode])

  const handleCopy = useCallback(async (code: string) => {
    await navigator.clipboard.writeText(code)
    toast.success("Copied to clipboard")
  }, [])

  const handleDownload = useCallback(() => {
    const blob = new Blob([outputCode], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename ? filename.replace(".lua", "_renamed.lua") : "renamed_code.lua"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded")
  }, [outputCode, filename])

  const handleClear = useCallback(() => {
    setInputCode("")
    setOutputCode("")
    setFilename("")
    setResults([])
    setProgress({ current: 0, total: 0 })
  }, [])

  const renamedMap = useMemo(() => {
    const map = new Map<string, string>()
    results.forEach((r) => {
      if (r.success) {
        map.set(r.original, r.renamed)
      }
    })
    return map
  }, [results])

  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50 flex-shrink-0">
        <div className="px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold gradient-text truncate">LuaRenamer</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  AI-Powered Variable Renaming
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {inputCode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-destructive h-8 px-2 sm:px-3"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Clear</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="px-3 sm:px-6 py-4 sm:py-6">
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Main Editor Area */}
            <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
              {!inputCode ? (
                <div className="space-y-4">
                  <FileUpload onFileLoad={handleFileLoad} className="min-h-[200px] sm:min-h-[300px]" />

                  <div className="text-center text-muted-foreground text-sm">or paste code below</div>

                  <textarea
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    className="w-full h-[200px] sm:h-[300px] p-4 bg-code-bg rounded-lg border border-border font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-primary/50 scrollbar-thin text-slate-100"
                    placeholder="Paste your Lua code here..."
                    spellCheck={false}
                  />
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <TabsList className="bg-secondary w-full sm:w-auto">
                      <TabsTrigger value="input" className="gap-1.5 flex-1 sm:flex-initial text-xs sm:text-sm">
                        <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Input
                      </TabsTrigger>
                      <TabsTrigger
                        value="output"
                        className="gap-1.5 flex-1 sm:flex-initial text-xs sm:text-sm"
                        disabled={!outputCode}
                      >
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Output
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                      {activeTab === "output" && outputCode && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(outputCode)}
                            className="h-8 text-xs sm:text-sm"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            className="h-8 text-xs sm:text-sm bg-transparent"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            Download
                          </Button>
                        </>
                      )}
                      {activeTab === "input" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(inputCode)}
                          className="h-8 text-xs sm:text-sm"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copy
                        </Button>
                      )}
                    </div>
                  </div>

                  <TabsContent value="input" className="mt-0">
                    <CodeEditor
                      code={inputCode}
                      onChange={setInputCode}
                      highlightVariables={parsedCode?.variables || []}
                      className="h-[300px] sm:h-[400px] lg:h-[500px]"
                    />
                  </TabsContent>

                  <TabsContent value="output" className="mt-0">
                    <CodeEditor
                      code={outputCode}
                      readOnly
                      renamedVariables={renamedMap}
                      className="h-[300px] sm:h-[400px] lg:h-[500px]"
                    />
                  </TabsContent>
                </Tabs>
              )}

              {/* Processing Progress */}
              {isProcessing && (
                <div className="p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing variables...
                    </span>
                    <span className="text-foreground font-mono">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 order-1 lg:order-2">
              {/* Action Button */}
              <Button
                onClick={handleRename}
                disabled={!inputCode || isProcessing || parsedCode?.variables.length === 0}
                className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity glow-primary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {progress.current}/{progress.total}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Rename Variables
                  </>
                )}
              </Button>

              {/* Stats Card */}
              {parsedCode && (
                <div className="p-3 sm:p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-semibold text-sm sm:text-base">Analysis</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm">
                    <div className="p-2 sm:p-3 rounded-lg bg-secondary/50">
                      <p className="text-muted-foreground text-xs">Lines</p>
                      <p className="text-xl sm:text-2xl font-bold text-foreground">{parsedCode.lines.length}</p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-lg bg-secondary/50">
                      <p className="text-muted-foreground text-xs">Cryptic Vars</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">{parsedCode.variables.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Variables List */}
              {(parsedCode?.variables.length ?? 0) > 0 && (
                <div className="p-3 sm:p-4 rounded-xl bg-card border border-border max-h-[250px] sm:max-h-[350px] overflow-y-auto scrollbar-thin">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base sticky top-0 bg-card pb-2">
                    <Code2 className="w-4 h-4 text-primary" />
                    Variables
                    {results.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {results.filter((r) => r.success).length}/{results.length}
                      </span>
                    )}
                  </h3>
                  <VariableList variables={parsedCode?.variables || []} results={results} />
                </div>
              )}

              {/* Info Card - Hide on mobile when there's content */}
              <div
                className={`p-3 sm:p-4 rounded-xl bg-secondary/30 border border-border text-xs sm:text-sm text-muted-foreground ${inputCode ? "hidden lg:block" : ""}`}
              >
                <p className="mb-2">
                  <strong className="text-foreground">How it works:</strong>
                </p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Detects cryptic variables (v0, l_var_0)</li>
                  <li>Uses Pollinations AI for smart naming</li>
                  <li>Checks conflicts before renaming</li>
                  <li>Removes comments automatically</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
