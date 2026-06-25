import { ChatInterface, AdviceCard, CoachSidebar } from './components';
import { useCoachChat } from './hooks';

const suggestedTopics = [
  { id: 'savings', label: 'How can I save more?', icon: '\uD83D\uDCB0' },
  { id: 'invest', label: 'Where should I invest?', icon: '\uD83D\uDCC8' },
  { id: 'debt', label: 'How to pay off debt faster?', icon: '\uD83D\uDCB3' },
  { id: 'budget', label: 'Help me create a budget', icon: '\uD83D\uDCCB' },
  { id: 'retire', label: 'Am I on track for retirement?', icon: '\uD83C\uDFD6\uFE0F' },
];

export const AICoachPage = () => {
  const { messages, sendMessage, isTyping } = useCoachChat();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Financial Coach</h1>
        <p className="mt-1 text-sm text-gray-600">
          Get personalized financial advice powered by AI
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <ChatInterface
            messages={messages}
            onSendMessage={sendMessage}
            isTyping={isTyping}
          />
        </div>

        <div className="space-y-4">
          <CoachSidebar
            topics={suggestedTopics}
            onTopicSelect={sendMessage}
          />

          <AdviceCard
            title="Track Your Spending"
            description="Monitoring daily expenses is the first step to financial freedom."
            category="Tip of the Day"
          />
        </div>
      </div>
    </div>
  );
};
