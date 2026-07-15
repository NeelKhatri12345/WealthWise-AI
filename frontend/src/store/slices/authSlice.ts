import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  authService,
  type CurrentUserResponse,
  type LoginRequest,
  type RegisterRequest,
  type TokenResponse,
} from "@/services/auth.service";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  isVerified: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;
}

const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem(TOKEN_KEY),
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  isHydrated: !localStorage.getItem(TOKEN_KEY),
  error: null,
};

function getErrorMessage(err: unknown, fallback: string): string {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message ?? fallback;
}

function persistTokens(tokens: TokenResponse): void {
  localStorage.setItem(TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

function clearPersistedTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function applyTokens(state: AuthState, tokens: TokenResponse): void {
  state.accessToken = tokens.access_token;
  state.refreshToken = tokens.refresh_token;
  state.isAuthenticated = true;
  persistTokens(tokens);
}

function clearAuthState(state: AuthState): void {
  state.user = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.isAuthenticated = false;
  state.isHydrated = true;
  state.error = null;
  clearPersistedTokens();
}

function mapCurrentUserResponse(res: CurrentUserResponse): User {
  return {
    id: res.id,
    email: res.email,
    fullName: res.full_name,
    role: res.role_name,
    phone: res.phone ?? undefined,
    isVerified: res.is_verified,
  };
}

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      return await authService.login(credentials);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Login failed"));
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload: RegisterRequest, { rejectWithValue }) => {
    try {
      return await authService.register(payload);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Registration failed"));
    }
  },
);

export const refresh = createAsyncThunk(
  "auth/refresh",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };
      if (!auth.refreshToken) {
        return rejectWithValue("No refresh token available");
      }
      return await authService.refresh(auth.refreshToken);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Token refresh failed"));
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    return await authService.logout();
  } catch {
    return { success: true, message: "Logged out locally" };
  }
});

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return mapCurrentUserResponse(response);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      const status = error.response?.status;
      const message = error.response?.data?.message ?? "Failed to fetch user";
      return rejectWithValue({ status, message });
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (payload: { full_name: string; phone?: string | null }, { rejectWithValue }) => {
    try {
      const response = await authService.updateProfile(payload);
      return mapCurrentUserResponse(response);
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to update profile"));
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setHydrated(state) {
      state.isHydrated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        applyTokens(state, action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        applyTokens(state, action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(refresh.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refresh.fulfilled, (state, action) => {
        state.isLoading = false;
        applyTokens(state, action.payload);
      })
      .addCase(refresh.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        clearAuthState(state);
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        clearAuthState(state);
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        clearAuthState(state);
        state.error = action.error.message ?? "Logout failed";
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isHydrated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isHydrated = true;
        const payload = action.payload as { status?: number; message?: string } | undefined;
        state.error = payload?.message ?? "Failed to fetch user";
        if (payload?.status === 401) {
          clearAuthState(state);
        }
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthError, setHydrated } = authSlice.actions;
export default authSlice.reducer;
