"use client";

import { useState, type FormEvent } from "react";

interface ChatInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSubmit, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text) return;
    onSubmit(text);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 pb-4"
    >
      <div className="flex flex-1 items-center rounded-2xl border border-card-border bg-card px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-accent/40">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Try “AAPL” or “analyze NVDA 2026-08-20”"
          className="w-full bg-transparent text-[15px] text-foreground placeholder:text-muted focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="shrink-0 rounded-2xl bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Send
      </button>
    </form>
  );
}
