// Base44 API Client for Vercel AI integration
// This provides LLM access for the renamer AI features

export const base44 = {
  integrations: {
    Core: {
      async InvokeLLM({
        prompt,
        response_json_schema,
      }: {
        prompt: string
        response_json_schema?: object
      }) {
        try {
          const response = await fetch("/api/ai-rename", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt,
              schema: response_json_schema,
            }),
          })

          if (!response.ok) {
            throw new Error("LLM request failed")
          }

          return await response.json()
        } catch (error) {
          console.error("Base44 LLM Error:", error)
          return null
        }
      },
    },
  },
}
