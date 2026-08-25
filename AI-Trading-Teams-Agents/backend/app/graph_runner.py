"""Bridges TradingAgentsGraph's synchronous LangGraph stream into an async
generator of progress events, for the FastAPI SSE endpoint to consume.

Runs the graph in a background thread (LangGraph's ``.stream()`` here is
blocking/sync) and relays state snapshots through a queue as they arrive,
so the web chat UI can show each agent finishing in near-real-time instead
of waiting for the whole multi-agent run to complete.

Deliberately uses only the public TradingAgentsGraph/Propagator surface
(``propagator.create_initial_state`` / ``get_graph_args``, ``graph.stream``,
``process_signal``) rather than the private ``_run_graph``/``propagate``
helpers, which also wire in cross-run memory (past decisions) and
checkpoint/resume. This runner intentionally skips those — every web
request is a fresh, stateless analysis.
"""

from __future__ import annotations

import asyncio
import queue
import threading
from collections.abc import AsyncIterator
from typing import Any

from tradingagents.graph.trading_graph import TradingAgentsGraph

# (state field, event agent id, display label) for the four analyst reports.
# Emitted in this order as each becomes non-empty in the streamed state.
_ANALYST_STAGES = [
    ("market_report", "market_analyst", "Market Analyst"),
    ("sentiment_report", "sentiment_analyst", "Sentiment Analyst"),
    ("news_report", "news_analyst", "News Analyst"),
    ("fundamentals_report", "fundamentals_analyst", "Fundamentals Analyst"),
]

_SENTINEL = object()


def _judge_decision(state: dict, key: str) -> str:
    return (state.get(key) or {}).get("judge_decision") or ""


def _run_graph_sync(config: dict, ticker: str, date: str, out: "queue.Queue[Any]") -> None:
    try:
        graph = TradingAgentsGraph(debug=True, config=config)
        init_state = graph.propagator.create_initial_state(ticker, date)
        args = graph.propagator.get_graph_args()

        seen_analyst_fields: set[str] = set()
        last_research_judge = ""
        last_trader_plan = ""
        final_state: dict = {}

        for chunk in graph.graph.stream(init_state, **args):
            final_state.update(chunk)

            for field, agent_id, label in _ANALYST_STAGES:
                if field in seen_analyst_fields:
                    continue
                if chunk.get(field):
                    seen_analyst_fields.add(field)
                    out.put(("agent_done", {
                        "agent": agent_id, "label": label, "report": chunk[field],
                    }))

            research_judge = _judge_decision(chunk, "investment_debate_state")
            if research_judge and research_judge != last_research_judge:
                last_research_judge = research_judge
                out.put(("agent_done", {
                    "agent": "research_manager",
                    "label": "Research Manager",
                    "report": chunk.get("investment_plan") or research_judge,
                }))

            trader_plan = chunk.get("trader_investment_plan") or ""
            if trader_plan and trader_plan != last_trader_plan:
                last_trader_plan = trader_plan
                out.put(("agent_done", {
                    "agent": "trader", "label": "Trader", "report": trader_plan,
                }))

        final_decision_text = final_state.get("final_trade_decision", "")
        if not final_decision_text:
            raise RuntimeError("The analysis finished without a final trade decision.")

        decision = graph.process_signal(final_decision_text)
        out.put(("final", {
            "ticker": ticker,
            "date": date,
            "decision": decision,
            "final_trade_decision": final_decision_text,
        }))
    except Exception as exc:  # noqa: BLE001 - surfaced to the client, not swallowed
        out.put(("error", {"message": str(exc)}))
    finally:
        out.put(_SENTINEL)


async def run_analysis(config: dict, ticker: str, date: str) -> AsyncIterator[tuple[str, dict]]:
    """Yield ``(event_name, payload)`` tuples as the graph runs.

    Events: ``agent_done`` (one per completed analyst/manager/trader stage),
    ``final`` (terminal, carries the BUY/HOLD/SELL decision), or ``error``
    (terminal, carries a message). Exactly one terminal event is always sent.
    """
    q: "queue.Queue[Any]" = queue.Queue()
    thread = threading.Thread(
        target=_run_graph_sync, args=(config, ticker, date, q), daemon=True,
    )
    thread.start()

    loop = asyncio.get_event_loop()
    while True:
        item = await loop.run_in_executor(None, q.get)
        if item is _SENTINEL:
            return
        yield item
