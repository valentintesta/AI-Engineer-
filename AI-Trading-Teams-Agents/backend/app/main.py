"""FastAPI backend for the Trading-Analysts-Team web chatbot.

Wraps TradingAgentsGraph (Groq LLM + yfinance market data + Exa news)
behind a single Server-Sent-Events endpoint so the Next.js
chat frontend can show each agent's report as it completes, instead of
waiting for the whole multi-agent run.
"""

from __future__ import annotations

import json
import os
import re
from datetime import date as date_cls
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from .config import build_config  # noqa: E402 - after load_dotenv, so keys are present
from .graph_runner import run_analysis  # noqa: E402

app = FastAPI(title="Trading-Analysts-Team API")

# Comma-separated list, e.g. "https://myapp.vercel.app,http://localhost:3000".
# Defaults to local dev only so a forgotten env var fails closed, not open.
_allowed_origins = os.getenv("BACKEND_ALLOWED_ORIGINS", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in _allowed_origins.split(",") if origin.strip()],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_TICKER_RE = re.compile(r"^[A-Z]{1,5}(\.[A-Z]{1,2})?$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/analyze")
async def analyze(
    ticker: str = Query(..., min_length=1, max_length=8),
    date: str | None = Query(default=None),
):
    ticker = ticker.strip().upper()
    if not _TICKER_RE.match(ticker):
        raise HTTPException(400, f"'{ticker}' doesn't look like a ticker symbol (e.g. AAPL, BRK.B).")

    trade_date = date or date_cls.today().isoformat()
    if not _DATE_RE.match(trade_date):
        raise HTTPException(400, f"'{trade_date}' must be in yyyy-mm-dd format.")

    config = build_config()

    async def event_stream():
        yield _sse("status", {"stage": "started", "ticker": ticker, "date": trade_date})
        async for event, payload in run_analysis(config, ticker, trade_date):
            yield _sse(event, payload)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"
