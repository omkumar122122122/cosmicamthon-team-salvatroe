/**
 * ChatInput.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Bottom input area of the chat window.
 *
 * Features:
 *  - Auto-expanding textarea (grows to 5 rows, then scrolls)
 *  - Send on Enter (Shift+Enter for newline)
 *  - Send button with loading state
 *  - Quick-action chips for common queries
 *  - Character limit indication
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { FiSend } from "react-icons/fi";

/** Quick-action chip definitions */
const QUICK_CHIPS = [
  { label: "Health Report",         text: "What is my child's latest health report summary?" },
  { label: "Vaccination Schedule",  text: "Show me the upcoming vaccination schedule for my child." },
  { label: "KYC Reminder",          text: "When is my KYC verification due and what documents do I need?" },
  { label: "Upcoming Appointment",  text: "What upcoming appointments do I have?" },
  { label: "Emergency Contacts",    text: "What are the emergency contacts for my child's orphanage?" },
  { label: "Adoption Policy",       text: "Explain the adoption process and documentation requirements." },
  { label: "Annual Health Checkup", text: "What is required for the annual full-body health checkup?" },
  { label: "Dashboard Help",        text: "How do I navigate the Parent Dashboard features?" },
];

const MAX_CHARS = 2000;

/**
 * @param {Object}   props
 * @param {Function} props.onSend     - Callback(text: string)
 * @param {boolean}  props.isLoading  - Disables input while AI is responding
 */
export default function ChatInput({ onSend, isLoading }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(/** @type {HTMLTextAreaElement|null} */ (null));

  /** Auto-resize the textarea up to a max height */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
  }, [value, isLoading, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChip = (chipText) => {
    onSend(chipText);
  };

  const remaining = MAX_CHARS - value.length;
  const isOverLimit = remaining < 0;

  return (
    <div className="border-t border-gray-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Quick-action chips */}
      <div className="flex gap-1.5 overflow-x-auto px-3 pb-0 pt-2.5 scrollbar-thin">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            disabled={isLoading}
            onClick={() => handleChip(chip.text)}
            className="shrink-0 rounded-full border border-civic-200 bg-civic-50 px-2.5 py-1 text-[11px] font-semibold text-civic-700 transition
              hover:bg-civic-100 disabled:opacity-40
              dark:border-civic-500/30 dark:bg-civic-500/10 dark:text-civic-300 dark:hover:bg-civic-500/20"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Textarea + send button */}
      <div className="flex items-end gap-2 px-3 pb-3 pt-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS + 50))}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Ask about health reports, vaccinations, KYC…"
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition
              focus:border-civic-500 focus:bg-white focus:ring-2 focus:ring-civic-500/15
              disabled:cursor-not-allowed disabled:opacity-60
              dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          {/* Character counter — only show when close to limit */}
          {remaining < 200 && (
            <span className={`absolute bottom-2 right-2.5 text-[10px] font-medium ${isOverLimit ? "text-red-500" : "text-slate-400"}`}>
              {remaining}
            </span>
          )}
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !value.trim() || isOverLimit}
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-civic-600 text-white shadow-sm transition
            hover:bg-civic-700 active:scale-95
            disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <FiSend className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
