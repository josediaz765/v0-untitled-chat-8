import { createClient } from "@supabase/supabase-js"
import RawScriptViewer from "../raw-script-viewer"

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
    let query = supabase.from("scripts").select("*")

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      query = query.eq("id", id)
    } else {
      query = query.eq("title", decodeURIComponent(id))
    }

    const { data, error } = await query.single()
    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

export default async function RawScriptViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: script, error } = await getScript(id)

  // Handle script not found
  if (error || !script) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "monospace" }}>
        <h1>Script Not Found</h1>
        <p>The script you are looking for does not exist.</p>
      </div>
    )
  }

  const publicCustomHtml = script.public_custom_html ?? true
  if (!publicCustomHtml) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "monospace",
          background: "#1e1e2e",
          color: "#f8f8f2",
          minHeight: "100vh",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h1 style={{ color: "#8be9fd", marginBottom: "20px" }}>
            {script.title} <span style={{ fontSize: "14px", color: "#6272a4" }}>(Raw Mode)</span>
          </h1>
          <pre
            style={{
              background: "#282a36",
              padding: "20px",
              borderRadius: "8px",
              overflow: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {script.content || "-- Empty script"}
          </pre>
        </div>
      </div>
    )
  }

  return <RawScriptViewer script={script} />
}
