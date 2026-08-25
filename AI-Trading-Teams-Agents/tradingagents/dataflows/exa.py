"""Exa (https://exa.ai) based news fetching.

Exa is a search API with a neural index and first-class publish-date
filtering, which makes it a good fit for the look-ahead-safe news windows
this project needs: the date bounds are enforced server-side rather than
by filtering whatever a generic search returned.

Registered as a ``news_data`` vendor in ``dataflows/interface.py``, so it
joins the yfinance/alpha_vantage chain and is selected via
``config["data_vendors"]["news_data"]``.

Scope note: this module covers news only. Exa's index has effectively no
Reddit or X/Twitter coverage (verified live — domain-filtered queries
return unrelated sites or nothing), so social sentiment stays on
``dataflows/reddit.py`` and ``dataflows/stocktwits.py``.
"""

import logging
import os
from datetime import datetime, timedelta

import requests

from .config import get_config
from .errors import VendorNotConfiguredError, VendorRateLimitError

logger = logging.getLogger(__name__)

API_URL = "https://api.exa.ai/search"

# Network timeout (seconds) so a stalled request can't hang the agents,
# matching alpha_vantage_common.py's convention. Exa's neural search is
# slower than a plain keyword lookup, hence the roomier budget.
REQUEST_TIMEOUT = 45

# Per-article text budget. Kept deliberately tight: every article lands in
# an LLM prompt, and the full page text Exa can return would blow a
# rate-limited token budget on its own.
MAX_CHARS_PER_ARTICLE = 700


class ExaNotConfiguredError(VendorNotConfiguredError):
    """Raised when Exa is selected but no API key is configured, or the key
    is rejected by the API."""


class ExaRateLimitError(VendorRateLimitError):
    """Raised when the Exa API rate limit / quota is exceeded."""


def _get_api_key() -> str:
    api_key = os.getenv("EXA_API_KEY")
    if not api_key:
        raise ExaNotConfiguredError("EXA_API_KEY environment variable is not set.")
    return api_key


def _search(query: str, limit: int, start_date: str, end_date: str) -> list[dict]:
    """Run one date-bounded news search and return Exa's result list."""
    payload = {
        "query": query,
        "category": "news",
        "numResults": limit,
        # Exa wants full ISO-8601 timestamps. The end bound covers the whole
        # end day so same-day news isn't silently dropped.
        "startPublishedDate": f"{start_date}T00:00:00.000Z",
        "endPublishedDate": f"{end_date}T23:59:59.999Z",
        "contents": {"text": {"maxCharacters": MAX_CHARS_PER_ARTICLE}},
    }
    response = requests.post(
        API_URL,
        headers={"x-api-key": _get_api_key(), "Content-Type": "application/json"},
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )
    if response.status_code == 429:
        raise ExaRateLimitError("Exa rate limit exceeded (HTTP 429).")
    if response.status_code in (401, 403):
        raise ExaNotConfiguredError(
            f"Exa API key rejected (HTTP {response.status_code}). "
            "Check the key and the account's credit balance."
        )
    response.raise_for_status()
    return response.json().get("results", [])


def _format(results: list[dict], limit: int) -> str:
    lines = []
    for item in results[:limit]:
        title = item.get("title") or "No title"
        published = (item.get("publishedDate") or "")[:10]
        author = item.get("author") or "Unknown"
        url = item.get("url", "")
        header = f"### {title} (source: {author}"
        header += f", {published})" if published else ")"
        lines.append(header)
        text = (item.get("text") or "").strip()
        if text:
            lines.append(" ".join(text.split()))
        if url:
            lines.append(f"Link: {url}")
        lines.append("")
    return "\n".join(lines)


def get_news(ticker: str, start_date: str, end_date: str) -> str:
    """Retrieve ticker news via Exa.

    Same signature and string-return contract as
    ``yfinance_news.get_news_yfinance``, so it drops into
    ``VENDOR_METHODS["get_news"]``.
    """
    limit = get_config()["news_article_limit"]
    results = _search(f"{ticker} stock news", limit, start_date, end_date)
    if not results:
        return f"No news found for {ticker} between {start_date} and {end_date}"
    return (
        f"## {ticker} News, from {start_date} to {end_date} (via Exa):\n\n"
        f"{_format(results, limit)}"
    )


def get_global_news(
    curr_date: str,
    look_back_days: int | None = None,
    limit: int | None = None,
) -> str:
    """Retrieve global/macro news via Exa.

    Mirrors ``yfinance_news.get_global_news_yfinance``: walks the configured
    ``global_news_queries``, dedupes by URL, and stops once ``limit`` results
    are collected.
    """
    config = get_config()
    if look_back_days is None:
        look_back_days = config["global_news_lookback_days"]
    if limit is None:
        limit = config["global_news_article_limit"]

    start_date = (
        datetime.strptime(curr_date, "%Y-%m-%d") - timedelta(days=look_back_days)
    ).strftime("%Y-%m-%d")

    collected: list[dict] = []
    seen_urls = set()
    for query in config["global_news_queries"]:
        for item in _search(query, limit, start_date, curr_date):
            url = item.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                collected.append(item)
        if len(collected) >= limit:
            break

    if not collected:
        return f"No global news found between {start_date} and {curr_date}"
    return (
        f"## Global Market News, from {start_date} to {curr_date} (via Exa):\n\n"
        f"{_format(collected, limit)}"
    )
