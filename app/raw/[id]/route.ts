import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
  is_disabled?: boolean
}

async function getScript(id: string) {
  try {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    let result

    if (uuidRegex.test(id)) {
      // Try UUID lookup first
      result = await supabase.from("scripts").select("*").eq("id", id).single()
    } else {
      // Fall back to title lookup (decode URL encoding)
      const decodedTitle = decodeURIComponent(id)
      result = await supabase.from("scripts").select("*").eq("title", decodedTitle).single()
    }

    return result
  } catch (error) {
    return { data: null, error }
  }
}

function generateHTMLViewer(script: Script, baseUrl: string): string {
  const isPrivate = script.is_private
  const identifier = script.title?.trim() || script.id
  const rawUrl = `${baseUrl}/raw/${encodeURIComponent(identifier)}`
  const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`

  if (isPrivate) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${script.title} - Private Script</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @keyframes neonGlow {
      0%, 100% {
        box-shadow: 
          0 0 20px rgba(168, 85, 247, 0.4),
          0 0 40px rgba(168, 85, 247, 0.3),
          0 0 60px rgba(239, 68, 68, 0.2),
          inset 0 0 20px rgba(168, 85, 247, 0.1);
        border-color: rgba(168, 85, 247, 0.6);
      }
      50% {
        box-shadow: 
          0 0 30px rgba(239, 68, 68, 0.4),
          0 0 50px rgba(239, 68, 68, 0.3),
          0 0 70px rgba(168, 85, 247, 0.2),
          inset 0 0 30px rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.6);
      }
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a0520 30%, #0f0520 60%, #0a0a0f 100%);
      background-size: 200% 200%;
      animation: gradientShift 15s ease infinite;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      background: rgba(20, 10, 30, 0.7);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(168, 85, 247, 0.5);
      border-radius: 24px;
      padding: 48px;
      max-width: 650px;
      width: 100%;
      animation: neonGlow 4s ease-in-out infinite;
      position: relative;
      overflow: hidden;
    }
    
    .container::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, 
        transparent,
        rgba(168, 85, 247, 0.3),
        transparent,
        rgba(239, 68, 68, 0.3),
        transparent
      );
      background-size: 400% 400%;
      animation: gradientShift 8s linear infinite;
      border-radius: 24px;
      z-index: -1;
    }
    
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }
    
    .lock-icon {
      font-size: 64px;
      margin-bottom: 16px;
      line-height: 1;
      filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.6));
    }
    
    h1 { 
      font-size: 36px; 
      margin-bottom: 8px; 
      font-weight: 700; 
      background: linear-gradient(135deg, #a855f7, #ef4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .badge {
      display: inline-block;
      background: rgba(168, 85, 247, 0.2);
      border: 1px solid rgba(168, 85, 247, 0.6);
      color: #c084fc;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 12px;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
    }
    
    .alert {
      background: rgba(168, 85, 247, 0.08);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
      font-size: 14px;
      line-height: 1.7;
      color: #cbd5e1;
    }
    
    .alert strong { 
      color: #c084fc; 
      display: block; 
      margin-bottom: 8px; 
      font-size: 15px;
    }
    
    .loadstring-section {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
    }
    
    .section-title {
      color: #4ade80;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .code {
      font-family: 'Courier New', 'SF Mono', monospace;
      font-size: 13px;
      color: #86efac;
      word-break: break-all;
      background: rgba(0,0,0,0.5);
      padding: 16px;
      border-radius: 10px;
      border: 1px solid rgba(34, 197, 94, 0.2);
      margin-bottom: 18px;
      line-height: 1.6;
    }
    
    .copy-btn {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: none;
      padding: 16px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      width: 100%;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
      transition: all 0.3s ease;
    }
    
    .copy-btn:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
    }
    
    .copy-btn:active {
      transform: translateY(-1px);
    }
    
    .features {
      margin-top: 28px;
      display: grid;
      gap: 14px;
    }
    
    .feature {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      background: rgba(168, 85, 247, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(168, 85, 247, 0.15);
      font-size: 14px;
      color: #e2e8f0;
      transition: all 0.2s;
    }
    
    .feature:hover {
      background: rgba(168, 85, 247, 0.1);
      border-color: rgba(168, 85, 247, 0.3);
    }
    
    .feature-icon { 
      font-size: 22px; 
      flex-shrink: 0;
      filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.5));
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="lock-icon">🔒</div>
      <h1>${script.title}</h1>
      <div class="badge">PRIVATE</div>
    </div>
    
    <div class="alert">
      <strong>Source Code Protected</strong>
      This script is private. The source code is hidden from view but remains fully executable through the loadstring below.
    </div>
    
    <div class="loadstring-section">
      <div class="section-title">Execution Loadstring</div>
      <div class="code">${loadstring}</div>
      <button class="copy-btn" onclick="copyLoadstring()">Copy Loadstring</button>
    </div>
    
    <div class="features">
      <div class="feature">
        <span class="feature-icon">⚡</span>
        <span>Instant execution in all Roblox executors</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🔒</span>
        <span>Source code protected from viewing</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🌐</span>
        <span>Fast and reliable HTTP loading</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🚀</span>
        <span>Compatible with mobile and desktop executors</span>
      </div>
    </div>
  </div>
  
  <script>
    function copyLoadstring() {
      navigator.clipboard.writeText('${loadstring.replace(/'/g, "\\'")}').then(() => {
        const btn = document.querySelector('.copy-btn');
        const original = btn.textContent;
        btn.textContent = 'Copied to Clipboard!';
        btn.style.background = 'linear-gradient(135deg, #a855f7, #ef4444)';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        }, 2000);
      });
    }
  </script>
</body>
</html>`
  }

  // Public HTML viewer
  const highlightedCode = highlightLua(script.content)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${script.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0e27 0%, #1a0033 50%, #1a0033 100%);
      color: #f8f8f2;
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      padding: 20px;
    }
    .container { max-width: 1000px; margin: 0 auto; }
    .header {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(139, 233, 253, 0.2);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 30px;
      backdrop-filter: blur(10px);
    }
    h1 { font-size: 36px; color: #8be9fd; margin-bottom: 10px; }
    .badge {
      display: inline-block;
      background: rgba(139, 233, 253, 0.2);
      border: 1px solid rgba(139, 233, 253, 0.5);
      color: #8be9fd;
      padding: 6px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .meta-item { }
    .meta-label { color: #6272a4; font-size: 12px; margin-bottom: 4px; text-transform: uppercase; }
    .meta-value { color: #f1fa8c; font-weight: 600; }
    .section {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 30px;
      backdrop-filter: blur(10px);
    }
    .section.loadstring { border: 1px solid rgba(34, 197, 94, 0.2); }
    .section.code { border: 1px solid rgba(241, 250, 140, 0.2); }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .code-box {
      background: #1e1e2e;
      border: 1px solid rgba(241, 250, 140, 0.1);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      overflow: auto;
      max-height: 600px;
    }
    .loadstring-code {
      background: #1e1e2e;
      border: 1px solid rgba(34, 197, 94, 0.1);
      border-radius: 12px;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: #a7f3d0;
      word-break: break-all;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .copy-btn {
      background: linear-gradient(45deg, #f1fa8c, #e8f635);
      color: black;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(241, 250, 140, 0.3);
      width: 100%;
    }
    .copy-btn.green {
      background: linear-gradient(45deg, #22c55e, #16a34a);
      color: white;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
    }
    .copy-btn:hover { transform: translateY(-2px); opacity: 0.9; }
    .lua-keyword { color: #ff79c6; }
    .lua-function { color: #50fa7b; }
    .lua-string { color: #f1fa8c; }
    .lua-number { color: #bd93f9; }
    .lua-comment { color: #6272a4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${script.title}</h1>
      <span class="badge">🌐 Public</span>
      <div class="meta">
        <div class="meta-item">
          <div class="meta-label">Created</div>
          <div class="meta-value">${new Date(script.created_at).toLocaleDateString()}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Last Updated</div>
          <div class="meta-value">${new Date(script.updated_at).toLocaleDateString()}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Script ID</div>
          <div class="meta-value" style="font-size: 12px; word-break: break-all;">${script.id.substring(0, 16)}...</div>
        </div>
      </div>
    </div>
    
    <div class="section loadstring">
      <div class="section-title" style="color: #22c55e;">🔗 Loadstring</div>
      <div class="loadstring-code">${loadstring}</div>
      <button class="copy-btn green" onclick="copyText('${loadstring.replace(/'/g, "\\'")}', this, 'Loadstring')">📋 Copy Loadstring</button>
    </div>

    <div class="section code">
      <div class="section-title" style="color: #f1fa8c;">📄 Source Code</div>
      <div class="code-box">${highlightedCode}</div>
      <button class="copy-btn" onclick="copyText(\`${script.content.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`, this, 'Source Code')">📋 Copy Source Code</button>
    </div>
  </div>
  <script>
    function copyText(text, btn, type) {
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied to Clipboard!';
        setTimeout(() => btn.textContent = originalText, 2000);
      });
    }
  </script>
</body>
</html>`
}

function highlightLua(code: string): string {
  let highlighted = code
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
    "elseif",
    "for",
    "while",
    "do",
    "return",
    "true",
    "false",
    "nil",
    "and",
    "or",
    "not",
    "break",
    "repeat",
    "until",
  ]
  const functions = ["print", "loadstring", "game", "HttpGet", "require", "wait", "spawn", "GetService"]

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

  return `<pre style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all; color: #f8f8f2; margin: 0;">${highlighted}</pre>`
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params

  const { data: script, error } = await getScript(id)

  if (error || !script) {
    return new NextResponse("-- Script not found", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  if (script.is_disabled) {
    const acceptHeader = request.headers.get("accept") || ""
    const isBrowser = acceptHeader.includes("text/html")

    if (isBrowser) {
      const disabledHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Script Disabled</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #0f0f23 50%, #16213e 100%);
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(239, 68, 68, 0.4);
      border-radius: 24px;
      padding: 48px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px rgba(239, 68, 68, 0.3);
    }
    .icon {
      font-size: 72px;
      margin-bottom: 24px;
      line-height: 1;
    }
    h1 { 
      font-size: 28px; 
      margin-bottom: 16px; 
      font-weight: 700; 
      color: #ef4444;
    }
    p {
      font-size: 16px;
      color: #cbd5e1;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .contact {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 14px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚫</div>
    <h1>Script Disabled</h1>
    <p>This script has been disabled and is no longer available for execution.</p>
    <p>If you believe this is an error, please contact the script owner.</p>
    <div class="contact">
      <strong>Need Help?</strong><br>
      Contact the owner of this script for more information.
    </div>
  </div>
</body>
</html>`

      return new NextResponse(disabledHTML, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    } else {
      return new NextResponse('game.Players.LocalPlayer:Kick("This script has been disabled by its owner")', {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }
  }

  const acceptHeader = request.headers.get("accept") || ""
  const isRobloxExecutor = !acceptHeader.includes("text/html")
  const publicCustomHtml = script.public_custom_html ?? true

  if (isRobloxExecutor) {
    return new NextResponse(script.content || "-- Empty script", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  if (script.is_private) {
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    const identifier = script.title?.trim() || script.id
    const rawUrl = `${baseUrl}/raw/${encodeURIComponent(identifier)}`
    const loadstring = `loadstring(game:HttpGet("${rawUrl}"))()`

    const privateHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${script.title} - Private Script</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    @keyframes neonGlow {
      0%, 100% {
        box-shadow: 
          0 0 20px rgba(168, 85, 247, 0.4),
          0 0 40px rgba(168, 85, 247, 0.3),
          0 0 60px rgba(239, 68, 68, 0.2),
          inset 0 0 20px rgba(168, 85, 247, 0.1);
        border-color: rgba(168, 85, 247, 0.6);
      }
      50% {
        box-shadow: 
          0 0 30px rgba(239, 68, 68, 0.4),
          0 0 50px rgba(239, 68, 68, 0.3),
          0 0 70px rgba(168, 85, 247, 0.2),
          inset 0 0 30px rgba(239, 68, 68, 0.1);
        border-color: rgba(239, 68, 68, 0.6);
      }
    }
    
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a0520 30%, #0f0520 60%, #0a0a0f 100%);
      background-size: 200% 200%;
      animation: gradientShift 15s ease infinite;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .container {
      background: rgba(20, 10, 30, 0.7);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(168, 85, 247, 0.5);
      border-radius: 24px;
      padding: 48px;
      max-width: 650px;
      width: 100%;
      animation: neonGlow 4s ease-in-out infinite;
      position: relative;
      overflow: hidden;
    }
    
    .container::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, 
        transparent,
        rgba(168, 85, 247, 0.3),
        transparent,
        rgba(239, 68, 68, 0.3),
        transparent
      );
      background-size: 400% 400%;
      animation: gradientShift 8s linear infinite;
      border-radius: 24px;
      z-index: -1;
    }
    
    .header {
      text-align: center;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(168, 85, 247, 0.2);
    }
    
    .lock-icon {
      font-size: 64px;
      margin-bottom: 16px;
      line-height: 1;
      filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.6));
    }
    
    h1 { 
      font-size: 36px; 
      margin-bottom: 8px; 
      font-weight: 700; 
      background: linear-gradient(135deg, #a855f7, #ef4444);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .badge {
      display: inline-block;
      background: rgba(168, 85, 247, 0.2);
      border: 1px solid rgba(168, 85, 247, 0.6);
      color: #c084fc;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 12px;
      box-shadow: 0 0 15px rgba(168, 85, 247, 0.3);
    }
    
    .alert {
      background: rgba(168, 85, 247, 0.08);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 28px;
      font-size: 14px;
      line-height: 1.7;
      color: #cbd5e1;
    }
    
    .alert strong { 
      color: #c084fc; 
      display: block; 
      margin-bottom: 8px; 
      font-size: 15px;
    }
    
    .loadstring-section {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 16px;
      padding: 28px;
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
    }
    
    .section-title {
      color: #4ade80;
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .code {
      font-family: 'Courier New', 'SF Mono', monospace;
      font-size: 13px;
      color: #86efac;
      word-break: break-all;
      background: rgba(0,0,0,0.5);
      padding: 16px;
      border-radius: 10px;
      border: 1px solid rgba(34, 197, 94, 0.2);
      margin-bottom: 18px;
      line-height: 1.6;
    }
    
    .copy-btn {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      border: none;
      padding: 16px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 600;
      width: 100%;
      box-shadow: 0 4px 20px rgba(34, 197, 94, 0.4);
      transition: all 0.3s ease;
    }
    
    .copy-btn:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 8px 30px rgba(34, 197, 94, 0.5);
    }
    
    .copy-btn:active {
      transform: translateY(-1px);
    }
    
    .features {
      margin-top: 28px;
      display: grid;
      gap: 14px;
    }
    
    .feature {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      background: rgba(168, 85, 247, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(168, 85, 247, 0.15);
      font-size: 14px;
      color: #e2e8f0;
      transition: all 0.2s;
    }
    
    .feature:hover {
      background: rgba(168, 85, 247, 0.1);
      border-color: rgba(168, 85, 247, 0.3);
    }
    
    .feature-icon { 
      font-size: 22px; 
      flex-shrink: 0;
      filter: drop-shadow(0 0 5px rgba(168, 85, 247, 0.5));
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="lock-icon">🔒</div>
      <h1>${script.title}</h1>
      <div class="badge">PRIVATE</div>
    </div>
    
    <div class="alert">
      <strong>Source Code Protected</strong>
      This script is private. The source code is hidden from view but remains fully executable through the loadstring below.
    </div>
    
    <div class="loadstring-section">
      <div class="section-title">Execution Loadstring</div>
      <div class="code">${loadstring}</div>
      <button class="copy-btn" onclick="copyLoadstring()">Copy Loadstring</button>
    </div>
    
    <div class="features">
      <div class="feature">
        <span class="feature-icon">⚡</span>
        <span>Instant execution in all Roblox executors</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🔒</span>
        <span>Source code protected from viewing</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🌐</span>
        <span>Fast and reliable HTTP loading</span>
      </div>
      <div class="feature">
        <span class="feature-icon">🚀</span>
        <span>Compatible with mobile and desktop executors</span>
      </div>
    </div>
  </div>
  
  <script>
    function copyLoadstring() {
      navigator.clipboard.writeText('${loadstring.replace(/'/g, "\\'")}').then(() => {
        const btn = document.querySelector('.copy-btn');
        const original = btn.textContent;
        btn.textContent = 'Copied to Clipboard!';
        btn.style.background = 'linear-gradient(135deg, #a855f7, #ef4444)';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        }, 2000);
      });
    }
  </script>
</body>
</html>`

    return new NextResponse(privateHTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  if (!publicCustomHtml) {
    return new NextResponse(script.content || "-- Empty script", {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const html = generateHTMLViewer(script, baseUrl)

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  })
}
