import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Send, User, X, Sparkles, Calculator } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { openEstimator } from "@/components/cost-estimator-modal";

type Msg = {
  role: "user" | "assistant";
  content: string;
  time: string;
};

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Hello! I am **Netweavesolutions AI Assistant**. 🚀\n\nAsk me anything about our software engineering services, pricing, tech stack, or project timelines!",
  time: nowTime(),
};

const CHIPS = [
  { label: "Our Services", prompt: "What services do you offer?" },
  { label: "School ERP Price", prompt: "What is the price for a School ERP?" },
  { label: "Cost Calculator", action: "estimator" as const },
];

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { role: "user", content: trimmed, time: nowTime() };
    const next = [...msgs, userMsg];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMsgs((m) => [...m, { role: "assistant", content: data.reply || "…", time: nowTime() }]);
    } catch (err) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            err instanceof Error && err.message
              ? err.message
              : "Something went wrong. Please try again.",
          time: nowTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <motion.button
        aria-label="Open AI Assistant"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-6 z-40 grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.9)] transition-transform group"
        style={{
          bottom: "6rem",
          background:
            "linear-gradient(135deg, oklch(0.53 0.213 275) 0%, oklch(0.60 0.212 300) 50%, oklch(0.72 0.13 210) 100%)",
        }}
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full opacity-70 blur-xl -z-10"
          style={{
            background: "linear-gradient(135deg, oklch(0.53 0.213 275), oklch(0.72 0.13 210))",
          }}
        />
        <Bot className="h-6 w-6 transition-transform group-hover:rotate-12" />
        <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-cyan-400 text-[10px] font-bold text-slate-900 ring-2 ring-background">
          <Sparkles className="h-3 w-3" />
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed right-4 sm:right-6 z-40 flex flex-col overflow-hidden rounded-2xl border border-indigo-500/30 shadow-2xl backdrop-blur-xl"
            style={{
              bottom: "10.5rem",
              width: "min(384px, calc(100vw - 2rem))",
              height: "min(85vh, 480px)",
              background: "color-mix(in oklab, var(--card) 85%, transparent)",
              boxShadow:
                "0 30px 60px -20px rgba(0,0,0,0.5), 0 0 0 1px color-mix(in oklab, oklch(0.72 0.13 210) 15%, transparent)",
            }}
          >
            {/* Header */}
            <div
              className="relative flex items-center gap-3 border-b border-cyan-500/20 px-4 py-3"
              style={{
                background: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, #1e1b4b 100%)",
              }}
            >
              <div className="relative">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 ring-2 ring-cyan-400/60">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    Netweavesolutions AI Assistant
                  </h3>
                  <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                    Gemini
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/80 truncate">
                  Instant answers about services &amp; quotes
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-indigo-200 hover:bg-white/10 hover:text-white transition"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-slate-50 dark:bg-slate-950/60"
            >
              {msgs.map((m, i) => (
                <MessageBubble key={i} m={m} />
              ))}
              {loading && (
                <div className="flex items-start gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 shrink-0">
                    <Bot className="h-4 w-4 text-white animate-spin-slow" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                    <span className="inline-flex gap-1">
                      Thinking
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse [animation-delay:150ms]">.</span>
                      <span className="animate-pulse [animation-delay:300ms]">.</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chips */}
            <div className="border-t border-border/60 bg-background/60 px-3 py-2">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CHIPS.map((c) => (
                  <button
                    key={c.label}
                    onClick={() => {
                      if ("action" in c && c.action === "estimator") {
                        setOpen(false);
                        openEstimator();
                      } else if ("prompt" in c) {
                        void send(c.prompt);
                      }
                    }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/5 px-3 py-1.5 text-xs font-medium text-foreground hover:border-indigo-500 hover:bg-indigo-500/10 transition"
                  >
                    {"action" in c && c.action === "estimator" && (
                      <Calculator className="h-3 w-3 text-indigo-500" />
                    )}
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
                className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition"
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about websites, mobile apps, ERPs..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg text-white transition",
                    !input.trim() || loading
                      ? "bg-muted-foreground/40 cursor-not-allowed"
                      : "bg-linear-to-br from-indigo-600 to-cyan-500 hover:shadow-glow hover:scale-105",
                  )}
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ m }: { m: Msg }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex items-start gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-linear-to-br from-indigo-500 to-cyan-500 text-white",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-card text-card-foreground border border-border rounded-tl-sm",
        )}
      >
        <div
          className={cn(
            "prose prose-sm max-w-none",
            isUser ? "text-white **:text-white [&_a]:underline" : "dark:prose-invert",
          )}
        >
          <ReactMarkdown>{m.content}</ReactMarkdown>
        </div>
        <div
          className={cn(
            "mt-1 text-[10px] tabular-nums",
            isUser ? "text-indigo-100/80 text-right" : "text-muted-foreground text-right",
          )}
        >
          {m.time}
        </div>
      </div>
    </div>
  );
}

