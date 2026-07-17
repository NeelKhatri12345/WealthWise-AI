import axiosInstance, { type ApiResponse } from "./axiosInstance";

export interface AICoachMessageResponse {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  intent: string | null;
  created_at: string;
}

export interface ConversationSummaryResponse {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetailResponse {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: AICoachMessageResponse[];
}

export interface SendMessageResponse {
  conversation_id: string;
  user_message: AICoachMessageResponse;
  assistant_message: AICoachMessageResponse;
}

export const aiCoachApi = {
  async createConversation(title?: string): Promise<ConversationDetailResponse> {
    const { data } = await axiosInstance.post<
      ApiResponse<ConversationDetailResponse>
    >("/ai-coach/conversations", { title });
    return data.data;
  },

  async listConversations(skip = 0, limit = 50): Promise<ConversationSummaryResponse[]> {
    const { data } = await axiosInstance.get<
      ApiResponse<ConversationSummaryResponse[]>
    >("/ai-coach/conversations", {
      params: { skip, limit },
    });
    return data.data;
  },

  async getConversation(conversationId: string): Promise<ConversationDetailResponse> {
    const { data } = await axiosInstance.get<
      ApiResponse<ConversationDetailResponse>
    >(`/ai-coach/conversations/${conversationId}`);
    return data.data;
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<SendMessageResponse> {
    const { data } = await axiosInstance.post<
      ApiResponse<SendMessageResponse>
    >(`/ai-coach/conversations/${conversationId}/messages`, { content });
    return data.data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await axiosInstance.delete<ApiResponse<null>>(
      `/ai-coach/conversations/${conversationId}`,
    );
  },
};
