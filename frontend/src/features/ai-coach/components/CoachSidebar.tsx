interface Topic {
  id: string;
  label: string;
  icon?: string;
}

interface CoachSidebarProps {
  topics: Topic[];
  onTopicSelect: (topic: string) => void;
  recentQuestions?: string[];
}

export const CoachSidebar = ({
  topics,
  onTopicSelect,
  recentQuestions = [],
}: CoachSidebarProps) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wide">
        Suggested Topics
      </h3>

      <div className="space-y-2">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => onTopicSelect(topic.label)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            {topic.icon && <span>{topic.icon}</span>}
            <span>{topic.label}</span>
          </button>
        ))}
      </div>

      {recentQuestions.length > 0 && (
        <>
          <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-900 uppercase tracking-wide">
            Recent Questions
          </h3>
          <div className="space-y-1">
            {recentQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onTopicSelect(q)}
                className="w-full rounded-lg px-3 py-2 text-left text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors truncate"
              >
                {q}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
