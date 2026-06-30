export interface CoachMessageResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
export interface CoachSessionResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}
export declare const coachApi: {
  sendMessage(
    sessionId: string,
    content: string,
  ): Promise<CoachMessageResponse>;
  getSessions(): Promise<CoachSessionResponse[]>;
  getSessionMessages(sessionId: string): Promise<CoachMessageResponse[]>;
  createSession(title?: string): Promise<CoachSessionResponse>;
};
