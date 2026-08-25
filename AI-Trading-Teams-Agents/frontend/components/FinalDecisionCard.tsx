import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FinalDecisionCardProps {
  ticker: string;
  date: string;
  decision: string;
  finalTradeDecision: string;
}

function badgeClasses(decision: string): string {
  const normalized = decision.trim().toUpperCase();
  if (normalized === "BUY") return "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
  if (normalized === "SELL") return "bg-red-100 text-red-800 ring-red-600/20";
  if (normalized === "HOLD") return "bg-slate-200 text-slate-700 ring-slate-500/20";
  return "bg-accent-soft text-accent ring-accent/20";
}

export default function FinalDecisionCard({
  ticker,
  date,
  decision,
  finalTradeDecision,
}: FinalDecisionCardProps) {
  return (
    <div className="max-w-[90%] rounded-2xl border border-card-border bg-card px-5 py-4 shadow-md sm:max-w-[80%]">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${badgeClasses(
            decision
          )}`}
        >
          {decision}
        </span>
        <span className="text-sm text-muted">
          Final call for <span className="font-medium text-foreground">{ticker}</span> on{" "}
          {date}
        </span>
      </div>
      <div className="prose prose-sm mt-4 max-w-none border-t border-card-border pt-4 prose-headings:font-semibold prose-a:text-accent prose-table:block prose-table:overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalTradeDecision}</ReactMarkdown>
      </div>
    </div>
  );
}
