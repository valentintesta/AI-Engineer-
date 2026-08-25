"""Builds the TradingAgentsGraph config used by the web backend.

Layered on tradingagents.default_config: OpenAI for the LLM (the repo's
own default provider) and Exa for news. Set here rather than through the
TRADINGAGENTS_* env vars so the CLI (main.py / cli/main.py) is unaffected
and keeps using its own defaults.

Provider is switchable via BACKEND_LLM_PROVIDER. Groq was the original
target here, but its free tier caps every gpt-oss model at 8k
tokens-per-minute, and the market analyst's tool-calling loop alone
measured 8.4k-14k tokens per request — so runs failed with HTTP 413
before finishing. OpenAI's limit on this account is 200k TPM, which the
pipeline fits comfortably at full analysis depth. To go back to Groq, set
BACKEND_LLM_PROVIDER=groq plus the model and budget vars below; the
token-budget knobs exist for exactly that case.
"""

import os

from tradingagents.default_config import DEFAULT_CONFIG

PROVIDER = os.getenv("BACKEND_LLM_PROVIDER", "openai")

# Big model for the decision-making nodes, cheaper/faster one for the
# analysts — the same split the repo ships by default. This pipeline makes
# roughly 15-25 LLM calls per analysis, so the quick-think choice is what
# mostly drives cost per run.
DEEP_THINK_MODEL = os.getenv("BACKEND_DEEP_THINK_LLM", "gpt-5.5")
QUICK_THINK_MODEL = os.getenv("BACKEND_QUICK_THINK_LLM", "gpt-5.4-mini")


def _int_env(name: str, default: str) -> int:
    return int(os.getenv(name, default))


def build_config() -> dict:
    config = DEFAULT_CONFIG.copy()
    config["llm_provider"] = PROVIDER
    config["deep_think_llm"] = DEEP_THINK_MODEL
    config["quick_think_llm"] = QUICK_THINK_MODEL
    config["backend_url"] = None

    # Ride out bursty 429s instead of aborting a run. The SDK's own backoff
    # honours the server's suggested wait; the default budget (2) is thin for
    # a pipeline that issues many calls in quick succession.
    config["llm_max_retries"] = _int_env("BACKEND_LLM_MAX_RETRIES", "8")

    # data_vendors is a nested dict — copy before mutating so we don't touch
    # the shared DEFAULT_CONFIG dict. Exa is the primary news source, with
    # yfinance kept as an explicit fallback in the chain so an expired or
    # rejected EXA_API_KEY degrades the run instead of aborting it
    # (route_to_vendor walks the chain in order and only uses vendors listed).
    config["data_vendors"] = {**config["data_vendors"], "news_data": "exa,yfinance"}

    # Token-budget knobs. The defaults below match the repo's own values, i.e.
    # full analysis depth — they only need lowering on a rate-capped provider.
    # Measured costs, if you ever have to tune them: one indicator is ~370
    # tokens over a 30-day window but ~3,570 over 365 days (the window is
    # model-chosen, so max_indicator_lookback_days is what bounds the worst
    # case), and a 20-article news block is ~4,600 tokens.
    config["news_article_limit"] = _int_env("BACKEND_NEWS_LIMIT", "20")
    config["global_news_article_limit"] = _int_env("BACKEND_GLOBAL_NEWS_LIMIT", "10")
    config["max_indicators"] = _int_env("BACKEND_MAX_INDICATORS", "8")
    lookback = os.getenv("BACKEND_MAX_INDICATOR_LOOKBACK")
    config["max_indicator_lookback_days"] = int(lookback) if lookback else None

    return config
