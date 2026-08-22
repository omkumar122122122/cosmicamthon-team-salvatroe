/**
 * TypingIndicator.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Three animated dots that indicate the AI is generating a response.
 * Uses CSS keyframe animation for smooth, staggered bounce effect.
 */

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2">
      {/* AI avatar dot */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-civic-600 to-indigo-600 text-[11px] font-bold text-white shadow-sm">
        AI
      </div>

      {/* Bouncing dots container */}
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 dark:bg-slate-800">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"
            style={{
              animation: `typingBounce 1.2s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Inline keyframes injected via style tag — avoids adding to global CSS */}
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0);     opacity: 0.4; }
          40%            { transform: translateY(-6px);  opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
