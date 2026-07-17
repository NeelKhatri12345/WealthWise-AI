export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    sources?: string[];
    confidence?: number;
  };
}

export interface CoachSession {
  id: string;
  title: string;
  messages: CoachMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Advice {
  id: string;
  category: "savings" | "investment" | "debt" | "budgeting" | "tax" | "general";
  title: string;
  summary: string;
  detail: string;
  priority: "low" | "medium" | "high";
  actionItems: string[];
  createdAt: string;
}
