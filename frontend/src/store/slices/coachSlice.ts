import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface CoachSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface CoachState {
  messages: CoachMessage[];
  sessions: CoachSession[];
  currentSession: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: CoachState = {
  messages: [],
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
};

export const sendMessage = createAsyncThunk(
  "coach/sendMessage",
  async (
    { sessionId, content }: { sessionId: string; content: string },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const userMessage: CoachMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      dispatch(coachSlice.actions.addMessage(userMessage));

      const { coachApi } = await import("../../services/api/coach.api");
      return await coachApi.sendMessage(sessionId, content);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to send message",
      );
    }
  },
);

export const fetchSessions = createAsyncThunk(
  "coach/fetchSessions",
  async (_, { rejectWithValue }) => {
    try {
      const { coachApi } = await import("../../services/api/coach.api");
      return await coachApi.getSessions();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to fetch sessions",
      );
    }
  },
);

export const createSession = createAsyncThunk(
  "coach/createSession",
  async (title: string | undefined, { rejectWithValue }) => {
    try {
      const { coachApi } = await import("../../services/api/coach.api");
      return await coachApi.createSession(title);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to create session",
      );
    }
  },
);

const coachSlice = createSlice({
  name: "coach",
  initialState,
  reducers: {
    setCurrentSession(state, action: PayloadAction<string | null>) {
      state.currentSession = action.payload;
      state.messages = [];
    },
    addMessage(state, action: PayloadAction<CoachMessage>) {
      state.messages.push(action.payload);
    },
    clearCoachError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSessions.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.sessions.unshift(action.payload);
        state.currentSession = action.payload.id;
        state.messages = [];
      });
  },
});

export const { setCurrentSession, addMessage, clearCoachError } =
  coachSlice.actions;
export default coachSlice.reducer;
