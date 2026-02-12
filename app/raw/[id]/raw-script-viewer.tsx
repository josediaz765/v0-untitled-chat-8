"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Script {
  id: string
  title: string
  content: string
  author_id: string
  is_private: boolean
  is_html_viewer: boolean
  public_custom_html?: boolean
  updated_at: string
  created_at: string
  api_key_source?: string
}

const CodeHighlighter = ({ code }: { code: string }) => {
  const highlightLua = (text: string) => {
    let highlighted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")

    const keywords = [
      "local",
      "function",
      "end",
      "if",
      "then",
      "else",
      "for",
      "while",
      "do",
      "return",
      "true",
      "false",
      "nil",
    ]
    const functions = ["print", "loadstring", "game", "HttpGet", "require"]

    keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g")
      highlighted = highlighted.replace(regex, `<span class="lua-keyword">${keyword}</span>`)
    })

    functions.forEach((func) => {
      const regex = new RegExp(`\\b${func}\\b`, "g")
      highlighted = highlighted.replace(regex, `<span class="lua-function">${func}</span>`)
    })

    highlighted = highlighted.replace(/&quot;([^&]*)&quot;/g, '<span class="lua-string">&quot;$1&quot;</span>')
    highlighted = highlighted.replace(/&#39;([^&]*)&#39;/g, '<span class="lua-string">&#39;$1&#39;</span>')
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span class="lua-number">$1</span>')
    highlighted = highlighted.replace(/--([^\n]*)/g, '<span class="lua-comment">--$1</span>')

    return highlighted
  }

  return (
    <>
      <style>{`
        .lua-keyword { color: #ff79c6; }
        .lua-function { color: #50fa7b; }
        .lua-string { color: #f1fa8c; }
        .lua-number { color: #bd93f9; }
        .lua-comment { color: #6272a4; }
      `}</style>
      <div
        dangerouslySetInnerHTML={{ __html: highlightLua(code) }}
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          fontSize: "13px",
          lineHeight: "1.6",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          color: "#f8f8f2",
        }}
      />
    </>
  )
}

export default function RawScriptViewer({ script }: { script: Script }) {
  const [expanded, setExpanded] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  const MAX_PREVIEW_LINES = 10

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(type)
      setTimeout(() => setCopyFeedback(""), 2000)
    })
  }

  if (!mounted) {
    return null
  }

  if (script.is_private) {
    const identifier =
      script.title && script.title.trim() && /^[a-zA-Z0-9\s\-_]+$/.test(script.title.trim())
        ? script.title.trim()
        : script.id

    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
    const rawUrl = `${baseUrl}/raw/${encodeURIComponent(identifier)}`
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
          color: "#fff",
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          overflowX: "hidden",
          padding: "20px",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(20px)",
              border: "2px solid rgba(219, 39, 119, 0.3)",
              borderRadius: "24px",
              padding: "40px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(219, 39, 119, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "rgba(219, 39, 119, 0.2)",
                border: "1px solid rgba(219, 39, 119, 0.5)",
                color: "#f472b6",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              ACCESS BLOCKED
            </div>

            <div style={{ fontSize: "80px", marginBottom: "24px", textAlign: "center" }}>🔒</div>

            <h1
              style={{
                fontSize: "32px",
                marginBottom: "8px",
                fontWeight: "700",
                color: "#f472b6",
                textAlign: "center",
              }}
            >
              Security Breach Detected
            </h1>

            <div
              style={{
                fontSize: "16px",
                color: "#cbd5e1",
                marginBottom: "24px",
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              Protected API Script Endpoint
            </div>

            <div
              style={{
                background: "rgba(219, 39, 119, 0.1)",
                border: "1px solid rgba(219, 39, 119, 0.3)",
                borderRadius: "16px",
                padding: "20px",
                margin: "24px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "24px", flexShrink: 0, marginTop: "2px" }}>⚠️</div>
              <div>
                <div
                  style={{
                    color: "#f472b6",
                    fontWeight: "600",
                    marginBottom: "4px",
                  }}
                >
                  Source Code Hidden
                </div>
                <div
                  style={{
                    color: "#cbd5e1",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  Your access request has been denied by our security protocols. This is a protected endpoint.
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: "16px",
                padding: "24px",
                margin: "32px 0",
              }}
            >
              <div
                style={{
                  color: "#22c55e",
                  fontSize: "14px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                🔗 Execution Loadstring
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                  fontSize: "13px",
                  color: "#a7f3d0",
                  wordBreak: "break-all",
                  marginBottom: "16px",
                  background: "rgba(0,0,0,0.3)",
                  padding: "16px",
                  borderRadius: "8px",
                  border: "1px solid rgba(34, 197, 94, 0.1)",
                  lineHeight: "1.5",
                }}
              >
                {loadstring}
              </div>
              <button
                onClick={() => handleCopy(loadstring, "loadstring")}
                style={{
                  background: "linear-gradient(45deg, #22c55e, #16a34a)",
                  color: "white",
                  border: "none",
                  padding: "14px 28px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 20px rgba(34, 197, 94, 0.3)",
                  width: "100%",
                }}
              >
                {copyFeedback === "loadstring" ? "✅ Copied!" : "📋 Copy Loadstring"}
              </button>
            </div>

            <div
              style={{
                marginTop: "32px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
              }}
            >
              {[
                { icon: "⚡", text: "Instant execution in all Roblox executors" },
                { icon: "🔒", text: "Source code protected from viewing" },
                { icon: "🌐", text: "Fast HTTP connection & reliable loading" },
                { icon: "📱", text: "Compatible with mobile & desktop executors" },
                { icon: "🚀", text: "Optimized performance & error handling" },
                { icon: "🔄", text: "Auto-updates with API key changes" },
              ].map((feature, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    fontSize: "14px",
                    color: "#e2e8f0",
                    transition: "all 0.3s ease",
                  }}
                >
                  <span style={{ fontSize: "18px", color: "#22c55e" }}>{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const codeLines = script.content.split("\n")
  const isCodeLong = codeLines.length > MAX_PREVIEW_LINES
  const previewCode = expanded ? script.content : codeLines.slice(0, MAX_PREVIEW_LINES).join("\n")

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const rawUrl = `${baseUrl}/raw/${encodeURIComponent(script.title || script.id)}`
  const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a0033 50%, #1a0033 100%)",
        color: "#f8f8f2",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        lineHeight: "1.6",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(139, 233, 253, 0.2)",
            borderRadius: "16px",
            padding: "32px",
            marginBottom: "30px",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "start",
              gap: "20px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  margin: "0 0 10px 0",
                  color: "#8be9fd",
                }}
              >
                {script.title}
              </h1>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(139, 233, 253, 0.2)",
                  border: "1px solid rgba(139, 233, 253, 0.5)",
                  color: "#8be9fd",
                  padding: "6px 12px",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                🌐 Public
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            <div>
              <div style={{ color: "#6272a4", fontSize: "12px", marginBottom: "4px", textTransform: "uppercase" }}>
                Created
              </div>
              <div style={{ color: "#f1fa8c", fontWeight: "600" }}>
                {new Date(script.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ color: "#6272a4", fontSize: "12px", marginBottom: "4px", textTransform: "uppercase" }}>
                Last Updated
              </div>
              <div style={{ color: "#f1fa8c", fontWeight: "600" }}>
                {new Date(script.updated_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div style={{ color: "#6272a4", fontSize: "12px", marginBottom: "4px", textTransform: "uppercase" }}>
                Script ID
              </div>
              <div style={{ color: "#f1fa8c", fontWeight: "600", fontSize: "12px", wordBreak: "break-all" }}>
                {script.id.substring(0, 16)}...
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "30px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 16px 0",
              color: "#22c55e",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            🔗 Loadstring
          </h2>
          <div
            style={{
              background: "#1e1e2e",
              border: "1px solid rgba(34, 197, 94, 0.1)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: "13px",
              color: "#a7f3d0",
              wordBreak: "break-all",
              lineHeight: "1.6",
            }}
          >
            {loadstring}
          </div>
          <button
            onClick={() => handleCopy(loadstring, "loadstring")}
            style={{
              background: "linear-gradient(45deg, #22c55e, #16a34a)",
              color: "black",
              border: "none",
              padding: "12px 24px",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
              width: "100%",
            }}
          >
            {copyFeedback === "loadstring" ? "✅ Copied to Clipboard!" : "📋 Copy Loadstring"}
          </button>
        </div>

        <div
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(241, 250, 140, 0.2)",
            borderRadius: "16px",
            padding: "24px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              margin: "0 0 16px 0",
              color: "#f1fa8c",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📄 Source Code
            {isCodeLong && (
              <span style={{ fontSize: "12px", color: "#6272a4", marginLeft: "auto" }}>
                {expanded ? `${codeLines.length} lines` : `${MAX_PREVIEW_LINES} of ${codeLines.length} lines`}
              </span>
            )}
          </h2>

          <div
            style={{
              background: "#1e1e2e",
              border: "1px solid rgba(241, 250, 140, 0.1)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
              overflow: "auto",
              maxHeight: expanded ? "none" : "400px",
            }}
          >
            <CodeHighlighter code={previewCode} />
            {isCodeLong && !expanded && (
              <div
                style={{
                  background: "linear-gradient(transparent, #1e1e2e)",
                  height: "40px",
                  marginTop: "-40px",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingBottom: "8px",
                }}
              >
                <span style={{ color: "#6272a4", fontSize: "12px" }}>... code continues below</span>
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {isCodeLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: expanded ? "rgba(139, 233, 253, 0.2)" : "rgba(139, 233, 253, 0.1)",
                  color: "#8be9fd",
                  border: "1px solid rgba(139, 233, 253, 0.3)",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "600",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {expanded ? (
                  <>
                    <ChevronUp size={18} /> Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} /> Load More
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => handleCopy(script.content, "source")}
              style={{
                background: "linear-gradient(45deg, #f1fa8c, #e8f635)",
                color: "black",
                border: "none",
                padding: "12px 24px",
                borderRadius: "12px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "600",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(241, 250, 140, 0.3)",
              }}
            >
              {copyFeedback === "source" ? "✅ Copied to Clipboard!" : "📋 Copy Source Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
