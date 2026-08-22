/**
 * ChatWindow.jsx
 * Full chat window panel: header, scrollable message list, typing indicator,
 * error banner with retry, and the input bar.
 */

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FiX, FiTrash2, FiShield } from "react-icons/fi";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";

const WELCOME =
  "Hello! 👋 I'm your **AI Welfare Assistant** for the Child Safety Management System.\n\n" +
  "I can help you with:\n" +
  "- 📋 Child health reports & vaccination schedules\n" +
  "- 🔐 KYC verification reminders\n" +
  "- 📅 Appointments & visit scheduling\n" +
  "- 📜 Adoption policies & procedures\n" +
  "- 🚨 Emergency contacts\n\n" +
  "Use the quick-action chips below or ask me anything!";

export default function ChatWindow({ messages, isLoading, error, onSend, onRetry, onClear, onClose, inline = false }) {
  const bottomRef = useRef(null);

  /* Auto-scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /* When inline=true render as a flat section (no floating panel wrapper or framer animation) */
  const content = (
    <>
      {/* ── Header — hide in inline mode since the parent card already has a header */}
      {!inline && (
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-civic-600 to-indigo-600 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
              <FiShield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">AI Welfare Assistant</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] font-medium text-white/80">Online · Powered by Gemini</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onClear} title="Clear conversation"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/20 hover:text-white">
              <FiTrash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={onClose} title="Close chat"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/20 hover:text-white">
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Inline sub-header (clear button only) */}
      {inline && (
        <div className="flex items-center justify-end gap-1 px-4 pt-3">
          <button onClick={onClear} title="Clear conversation"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <FiTrash2 className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* ── Message list */}
      <div
        className="overflow-y-auto py-3"
        style={{
          height: inline ? "min(400px, 55vh)" : undefined,
          flex: inline ? undefined : 1,
          scrollbarWidth: "thin"
        }}
      >
        {messages.length === 0 && !isLoading && (
          <ChatMessage message={{ id: "welcome", role: "assistant", content: WELCOME, timestamp: new Date() }} />
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="mx-4 mt-2 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-xs font-medium leading-relaxed text-red-700 dark:text-red-300">{error}</p>
            <button onClick={onRetry}
              className="shrink-0 rounded-lg bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 transition hover:bg-red-200 dark:bg-red-500/20 dark:text-red-300">
              Retry
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar */}
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </>
  );

  /* Inline: flat section, no animation wrapper */
  if (inline) {
    return <div className="flex flex-col">{content}</div>;
  }

  /* Floating: animated panel */
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 16 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-modal dark:border-slate-700 dark:bg-slate-900"
      style={{ width: "min(380px, calc(100vw - 2rem))", height: "min(600px, calc(100vh - 7rem))" }}
    >
      {content}
    </motion.div>
  );
}
