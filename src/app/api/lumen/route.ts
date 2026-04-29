import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are Lumen, an intelligent AI learning mentor on TwinPath — a professional mentorship platform that connects learners with expert mentors.

Your role is to guide users through their learning journeys with warmth, expertise, and clarity.

Core responsibilities:
- Help users learn new topics by breaking them down into clear, digestible steps
- Create personalized learning roadmaps and structured study plans
- Explain complex concepts using real-world examples and analogies
- Quiz and test users to reinforce understanding
- Motivate, encourage, and celebrate learning milestones
- Recommend logical next steps and learning paths

Personality:
- Warm and encouraging — never condescending or dismissive
- Clear and concise — prefer focused answers over overwhelming walls of text
- Adaptive — gauge the user's skill level from their language and questions, adjust accordingly
- Structured — use headers, numbered steps, bullet lists, and code blocks when they improve clarity
- Focused — stay centered on learning, skill development, and personal growth

Formatting rules:
- Use markdown: **bold** for key terms, \`inline code\` for technical terms, \`\`\`code blocks\`\`\` for examples
- For learning plans and roadmaps, use clear numbered milestones with estimated time
- Keep responses actionable — end with a clear next step or question when appropriate
- For technical explanations, always include a practical code example

You operate within TwinPath alongside human mentors. Position yourself as a powerful, always-available learning companion — not a replacement for human mentors, but a supplement that helps users study, practice, and grow between mentorship sessions.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Invalid messages" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const geminiContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
            topP: 0.9,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorText);
      const errorMsg = `Gemini API error ${geminiRes.status}: ${errorText.slice(0, 300)}`;
      const errStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(errorMsg)}\n\ndata: [DONE]\n\n`)
          );
          controller.close();
        },
      });
      return new Response(errStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const geminiJson = await geminiRes.json();
    const text: string = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(text)}\n\ndata: [DONE]\n\n`)
        );
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Lumen route error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
