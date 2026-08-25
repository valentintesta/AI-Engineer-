"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AgentDoneEvent,
  ErrorEventPayload,
  FinalEvent,
  StatusEvent,
} from "./types";

export type RunPhase = "connecting" | "running" | "done" | "error";

export interface AnalysisStreamState {
  phase: RunPhase;
  /** Payload from the `status` event, once received. */
  statusInfo: StatusEvent | null;
  /** One entry per `agent_done` event received so far, in order. */
  agentReports: AgentDoneEvent[];
  /** Payload from the `final` event, once received. */
  final: FinalEvent | null;
  /** Error message, from either the backend `error` event or a transport failure. */
  error: string | null;
}

const initialState: AnalysisStreamState = {
  phase: "connecting",
  statusInfo: null,
  agentReports: [],
  final: null,
  error: null,
};

/**
 * Opens (and tears down) a single EventSource against the backend's
 * `/api/analyze` SSE endpoint for one ticker/date run, translating the four
 * named events from the contract (`status`, `agent_done`, `final`, `error`)
 * into React state. A fresh EventSource is opened whenever `ticker`/`date`
 * change, and it is always closed on unmount or before opening the next one.
 */
export function useAnalysisStream(
  ticker: string,
  date: string | null
): AnalysisStreamState {
  const [state, setState] = useState<AnalysisStreamState>(initialState);
  // Guards against state updates from a stale/closed EventSource racing
  // with a newly opened one (e.g. React StrictMode double-invoke in dev).
  const isCurrent = useRef(true);

  useEffect(() => {
    isCurrent.current = true;

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
      "http://localhost:8000";
    const params = new URLSearchParams({ ticker });
    if (date) params.set("date", date);

    const es = new EventSource(`${baseUrl}/api/analyze?${params.toString()}`);

    const safeParse = <T,>(raw: string | undefined): T | null => {
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    };

    es.addEventListener("status", (evt) => {
      if (!isCurrent.current) return;
      const data = safeParse<StatusEvent>((evt as MessageEvent).data);
      setState((s) => ({ ...s, phase: "running", statusInfo: data ?? s.statusInfo }));
    });

    es.addEventListener("agent_done", (evt) => {
      if (!isCurrent.current) return;
      const data = safeParse<AgentDoneEvent>((evt as MessageEvent).data);
      if (!data) return;
      setState((s) => ({
        ...s,
        phase: "running",
        agentReports: [...s.agentReports, data],
      }));
    });

    es.addEventListener("final", (evt) => {
      if (!isCurrent.current) return;
      const data = safeParse<FinalEvent>((evt as MessageEvent).data);
      setState((s) => ({ ...s, phase: "done", final: data }));
      es.close();
    });

    es.addEventListener("error", (evt) => {
      if (!isCurrent.current) return;
      // The browser also dispatches a generic "error" event (no `data`) on
      // transport-level failures, not just on the backend's named `error`
      // SSE event — handle both here.
      const data = safeParse<ErrorEventPayload>((evt as MessageEvent).data);
      setState((s) =>
        s.phase === "done"
          ? s
          : {
              ...s,
              phase: "error",
              error: data?.message ?? "Lost connection to the analysis stream.",
            }
      );
      es.close();
    });

    return () => {
      isCurrent.current = false;
      es.close();
    };
  }, [ticker, date]);

  return state;
}
