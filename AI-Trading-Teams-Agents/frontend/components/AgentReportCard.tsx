import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AgentReportCardProps {
  label: string;
  report: string;
  /** Render expanded by default instead of collapsed. */
  defaultOpen?: boolean;
}

/** Grabs a short, markdown-stripped one-liner to show as a collapsed preview. */
function previewOf(markdown: string): string {
  const firstLine = markdown
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return "No summary available.";
  const stripped = firstLine.replace(/[#*_`>-]/g, "").trim();
  return stripped.length > 140 ? `${stripped.slice(0, 140)}…` : stripped;
}

export default function AgentReportCard({
  label,
  report,
  defaultOpen = false,
}: AgentReportCardProps) {
  return (
    <details
      open={defaultOpen}
      className="group max-w-[85%] rounded-2xl border border-card-border bg-card px-4 py-3 shadow-sm sm:max-w-[75%]"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 py-1 marker:content-none">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M16.704 5.29a1 1 0 010 1.415l-7.25 7.25a1 1 0 01-1.415 0l-3.25-3.25a1 1 0 111.415-1.414l2.542 2.542 6.543-6.543a1 1 0 011.415 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="font-medium text-foreground">{label}</span>
        <span className="ml-1 truncate text-sm text-muted group-open:hidden">
          {previewOf(report)}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="ml-auto h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.24 4.65a.75.75 0 01-1.08 0l-4.24-4.65a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>
      <div className="prose prose-sm mt-3 max-w-none border-t border-card-border pt-3 prose-headings:font-semibold prose-a:text-accent prose-table:block prose-table:overflow-x-auto">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
      </div>
    </details>
  );
}
