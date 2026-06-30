interface AdviceCardProps {
  title: string;
  description: string;
  category: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const AdviceCard = ({
  title,
  description,
  category,
  actionLabel = "Learn More",
  onAction,
}: AdviceCardProps) => {
  return (
    <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-5 border border-indigo-100">
      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
        {category}
      </span>
      <h4 className="mt-2 text-sm font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 text-sm text-gray-600">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          {actionLabel} &rarr;
        </button>
      )}
    </div>
  );
};
