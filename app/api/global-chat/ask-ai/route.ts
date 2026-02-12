import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, prompt, conversationHistory = [] } = await request.json()

    if (!apiKey || !prompt) {
      return NextResponse.json({ error: "API key and prompt are required" }, { status: 400 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available", setup_required: true }, { status: 500 })
    }

    // Verify API key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("user_id")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Build messages for AI
    const systemPrompt = {
      role: "system",
      content: `You are a helpful AI assistant in a Roblox global chat system. You help players with questions, provide information, and engage in friendly conversation. Keep responses concise and helpful.`,
    }

    const messages = [systemPrompt, ...conversationHistory, { role: "user", content: prompt }]

    // Call Pollinations.AI using OpenAI-compatible endpoint
    const aiResponse = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai",
        messages: messages,
        temperature: 0.7,
      }),
    })

    if (!aiResponse.ok) {
      console.error("Pollinations.AI error:", await aiResponse.text())
      return NextResponse.json({ error: "AI service unavailable" }, { status: 500 })
    }

    const aiData = await aiResponse.json()
    const aiMessage = aiData.choices?.[0]?.message?.content || "I'm having trouble responding right now."

    // Store AI response in database as a chat message
    await supabaseAdmin.from("global_chat_messages").insert({
      api_key: apiKey,
      message: aiMessage,
      username: "AI Assistant",
      display_name: "AI Assistant",
      user_id: "0",
      thumbnail_url: null,
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      response: aiMessage,
      message: "AI response generated successfully",
    })
  } catch (error) {
    console.error("Error in AI endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
