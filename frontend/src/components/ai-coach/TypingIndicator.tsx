import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

export function TypingIndicator() {
  const [stage, setStage] = useState(0);

  const STAGES = [
    "Reading financial profile...",
    "Reviewing Health Score...",
    "Analyzing Risk Profile...",
    "Generating personalized guidance...",
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(1), 1500);
    const timer2 = setTimeout(() => setStage(2), 3000);
    const timer3 = setTimeout(() => setStage(3), 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="flex items-start gap-3">
      {/* Bot Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-2 rounded-2xl rounded-tl-none bg-gray-50 border border-gray-100 p-4 max-w-[85%] sm:max-w-[70%] shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <Spinner size="sm" />
          <span>Thinking...</span>
        </div>
        
        <div className="space-y-1.5 mt-1 border-t border-gray-200/50 pt-2 text-xs">
          {STAGES.slice(0, stage + 1).map((text, idx) => {
            const isLatest = idx === stage;
            return (
              <div key={text} className="flex items-center gap-2">
                {isLatest ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse" />
                ) : (
                  <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                <span className={isLatest ? "text-gray-700 font-medium" : "text-gray-400"}>
                  {text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
