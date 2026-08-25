interface ErrorCardProps {
  message: string;
}

export default function ErrorCard({ message }: ErrorCardProps) {
  return (
    <div className="max-w-[85%] rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm sm:max-w-[70%]">
      <div className="flex items-start gap-2">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
        >
          <path
            fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.516-2.63L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-medium">Analysis failed</p>
          <p className="mt-0.5 text-sm text-red-700">{message}</p>
        </div>
      </div>
    </div>
  );
}
