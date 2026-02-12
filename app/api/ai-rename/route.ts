export async function POST(request: Request) {
  try {
    const { prompt, selectedModel = "openai" } = await request.json()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                'You are a code variable renaming expert. Return ONLY valid JSON with a \'mappings\' property. No explanations. Example: {"mappings": {"x": "playerPosition", "fn": "calculateScore"}}',
            },
            { role: "user", content: prompt },
          ],
          model: selectedModel,
          private: true, // Response won't appear in public feed
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error")
        return Response.json(
          {
            error: `API error: ${response.status}`,
            details: errorText,
            mappings: {},
          },
          { status: response.status },
        )
      }

      const content = await response.text()

      if (!content || content.trim() === "") {
        return Response.json({
          error: "Empty response from AI",
          details: "The AI model returned an empty response. Try a different model.",
          mappings: {},
        })
      }

      const parseJSON = (text: string): { mappings: Record<string, string> } | null => {
        // Try direct parse
        try {
          const parsed = JSON.parse(text)
          if (parsed.mappings) return parsed
          if (typeof parsed === "object" && !Array.isArray(parsed)) return { mappings: parsed }
        } catch {}

        // Try extracting from markdown code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) {
          try {
            const parsed = JSON.parse(codeBlockMatch[1].trim())
            if (parsed.mappings) return parsed
            if (typeof parsed === "object" && !Array.isArray(parsed)) return { mappings: parsed }
          } catch {}
        }

        // Try finding JSON object with mappings
        const jsonMatch = text.match(/\{[\s\S]*"mappings"[\s\S]*\}/)
        if (jsonMatch) {
          try {
            // Find the balanced braces
            let depth = 0
            let start = -1
            let end = -1
            for (let i = 0; i < text.length; i++) {
              if (text[i] === "{") {
                if (depth === 0) start = i
                depth++
              } else if (text[i] === "}") {
                depth--
                if (depth === 0) {
                  end = i + 1
                  const candidate = text.slice(start, end)
                  if (candidate.includes('"mappings"')) {
                    try {
                      return JSON.parse(candidate)
                    } catch {}
                  }
                }
              }
            }
          } catch {}
        }

        // Try any JSON object
        const anyJson = text.match(/\{[^{}]*\}/)
        if (anyJson) {
          try {
            const parsed = JSON.parse(anyJson[0])
            if (typeof parsed === "object" && !Array.isArray(parsed)) {
              return { mappings: parsed }
            }
          } catch {}
        }

        return null
      }

      const result = parseJSON(content)
      if (result) {
        return Response.json(result)
      }

      return Response.json({
        error: "Failed to parse AI response",
        details: `Could not extract JSON. Response: ${content.slice(0, 200)}`,
        mappings: {},
      })
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      const error = fetchError as Error

      if (error.name === "AbortError") {
        return Response.json(
          {
            error: "Request timeout",
            details: "Request took too long (>20s). Try 'Fast' mode or a different model.",
            mappings: {},
          },
          { status: 408 },
        )
      }
      throw fetchError
    }
  } catch (error: unknown) {
    const err = error as Error
    return Response.json(
      {
        error: "Failed to process request",
        details: err?.message || "An unexpected error occurred",
        mappings: {},
      },
      { status: 500 },
    )
  }
}
