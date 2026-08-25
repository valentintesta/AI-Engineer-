// Shared types mirroring the SSE contract exposed by the FastAPI backend
// (see backend/app/main.py). Keep these in sync with the backend response
// shapes — they are intentionally loose (backend is the source of truth).

/** Fired once, immediately, when a run starts. */
export interface StatusEvent {
  stage: string;
  ticker: string;
  date: string;
}

/** Fired 0-6 times as each pipeline stage completes. */
export interface AgentDoneEvent {
  agent:
    | "market_analyst"
    | "sentiment_analyst"
    | "news_analyst"
    | "fundamentals_analyst"
    | "research_manager"
    | "trader"
    | string;
  label: string;
  report: string;
}

/** Fired exactly once on success; terminal. */
export interface FinalEvent {
  ticker: string;
  date: string;
  decision: string;
  final_trade_decision: string;
}

/** Fired exactly once on failure instead of `final`; terminal. */
export interface ErrorEventPayload {
  message: string;
}
