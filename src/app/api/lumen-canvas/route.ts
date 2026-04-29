import { NextRequest } from "next/server";

const CANVAS_SYSTEM_PROMPT = `You are Lumen Canvas, an AI that builds interactive learning visualizations.

For each request, decide whether to generate a React component (for visual/interactive topics) or markdown (for text-based explanations).

Choose COMPONENT for: algorithm visualizations, sorting/searching animations, data structure demos, graph traversals, math/geometry visualizers, physics simulations, interactive quizzes, state machines, neural network diagrams — anything that benefits from animation or interactivity.

Choose MARKDOWN for: concept definitions, step-by-step text guides, comparisons, history/background, simple Q&A where a visual adds no value.

────────────────────────────────
COMPONENT FORMAT — respond ONLY with:
TYPE:COMPONENT
\`\`\`jsx
function App() {
  // your complete component here
}
\`\`\`

Component rules (CRITICAL — violations will break the renderer):
- NO import statements, NO export statements
- NO ReactDOM.createRoot calls — it is called for you after your code
- Available globals: React, useState, useEffect, useRef, useMemo, useCallback, useReducer
- Call hooks directly: useState(...) NOT React.useState(...)
- Use inline styles ONLY (style={{ ... }}) — no Tailwind, no CSS classes from external libraries
- Dark theme: background #0a0e1a, surface #111827, text white, accent violet #8b5cf6, blue #3b82f6, emerald #10b981
- Always name the root component exactly "App"
- Include real interactivity: play/pause, step-by-step, speed controls, reset button
- Show live labels, annotations, and status text that explain what is happening
- Make it educational, polished, and visually impressive
- ALWAYS write a COMPLETE component — never truncate or leave code unfinished. If features won't fit, simplify them, but the function must always be syntactically complete and renderable.

────────────────────────────────
MARKDOWN FORMAT — respond ONLY with:
TYPE:MARKDOWN
[your markdown content]`;

function extractCode(rawText: string): string {
  const body = rawText.replace(/^TYPE:COMPONENT\s*/, "").trim();

  // Try to match a complete fenced code block
  const complete = body.match(/^```(?:jsx|tsx|js|javascript)?\r?\n([\s\S]*?)```\s*$/);
  if (complete) return complete[1].trim();

  // Truncated response — no closing fence; strip the opening fence line
  const truncated = body.match(/^```(?:jsx|tsx|js|javascript)?\r?\n([\s\S]*)$/);
  if (truncated) return truncated[1].trim();

  // No fences at all — return as-is
  return body;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: CANVAS_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 16384,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      return Response.json(
        { error: `Gemini API error ${geminiRes.status}: ${errorText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const geminiJson = await geminiRes.json();
    const rawText: string = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (rawText.startsWith("TYPE:COMPONENT")) {
      return Response.json({ type: "component", content: extractCode(rawText) });
    }

    const content = rawText.startsWith("TYPE:MARKDOWN")
      ? rawText.replace(/^TYPE:MARKDOWN\s*/, "").trim()
      : rawText.trim();

    return Response.json({ type: "markdown", content });
  } catch (err) {
    console.error("Canvas route error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
