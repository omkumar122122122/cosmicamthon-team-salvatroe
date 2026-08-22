import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiBell, FiBookOpen, FiChevronDown, FiCopy, FiRefreshCw,
  FiHelpCircle, FiInfo, FiLink, FiMessageCircle, FiPaperclip,
  FiSearch, FiSend, FiShield, FiZap, FiPlus, FiTrash2, FiAlertCircle
} from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import Breadcrumb from "../components/Breadcrumb";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../context/AuthContext";
import { classNames } from "../utils/formatters";

const recentChats = [
  "What is my child's vaccination status?",
  "When is my KYC due?",
  "How do I schedule a visit?",
  "Annual health checkup reminder",
  "Adoption process steps",
  "Emergency contacts",
];

const quickQuestions = [
  "What is my child's health status?",
  "Show vaccination schedule",
  "When is my KYC renewal due?",
  "How do I schedule a visit?",
  "What documents are required?",
  "Annual health checkup guidance",
  "Emergency contacts",
  "How does adoption monitoring work?",
];

const faqs = [
  { question: "Who can adopt?",                answer: "Eligibility depends on age, health, financial stability, background checks, and suitability review by authorized officers." },
  { question: "How long is the process?",      answer: "Timelines vary by verification, document review, matching, counselling, legal steps, and welfare authority approvals." },
  { question: "Which documents are needed?",   answer: "Identity proof, address proof, income proof, photographs, health details, family information, and declarations." },
  { question: "Can I adopt from another state?",answer: "Inter-state adoption may be possible through official procedures. An administrator must review case-specific requirements." },
  { question: "What is post-adoption monitoring?",answer: "Scheduled welfare follow-up checking the child's health, education, safety, adjustment, and family support." },
];

const sideCards = [
  { title: "Frequently Asked Questions", text: "Eligibility, documents, visits, legal steps, and welfare monitoring.", icon: FiHelpCircle },
  { title: "Recent Notifications",       text: "Visit slot pending confirmation. Two documents need review.",        icon: FiBell      },
  { title: "Helpful Resources",          text: "Adoption checklist, child rights guide, parent responsibilities.",   icon: FiBookOpen  },
];

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function SahayakAI() {
  const { user } = useAuth();
  const { messages, isLoading, error, send, retry, clearConversation } = useChat({
    parentId: user?.parentId || user?.id,
    childId:  null,
  });

  const [chatSearch, setChatSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [openFaq,    setOpenFaq]    = useState(-1);
  const messagesEndRef = useRef(null);

  const filteredChats = useMemo(
    () => recentChats.filter((c) => c.toLowerCase().includes(chatSearch.toLowerCase())),
    [chatSearch]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading]);

  const handleSend = (text) => {
    const t = (text ?? inputValue).trim();
    if (!t || isLoading) return;
    send(t);
    setInputValue("");
  };

  const handleNewChat = () => {
    clearConversation();
    setInputValue("");
  };

  return (
    <div className="space-y-5">
      <Breadcrumb items={["Parent", "Sahayak AI"]} />

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
        <div
          className="grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_280px]"
          style={{ minHeight: "calc(100vh - 170px)" }}
        >
          {/* ── Left sidebar ──────────────────────────────────── */}
          <aside className="flex flex-col border-b border-gray-100 bg-gray-50/70 dark:border-slate-800 dark:bg-slate-900/60 lg:border-b-0 lg:border-r">
            <div className="p-4 space-y-3">
              <button
                onClick={handleNewChat}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-civic-500 to-civic-600 px-4 py-2.5 text-sm font-semibold text-white shadow-btn-primary transition hover:from-civic-500 hover:to-civic-700 active:scale-[0.98] font-display"
              >
                <FiPlus className="h-4 w-4" /> New Chat
              </button>

              {messages.length > 0 && (
                <button
                  onClick={handleNewChat}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                >
                  <FiTrash2 className="h-3.5 w-3.5" /> Clear conversation
                </button>
              )}

              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800">
                <FiSearch className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search chats…"
                  className="min-h-[36px] w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-display">
                Quick Topics
              </p>
              <div className="space-y-0.5">
                {filteredChats.map((chat) => (
                  <button
                    key={chat}
                    onClick={() => handleSend(chat)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <FiMessageCircle className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{chat}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Main chat area ─────────────────────────────────── */}
          <main className="flex min-w-0 flex-col">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
                  <FiShield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-[15px] font-bold text-slate-900 dark:text-white">YourSathi</h1>
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20">
                      <FiZap className="h-2.5 w-2.5" /> Gemini AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Adoption &amp; Child Welfare Assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Online</span>
              </div>
            </header>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
                {messages.length === 0 && !isLoading ? (
                  <WelcomeScreen onSelect={handleSend} openFaq={openFaq} setOpenFaq={setOpenFaq} />
                ) : (
                  <div className="space-y-4 pb-2">
                    {messages.map((msg) => (
                      <MessageBubble key={msg.id} message={msg} />
                    ))}
                    {isLoading && <TypingBubble />}
                  </div>
                )}

                {/* Error banner */}
                {error && (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
                    <div className="flex items-center gap-2">
                      <FiAlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <button
                      onClick={retry}
                      className="shrink-0 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 transition hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input bar */}
            <div className="sticky bottom-0 border-t border-gray-100 bg-white/95 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div className="mx-auto max-w-2xl">
                <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-2 shadow-sm transition focus-within:border-civic-400 focus-within:ring-2 focus-within:ring-civic-500/15 dark:border-slate-700 dark:bg-slate-800/80">
                  <button
                    disabled
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 disabled:opacity-40"
                    title="Attach file (coming soon)"
                  >
                    <FiPaperclip className="h-4 w-4" />
                  </button>
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    disabled={isLoading}
                    placeholder="Ask YourSathi anything… (Enter to send)"
                    className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-white"
                    style={{ minHeight: "36px" }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim() || isLoading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-civic-600 text-white transition hover:bg-civic-700 disabled:opacity-50 active:scale-[0.96]"
                    title="Send"
                  >
                    {isLoading
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      : <FiSend className="h-4 w-4" />
                    }
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500">
                  YourSathi is an AI guide · Cannot approve applications or make legal decisions
                </p>
              </div>
            </div>
          </main>

          {/* ── Right resources panel ──────────────────────────── */}
          <aside className="hidden border-l border-gray-100 bg-gray-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40 xl:block">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Resources
            </p>
            <div className="space-y-3">
              {sideCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-civic-50 text-civic-600 dark:bg-civic-500/10 dark:text-civic-400">
                      <card.icon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-[12px] font-bold text-slate-900 dark:text-white">{card.title}</h3>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{card.text}</p>
                </div>
              ))}

              <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-900 dark:text-white">
                  <FiLink className="h-3.5 w-3.5 text-civic-600" /> Quick Links
                </div>
                <div className="mt-2.5 space-y-1.5">
                  {["Adoption process checklist", "Parent responsibility guide", "Visit request instructions"].map((l) => (
                    <p
                      key={l}
                      className="cursor-pointer text-[11px] font-medium text-civic-600 hover:underline dark:text-civic-400"
                    >
                      {l}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   WELCOME SCREEN — shown when no messages yet
═══════════════════════════════════════════════════════════ */
function WelcomeScreen({ onSelect, openFaq, setOpenFaq }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-4">
      {/* Avatar */}
      <div className="flex flex-col items-center text-center">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
          <FiShield className="h-9 w-9 text-white" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900">
            <FiZap className="h-2.5 w-2.5 text-white" />
          </span>
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">Hello, I'm YourSathi 👋</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          I'm your AI welfare assistant. Ask me about your child's health reports, vaccination
          schedule, KYC reminders, adoption guidance, and more.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
          <FiInfo className="h-3 w-3" />
          AI guide only — cannot approve applications or make legal decisions
        </div>
      </div>

      {/* Quick question chips */}
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-civic-300 hover:bg-civic-50 hover:text-civic-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-civic-500/10"
          >
            <FiMessageCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {q}
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="mt-8">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <FiHelpCircle className="h-4 w-4 text-civic-600" /> Frequently Asked Questions
        </p>
        <div className="space-y-2">
          {faqs.map((item, i) => (
            <div
              key={item.question}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white"
              >
                {item.question}
                <FiChevronDown
                  className={classNames(
                    "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                    openFaq === i && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {openFaq === i && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden px-4 pb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
                  >
                    {item.answer}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   MESSAGE BUBBLE — renders one user or assistant message
═══════════════════════════════════════════════════════════ */
function MessageBubble({ message }) {
  const isAI   = message.role === "assistant";
  const time   = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={classNames("flex gap-3", isAI ? "justify-start" : "justify-end")}
    >
      {isAI && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
          <FiShield className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className={classNames("max-w-[84%]", isAI ? "text-left" : "text-right")}>
        {/* Bubble */}
        <div
          className={classNames(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isAI
              ? "rounded-tl-sm border border-gray-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              : "rounded-tr-sm bg-gradient-to-br from-civic-600 to-indigo-600 text-white"
          )}
        >
          {isAI ? (
            /* Render Markdown for AI replies */
            <ReactMarkdown
              components={{
                p:      ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                ul:     ({ children }) => <ul className="mb-1.5 ml-4 list-disc space-y-0.5">{children}</ul>,
                ol:     ({ children }) => <ol className="mb-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>,
                li:     ({ children }) => <li>{children}</li>,
                code:   ({ inline, children }) =>
                  inline
                    ? <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>
                    : <pre className="mt-1 overflow-x-auto rounded-lg bg-black/10 p-2 font-mono text-xs dark:bg-white/10"><code>{children}</code></pre>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Timestamp + copy/retry for AI */}
        <div className={classNames("mt-1.5 flex items-center gap-2 text-[10px] text-slate-400", isAI ? "justify-start pl-1" : "justify-end pr-1")}>
          <span>{time}</span>
          {isAI && (
            <button
              onClick={() => navigator.clipboard?.writeText(message.content)}
              title="Copy"
              className="rounded p-0.5 transition hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <FiCopy className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Animated typing indicator ───────────────────────────── */
function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
        <FiShield className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"
              style={{
                animation: "typingBounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes typingBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-5px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
