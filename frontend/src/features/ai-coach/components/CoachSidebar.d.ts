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
export declare const CoachSidebar: ({ topics, onTopicSelect, recentQuestions }: CoachSidebarProps) => import("react").JSX.Element;
export {};
