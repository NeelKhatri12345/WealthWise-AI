export interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const QUESTIONS = [
  "Why is my Health Score low?",
  "How can I improve my savings?",
  "Explain my Risk Profile.",
  "Where am I overspending?",
  "Create a 30-day improvement plan.",
  "How can I reduce debt?",
  "What investment strategy suits me?",
  "Explain my spending behaviour.",
];

export function SuggestedQuestions({ onSelectQuestion }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggested Questions</p>
      <div className="flex flex-wrap gap-2">
        {QUESTIONS.map((question) => (
          <button
            key={question}
            onClick={() => onSelectQuestion(question)}
            className="rounded-full border border-primary-200 bg-primary-50/50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-all hover:bg-primary-100 hover:border-primary-300 hover:shadow-sm"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
