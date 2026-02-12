"use client"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function CodeEditor({ value, onChange, placeholder, readOnly = false, className }) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-slate-500 font-medium ml-2">{readOnly ? "output.lua" : "input.lua"}</span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "min-h-[400px] max-h-[500px] resize-none border-0 rounded-none",
          "bg-transparent text-slate-100 placeholder:text-slate-600",
          "font-mono text-sm leading-relaxed p-4",
          "focus-visible:ring-0 focus-visible:ring-offset-0",
          readOnly && "cursor-default",
        )}
        spellCheck={false}
      />
      <div className="absolute bottom-3 right-3 text-xs text-slate-600 font-mono">
        {value ? `${(new Blob([value]).size / 1024).toFixed(1)} KB` : "0 KB"}
      </div>
    </div>
  )
}
