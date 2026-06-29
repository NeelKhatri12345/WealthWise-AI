import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
};
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
    try {
        const { authApi } = await import('../../services/api/auth.api');
        const response = await authApi.login(credentials);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        return response;
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Login failed');
    }
});
export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
    try {
        const { authApi } = await import('../../services/api/auth.api');
        const response = await authApi.register(data);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        return response;
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Registration failed');
    }
});
export const refreshTokenThunk = createAsyncThunk('auth/refreshToken', async (_, { getState, rejectWithValue }) => {
    try {
        const state = getState();
        const { authApi } = await import('../../services/api/auth.api');
        const response = await authApi.refreshToken(state.auth.refreshToken);
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        return response;
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Token refresh failed');
    }
});
export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
    try {
        const { authApi } = await import('../../services/api/auth.api');
        const response = await authApi.updateProfile(data);
        return response;
    }
    catch (err) {
        const error = err;
        return rejectWithValue(error.response?.data?.message ?? 'Profile update failed');
    }
});
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout(state) {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        },
        clearAuthError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(login.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
        })
            .addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(register.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
            .addCase(register.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
        })
            .addCase(register.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        })
            .addCase(refreshTokenThunk.fulfilled, (state, action) => {
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
        })
            .addCase(refreshTokenThunk.rejected, (state) => {
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
        })
            .addCase(updateProfile.pending, (state) => {
            state.loading = true;
        })
            .addCase(updateProfile.fulfilled, (state, action) => {
            state.loading = false;
            state.user = action.payload;
        })
            .addCase(updateProfile.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload;
        });
    },
});
export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
