from typing import Annotated

from langchain_core.tools import tool

from tradingagents.dataflows.config import get_config
from tradingagents.dataflows.interface import route_to_vendor


@tool
def get_indicators(
    symbol: Annotated[str, "ticker symbol of the company"],
    indicator: Annotated[str, "technical indicator to get the analysis and report of"],
    curr_date: Annotated[str, "The current trading date you are trading on, YYYY-mm-dd"],
    look_back_days: Annotated[int, "how many days to look back"] = 30,
) -> str:
    """
    Retrieve a single technical indicator for a given ticker symbol.
    Uses the configured technical_indicators vendor.
    Args:
        symbol (str): Ticker symbol of the company, e.g. AAPL, TSM
        indicator (str): A single technical indicator name, e.g. 'rsi', 'macd'. Call this tool once per indicator.
        curr_date (str): The current trading date you are trading on, YYYY-mm-dd
        look_back_days (int): How many days to look back, default is 30
    Returns:
        str: A formatted dataframe containing the technical indicators for the specified ticker symbol and indicator.
    """
    # The result grows linearly with the window (one row per trading day), and
    # every row lands in the agent's prompt: a 365-day request costs ~10x a
    # 30-day one. On token-capped providers a single long window can exceed the
    # per-request ceiling on its own, so an optional config cap bounds the worst
    # case regardless of what the model asks for. Default None = uncapped, so
    # behaviour is unchanged unless a deployment opts in.
    max_lookback = get_config().get("max_indicator_lookback_days")
    clamped = False
    if max_lookback and look_back_days > max_lookback:
        look_back_days, clamped = max_lookback, True

    # LLMs sometimes pass multiple indicators as a comma-separated string;
    # split and process each individually.
    indicators = [i.strip().lower() for i in indicator.split(",") if i.strip()]
    results = []
    for ind in indicators:
        try:
            results.append(route_to_vendor("get_indicators", symbol, ind, curr_date, look_back_days))
        except ValueError as e:
            results.append(str(e))

    body = "\n\n".join(results)
    if clamped:
        # Say so explicitly: otherwise the agent may describe a multi-month
        # trend from data it never received.
        body = (
            f"NOTE: the look-back window was capped at {max_lookback} days by "
            f"configuration. Only this window is shown below — do not describe "
            f"trends over a longer period than this.\n\n{body}"
        )
    return body
