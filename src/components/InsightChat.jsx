import { useState } from "react";
import { fetchChatReply, isChatConfigured } from "../lib/ai.js";

// Follow-up chat about a location's already-generated analysis.
// This calls a real LLM (see server/app.py) for genuine back-and-
// forth conversation — it does NOT use pre-written rules or
// keyword matching. There is deliberately NO offline fallback
// (see lib/ai.js) — if the optional local AI server isn't
// reachable, this shows a plain, honest explanation instead of a
// broken or fake chat box.
export default function InsightChat({ context }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(!isChatConfigured());

  async function handleSend(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const reply = await fetchChatReply(nextMessages, context);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setIsUnavailable(false);
    } catch {
      setIsUnavailable(true);
    } finally {
      setIsSending(false);
    }
  }

  // Nothing sent yet and we already know chat isn't configured —
  // don't show an input box that can't work.
  if (isUnavailable && messages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-line)] p-4 text-sm text-[var(--color-muted)]">
        Live chat needs the optional local AI server running (see{" "}
        <code className="rounded bg-[var(--color-line)]/50 px-1 py-0.5 text-xs">server/app.py</code>'s setup steps)
        — it isn't reachable right now, so the summary above is all that's available at the moment.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length > 0 && (
        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-xl border border-[var(--color-line)] p-3">
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "max-w-[80%] self-end rounded-xl rounded-br-sm bg-[var(--color-primary)] px-3 py-2 text-sm text-white"
                  : "max-w-[80%] self-start rounded-xl rounded-bl-sm bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-ink)]"
              }
            >
              {message.content}
            </div>
          ))}
          {isSending && (
            <div className="max-w-[80%] self-start rounded-xl rounded-bl-sm bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-[var(--color-muted)]">
              Thinking…
            </div>
          )}
        </div>
      )}

      {isUnavailable && messages.length > 0 && (
        <p className="text-xs text-[var(--color-amber)]">
          Chat isn't reachable right now — the local AI server may have stopped.
        </p>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a follow-up question…"
          aria-label="Ask a follow-up question"
          autoComplete="off"
          className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted-2)] focus:border-[var(--color-primary)] focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="shrink-0 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}