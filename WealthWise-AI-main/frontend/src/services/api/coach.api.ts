import axiosInstance, { type ApiResponse } from "./axiosInstance";

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

export const coachApi = {
  async sendMessage(
    sessionId: string,
    content: string,
  ): Promise<CoachMessageResponse> {
    const { data } = await axiosInstance.post<
      ApiResponse<CoachMessageResponse>
    >(`/coach/sessions/${sessionId}/messages`, { content });
    return data.data;
  },

  async getSessions(): Promise<CoachSessionResponse[]> {
    const { data } =
      await axiosInstance.get<ApiResponse<CoachSessionResponse[]>>(
        "/coach/sessions",
      );
    return data.data;
  },

  async getSessionMessages(sessionId: string): Promise<CoachMessageResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<CoachMessageResponse[]>
    >(`/coach/sessions/${sessionId}/messages`);
    return data.data;
  },

  async createSession(title?: string): Promise<CoachSessionResponse> {
    const { data } = await axiosInstance.post<
      ApiResponse<CoachSessionResponse>
    >("/coach/sessions", { title });
    return data.data;
  },
};
