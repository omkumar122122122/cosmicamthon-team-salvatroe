/**
 * ChatMessage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a single chat bubble (user or assistant).
 *
 * Features:
 *  - Markdown rendering via react-markdown
 *  - Timestamp display
 *  - Role-based avatar and bubble colour
 *  - Error state indicator
 *  - Entrance animation via Framer Motion
 */

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { FiAlertCircle } from "react-icons/fi";

/**
 * Format a Date to a short time string, e.g. "09:42 AM".
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * @param {Object}  props
 * @param {import("../../hooks/useChat").Message} props.message
 */
export default function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2.5 px-4 py-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {isUser ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-civic-600 text-[11px] font-bold text-white shadow-sm">
          Me
        </div>
      ) : (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-civic-600 to-indigo-600 text-[11px] font-bold text-white shadow-sm">
          AI
        </div>
      )}

      {/* Bubble + timestamp */}
      <div className={`flex max-w-[80%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm
            ${isUser
              ? "rounded-br-sm bg-civic-600 text-white"
              : message.error
              ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              : "rounded-bl-sm bg-gray-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            }
          `}
        >
          {/* Error icon */}
          {message.error && (
            <div className="mb-1.5 flex items-center gap-1.5">
              <FiAlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs font-semibold">Error</span>
            </div>
          )}

          {isUser ? (
            /* User messages — plain text, preserve whitespace */
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            /* Assistant messages — render Markdown */
            <ReactMarkdown
              components={{
                /* Style markdown elements to fit the bubble */
                p:      ({ children }) => <p className="mb-1.5 last:mb-0 break-words">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em:     ({ children }) => <em className="italic">{children}</em>,
                ul:     ({ children }) => <ul className="mb-1.5 ml-3 list-disc space-y-0.5">{children}</ul>,
                ol:     ({ children }) => <ol className="mb-1.5 ml-3 list-decimal space-y-0.5">{children}</ol>,
                li:     ({ children }) => <li className="text-sm">{children}</li>,
                h1:     ({ children }) => <h1 className="mb-1 text-base font-bold">{children}</h1>,
                h2:     ({ children }) => <h2 className="mb-1 text-sm font-bold">{children}</h2>,
                h3:     ({ children }) => <h3 className="mb-0.5 text-sm font-semibold">{children}</h3>,
                code:   ({ inline, children }) =>
                  inline
                    ? <code className="rounded bg-black/10 px-1 py-0.5 font-mono text-xs dark:bg-white/10">{children}</code>
                    : <pre className="mt-1.5 overflow-x-auto rounded-lg bg-black/10 p-2 font-mono text-xs dark:bg-white/10"><code>{children}</code></pre>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-current pl-3 opacity-80">{children}</blockquote>
                ),
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noreferrer" className="underline opacity-80 hover:opacity-100">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Timestamp */}
        <span className="px-1 text-[10px] text-slate-400 dark:text-slate-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
