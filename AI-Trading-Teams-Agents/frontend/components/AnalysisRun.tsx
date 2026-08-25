"use client";

import { useAnalysisStream } from "@/lib/useAnalysisStream";
import AgentReportCard from "./AgentReportCard";
import FinalDecisionCard from "./FinalDecisionCard";
import ErrorCard from "./ErrorCard";
import ThinkingIndicator from "./ThinkingIndicator";

interface AnalysisRunProps {
  ticker: string;
  date: string | null;
}

const THINKING_LABELS: Record<string, string> = {
  connecting: "Connecting to the analyst desk…",
  running: "Analysts are working…",
};

/**
 * Owns one EventSource-backed analysis run: renders a report card per
 * completed agent, a thinking indicator while the pipeline is still going,
 * and either the final decision or an error card once it terminates.
 */
export default function AnalysisRun({ ticker, date }: AnalysisRunProps) {
  const { phase, statusInfo, agentReports, final, error } = useAnalysisStream(
    ticker,
    date
  );

  const resolvedTicker = statusInfo?.ticker ?? final?.ticker ?? ticker;
  const resolvedDate = statusInfo?.date ?? final?.date ?? date ?? "today";

  return (
    <div className="flex flex-col gap-2 px-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Analyzing {resolvedTicker} · {resolvedDate}
      </p>

      {agentReports.map((r, i) => (
        <AgentReportCard key={`${r.agent}-${i}`} label={r.label} report={r.report} />
      ))}

      {(phase === "connecting" || phase === "running") && (
        <ThinkingIndicator label={THINKING_LABELS[phase]} />
      )}

      {phase === "done" && final && (
        <FinalDecisionCard
          ticker={resolvedTicker}
          date={resolvedDate}
          decision={final.decision}
          finalTradeDecision={final.final_trade_decision}
        />
      )}

      {phase === "error" && <ErrorCard message={error ?? "Something went wrong."} />}
    </div>
  );
}
