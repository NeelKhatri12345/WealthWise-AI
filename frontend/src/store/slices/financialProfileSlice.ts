import {
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import type { RootState } from "../index";
import type {
  ChatMessage,
  RetakeChatResponse,
  SendMessageResponse,
  StartChatResponse,
  InputType,
} from "../../services/api/financialChat.api";
import type { FinancialProfile } from "../../services/api/financialProfile.api";
import type { HealthScoreSnapshot } from "../../services/api/health.api";

// ── State shape ────────────────────────────────────────────────────────────────

export interface FinancialProfileState {
  // Profile
  profile: FinancialProfile | null;
  profileLoading: boolean;
  profileError: string | null;

  // Chat session
  sessionId: string | null;
  sessionStatus: "idle" | "active" | "completed";
  currentStep: number;
  messages: ChatMessage[];
  // UI hints for the CURRENT question
  quickReplies: string[] | null;
  allowFreeText: boolean;
  inputType: InputType;
  // Profile fill %
  completionPct: number;
  // Validation state
  isValidAnswer: boolean;
  validationMessage: string | null;
  chatLoading: boolean;
  chatError: string | null;

  // Hybrid health score snapshot
  snapshot: HealthScoreSnapshot | null;
  snapshotLoading: boolean;
  snapshotError: string | null;
}

const initialState: FinancialProfileState = {
  profile: null,
  profileLoading: false,
  profileError: null,

  sessionId: null,
  sessionStatus: "idle",
  currentStep: 0,
  messages: [],
  quickReplies: null,
  allowFreeText: false,
  inputType: "chips",
  completionPct: 0,
  isValidAnswer: true,
  validationMessage: null,
  chatLoading: false,
  chatError: null,

  snapshot: null,
  snapshotLoading: false,
  snapshotError: null,
};

// ── Thunks ─────────────────────────────────────────────────────────────────────

export const fetchFinancialProfile = createAsyncThunk(
  "financialProfile/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { financialProfileApi } = await import(
        "../../services/api/financialProfile.api"
      );
      return await financialProfileApi.getProfile();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message ?? "Failed to load profile");
    }
  },
);

// TOTAL_STEPS must match the backend constant (10 questions, steps 0–9).
const TOTAL_STEPS = 10;

export const startChatSession = createAsyncThunk(
  "financialProfile/startSession",
  async (_, { rejectWithValue }) => {
    try {
      const { financialChatApi } = await import(
        "../../services/api/financialChat.api"
      );
      // StartChatResponse now carries is_complete, profile_completion_percentage,
      // and current_step as the authoritative session state — no race condition.
      const startRes = await financialChatApi.startSession();

      // Always fetch message history so the chat window can replay the previous
      // Q&A conversation for both active and completed sessions.
      const sessionRes = await financialChatApi.getSession(startRes.session_id);
      return { start: startRes, messages: sessionRes.messages };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message ?? "Failed to start chat session");
    }
  },
);

export const goToPreviousStep = createAsyncThunk(
  "financialProfile/goToPrevious",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const { financialChatApi } = await import(
        "../../services/api/financialChat.api"
      );
      return await financialChatApi.goToPreviousStep(sessionId);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message ?? "Failed to go to previous step");
    }
  },
);

export const sendChatMessage = createAsyncThunk(
  "financialProfile/sendMessage",
  async (
    { sessionId, message }: { sessionId: string; message: string },
    { rejectWithValue },
  ) => {
    try {
      const { financialChatApi } = await import(
        "../../services/api/financialChat.api"
      );
      return await financialChatApi.sendMessage(sessionId, message);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message ?? "Failed to send message");
    }
  },
);

export const fetchLatestSnapshot = createAsyncThunk(
  "financialProfile/fetchSnapshot",
  async (_, { rejectWithValue }) => {
    try {
      const { healthApi } = await import("../../services/api/health.api");
      return await healthApi.getLatestSnapshot();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(e.response?.data?.message ?? "No snapshot found");
    }
  },
);

export const calculateHealthScore = createAsyncThunk(
  "financialProfile/calculateScore",
  async (_, { rejectWithValue }) => {
    try {
      const { healthApi } = await import("../../services/api/health.api");
      return await healthApi.calculateScore();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        e.response?.data?.message ?? "Failed to calculate health score",
      );
    }
  },
);

export const retakeAssessment = createAsyncThunk(
  "financialProfile/retake",
  async (_, { rejectWithValue }) => {
    try {
      const { financialChatApi } = await import(
        "../../services/api/financialChat.api"
      );
      // POST /retake returns the fresh session + initial Step-0 messages inline.
      // No second GET call is required.
      const res: RetakeChatResponse = await financialChatApi.retakeAssessment();
      return { start: res, messages: res.messages };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        e.response?.data?.message ?? "Failed to retake assessment",
      );
    }
  },
);

// ── Slice ──────────────────────────────────────────────────────────────────────

const financialProfileSlice = createSlice({
  name: "financialProfile",
  initialState,
  reducers: {
    clearChatError(state) {
      state.chatError = null;
    },
    clearSnapshotError(state) {
      state.snapshotError = null;
    },
    clearValidationMessage(state) {
      state.validationMessage = null;
      state.isValidAnswer = true;
    },
    resetChat(state) {
      state.sessionId = null;
      state.sessionStatus = "idle";
      state.currentStep = 0;
      state.messages = [];
      state.quickReplies = null;
      state.allowFreeText = false;
      state.inputType = "chips";
      state.completionPct = 0;
      state.isValidAnswer = true;
      state.validationMessage = null;
      state.chatError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchFinancialProfile
    builder
      .addCase(fetchFinancialProfile.pending, (state) => {
        state.profileLoading = true;
        state.profileError = null;
      })
      .addCase(fetchFinancialProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.profile = action.payload;
        // NOTE: completionPct is NOT set here intentionally.
        // It is owned exclusively by the chat session state (startChatSession / sendChatMessage).
        // Setting it here caused a race condition: fetchFinancialProfile could resolve before
        // startChatSession and set completionPct=100 while currentStep was still 0.
      })
      .addCase(fetchFinancialProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.profileError = action.payload as string;
      });

    // startChatSession
    builder
      .addCase(startChatSession.pending, (state) => {
        state.chatLoading = true;
        state.chatError = null;
      })
      .addCase(startChatSession.fulfilled, (state, action) => {
        state.chatLoading = false;
        // Payload shape: { start: StartChatResponse, messages: ChatMessage[] }
        // StartChatResponse is the single authoritative source for all session state on load.
        const { start, messages } = action.payload as {
          start: StartChatResponse;
          messages: ChatMessage[];
        };

        state.sessionId = start.session_id;
        state.sessionStatus = start.status as "active" | "completed";

        // For completed sessions the backend pins current_step to TOTAL_STEPS - 1 (= 9).
        // This guarantees displayStep = min(9 + 1, 10) = 10, consistent with Progress 100%.
        // For active sessions, use the step returned by the backend directly.
        state.currentStep = start.is_complete
          ? TOTAL_STEPS - 1
          : start.current_step;

        // completionPct is set ONLY from StartChatResponse.profile_completion_percentage.
        // This removes the race with fetchFinancialProfile.fulfilled which used to set it
        // from the profile API and could arrive with currentStep still at 0.
        state.completionPct = start.profile_completion_percentage;

        state.quickReplies = start.quick_replies ?? null;
        state.allowFreeText = start.allow_free_text ?? false;
        state.inputType = start.input_type ?? "chips";

        // For active sessions, hydrate message history so the chat window replays the
        // previous Q&A. For completed sessions messages is [] and the CompletionCard
        // is shown instead of the chat input area.
        state.messages = messages;
      })
      .addCase(startChatSession.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.payload as string;
      });

    // goToPreviousStep
    builder
      .addCase(goToPreviousStep.pending, (state) => {
        state.chatLoading = true;
        state.chatError = null;
        state.validationMessage = null;
        state.isValidAnswer = true;
        state.quickReplies = null;
      })
      .addCase(goToPreviousStep.fulfilled, (state, action) => {
        state.chatLoading = false;
        const res = action.payload as SendMessageResponse;

        state.currentStep = res.current_step;
        state.completionPct = res.profile_completion_percentage;
        state.isValidAnswer = res.is_valid_answer ?? true;
        state.validationMessage = res.validation_message ?? null;
        state.quickReplies = res.quick_replies ?? res.suggested_choices ?? null;
        state.allowFreeText = res.allow_free_text ?? false;
        state.inputType = res.input_type ?? "chips";
        state.sessionStatus = res.is_complete ? "completed" : "active";

        // Truncate messages to target step
        const targetStep = res.current_step;
        let assistantCount = 0;
        const keptMessages: ChatMessage[] = [];
        for (const msg of state.messages) {
          if (msg.sender === "assistant") {
            assistantCount++;
          }
          keptMessages.push(msg);
          if (msg.sender === "assistant" && assistantCount === targetStep + 1) {
            break;
          }
        }
        state.messages = keptMessages;
      })
      .addCase(goToPreviousStep.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.payload as string;
      });

    // sendChatMessage
    builder
      .addCase(sendChatMessage.pending, (state, action) => {
        state.chatLoading = true;
        state.chatError = null;
        state.validationMessage = null;
        state.isValidAnswer = true;
        state.quickReplies = null;

        // Optimistically push user message
        state.messages.push({
          id: `user-${Date.now()}`,
          sender: "user",
          message: action.meta.arg.message,
          extracted_fields: null,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.chatLoading = false;
        const res = action.payload as SendMessageResponse;

        state.currentStep = res.current_step;
        state.completionPct = res.profile_completion_percentage;
        state.isValidAnswer = res.is_valid_answer ?? true;
        state.validationMessage = res.validation_message ?? null;
        state.quickReplies = res.quick_replies ?? res.suggested_choices ?? null;
        state.allowFreeText = res.allow_free_text ?? false;
        state.inputType = res.input_type ?? "chips";

        if (!res.is_valid_answer) {
          // Keep the user message bubble but do not push new assistant bubble on validation failure
          return;
        }

        state.sessionStatus = res.is_complete ? "completed" : "active";

        // Append assistant reply
        state.messages.push({
          id: `asst-${Date.now()}`,
          sender: "assistant",
          message: res.assistant_message,
          extracted_fields: res.extracted_fields as Record<string, unknown> | null,
          created_at: new Date().toISOString(),
        });
      })
      .addCase(sendChatMessage.rejected, (state) => {
        state.chatLoading = false;
        // Pop the optimistic user message on failure
        if (state.messages.length > 0 && state.messages[state.messages.length - 1].sender === "user") {
          state.messages.pop();
        }
      });

    // fetchLatestSnapshot
    builder
      .addCase(fetchLatestSnapshot.pending, (state) => {
        state.snapshotLoading = true;
        state.snapshotError = null;
      })
      .addCase(fetchLatestSnapshot.fulfilled, (state, action) => {
        state.snapshotLoading = false;
        state.snapshot = action.payload;
      })
      .addCase(fetchLatestSnapshot.rejected, (state, action) => {
        state.snapshotLoading = false;
        state.snapshotError = action.payload as string;
      });

    // calculateHealthScore
    builder
      .addCase(calculateHealthScore.pending, (state) => {
        state.snapshotLoading = true;
        state.snapshotError = null;
      })
      .addCase(calculateHealthScore.fulfilled, (state, action) => {
        state.snapshotLoading = false;
        state.snapshot = action.payload;
      })
      .addCase(calculateHealthScore.rejected, (state, action) => {
        state.snapshotLoading = false;
        state.snapshotError = action.payload as string;
      });

    // retakeAssessment — reuses the same payload shape as startChatSession
    builder
      .addCase(retakeAssessment.pending, (state) => {
        state.chatLoading = true;
        state.chatError = null;
      })
      .addCase(retakeAssessment.fulfilled, (state, action) => {
        state.chatLoading = false;
        const { start, messages } = action.payload as {
          start: StartChatResponse;
          messages: ChatMessage[];
        };
        state.sessionId = start.session_id;
        state.sessionStatus = "active";
        state.currentStep = 0;
        state.completionPct = 0;
        state.messages = messages;
        state.quickReplies = start.quick_replies ?? null;
        state.allowFreeText = start.allow_free_text ?? false;
        state.inputType = start.input_type ?? "chips";
        state.isValidAnswer = true;
        state.validationMessage = null;
      })
      .addCase(retakeAssessment.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.payload as string;
      });
  },
});

export const {
  clearChatError,
  clearSnapshotError,
  clearValidationMessage,
  resetChat,
} = financialProfileSlice.actions;
export default financialProfileSlice.reducer;

export const selectFinancialProfile = (state: RootState) =>
  state.financialProfile;
