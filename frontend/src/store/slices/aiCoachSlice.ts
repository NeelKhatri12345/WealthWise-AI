import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  aiCoachApi,
  type AICoachMessageResponse,
  type ConversationSummaryResponse,
  type ConversationDetailResponse,
} from "../../services/api/aiCoach.api";
import { parseApiError } from "../../utils/error";

export interface AICoachState {
  conversations: ConversationSummaryResponse[];
  currentConversation: ConversationDetailResponse | null;
  messages: AICoachMessageResponse[];
  loading: boolean;
  sending: boolean;
  error: string | null;
}

const initialState: AICoachState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: false,
  sending: false,
  error: null,
};

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchConversations = createAsyncThunk(
  "aiCoach/fetchConversations",
  async (_, { rejectWithValue }) => {
    try {
      return await aiCoachApi.listConversations();
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err));
    }
  },
);

export const fetchConversationDetail = createAsyncThunk(
  "aiCoach/fetchConversationDetail",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      return await aiCoachApi.getConversation(conversationId);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err));
    }
  },
);

export const startNewConversation = createAsyncThunk(
  "aiCoach/startNewConversation",
  async (title: string | undefined, { rejectWithValue }) => {
    try {
      return await aiCoachApi.createConversation(title);
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err));
    }
  },
);

export const sendCoachMessage = createAsyncThunk(
  "aiCoach/sendCoachMessage",
  async (
    { conversationId, content }: { conversationId: string; content: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      // Optimistically add user message before call succeeds to give responsive UI
      const tempId = `temp-user-${Date.now()}`;
      dispatch(
        aiCoachSlice.actions.addOptimisticUserMessage({
          id: tempId,
          conversation_id: conversationId,
          content,
        }),
      );

      const response = await aiCoachApi.sendMessage(conversationId, content);
      return { tempId, response };
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err));
    }
  },
);

export const removeConversation = createAsyncThunk(
  "aiCoach/removeConversation",
  async (conversationId: string, { rejectWithValue }) => {
    try {
      await aiCoachApi.deleteConversation(conversationId);
      return conversationId;
    } catch (err: unknown) {
      return rejectWithValue(parseApiError(err));
    }
  },
);

// ── Slice ────────────────────────────────────────────────────────────────────

const aiCoachSlice = createSlice({
  name: "aiCoach",
  initialState,
  reducers: {
    setCurrentConversationNull(state) {
      state.currentConversation = null;
      state.messages = [];
    },
    clearAICoachError(state) {
      state.error = null;
    },
    addOptimisticUserMessage(
      state,
      action: PayloadAction<{ id: string; conversation_id: string; content: string }>,
    ) {
      state.messages.push({
        id: action.payload.id,
        conversation_id: action.payload.conversation_id,
        user_id: "",
        role: "user",
        content: action.payload.content,
        intent: null,
        created_at: new Date().toISOString(),
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchConversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchConversations.fulfilled,
        (state, action: PayloadAction<ConversationSummaryResponse[]>) => {
          state.loading = false;
          state.conversations = action.payload;
        },
      )
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchConversationDetail
      .addCase(fetchConversationDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchConversationDetail.fulfilled,
        (state, action: PayloadAction<ConversationDetailResponse>) => {
          state.loading = false;
          state.currentConversation = action.payload;
          state.messages = action.payload.messages;
        },
      )
      .addCase(fetchConversationDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // startNewConversation
      .addCase(startNewConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        startNewConversation.fulfilled,
        (state, action: PayloadAction<ConversationDetailResponse>) => {
          state.loading = false;
          state.currentConversation = action.payload;
          state.messages = [];
          
          // Add to conversation summary list at top
          state.conversations.unshift({
            id: action.payload.id,
            title: action.payload.title,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at,
            message_count: 0,
          });
        },
      )
      .addCase(startNewConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // sendCoachMessage
      .addCase(sendCoachMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendCoachMessage.fulfilled, (state, action) => {
        state.sending = false;
        const { tempId, response } = action.payload;
        
        // Remove optimistic message and replace/push correct messages
        state.messages = state.messages.filter((msg) => msg.id !== tempId);
        state.messages.push(response.user_message);
        state.messages.push(response.assistant_message);

        // Update list title if it was first message and title changed
        if (state.currentConversation) {
          // Find conversation summary to update its title/message count/updated time
          const summaryIdx = state.conversations.findIndex(
            (c) => c.id === response.conversation_id,
          );
          if (summaryIdx !== -1) {
            const firstMsg = state.currentConversation.messages.length === 0;
            if (firstMsg) {
              const preview = response.user_message.content.trim();
              const newTitle = preview.length > 40 ? preview.slice(0, 37) + "..." : preview;
              state.conversations[summaryIdx].title = newTitle;
              if (state.currentConversation.id === response.conversation_id) {
                state.currentConversation.title = newTitle;
              }
            }
            state.conversations[summaryIdx].message_count += 2;
            state.conversations[summaryIdx].updated_at = response.assistant_message.created_at;
            // Bubble to top of sidebar
            const [moved] = state.conversations.splice(summaryIdx, 1);
            state.conversations.unshift(moved);
          }
        }
      })
      .addCase(sendCoachMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
        // Remove the optimistic user message from list
        state.messages = state.messages.filter((msg) => !msg.id.startsWith("temp-user-"));
      })

      // removeConversation
      .addCase(removeConversation.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeConversation.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.conversations = state.conversations.filter((c) => c.id !== action.payload);
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null;
          state.messages = [];
        }
      })
      .addCase(removeConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentConversationNull, clearAICoachError } = aiCoachSlice.actions;
export default aiCoachSlice.reducer;
