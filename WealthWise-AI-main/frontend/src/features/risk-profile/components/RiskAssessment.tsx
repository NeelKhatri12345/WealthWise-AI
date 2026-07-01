import { useState } from "react";

interface Question {
  id: string;
  text: string;
  options: Array<{ value: string; label: string }>;
}

interface RiskAssessmentProps {
  questions: Question[];
  onSubmit: (answers: Record<string, string>) => void;
  isLoading?: boolean;
}

export const RiskAssessment = ({
  questions,
  onSubmit,
  isLoading = false,
}: RiskAssessmentProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isComplete = Object.keys(answers).length === questions.length;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        Risk Assessment
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Question {currentIndex + 1} of {questions.length}
      </p>

      <div className="mb-6 h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {currentQuestion && (
        <div>
          <p className="mb-4 text-base font-medium text-gray-900">
            {currentQuestion.text}
          </p>
          <div className="space-y-2">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                  answers[currentQuestion.id] === opt.value
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Previous
        </button>

        {isComplete && (
          <button
            onClick={() => onSubmit(answers)}
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? "Submitting..." : "Submit Assessment"}
          </button>
        )}
      </div>
    </div>
  );
};
