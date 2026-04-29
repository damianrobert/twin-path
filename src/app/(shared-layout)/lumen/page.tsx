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
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "lumen_sessions";
const CURRENT_KEY = "lumen_current_id";

const SUGGESTED_PROMPTS = [
  "Create a learning roadmap for React.js from beginner to advanced",
  "Explain the difference between REST and GraphQL APIs with examples",
  "Quiz me on JavaScript fundamentals — start easy and get harder",
  "I want to learn machine learning. Where should I begin?",
];

// ─── Markdown renderer ───────────────────────────────────────────────────────

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

          // Bullet list
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

          // Numbered list
          if (/^\d+\. /.test(line)) {
            const items: React.ReactNode[] = [];
            while (i < lines.length && /^\d+\. /.test(lines[i])) {
              nodes.push(
                <li key={i} className="leading-relaxed">
                  {renderInline(lines[i].replace(/^\d+\. /, ""))}
                </li>
              );
              i++;
            }
            if (items.length > 0) {
              nodes.push(
                <ol
                  key={`${si}-ol-${i}`}
                  className="list-decimal list-outside ml-4 space-y-1 text-white/75 text-sm my-1.5"
                >
                  {items}
                </ol>
              );
            }
            continue;
          }

          // Regular line
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LumenPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load from localStorage
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

  // Persist sessions
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

  // Auto-resize textarea
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

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      // Ensure we have an active session
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

      const userMsg: Message = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const modelMsg: Message = {
        id: uid(),
        role: "model",
        content: "",
        timestamp: Date.now(),
      };

      // Add user message + empty model placeholder
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

      // Build message history for API (exclude empty placeholder)
      const sessionNow = sessions.find((s) => s.id === sid);
      const history: { role: string; content: string }[] = [
        ...(sessionNow?.messages ?? []).map((m) => ({
          role: m.role,
          content: m.content,
        })),
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
                    msgs[msgs.length - 1] = {
                      ...last,
                      content: last.content + chunk,
                    };
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
        console.error("Lumen send error:", err);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const messages = currentSession?.messages ?? [];
  const isWelcome = messages.length === 0;

  return (
    <div
      className="flex"
      style={{ height: "calc(100vh - 3.5rem)" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className={`flex-shrink-0 border-r border-white/8 bg-white/[0.02] flex flex-col transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-0"
        }`}
      >
        {/* New chat */}
        <div className="p-3 border-b border-white/8">
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-sm text-white/70 hover:text-white transition-all"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            New chat
          </button>
        </div>

        {/* Sessions list */}
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
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold text-sm">Lumen</span>
                <span className="ml-2 text-white/30 text-xs">AI Mentor</span>
              </div>
            </div>
          </div>

          <button
            onClick={createNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/55 hover:text-white rounded-xl text-xs font-medium transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            New chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-6">
          {isWelcome ? (
            <Welcome onPrompt={(p) => sendMessage(p)} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={
                    streaming &&
                    idx === messages.length - 1 &&
                    msg.role === "model"
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative bg-white/[0.04] border border-white/10 rounded-2xl focus-within:border-violet-500/40 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Lumen anything about learning…"
                rows={1}
                disabled={streaming}
                className="w-full bg-transparent px-4 pt-3.5 pb-12 text-white text-sm placeholder:text-white/25 resize-none focus:outline-none leading-relaxed scrollbar-hide"
              />

              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                {streaming && (
                  <div className="flex items-center gap-1.5 text-xs text-white/35 mr-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Thinking…
                  </div>
                )}
                <span className="text-white/20 text-xs hidden sm:block">
                  Shift+Enter for newline
                </span>
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="flex items-center justify-center w-8 h-8 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="text-center text-white/20 text-[10px] mt-2">
              Lumen can make mistakes. Verify important information with your mentor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────

function Welcome({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full text-center px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.07),transparent_70%)]" />
      </div>

      {/* Logo */}
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

      {/* Suggested prompts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {SUGGESTED_PROMPTS.map((prompt) => (
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

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming: boolean;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] px-4 py-3 bg-white text-black rounded-2xl rounded-tr-sm text-sm leading-relaxed font-medium">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* Lumen avatar */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center mt-0.5">
        <Sparkles className="h-3.5 w-3.5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
          {message.content === "" && isStreaming ? (
            <div className="flex items-center gap-1.5 h-5">
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          ) : (
            <>
              <MessageContent content={message.content} />
              {isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle" />
              )}
            </>
          )}
        </div>
        <p className="text-white/20 text-[10px] mt-1.5 ml-1">
          {relativeTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
