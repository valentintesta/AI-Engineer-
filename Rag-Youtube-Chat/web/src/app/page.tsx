"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

type Message = { role: "user" | "assistant" | "error"; content: string };

function parseVideoId(input: string): string | null {
  const value = input.trim();
  if (/^[\w-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") return url.pathname.slice(1, 12) || null;
    const v = url.searchParams.get("v");
    if (v) return v;
    const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const trpc = useTRPC();
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const ingest = useMutation(
    trpc.ingest.mutationOptions({
      onSuccess: (data) => {
        setVideoId(data.videoId);
        setMessages([]);
      },
    }),
  );

  const ask = useMutation(
    trpc.ask.mutationOptions({
      onSuccess: (data) => setMessages((m) => [...m, { role: "assistant", content: data.answer }]),
      onError: (err) => setMessages((m) => [...m, { role: "error", content: err.message }]),
    }),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ask.isPending]);

  const parsedId = parseVideoId(url);

  function onIngest(e: React.FormEvent) {
    e.preventDefault();
    if (parsedId) ingest.mutate({ videoId: parsedId });
  }

  function onAsk(e: React.FormEvent) {
    e.preventDefault();
    const query = question.trim();
    if (!videoId || !query || ask.isPending) return;
    setMessages((m) => [...m, { role: "user", content: query }]);
    setQuestion("");
    ask.mutate({ videoId, query });
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">Chat con YouTube</h1>
        <p className="text-sm text-zinc-500">
          Pegá un link, indexamos el transcript y respondemos solo con lo que dice el video.
        </p>
      </header>

      <form onSubmit={onIngest} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700"
        />
        <button
          type="submit"
          disabled={!parsedId || ingest.isPending}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {ingest.isPending ? "Indexando…" : "Indexar video"}
        </button>
      </form>
      {url && !parsedId && <p className="-mt-4 text-sm text-red-500">Ese link no parece de YouTube.</p>}
      {ingest.error && <p className="-mt-4 text-sm text-red-500">{ingest.error.message}</p>}

      {videoId ? (
        <section className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`}
              alt=""
              className="h-12 w-20 rounded object-cover"
            />
            <span>
              Video <code>{videoId}</code> listo
              {ingest.data?.videoId === videoId && ` · ${ingest.data.chunks} fragmentos`}
            </span>
          </div>

          <div className="flex flex-1 flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "self-end max-w-[85%] rounded-2xl bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : m.role === "error"
                      ? "max-w-[85%] rounded-2xl bg-red-50 px-4 py-2 text-red-700 dark:bg-red-950 dark:text-red-300"
                      : "max-w-[85%] whitespace-pre-wrap rounded-2xl bg-zinc-100 px-4 py-2 dark:bg-zinc-900"
                }
              >
                {m.content}
              </div>
            ))}
            {ask.isPending && <div className="text-sm text-zinc-500">Pensando…</div>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={onAsk} className="sticky bottom-4 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Preguntá algo sobre el video…"
              className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-black"
            />
            <button
              type="submit"
              disabled={!question.trim() || ask.isPending}
              className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Enviar
            </button>
          </form>
        </section>
      ) : (
        !ingest.isPending && <p className="text-sm text-zinc-500">Indexá un video para empezar a chatear.</p>
      )}
    </main>
  );
}
