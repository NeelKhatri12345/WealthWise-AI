import axiosInstance, { type ApiResponse } from "./axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────

export type InputType = "chips" | "amount" | "text";

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  message: string;
  extracted_fields: Record<string, unknown> | null;
  created_at: string;
}

export interface StartChatResponse {
  session_id: string;
  status: string;
  current_step: number;
  first_message: string;
  /** True when the session was already completed — frontend shows CompletionCard, no input needed. */
  is_complete: boolean;
  /** Authoritative completion % from profile — use this as the single source of truth on load. */
  profile_completion_percentage: number;
  quick_replies: string[] | null;
  input_type: InputType;
  allow_free_text: boolean;
}

/** Returned by POST /retake — same as StartChatResponse but also includes the
 *  seeded Step-0 assistant messages, eliminating a second GET round-trip. */
export interface RetakeChatResponse extends StartChatResponse {
  messages: ChatMessage[];
}

export interface SendMessageResponse {
  session_id: string;
  status: string;
  current_step: number;
  assistant_message: string;
  extracted_fields: Record<string, unknown> | null;
  profile_completion_percentage: number;
  is_complete: boolean;
  // Validation
  is_valid_answer: boolean;
  validation_message: string | null;
  // UI hints
  quick_replies: string[] | null;
  allow_free_text: boolean;
  input_type: InputType;
  // backwards compat
  suggested_choices: string[] | null;
}

export interface ChatSession {
  id: string;
  user_id: string;
  status: string;
  current_step: number;
  started_at: string;
  completed_at: string | null;
  messages: ChatMessage[];
  profile_completion_percentage: number;
}

// ── API ───────────────────────────────────────────────────────────────────────

export const financialChatApi = {
  async startSession(): Promise<StartChatResponse> {
    const { data } = await axiosInstance.post<ApiResponse<StartChatResponse>>(
      "/financial-chat/start",
    );
    return data.data;
  },

  async retakeAssessment(): Promise<RetakeChatResponse> {
    const { data } = await axiosInstance.post<ApiResponse<RetakeChatResponse>>(
      "/financial-chat/retake",
    );
    return data.data;
  },

  async sendMessage(
    sessionId: string,
    message: string,
  ): Promise<SendMessageResponse> {
    const { data } = await axiosInstance.post<ApiResponse<SendMessageResponse>>(
      `/financial-chat/${sessionId}/message`,
      { message },
    );
    return data.data;
  },

  async goToPreviousStep(sessionId: string): Promise<SendMessageResponse> {
    const { data } = await axiosInstance.post<ApiResponse<SendMessageResponse>>(
      `/financial-chat/${sessionId}/previous`,
    );
    return data.data;
  },

  async getSession(sessionId: string): Promise<ChatSession> {
    const { data } = await axiosInstance.get<ApiResponse<ChatSession>>(
      `/financial-chat/${sessionId}`,
    );
    return data.data;
  },
};

