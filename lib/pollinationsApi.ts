export interface RenameResult {
  original: string
  renamed: string
  success: boolean
}

const API_TIMEOUT = 15000

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

function parseJSONResponse(text: string): { mappings?: Record<string, string> } {
  // Try direct JSON parse
  try {
    const parsed = JSON.parse(text)
    if (parsed.mappings) return parsed
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      return { mappings: parsed }
    }
  } catch {}

  // Try extracting from code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim())
      if (parsed.mappings) return parsed
      if (typeof parsed === "object") return { mappings: parsed }
    } catch {}
  }

  // Find JSON object
  const jsonMatch = text.match(/\{[\s\S]*"mappings"[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch {}
  }

  return {}
}

export async function renameBatchVariables(
  variables: Array<{ name: string; occurrences: number }>,
  code: string,
  onProgress?: (current: number, total: number, result: RenameResult) => void,
): Promise<{ results: RenameResult[]; processedCode: string }> {
  const results: RenameResult[] = []
  const mappings: Record<string, string> = {}
  const usedNames = new Set<string>()

  // Process variables in smaller batches for better AI responses
  const batchSize = 20

  for (let i = 0; i < variables.length; i += batchSize) {
    const batch = variables.slice(i, i + batchSize)

    // Get context for each variable
    const varContexts = batch
      .map((v) => {
        const lines = code.split("\n").filter((line) => line.includes(v.name))
        return `${v.name}: ${lines[0]?.trim().slice(0, 100) || "variable"}`
      })
      .join("\n")

    const prompt = `Rename these Lua variables to meaningful names. Return JSON only.
Variables:
${varContexts}

Avoid these names: ${Array.from(usedNames).slice(-20).join(", ") || "none"}

Return format: {"mappings": {"oldName": "newName", ...}}`

    try {
      const response = await fetchWithTimeout(
        "/api/ai-rename",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, selectedModel: "openai" }),
        },
        API_TIMEOUT,
      )

      const result = await response.json()
      const batchMappings = result.mappings || {}

      // Process results
      for (const variable of batch) {
        let renamed = batchMappings[variable.name]
        let success = false

        if (renamed && typeof renamed === "string" && renamed.length > 0) {
          // Ensure unique name
          let uniqueName = renamed
          let counter = 1
          while (usedNames.has(uniqueName)) {
            uniqueName = `${renamed}${counter}`
            counter++
          }
          usedNames.add(uniqueName)
          mappings[variable.name] = uniqueName
          renamed = uniqueName
          success = true
        } else {
          // Fallback naming
          renamed = `var_${i + batch.indexOf(variable)}`
          let counter = 1
          while (usedNames.has(renamed)) {
            renamed = `var_${i + batch.indexOf(variable)}_${counter}`
            counter++
          }
          usedNames.add(renamed)
          mappings[variable.name] = renamed
        }

        const renameResult: RenameResult = {
          original: variable.name,
          renamed,
          success,
        }

        results.push(renameResult)

        if (onProgress) {
          onProgress(i + batch.indexOf(variable) + 1, variables.length, renameResult)
        }
      }
    } catch (error) {
      // On error, use fallback names for the batch
      for (const variable of batch) {
        const fallbackName = `var_${i + batch.indexOf(variable)}`
        let uniqueName = fallbackName
        let counter = 1
        while (usedNames.has(uniqueName)) {
          uniqueName = `${fallbackName}_${counter}`
          counter++
        }
        usedNames.add(uniqueName)
        mappings[variable.name] = uniqueName

        results.push({
          original: variable.name,
          renamed: uniqueName,
          success: false,
        })

        if (onProgress) {
          onProgress(i + batch.indexOf(variable) + 1, variables.length, {
            original: variable.name,
            renamed: uniqueName,
            success: false,
          })
        }
      }
    }
  }

  // Apply all mappings to code
  let processedCode = code
  const sortedMappings = Object.entries(mappings).sort((a, b) => b[0].length - a[0].length)

  for (const [oldName, newName] of sortedMappings) {
    const regex = new RegExp(`\\b${oldName}\\b`, "g")
    processedCode = processedCode.replace(regex, newName)
  }

  return { results, processedCode }
}
