"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import AnalysisRun from "@/components/AnalysisRun";
import { parseAnalysisQuery } from "@/lib/parseQuery";

type ChatItem =
  | { type: "user"; id: string; text: string }
  | { type: "validation"; id: string; text: string }
  | { type: "run"; id: string; ticker: string; date: string | null };

let nextId = 0;
function makeId(): string {
  nextId += 1;
  return `${Date.now()}-${nextId}`;
}

export default function Home() {
  const [items, setItems] = useState<ChatItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  function handleSubmit(rawText: string) {
    const { ticker, date } = parseAnalysisQuery(rawText);

    if (!ticker) {
      setItems((prev) => [
        ...prev,
        { type: "user", id: makeId(), text: rawText },
        {
          type: "validation",
          id: makeId(),
          text: "I couldn't find a valid ticker in that message. Try something like \"AAPL\" or \"analyze NVDA 2026-08-20\".",
        },
      ]);
      return;
    }

    setItems((prev) => [
      ...prev,
      { type: "user", id: makeId(), text: rawText },
      { type: "run", id: makeId(), ticker, date },
    ]);
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b border-card-border bg-card/60 px-4 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-foreground">
            Trading Analysts Team
          </h1>
          <p className="text-sm text-muted">
            Ask about a ticker and watch each analyst weigh in, live.
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {items.length === 0 && (
            <div className="mx-4 rounded-2xl border border-dashed border-card-border px-5 py-8 text-center text-sm text-muted">
              Send a ticker like <span className="font-medium text-foreground">AAPL</span> or{" "}
              <span className="font-medium text-foreground">
                analyze NVDA 2026-08-20
              </span>{" "}
              to kick off a full analyst-team run.
            </div>
          )}

          {items.map((item) => {
            if (item.type === "user") {
              return <ChatMessage key={item.id} text={item.text} role="user" />;
            }
            if (item.type === "validation") {
              return <ChatMessage key={item.id} text={item.text} role="system" />;
            }
            return <AnalysisRun key={item.id} ticker={item.ticker} date={item.date} />;
          })}
          <div ref={bottomRef} />
        </div>
      </main>

      <div className="border-t border-card-border bg-card/60 backdrop-blur-sm">
        <ChatInput onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
