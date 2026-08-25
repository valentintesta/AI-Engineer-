interface ThinkingIndicatorProps {
  label?: string;
}

export default function ThinkingIndicator({
  label = "Working…",
}: ThinkingIndicatorProps) {
  return (
    <div className="flex max-w-[85%] items-center gap-2 rounded-2xl border border-card-border bg-card px-4 py-3 text-sm text-muted shadow-sm sm:max-w-[70%]">
      <span>{label}</span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
      </span>
    </div>
  );
}
