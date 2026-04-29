"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Palette,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
  canvasType?: "component" | "markdown" | "loading";
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

type Mode = "chat" | "canvas";

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "lumen_sessions";
const CURRENT_KEY = "lumen_current_id";

const CHAT_PROMPTS = [
  "Create a learning roadmap for React.js from beginner to advanced",
  "Explain the difference between REST and GraphQL APIs with examples",
  "Quiz me on JavaScript fundamentals — start easy and get harder",
  "I want to learn machine learning. Where should I begin?",
];

const CANVAS_PROMPTS = [
  "Visualize how Dijkstra's shortest path algorithm works step by step",
  "Show me a merge sort animation with color-coded comparisons",
  "Create an interactive binary search tree I can explore",
  "Visualize bubble sort vs quicksort side by side",
];

// ─── Canvas iframe builder ────────────────────────────────────────────────────

function buildSandboxHTML(code: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0e1a;color:#fff;font-family:system-ui,-apple-system,sans-serif;overflow:auto}
::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:3px}
</style>
<script>
window.addEventListener('error',function(e){
  var el=document.getElementById('root');
  if(el)el.innerHTML='<div style="padding:24px;color:#f87171;font-family:monospace;font-size:12px;line-height:1.7;background:#1a0808;border:1px solid #7f1d1d;border-radius:12px;margin:16px"><div style="font-size:14px;font-weight:700;margin-bottom:10px">⚠ Canvas render error</div><div style="white-space:pre-wrap">'+String(e.message||e)+'</div></div>';
});
</script>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const{useState,useEffect,useRef,useMemo,useCallback,useReducer}=React;
${code}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
</script>
</body>
</html>`;
}

// ─── Canvas Output ────────────────────────────────────────────────────────────

function CanvasOutput({ code }: { code: string }) {
  const [loaded, setLoaded] = useState(false);
  const html = useMemo(() => buildSandboxHTML(code), [code]);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0a0e1a]"
      style={{ height: 600 }}
    >
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0e1a] z-10 gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Palette className="h-4 w-4 text-white" />
          </div>
          <p className="text-white/40 text-xs">Building canvas…</p>
        </div>
      )}
      <iframe
        srcDoc={html}
        sandbox="allow-scripts"
        onLoad={() => setLoaded(true)}
        className="w-full h-full border-0"
        title="Lumen Canvas"
      />
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={i} className="text-white font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        if (part.startsWith("*") && part.endsWith("*"))
          return (
            <em key={i} className="italic text-white/80">
              {part.slice(1, -1)}
            </em>
          );
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 bg-white/10 rounded text-violet-300 font-mono text-[0.8em]"
            >
              {part.slice(1, -1)}
            </code>
          );
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/8">
        <span className="text-xs text-white/35 font-mono">{lang || "code"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="px-4 py-3 bg-[#0a0e1a] overflow-x-auto scrollbar-hide">
        <code className="text-sm text-white/80 font-mono leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  const segments = useMemo(() => {
    const result: Array<
      | { type: "code"; lang: string; code: string }
      | { type: "text"; value: string }
    > = [];
    const regex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIdx) {
        result.push({ type: "text", value: content.slice(lastIdx, match.index) });
      }
      result.push({ type: "code", lang: match[1] || "", code: match[2].trimEnd() });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < content.length) {
      result.push({ type: "text", value: content.slice(lastIdx) });
    }
    return result;
  }, [content]);

  return (
    <div className="space-y-1">
      {segments.map((seg, si) => {
        if (seg.type === "code") {
          return <CodeBlock key={si} lang={seg.lang} code={seg.code} />;
        }

        const lines = seg.value.split("\n");
        const nodes: React.ReactNode[] = [];
        let i = 0;

        while (i < lines.length) {
          const line = lines[i];

          if (line.trim() === "") {
            nodes.push(<div key={`${si}-${i}`} className="h-1.5" />);
            i++;
            continue;
          }

          if (line.startsWith("### ")) {
            nodes.push(
              <h3 key={`${si}-${i}`} className="text-white font-bold text-sm mt-3 mb-1">
                {renderInline(line.slice(4))}
              </h3>
            );
            i++;
            continue;
          }
          if (line.startsWith("## ")) {
            nodes.push(
              <h2 key={`${si}-${i}`} className="text-white font-bold text-base mt-4 mb-1.5">
                {renderInline(line.slice(3))}
              </h2>
            );
            i++;
            continue;
          }
          if (line.startsWith("# ")) {
            nodes.push(
              <h1 key={`${si}-${i}`} className="text-white font-bold text-lg mt-4 mb-2">
                {renderInline(line.slice(2))}
              </h1>
            );
            i++;
            continue;
          }

          if (line.startsWith("- ") || line.startsWith("* ")) {
            const items: React.ReactNode[] = [];
            while (
              i < lines.length &&
              (lines[i].startsWith("- ") || lines[i].startsWith("* "))
            ) {
              items.push(
                <li key={i} className="leading-relaxed">
                  {renderInline(lines[i].slice(2))}
                </li>
              );
              i++;
            }
            nodes.push(
              <ul
                key={`${si}-ul-${i}`}
                className="list-disc list-outside ml-4 space-y-1 text-white/75 text-sm my-1.5"
              >
                {items}
              </ul>
            );
            continue;
          }

          if (/^\d+\. /.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^\d+\. /.test(lines[i])) {
              items.push(
                <li key={i} className="leading-relaxed">
                  {renderInline(lines[i].replace(/^\d+\. /, ""))}
                </li>
              );
              i++;
            }
            nodes.push(
              <ol
                key={`${si}-ol-${i}`}
                className="list-decimal list-outside ml-4 space-y-1 text-white/75 text-sm my-1.5"
              >
                {items}
              </ol>
            );
            continue;
          }

          nodes.push(
            <p key={`${si}-${i}`} className="text-white/80 text-sm leading-relaxed">
              {renderInline(line)}
            </p>
          );
          i++;
        }

        return <React.Fragment key={si}>{nodes}</React.Fragment>;
      })}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function sessionTitle(messages: Message[]) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  return first.content.slice(0, 46) + (first.content.length > 46 ? "…" : "");
}

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ─── Lumen Avatar ─────────────────────────────────────────────────────────────

function LumenAvatar({ canvas = false }: { canvas?: boolean }) {
  return (
    <div
      className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
        canvas
          ? "bg-gradient-to-br from-violet-600 to-pink-500"
          : "bg-gradient-to-br from-violet-500 to-blue-500"
      }`}
    >
      {canvas ? (
        <Palette className="h-3.5 w-3.5 text-white" />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-white" />
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";
  const isCanvas =
    message.canvasType === "component" || message.canvasType === "markdown";
  const isLoading =
    message.canvasType === "loading" ||
    (message.content === "" && isStreaming);

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] px-4 py-3 bg-white text-black rounded-2xl rounded-tr-sm text-sm leading-relaxed font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-start gap-3">
        <LumenAvatar canvas={message.canvasType === "loading"} />
        <div className="flex-1 min-w-0">
          <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
            {message.canvasType === "loading" ? (
              <div className="flex items-center gap-2 text-white/40 text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                Building canvas…
              </div>
            ) : (
              <div className="flex items-center gap-1.5 h-5">
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (message.canvasType === "component") {
    return (
      <div className="flex items-start gap-3">
        <LumenAvatar canvas />
        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-xs text-white/30 font-medium">Canvas</span>
            <span className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <CanvasOutput code={message.content} />
          <p className="text-white/20 text-[10px] mt-1.5 ml-1">
            {relativeTime(message.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <LumenAvatar canvas={isCanvas} />
      <div className="flex-1 min-w-0">
        <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
          <MessageContent content={message.content} />
          {isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
          )}
        </div>
        <p className="text-white/20 text-[10px] mt-1.5 ml-1">
          {relativeTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Welcome Screens ──────────────────────────────────────────────────────────

function ChatWelcome({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">
        AI Learning Mentor
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Hi, I'm{" "}
        <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
          Lumen
        </span>
      </h1>
      <p className="text-white/40 text-base max-w-md mb-10">
        I'm your personal AI mentor — here to help you learn faster, build
        skills, and reach your goals on TwinPath.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {CHAT_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="group text-left px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
          >
            <p className="text-white/65 group-hover:text-white/90 text-sm leading-snug transition-colors">
              {prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function CanvasWelcome({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.09),transparent_70%)]" />
      </div>
      <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/25">
        <Palette className="h-7 w-7 text-white" />
      </div>
      <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3">
        Interactive Canvas
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
        Visualize to{" "}
        <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          Understand
        </span>
      </h1>
      <p className="text-white/40 text-base max-w-md mb-10">
        Describe any algorithm, data structure, or concept — I'll build a
        live interactive visualization just for you.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {CANVAS_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPrompt(prompt)}
            className="group text-left px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
          >
            <p className="text-white/65 group-hover:text-white/90 text-sm leading-snug transition-colors">
              {prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LumenPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<Mode>("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const storedId = localStorage.getItem(CURRENT_KEY);
      if (stored) {
        const parsed: ChatSession[] = JSON.parse(stored);
        setSessions(parsed);
        if (storedId && parsed.find((s) => s.id === storedId)) {
          setCurrentId(storedId);
        } else if (parsed.length > 0) {
          setCurrentId(parsed[0].id);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
    if (currentId) {
      localStorage.setItem(CURRENT_KEY, currentId);
    }
  }, [sessions, currentId]);

  const currentSession = sessions.find((s) => s.id === currentId) ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, scrollToBottom]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uid(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentId(newSession.id);
    setInput("");
  }, []);

  const deleteSession = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (id === currentId) {
          setCurrentId(next[0]?.id ?? null);
        }
        if (next.length === 0) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(CURRENT_KEY);
        }
        return next;
      });
    },
    [currentId]
  );

  // ── Chat send ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      let sid = currentId;
      if (!sid) {
        const newSession: ChatSession = {
          id: uid(),
          title: "New chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setCurrentId(newSession.id);
        sid = newSession.id;
      }

      const userMsg: Message = { id: uid(), role: "user", content: trimmed, timestamp: Date.now() };
      const modelMsg: Message = { id: uid(), role: "model", content: "", timestamp: Date.now() };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid
            ? {
                ...s,
                messages: [...s.messages, userMsg, modelMsg],
                title: s.messages.length === 0 ? sessionTitle([userMsg]) : s.title,
                updatedAt: Date.now(),
              }
            : s
        )
      );
      setInput("");
      setStreaming(true);

      const sessionNow = sessions.find((s) => s.id === sid);
      const history: { role: string; content: string }[] = [
        ...(sessionNow?.messages ?? []).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: trimmed },
      ];

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/lumen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const chunk: string = JSON.parse(data);
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id !== sid) return s;
                  const msgs = [...s.messages];
                  const last = msgs[msgs.length - 1];
                  if (last?.role === "model") {
                    msgs[msgs.length - 1] = { ...last, content: last.content + chunk };
                  }
                  return { ...s, messages: msgs, updatedAt: Date.now() };
                })
              );
            } catch {
              // skip
            }
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sid) return s;
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === "model" && last.content === "") {
              msgs[msgs.length - 1] = {
                ...last,
                content: `Sorry, something went wrong. Details: ${err?.message ?? "unknown error"}`,
              };
            }
            return { ...s, messages: msgs };
          })
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [currentId, sessions, streaming]
  );

  // ── Canvas send ────────────────────────────────────────────────────────────

  const sendCanvasMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      let sid = currentId;
      if (!sid) {
        const newSession: ChatSession = {
          id: uid(),
          title: "New chat",
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setCurrentId(newSession.id);
        sid = newSession.id;
      }

      const userMsg: Message = { id: uid(), role: "user", content: trimmed, timestamp: Date.now() };
      const modelMsg: Message = {
        id: uid(),
        role: "model",
        content: "",
        timestamp: Date.now(),
        canvasType: "loading",
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === sid
            ? {
                ...s,
                messages: [...s.messages, userMsg, modelMsg],
                title: s.messages.length === 0 ? sessionTitle([userMsg]) : s.title,
                updatedAt: Date.now(),
              }
            : s
        )
      );
      setInput("");
      setStreaming(true);

      try {
        const res = await fetch("/api/lumen-canvas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const { type, content } = data as { type: "component" | "markdown"; content: string };

        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sid) return s;
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === "model") {
              msgs[msgs.length - 1] = { ...last, content, canvasType: type };
            }
            return { ...s, messages: msgs, updatedAt: Date.now() };
          })
        );
      } catch (err: any) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sid) return s;
            const msgs = [...s.messages];
            const last = msgs[msgs.length - 1];
            if (last?.role === "model") {
              msgs[msgs.length - 1] = {
                ...last,
                content: `Canvas error: ${err?.message ?? "unknown error"}`,
                canvasType: "markdown",
              };
            }
            return { ...s, messages: msgs };
          })
        );
      } finally {
        setStreaming(false);
      }
    },
    [currentId, sessions, streaming]
  );

  const handleSend = useCallback(
    (text: string) => {
      if (mode === "canvas") {
        sendCanvasMessage(text);
      } else {
        sendMessage(text);
      }
    },
    [mode, sendMessage, sendCanvasMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const messages = currentSession?.messages ?? [];
  const isWelcome = messages.length === 0;

  return (
    <div className="flex" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* ── Sidebar ── */}
      <aside
        className={`flex-shrink-0 border-r border-white/8 bg-white/[0.02] flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-0"
        }`}
      >
        <div className="p-3 border-b border-white/8">
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/70 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-hide">
          {sessions.length === 0 ? (
            <p className="text-white/25 text-xs text-center py-6 px-3">
              No conversations yet. Start chatting with Lumen!
            </p>
          ) : (
            sessions.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => setCurrentId(s.id)}
                onKeyDown={(e) => e.key === "Enter" && setCurrentId(s.id)}
                className={`w-full group flex items-start justify-between gap-2 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  s.id === currentId
                    ? "bg-violet-500/20 border border-violet-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex-1 min-w-0 pointer-events-none">
                  <p
                    className={`text-xs font-medium leading-snug truncate ${
                      s.id === currentId ? "text-violet-200" : "text-white/60"
                    }`}
                  >
                    {s.title}
                  </p>
                  <p className="text-white/25 text-[10px] mt-0.5">
                    {relativeTime(s.updatedAt)}
                  </p>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-0.5 text-white/25 hover:text-red-400 transition-all mt-0.5"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  mode === "canvas"
                    ? "bg-gradient-to-br from-violet-600 to-pink-500"
                    : "bg-gradient-to-br from-violet-500 to-blue-500"
                }`}
              >
                {mode === "canvas" ? (
                  <Palette className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                )}
              </div>
              <div>
                <span className="text-white font-semibold text-sm">Lumen</span>
                <span className="ml-2 text-white/30 text-xs">
                  {mode === "canvas" ? "Canvas" : "AI Mentor"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode toggle */}
            <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setMode("chat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === "chat"
                    ? "bg-white/10 text-white"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                onClick={() => setMode("canvas")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  mode === "canvas"
                    ? "bg-violet-500/20 border border-violet-500/30 text-violet-300"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <Palette className="h-3.5 w-3.5" />
                Canvas
              </button>
            </div>

            <button
              onClick={createNewSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/55 hover:text-white rounded-xl text-xs font-medium transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6">
          {isWelcome ? (
            mode === "canvas" ? (
              <CanvasWelcome onPrompt={(p) => handleSend(p)} />
            ) : (
              <ChatWelcome onPrompt={(p) => handleSend(p)} />
            )
          ) : (
            <div className="space-y-6">
              {messages.map((msg, idx) => {
                const fullWidth = msg.role === "model" && msg.canvasType === "component";
                return (
                  <div key={msg.id} className={fullWidth ? "" : "max-w-3xl mx-auto"}>
                    <MessageBubble
                      message={msg}
                      isStreaming={
                        streaming &&
                        idx === messages.length - 1 &&
                        msg.role === "model"
                      }
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <div
              className={`relative bg-white/[0.04] border rounded-2xl transition-all ${
                mode === "canvas"
                  ? "border-white/10 focus-within:border-violet-500/50 focus-within:ring-2 focus-within:ring-violet-500/15"
                  : "border-white/10 focus-within:border-violet-500/40 focus-within:ring-2 focus-within:ring-violet-500/10"
              }`}
            >
              {mode === "canvas" && (
                <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
                  <Palette className="h-3 w-3 text-violet-400/60" />
                  <span className="text-[10px] text-violet-400/60 font-medium uppercase tracking-wider">
                    Canvas mode
                  </span>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  mode === "canvas"
                    ? "Describe a concept or algorithm to visualize…"
                    : "Ask Lumen anything about learning…"
                }
                rows={1}
                disabled={streaming}
                className={`w-full bg-transparent px-4 ${mode === "canvas" ? "pt-2" : "pt-3.5"} pb-12 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none leading-relaxed scrollbar-hide`}
              />

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {streaming && (
                  <div className="flex items-center gap-1.5 text-xs text-white/35 mr-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {mode === "canvas" ? "Building…" : "Thinking…"}
                  </div>
                )}
                <span className="text-white/20 text-xs hidden sm:block">
                  Shift+Enter for newline
                </span>
                <button
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || streaming}
                  className={`flex items-center justify-center w-8 h-8 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all ${
                    mode === "canvas"
                      ? "bg-gradient-to-br from-violet-500 to-pink-500 text-white hover:opacity-90"
                      : "bg-white text-black hover:bg-white/90"
                  }`}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-center text-white/20 text-[10px] mt-2">
              {mode === "canvas"
                ? "Canvas generates live interactive apps. Complex visualizations may take a moment."
                : "Lumen can make mistakes. Verify important information with your mentor."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
