import { useState } from "react";

export default function InsightChat({ context }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    if (!question.trim()) return;
    setAnswer(`Based on the current readings, focus first on the factor with the lower safety score. Your overall score is ${context.safety?.overallSafety ?? "not available"}.`);
    setQuestion("");
  }
  return <div>
    {answer && <div className="mb-4 rounded-xl bg-[var(--color-accent-soft)] p-4 text-sm text-[var(--color-ink)]">{answer}</div>}
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about these results..." aria-label="Ask a follow-up question" className="min-w-0 flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:outline-none" />
      <button type="submit" className="rounded-xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-soft)]">Ask</button>
    </form>
  </div>;
}