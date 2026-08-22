/**
 * Chatbot.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Top-level chatbot component. Renders:
 *   1. A floating action button (bottom-right)
 *   2. An unread-message badge
 *   3. The animated ChatWindow panel (open/close via AnimatePresence)
 *
 * Drop <Chatbot /> anywhere in the tree — it is fixed-positioned,
 * so it renders above all page content.
 *
 * Props:
 *   parentId (string|null) — forwarded to the AI for personalised responses
 *   childId  (string|null) — forwarded to the AI for personalised responses
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiMessageSquare, FiX } from "react-icons/fi";
import { useChat } from "../../hooks/useChat";
import ChatWindow from "./ChatWindow";

export default function Chatbot({ parentId = null, childId = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, isLoading, error, send, retry, clearConversation } = useChat({ parentId, childId });

  const unreadCount = isOpen ? 0 : messages.filter((m) => m.role === "assistant").length;

  const handleClose = () => setIsOpen(false);
  const handleToggle = () => setIsOpen((v) => !v);
  const handleClear = () => { clearConversation(); };

  return (
    /* Fixed wrapper — sits above all page content */
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Chat window (animated mount/unmount) ─────────── */}
      <AnimatePresence>
        {isOpen && (
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSend={send}
            onRetry={retry}
            onClear={handleClear}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>

      {/* ── Floating action button ────────────────────────── */}
      <motion.button
        type="button"
        onClick={handleToggle}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-civic-600 to-indigo-600 text-white shadow-lg shadow-civic-600/40 transition"
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <FiX className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <FiMessageSquare className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-civic-500 opacity-0 animate-pulse-ring" />
        )}
      </motion.button>
    </div>
  );
}
