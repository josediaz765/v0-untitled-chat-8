"use client"

import { useRef, useEffect } from "react"

interface VariableInfo {
  name: string
  occurrences: number
}

interface CodeEditorProps {
  code: string
  onChange?: (code: string) => void
  readOnly?: boolean
  highlightVariables?: VariableInfo[]
  renamedVariables?: Map<string, string>
  className?: string
}

export function CodeEditor({
  code,
  onChange,
  readOnly = false,
  highlightVariables = [],
  renamedVariables,
  className = "",
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const codeDisplayRef = useRef<HTMLDivElement>(null)

  const lines = code.split("\n")

  useEffect(() => {
    const syncScroll = () => {
      if (lineNumbersRef.current && textareaRef.current) {
        lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
      }
      if (codeDisplayRef.current && textareaRef.current) {
        codeDisplayRef.current.scrollTop = textareaRef.current.scrollTop
        codeDisplayRef.current.scrollLeft = textareaRef.current.scrollLeft
      }
    }

    const textarea = textareaRef.current
    textarea?.addEventListener("scroll", syncScroll)
    return () => textarea?.removeEventListener("scroll", syncScroll)
  }, [])

  return (
    <div
      className={`code-editor relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/80 ${className}`}
    >
      <div className="flex h-full">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="flex-shrink-0 py-3 px-2 text-right text-muted-foreground font-mono text-xs sm:text-sm select-none overflow-hidden border-r border-border bg-secondary/30"
          style={{ minWidth: "2.5rem" }}
        >
          {lines.map((_, i) => (
            <div key={i} className="leading-5 sm:leading-6 h-5 sm:h-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code area */}
        <div className="flex-1 relative min-w-0">
          {readOnly ? (
            <div
              ref={codeDisplayRef}
              className="p-3 font-mono text-xs sm:text-sm overflow-auto h-full scrollbar-thin text-slate-100"
            >
              {lines.map((line, i) => (
                <div key={i} className="leading-5 sm:leading-6 h-5 sm:h-6 whitespace-pre">
                  {line || " "}
                </div>
              ))}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => onChange?.(e.target.value)}
              className="w-full h-full p-3 bg-transparent font-mono text-xs sm:text-sm resize-none outline-none scrollbar-thin leading-5 sm:leading-6 text-slate-100 focus:ring-0 focus:outline-none"
              placeholder="Paste your Lua code here..."
              spellCheck={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}
