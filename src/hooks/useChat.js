/**
 * useChat.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom hook that manages the full chatbot state:
 *   - Session conversation history (user + assistant turns)
 *   - Loading / typing indicator state
 *   - Error state with retry capability
 *   - Send message action
 *   - Clear conversation action
 */

import { useState, useCallback, useRef } from "react";
import { sendChatMessage } from "../services/chatService";

/**
 * @typedef {Object} Message
 * @property {string} id
 * @property {"user"|"assistant"} role
 * @property {string} content
 * @property {Date} timestamp
 * @property {boolean} [error]
 */

const makeId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function useChat({ childId = null } = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const lastUserMessageRef = useRef(null);

  /**
   * Convert messages into the format expected by the backend.
   */
  const buildHistory = (msgs) =>
    msgs
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        content: m.content,
      }));

  /**
   * Send a message to the backend.
   */
  const send = useCallback(
    async (text) => {
      const trimmed = text.trim();

      if (!trimmed || isLoading) return;

      setError(null);
      lastUserMessageRef.current = trimmed;
      setIsLoading(true);

      // User message
      const userMsg = {
        id: makeId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      // Updated conversation
      const updatedMessages = [...messages, userMsg];

      // Show user message immediately
      setMessages(updatedMessages);

      try {
        const reply = await sendChatMessage({
          message: trimmed,
          conversation: buildHistory(updatedMessages),
          childId,
        });

        const assistantMsg = {
          id: makeId(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, childId]
  );

  /**
   * Retry last failed message.
   */
  const retry = useCallback(() => {
    if (lastUserMessageRef.current) {
      setError(null);

      setMessages((prev) => {
        if (prev.length && prev[prev.length - 1].role === "user") {
          return prev.slice(0, -1);
        }
        return prev;
      });

      send(lastUserMessageRef.current);
    }
  }, [send]);

  /**
   * Clear the conversation.
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setIsLoading(false);
    lastUserMessageRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    error,
    send,
    retry,
    clearConversation,
  };
}