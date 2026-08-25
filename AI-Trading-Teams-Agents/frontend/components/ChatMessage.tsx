interface ChatMessageProps {
  text: string;
  /** "user" renders a right-aligned bubble; "system" is a centered inline notice. */
  role?: "user" | "system";
}

export default function ChatMessage({ text, role = "user" }: ChatMessageProps) {
  if (role === "system") {
    return (
      <div className="flex justify-center px-4">
        <p className="max-w-lg rounded-full bg-accent-soft px-4 py-2 text-center text-sm text-foreground/80">
          {text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex justify-end px-4">
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent px-4 py-3 text-white shadow-sm sm:max-w-[70%]">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}
